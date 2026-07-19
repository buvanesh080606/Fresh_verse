from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from events.models import Event, EventRegistration, Announcement
from events.serializers import EventSerializer, EventRegistrationSerializer, AnnouncementSerializer
from core.models import Notification
from utils.permissions import IsAdminUserRole

User = get_user_model()

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        user = self.request.user
        queryset = Event.objects.all().order_by('date_time')
        
        # If user is student, filter events relevant to them
        if user.is_authenticated and user.role == 'student':
            if hasattr(user, 'student_profile'):
                profile = user.student_profile
                from django.db.models import Q
                queryset = queryset.filter(
                    (Q(target_department='All') | Q(target_department__iexact=profile.department)) &
                    (Q(target_section='All') | Q(target_section__iexact=profile.section))
                )
            else:
                queryset = queryset.filter(target_department='All', target_section='All')
        return queryset

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'register', 'cancel_registration']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsAdminUserRole]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        event = self.get_object()
        user = request.user

        if user.role != 'student':
            return Response({'error': 'Only students can register for events.'}, status=status.HTTP_403_FORBIDDEN)
        
        if not hasattr(user, 'student_profile'):
            return Response({'error': 'Please complete your student profile onboarding first.'}, status=status.HTTP_400_BAD_REQUEST)

        profile = user.student_profile

        # Check target department and section eligibility
        if event.target_department != 'All' and event.target_department.lower() != profile.department.lower():
            return Response({'error': f'This event is restricted to {event.target_department} department.'}, status=status.HTTP_403_FORBIDDEN)
            
        if event.target_section != 'All' and event.target_section.lower() != profile.section.lower():
            return Response({'error': f'This event is restricted to section {event.target_section}.'}, status=status.HTTP_403_FORBIDDEN)

        # Check deadline
        if timezone.now() > event.registration_deadline:
            return Response({'error': 'Registration deadline for this event has passed.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Check capacity
            current_registrations = event.registrations.filter(status='registered').count()
            if current_registrations >= event.max_seats:
                return Response({'error': 'No seats available for this event.'}, status=status.HTTP_400_BAD_REQUEST)

            # Check existing registration
            registration, created = EventRegistration.objects.get_or_create(
                event=event,
                student=profile,
                defaults={'status': 'registered'}
            )

            if not created:
                if registration.status == 'registered':
                    return Response({'error': 'You are already registered for this event.'}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    registration.status = 'registered'
                    registration.save()

            # Create Notification
            Notification.objects.create(
                user=user,
                title="Event Registration Confirmed",
                message=f"You have registered successfully for {event.title}. Venue: {event.venue}. Date: {event.date_time.strftime('%Y-%m-%d %I:%M %p')}."
            )

        return Response({
            'message': 'Successfully registered for event',
            'registration': EventRegistrationSerializer(registration).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='cancel-registration')
    def cancel_registration(self, request, pk=None):
        event = self.get_object()
        user = request.user

        if user.role != 'student' or not hasattr(user, 'student_profile'):
            return Response({'error': 'Invalid student request.'}, status=status.HTTP_400_BAD_REQUEST)

        profile = user.student_profile

        try:
            registration = EventRegistration.objects.get(event=event, student=profile)
            if registration.status == 'cancelled':
                return Response({'error': 'Registration is already cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

            registration.status = 'cancelled'
            registration.save()

            # Create Notification
            Notification.objects.create(
                user=user,
                title="Event Registration Cancelled",
                message=f"Your registration for {event.title} has been cancelled."
            )

            return Response({'message': 'Registration cancelled successfully'}, status=status.HTTP_200_OK)
        except EventRegistration.DoesNotExist:
            return Response({'error': 'Registration not found.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'], permission_classes=[IsAdminUserRole])
    def attendees(self, request, pk=None):
        event = self.get_object()
        registrations = event.registrations.all()
        serializer = EventRegistrationSerializer(registrations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Announcement.objects.all().order_by('-created_at')
        
        if user.is_authenticated and user.role == 'student':
            if hasattr(user, 'student_profile'):
                profile = user.student_profile
                from django.db.models import Q
                queryset = queryset.filter(
                    (Q(target_department='All') | Q(target_department__iexact=profile.department)) &
                    (Q(target_section='All') | Q(target_section__iexact=profile.section))
                )
            else:
                queryset = queryset.filter(target_department='All', target_section='All')
        return queryset

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsAdminUserRole]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        announcement = serializer.save(created_by=self.request.user)
        
        # Target students to receive notifications
        students = User.objects.filter(role='student')
        
        # Apply department target filter
        if announcement.target_department != 'All':
            students = students.filter(student_profile__department__iexact=announcement.target_department)
            
        # Apply section target filter
        if announcement.target_section != 'All':
            students = students.filter(student_profile__section__iexact=announcement.target_section)
        
        notifications = [
            Notification(
                user=student,
                title=f"New Announcement: {announcement.title}",
                message=f"A new announcement was published in the '{announcement.get_category_display()}' category:\n\n{announcement.content[:100]}..."
            )
            for student in students
        ]
        
        # Bulk create for performance
        Notification.objects.bulk_create(notifications)
