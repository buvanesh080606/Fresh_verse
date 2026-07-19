from django.db import models
from django.conf import settings

class Hostel(models.Model):
    HOSTEL_TYPES = (
        ('boys', 'Boys Hostel'),
        ('girls', 'Girls Hostel'),
    )
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=HOSTEL_TYPES)
    warden_name = models.CharField(max_length=100)
    contact = models.CharField(max_length=20)
    rules = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.name

class BusRoute(models.Model):
    route_no = models.CharField(max_length=20, unique=True)
    source = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    timings_json = models.JSONField(help_text="Store route timings list, e.g. [{'stop': 'Srirangam', 'time': '07:30 AM'}]")
    blocks_served = models.CharField(max_length=255, default='RV Block, KS Block, BD Block, Mech Block, MBA Block')

    def __str__(self):
        return f"Route {self.route_no}: {self.source} -> {self.destination}"

class CampusInfo(models.Model):
    CATEGORIES = (
        ('classroom', 'Classroom'),
        ('lab', 'Laboratory'),
        ('office', 'Administrative Office'),
        ('utility', 'Utility/Amenity'),
    )
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORIES)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

class AcademicCalendar(models.Model):
    EVENT_TYPES = (
        ('holiday', 'Holiday'),
        ('exam', 'Examination'),
        ('academic_activity', 'Academic Activity'),
    )
    event_date = models.DateField()
    description = models.CharField(max_length=255)
    event_type = models.CharField(max_length=25, choices=EVENT_TYPES)
    day_order = models.CharField(max_length=5, blank=True, null=True, help_text="e.g. I, II, III, IV, V")
    department = models.CharField(max_length=100, default='All')
    section = models.CharField(max_length=10, default='All')

    def __str__(self):
        return f"{self.event_date} (DO: {self.day_order or 'N/A'}) - {self.description} ({self.department}/{self.section})"

class Club(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    logo_url = models.TextField(blank=True, null=True)
    coordinator_name = models.CharField(max_length=100)
    contact_email = models.EmailField()

    def __str__(self):
        return self.name

class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=150)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.email}: {self.title}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            try:
                import threading
                from django.core.mail import send_mail
                from django.conf import settings
                
                subject = f"[FreshVerse] {self.title}"
                body = f"Hello {self.user.first_name or 'User'},\n\nYou have a new notification on your FreshVerse dashboard:\n\n{self.message}\n\nBest regards,\nFreshVerse Admin Team"
                
                # Send email in a background thread to prevent blocking main database transaction
                def send_email_with_logs():
                    try:
                        send_mail(
                            subject,
                            body,
                            settings.EMAIL_HOST_USER,
                            [self.user.email],
                            fail_silently=False
                        )
                        print(f"SMTP Success: Sent notification email to {self.user.email}")
                    except Exception as email_err:
                        print(f"SMTP Error sending to {self.user.email}: {email_err}")

                email_thread = threading.Thread(target=send_email_with_logs)
                email_thread.start()
            except Exception as e:
                print(f"Failed to initiate email notification thread to {self.user.email}: {e}")
