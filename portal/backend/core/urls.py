from django.urls import path, include
from rest_framework.routers import SimpleRouter
from core.views import (
    HostelViewSet, BusRouteViewSet, CampusInfoViewSet, 
    AcademicCalendarViewSet, ClubViewSet, NotificationViewSet,
    DashboardStatsView
)

router = SimpleRouter()
router.register('hostels', HostelViewSet, basename='hostels')
router.register('bus-routes', BusRouteViewSet, basename='bus-routes')
router.register('campus-info', CampusInfoViewSet, basename='campus-info')
router.register('calendar', AcademicCalendarViewSet, basename='calendar')
router.register('clubs', ClubViewSet, basename='clubs')
router.register('notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('', include(router.urls)),
]
