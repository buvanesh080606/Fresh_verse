from django.db import models
from django.conf import settings
from core.models import Hostel, BusRoute

class Faculty(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    department = models.CharField(max_length=100)
    designation = models.CharField(max_length=100)
    cabin = models.CharField(max_length=50)
    phone = models.CharField(max_length=20, blank=True, null=True)
    semesters = models.CharField(max_length=100, default='All', help_text="Comma-separated semesters e.g. 1,3,5 or All")

    def __str__(self):
        return f"{self.name} ({self.department}) - Sem: {self.semesters}"

class StudentProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_profile')
    roll_no = models.CharField(max_length=20, unique=True)
    department = models.CharField(max_length=100)
    section = models.CharField(max_length=10)
    semester = models.CharField(max_length=20, default='1')
    batch = models.CharField(max_length=20, help_text="e.g. 2023-2027")
    phone = models.CharField(max_length=20, blank=True, null=True)
    hostel = models.ForeignKey(Hostel, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    bus_route = models.ForeignKey(BusRoute, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')

    def __str__(self):
        return f"{self.roll_no} - {self.user.get_full_name() or self.user.email}"

class Timetable(models.Model):
    # Day Order choices (Indian college system)
    DAY_ORDER_CHOICES = (
        ('I',   'Day Order I'),
        ('II',  'Day Order II'),
        ('III', 'Day Order III'),
        ('IV',  'Day Order IV'),
        ('V',   'Day Order V'),
    )

    SLOT_TYPE_CHOICES = (
        ('class',  'Regular Class'),
        ('lab',    'Lab / Practical'),
        ('break',  'Short Break'),
        ('lunch',  'Lunch Break'),
    )

    # Day field — can hold day order (I-V) or day name (Monday-Friday)
    day_of_week = models.CharField(max_length=15, blank=True, null=True)
    day_order   = models.CharField(max_length=5, choices=DAY_ORDER_CHOICES, blank=True, null=True)

    period_number = models.PositiveIntegerField()
    start_time    = models.TimeField()
    end_time      = models.TimeField()

    subject_code  = models.CharField(max_length=50, blank=True, null=True)
    subject_name  = models.CharField(max_length=255, blank=True, null=True)
    slot_type     = models.CharField(max_length=10, choices=SLOT_TYPE_CHOICES, default='class')

    faculty       = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True, blank=True, related_name='timetables')
    department    = models.CharField(max_length=100)
    section       = models.CharField(max_length=10)
    semester      = models.CharField(max_length=20, default='1')
    batch         = models.CharField(max_length=20, help_text="e.g. 2023-2027")

    class Meta:
        ordering = ['day_order', 'day_of_week', 'period_number']

    def __str__(self):
        day_label = self.day_order or self.day_of_week or '?'
        return f"DO-{day_label} P{self.period_number} - {self.subject_name} ({self.department} Sem {self.semester} {self.section})"
