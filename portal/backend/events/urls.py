from django.urls import path, include
from rest_framework.routers import SimpleRouter
from events.views import EventViewSet, AnnouncementViewSet

router = SimpleRouter()
router.register('events', EventViewSet, basename='events')
router.register('announcements', AnnouncementViewSet, basename='announcements')

urlpatterns = [
    path('', include(router.urls)),
]
