from django.urls import path, include
from rest_framework.routers import SimpleRouter
from academic.views import FacultyViewSet, TimetableViewSet

router = SimpleRouter()
router.register('faculty', FacultyViewSet, basename='faculty')
router.register('timetable', TimetableViewSet, basename='timetable')

urlpatterns = [
    path('', include(router.urls)),
]
