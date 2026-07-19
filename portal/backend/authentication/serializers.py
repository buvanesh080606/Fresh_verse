from rest_framework import serializers
from django.contrib.auth import get_user_model
from academic.models import StudentProfile
from core.models import Hostel, BusRoute
from core.serializers import HostelSerializer, BusRouteSerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    has_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'has_profile', 'is_approved', 'is_superadmin', 'is_approved_admin', 'created_at')
        read_only_fields = ('id', 'email', 'role', 'created_at', 'has_profile', 'is_approved', 'is_superadmin', 'is_approved_admin')

    def get_has_profile(self, obj):
        if obj.role == 'student':
            return hasattr(obj, 'student_profile')
        return True

class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    hostel_detail = HostelSerializer(source='hostel', read_only=True)
    bus_route_detail = BusRouteSerializer(source='bus_route', read_only=True)

    class Meta:
        model = StudentProfile
        fields = (
            'id', 'user', 'roll_no', 'department', 'section', 'semester', 'batch', 'phone', 
            'hostel', 'bus_route', 'hostel_detail', 'bus_route_detail'
        )
        extra_kwargs = {
            'hostel': {'write_only': True, 'required': False, 'allow_null': True},
            'bus_route': {'write_only': True, 'required': False, 'allow_null': True},
        }

class OnboardSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    roll_no = serializers.CharField(max_length=20)
    department = serializers.CharField(max_length=100)
    section = serializers.CharField(max_length=10)
    semester = serializers.CharField(max_length=20, required=False, default='1')
    batch = serializers.CharField(max_length=20)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    hostel_id = serializers.IntegerField(required=False, allow_null=True)
    bus_route_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_roll_no(self, value):
        if StudentProfile.objects.filter(roll_no=value).exists():
            raise serializers.ValidationError("A student profile with this roll number already exists.")
        return value
