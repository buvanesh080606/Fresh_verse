from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('admin', 'Admin'),
    )
    
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True)
    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    created_at = models.DateTimeField(auto_now_add=True)
    
    is_approved = models.BooleanField(default=False)
    is_superadmin = models.BooleanField(default=False)
    is_approved_admin = models.BooleanField(default=False)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        if self.email == 'vsbuvaneshraj06@gmail.com':
            self.is_superadmin = True
            self.is_approved_admin = True
            self.is_approved = True
            self.role = 'admin'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.email} ({self.role})"
