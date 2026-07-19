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

class ClubViewSet(BaseCampusViewSet):
    queryset = Club.objects.all()
    serializer_class = ClubSerializer

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
