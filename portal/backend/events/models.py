from django.db import models
from django.conf import settings
from academic.models import StudentProfile

class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    poster_url = models.ImageField(upload_to='event_posters/', blank=True, null=True)
    date_time = models.DateTimeField()
    venue = models.CharField(max_length=150)
    registration_deadline = models.DateTimeField()
    max_seats = models.PositiveIntegerField()
    target_department = models.CharField(max_length=100, default='All')
    target_section = models.CharField(max_length=10, default='All')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_events')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class EventRegistration(models.Model):
    STATUS_CHOICES = (
        ('registered', 'Registered'),
        ('attended', 'Attended'),
        ('cancelled', 'Cancelled'),
    )
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='event_registrations')
    registered_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='registered')

    class Meta:
        unique_together = ('event', 'student')

    def __str__(self):
        return f"{self.student.roll_no} - {self.event.title} ({self.status})"

class Announcement(models.Model):
    CATEGORY_CHOICES = (
        ('academic', 'Academic'),
        ('placement', 'Placement'),
        ('general', 'General'),
    )
    title = models.CharField(max_length=200)
    content = models.TextField()
    category = models.CharField(max_length=15, choices=CATEGORY_CHOICES, default='general')
    target_department = models.CharField(max_length=100, default='All')
    target_section = models.CharField(max_length=10, default='All')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_announcements')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
