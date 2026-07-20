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

    def perform_destroy(self, instance):
        # Notify all registered students when an event is cancelled/deleted by admin
        registrations = instance.registrations.filter(status='registered')
        recipient_emails = []
        for reg in registrations:
            student_user = reg.student.user
            Notification.objects.create(
                user=student_user,
                title="Event Cancelled by Admin",
                message=f"The event '{instance.title}' scheduled for {instance.date_time.strftime('%Y-%m-%d')} has been cancelled by the administration."
            )
            if student_user.email:
                recipient_emails.append(student_user.email)

        if recipient_emails:
            from utils.email import send_email
            send_email(
                subject=f"⚠️ Event Cancelled: {instance.title}",
                body=(
                    f"Dear Student,\n\n"
                    f"Please be informed that the campus event '{instance.title}' scheduled for {instance.date_time.strftime('%B %d, %Y at %I:%M %p')} has been cancelled by the administration.\n\n"
                    f"We apologize for any inconvenience caused.\n\n"
                    f"Best regards,\nFreshVerse Campus Administration"
                ),
                to=list(set(recipient_emails))
            )

        instance.delete()

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

            # Dispatch Confirmation Email
            if user.email:
                from utils.email import send_email
                send_email(
                    subject=f"🎟️ Event Registration Confirmed: {event.title}",
                    body=(
                        f"Hello {user.first_name or user.username},\n\n"
                        f"Your registration for '{event.title}' has been successfully confirmed!\n\n"
                        f"EVENT DETAILS:\n"
                        f"• Event Title: {event.title}\n"
                        f"• Date & Time: {event.date_time.strftime('%B %d, %Y at %I:%M %p')}\n"
                        f"• Venue: {event.venue}\n"
                        f"• Target Department: {event.target_department}\n\n"
                        f"Please present your student ID at the venue.\n\n"
                        f"Best regards,\nFreshVerse Events Team"
                    ),
                    to=[user.email]
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

            # Dispatch Cancellation Email
            if user.email:
                from utils.email import send_email
                send_email(
                    subject=f"❌ Event Registration Cancelled: {event.title}",
                    body=(
                        f"Hello {user.first_name or user.username},\n\n"
                        f"This is to confirm that your registration for '{event.title}' has been cancelled.\n\n"
                        f"EVENT DETAILS:\n"
                        f"• Event Title: {event.title}\n"
                        f"• Date: {event.date_time.strftime('%B %d, %Y at %I:%M %p')}\n"
                        f"• Venue: {event.venue}\n\n"
                        f"If you did not request this cancellation or have any questions, please contact campus support.\n\n"
                        f"Best regards,\nFreshVerse Events Team"
                    ),
                    to=[user.email]
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

def get_dept_alias_list(dept_name):
    if not dept_name:
        return []
    dept_str = str(dept_name).strip()
    aiml_aliases = ['AIML', 'CSE(AIML)', 'CSE(AI&ML)', 'CSE (AI & ML)', 'AI & ML', 'AI&ML']
    cse_aliases = ['CSE', 'Computer Science', 'Computer Science & Engineering', 'Computer Science & Engineering (CSE)']
    ece_aliases = ['ECE', 'Electronics & Communication', 'Electronics & Communication (ECE)']
    eee_aliases = ['EEE', 'Electrical & Electronics', 'Electrical & Electronics (EEE)']
    mech_aliases = ['MECH', 'Mechanical', 'Mechanical Engineering', 'Mechanical Engineering (MECH)']
    civil_aliases = ['CIVIL', 'Civil', 'Civil Engineering', 'Civil Engineering (CIVIL)']
    it_aliases = ['IT', 'Information Technology', 'Information Technology (IT)']

    if dept_str in aiml_aliases:
        return aiml_aliases
    if dept_str in cse_aliases:
        return cse_aliases
    if dept_str in ece_aliases:
        return ece_aliases
    if dept_str in eee_aliases:
        return eee_aliases
    if dept_str in mech_aliases:
        return mech_aliases
    if dept_str in civil_aliases:
        return civil_aliases
    if dept_str in it_aliases:
        return it_aliases
    return [dept_str]

class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Announcement.objects.all().order_by('-created_at')
        
        if user.is_authenticated and user.role == 'student':
            if hasattr(user, 'student_profile'):
                profile = user.student_profile
                dept_aliases = get_dept_alias_list(profile.department)
                from django.db.models import Q
                queryset = queryset.filter(
                    (Q(target_department='All') | Q(target_department__in=dept_aliases) | Q(target_department__iexact=profile.department)) &
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
        
        # Target students to receive dashboard notifications & emails
        students = User.objects.filter(role='student')
        from django.db.models import Q
        
        # Apply department target filter with alias matching
        if announcement.target_department != 'All':
            dept_aliases = get_dept_alias_list(announcement.target_department)
            students = students.filter(
                Q(student_profile__department__in=dept_aliases) | 
                Q(student_profile__department__iexact=announcement.target_department)
            )
            
        # Apply section target filter
        if announcement.target_section != 'All':
            students = students.filter(
                Q(student_profile__section='All') | 
                Q(student_profile__section__iexact=announcement.target_section)
            )
        
        # 1. Create Dashboard Notifications
        notifications = [
            Notification(
                user=student,
                title=f"New Announcement: {announcement.title}",
                message=f"A new circular was published for {announcement.target_department}:\n\n{announcement.content}"
            )
            for student in students
        ]
        
        if notifications:
            Notification.objects.bulk_create(notifications)

        # 2. Dispatch Email Broadcast to Target Students
        recipient_emails = list(set([s.email for s in students if s.email]))
        if recipient_emails:
            from utils.email import send_email
            email_subject = f"[Campus Announcement] {announcement.title}"
            email_body = (
                f"Dear Student,\n\n"
                f"An official campus circular has been broadcasted for your department ({announcement.target_department}):\n\n"
                f"TITLE: {announcement.title}\n"
                f"CATEGORY: {announcement.get_category_display()}\n"
                f"TARGET DEPARTMENT: {announcement.target_department} (Section: {announcement.target_section})\n\n"
                f"ANNOUNCEMENT DETAILS:\n"
                f"{announcement.content}\n\n"
                f"--------------------------------------------------\n"
                f"FreshVerse Campus Administration Portal\n"
            )
            send_email(email_subject, email_body, recipient_emails)
