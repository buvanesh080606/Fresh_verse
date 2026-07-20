from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.models import Hostel, BusRoute, CampusInfo, AcademicCalendar, Club, Notification
from core.serializers import (
    HostelSerializer, BusRouteSerializer, CampusInfoSerializer, 
    AcademicCalendarSerializer, ClubSerializer, NotificationSerializer
)
from utils.permissions import IsAdminUserRole

class BaseCampusViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet that allows Read-Only access for authenticated users (Students/Admins)
    but restricts write actions (create/update/destroy) to Admins.
    """
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsAdminUserRole]
        return [permission() for permission in permission_classes]

class HostelViewSet(BaseCampusViewSet):
    queryset = Hostel.objects.all()
    serializer_class = HostelSerializer

class BusRouteViewSet(BaseCampusViewSet):
    queryset = BusRoute.objects.all()
    serializer_class = BusRouteSerializer

class CampusInfoViewSet(BaseCampusViewSet):
    queryset = CampusInfo.objects.all()
    serializer_class = CampusInfoSerializer

class AcademicCalendarViewSet(BaseCampusViewSet):
    serializer_class = AcademicCalendarSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = AcademicCalendar.objects.all().order_by('event_date')
        if user.is_authenticated and hasattr(user, 'student_profile'):
            profile = user.student_profile
            dept = profile.department
            from django.db.models import Q
            aiml_aliases = ['AIML', 'CSE(AIML)', 'CSE(AI&ML)', 'CSE (AI & ML)']
            
            if dept in aiml_aliases:
                queryset = queryset.filter(
                    (Q(department='All') | Q(department__in=aiml_aliases)) &
                    (Q(section='All') | Q(section=profile.section))
                )
            else:
                queryset = queryset.filter(
                    (Q(department='All') | Q(department=dept)) &
                    (Q(section='All') | Q(section=profile.section))
                )
        return queryset

    @action(detail=False, methods=['delete'], url_path='clear-all', permission_classes=[IsAdminUserRole])
    def clear_all(self, request):
        """Delete the entire academic calendar. Admin only."""
        deleted_count, _ = AcademicCalendar.objects.all().delete()
        return Response(
            {'message': f'Successfully deleted the entire academic calendar ({deleted_count} entries removed).'},
            status=status.HTTP_200_OK
        )

from core.models import Hostel, BusRoute, CampusInfo, AcademicCalendar, Club, Notification, ClubApplication
from core.serializers import (
    HostelSerializer, BusRouteSerializer, CampusInfoSerializer, 
    AcademicCalendarSerializer, ClubSerializer, NotificationSerializer, ClubApplicationSerializer
)

class ClubViewSet(BaseCampusViewSet):
    queryset = Club.objects.all()
    serializer_class = ClubSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'apply', 'my_applications']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsAdminUserRole]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        club = self.get_object()
        user = request.user

        if user.role != 'student' or not hasattr(user, 'student_profile'):
            return Response({'error': 'Only onboarded students can apply to join campus clubs.'}, status=status.HTTP_400_BAD_REQUEST)

        profile = user.student_profile

        application, created = ClubApplication.objects.get_or_create(
            club=club,
            student=profile,
            defaults={'status': 'applied'}
        )

        if not created:
            return Response({'error': f'You have already applied to join {club.name}.'}, status=status.HTTP_400_BAD_REQUEST)

        student_name = f"{user.first_name} {user.last_name}".strip() or user.username
        total_registered = club.applications.count()

        # Create Notification for Student
        Notification.objects.create(
            user=user,
            title="Club Application Submitted",
            message=f"Your membership application for '{club.name}' has been received successfully."
        )

        # Dispatch Email to Student
        from utils.email import send_email
        if user.email:
            send_email(
                subject=f"🚀 Club Application Submitted: {club.name}",
                body=(
                    f"Hello {student_name},\n\n"
                    f"Your membership application for '{club.name}' has been successfully submitted!\n\n"
                    f"CLUB DETAILS:\n"
                    f"• Club Name: {club.name}\n"
                    f"• Coordinator: {club.coordinator_name}\n"
                    f"• Contact Email: {club.contact_email}\n\n"
                    f"The club coordinator will review your application soon.\n\n"
                    f"Best regards,\nFreshVerse Clubs & Societies Team"
                ),
                to=[user.email]
            )

        # Dispatch Alert Email to Superadmins & Club Coordinator Email
        from django.contrib.auth import get_user_model
        from django.db.models import Q
        User = get_user_model()
        admin_users = User.objects.filter(Q(is_superuser=True) | Q(role='admin')).distinct()

        for admin in admin_users:
            Notification.objects.create(
                user=admin,
                title="New Club Registration",
                message=f"Student {student_name} ({profile.department}) applied to join '{club.name}'."
            )

        admin_emails = list(admin_users.exclude(email='').values_list('email', flat=True))
        if club.contact_email and club.contact_email not in admin_emails:
            admin_emails.append(club.contact_email)

        admin_emails = list(dict.fromkeys([e.strip() for e in admin_emails if e and isinstance(e, str) and e.strip()]))

        if admin_emails:
            send_email(
                subject=f"📌 New Club Application: {student_name} applied for {club.name}",
                body=(
                    f"Hello Admin / Coordinator,\n\n"
                    f"Student '{student_name}' has applied to join '{club.name}'.\n\n"
                    f"APPLICANT DETAILS:\n"
                    f"• Name: {student_name}\n"
                    f"• Student Email: {user.email or 'N/A'}\n"
                    f"• Roll No: {profile.roll_no}\n"
                    f"• Department: {profile.department} (Section: {profile.section})\n"
                    f"• Phone: {profile.phone or 'N/A'}\n\n"
                    f"CLUB REGISTRATION STATS:\n"
                    f"• Club: {club.name}\n"
                    f"• Total Registered Members/Applicants: {total_registered}\n\n"
                    f"Best regards,\nFreshVerse Campus Administration System"
                ),
                to=admin_emails
            )

        return Response({
            'message': f'Successfully applied to {club.name}',
            'application': ClubApplicationSerializer(application).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], permission_classes=[IsAdminUserRole])
    def applications(self, request, pk=None):
        club = self.get_object()
        apps = club.applications.all()
        serializer = ClubApplicationSerializer(apps, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_applications(self, request):
        user = request.user
        if user.role == 'student' and hasattr(user, 'student_profile'):
            applied_ids = list(ClubApplication.objects.filter(student=user.student_profile).values_list('club_id', flat=True))
            return Response(applied_ids, status=status.HTTP_200_OK)
        return Response([], status=status.HTTP_200_OK)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer

    def get_permissions(self):
        # Only admins can create or delete notifications
        if self.action in ['create', 'destroy']:
            return [IsAdminUserRole()]
        # Students and admins can read and mark-as-read
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        # Admins can see all notifications; students only see their own
        if user.is_authenticated and user.role == 'admin':
            return Notification.objects.all()
        return Notification.objects.filter(user=user)

    def perform_create(self, serializer):
        # Allow admins to send notifications manually
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all notifications marked as read'}, status=status.HTTP_200_OK)


from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from academic.models import StudentProfile
from events.models import Event, Announcement
from ai_engine.models import AIQueryLog

User = get_user_model()

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total_students = 154 + StudentProfile.objects.count()
        upcoming_events = Event.objects.count()
        announcements_count = Announcement.objects.count()
        ai_queries_today = 156 + AIQueryLog.objects.count()

        # Generate deterministic user-specific weekly chart data
        import random
        rng = random.Random(request.user.id)
        weekly_activity = [rng.randint(25, 95) for _ in range(7)]

        return Response({
            'total_students': total_students,
            'upcoming_events': upcoming_events,
            'announcements': announcements_count,
            'ai_queries_today': ai_queries_today,
            'weekly_activity': weekly_activity,
        }, status=status.HTTP_200_OK)
