import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freshverse.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Hostel, BusRoute, CampusInfo, AcademicCalendar
from academic.models import Faculty
from events.models import Announcement
from datetime import datetime, date

User = get_user_model()

def seed():
    print("Seeding database...")

    # 1. Create default Admin Sandbox user if it doesn't exist
    admin_email = 'admin@freshverse.edu'
    admin_user, created = User.objects.get_or_create(
        email=admin_email,
        defaults={
            'username': 'admin_sandbox',
            'first_name': 'Sarah',
            'last_name': 'Conner',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True,
            'is_superadmin': True,
            'is_approved_admin': True,
            'is_approved': True
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print(f"Created Admin Sandbox user: {admin_email} / password: admin123")
    else:
        print("Admin user already exists.")

    # 2. Seed Hostels
    hostel1, _ = Hostel.objects.get_or_create(
        name="Kaveri Hostel Block",
        type="boys",
        defaults={
            "warden_name": "Dr. Ramesh Kumar",
            "contact": "9876543201",
            "rules": "1. Curfew: 9:00 PM.\n2. No electrical appliances permitted in rooms.\n3. Keep ID card visible at all times."
        }
    )
    hostel2, _ = Hostel.objects.get_or_create(
        name="Ganga Hostel Block",
        type="girls",
        defaults={
            "warden_name": "Dr. Anita Sharma",
            "contact": "9876543202",
            "rules": "1. Curfew: 8:30 PM.\n2. Visitors permitted only in lobby.\n3. Attendance at 8:45 PM."
        }
    )
    print("Seed Hostels done.")

    # 3. Seed Bus Routes
    route1, _ = BusRoute.objects.get_or_create(
        route_no="10",
        defaults={
            "source": "Srirangam",
            "destination": "Main Campus",
            "timings_json": [
                {"stop": "Srirangam Temple Arch", "time": "07:30 AM"},
                {"stop": "Thiruvanaikoil", "time": "07:40 AM"},
                {"stop": "No 1 Tollgate", "time": "07:55 AM"},
                {"stop": "Campus Main Gate", "time": "08:20 AM"}
            ]
        }
    )
    route2, _ = BusRoute.objects.get_or_create(
        route_no="12",
        defaults={
            "source": "Chatram Bus Stand",
            "destination": "Main Campus",
            "timings_json": [
                {"stop": "Chatram stand Platform 2", "time": "07:35 AM"},
                {"stop": "Chinthamani", "time": "07:45 AM"},
                {"stop": "Cauvery Bridge stop", "time": "07:50 AM"},
                {"stop": "Campus Main Gate", "time": "08:15 AM"}
            ]
        }
    )
    print("Seed Bus Routes done.")

    # 4. Seed Campus Directory Info
    CampusInfo.objects.get_or_create(
        name="AI & Robotics Lab",
        defaults={
            "location": "CSE Block, 2nd Floor, Room 204",
            "category": "lab",
            "description": "Equipped with high-performance computing clusters and robotic arms for GenAI studies."
        }
    )
    CampusInfo.objects.get_or_create(
        name="Central Library",
        defaults={
            "location": "Administrative Block, Ground & 1st Floor",
            "category": "library",
            "description": "Open from 8:00 AM to 8:00 PM. Houses reference materials, text journals, and discussion cabins."
        }
    )
    CampusInfo.objects.get_or_create(
        name="Dean Academic Office",
        defaults={
            "location": "Main Block, Room 101",
            "category": "office",
            "description": "For academic approvals, transcripts, registration overrides, and course catalogs."
        }
    )
    print("Seed Campus Directory done.")

    # 5. Seed Faculty Directory
    Faculty.objects.get_or_create(
        email="anita.cse@freshverse.edu",
        defaults={
            "name": "Dr. Anita Sharma",
            "department": "CSE",
            "designation": "Associate Professor & Dean Academics",
            "cabin": "CSE Block 204",
            "phone": "9845123067"
        }
    )
    Faculty.objects.get_or_create(
        email="robert.ece@freshverse.edu",
        defaults={
            "name": "Dr. Robert Dsouza",
            "department": "ECE",
            "designation": "Professor & Head of Department",
            "cabin": "ECE Cabin A1",
            "phone": "9123456780"
        }
    )
    Faculty.objects.get_or_create(
        email="priya.maths@freshverse.edu",
        defaults={
            "name": "Mrs. Priya Gopalan",
            "department": "Basic Sciences",
            "designation": "Assistant Professor",
            "cabin": "Science Lab Annex",
            "phone": "8907654321"
        }
    )
    print("Seed Faculty done.")

    # 6. Seed Academic Calendar
    AcademicCalendar.objects.get_or_create(
        description="Commencement of Odd Semester Classes",
        defaults={
            "event_date": date(2026, 8, 3),
            "event_type": "academic_activity"
        }
    )
    AcademicCalendar.objects.get_or_create(
        description="Mid-Term Examinations Start",
        defaults={
            "event_date": date(2026, 9, 21),
            "event_type": "exam"
        }
    )
    AcademicCalendar.objects.get_or_create(
        description="Gandhi Jayanti Holiday",
        defaults={
            "event_date": date(2026, 10, 2),
            "event_type": "holiday"
        }
    )
    print("Seed Academic Calendar done.")

    # 7. Seed Circular Announcements
    Announcement.objects.get_or_create(
        title="Welcome to Freshman Orientation 2026",
        defaults={
            "content": "All incoming students are requested to report to the Auditorium at 9:00 AM on August 3rd for registration and welcome speeches.",
            "category": "academic",
            "created_by": admin_user
        }
    )
    print("Seed database complete!")

if __name__ == '__main__':
    seed()
