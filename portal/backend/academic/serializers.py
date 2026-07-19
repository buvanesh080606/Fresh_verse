from rest_framework import serializers
from academic.models import Faculty, StudentProfile, Timetable

class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = '__all__'

class TimetableSerializer(serializers.ModelSerializer):
    faculty_detail = FacultySerializer(source='faculty', read_only=True)

    class Meta:
        model = Timetable
        fields = (
            'id',
            'day_of_week', 'day_order',
            'period_number', 'start_time', 'end_time',
            'subject_code', 'subject_name', 'slot_type',
            'faculty', 'faculty_detail',
            'department', 'semester', 'section', 'batch',
        )
        extra_kwargs = {
            'faculty':      {'write_only': True, 'required': False, 'allow_null': True},
            'day_of_week':  {'required': False, 'allow_null': True},
            'day_order':    {'required': False, 'allow_null': True},
            'subject_code': {'required': False, 'allow_null': True},
            'subject_name': {'required': False, 'allow_null': True, 'allow_blank': True},
            'slot_type':    {'required': False},
        }
