import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freshverse.settings')
django.setup()

from core.models import CampusInfo

# Seed the specific blocks in CampusInfo
blocks = [
    {
        "name": "RV Block (Research & Vision)",
        "location": "West Campus Gate 2",
        "category": "classroom",
        "description": "Houses the AI Lab, Computer Vision Center, Neural Networks Lab, and Advanced GenAI Computing Clusters."
    },
    {
        "name": "KS Block (Knowledge & Sciences)",
        "location": "East Campus Annex",
        "category": "classroom",
        "description": "Houses the Physics Lab, Chemistry Lab, Advanced Biotechnology Research Labs, and Basic Science classrooms."
    },
    {
        "name": "BD Block (Big Data & Computing)",
        "location": "North Campus Quad",
        "category": "classroom",
        "description": "Houses the Cloud Computing Lab, Cyber Security & Cryptography Lab, IoT Sensor Lab, and Database Systems Labs."
    },
    {
        "name": "Mech Block (Mechanical Engineering)",
        "location": "South Campus Workshop Area",
        "category": "classroom",
        "description": "Houses the CAD/CAM Laboratory, CNC Machining Workshop, Robotics Lab, and Fluid Dynamics Research Center."
    },
    {
        "name": "MBA Block (Business Administration)",
        "location": "Central Campus Tower 2",
        "category": "classroom",
        "description": "Houses the Financial Analytics Lab, Business Simulation Center, Mock Boardroom, and Executive Seminar Halls."
    }
]

for b in blocks:
    CampusInfo.objects.get_or_create(
        name=b["name"],
        defaults={
            "location": b["location"],
            "category": b["category"],
            "description": b["description"]
        }
    )

print("Successfully seeded campus blocks & labs in Campus Directory!")
