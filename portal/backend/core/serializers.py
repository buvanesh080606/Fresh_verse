from rest_framework import serializers
from core.models import Hostel, BusRoute, CampusInfo, AcademicCalendar, Club, Notification, ClubApplication

class HostelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hostel
        fields = '__all__'

class BusRouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusRoute
        fields = '__all__'

class CampusInfoSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = CampusInfo
        fields = ('id', 'name', 'location', 'category', 'category_display', 'description')

class AcademicCalendarSerializer(serializers.ModelSerializer):
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)

    class Meta:
        model = AcademicCalendar
        fields = ('id', 'event_date', 'description', 'event_type', 'event_type_display', 'day_order', 'department', 'section')

    def validate_day_order(self, value):
        if not value or str(value).strip() == '' or str(value).strip().lower() in ('none', 'null'):
            return None
        return str(value).strip()

    def validate_department(self, value):
        if not value or str(value).strip() == '' or str(value).strip().lower() in ('none', 'null'):
            return 'All'
        return str(value).strip()

    def validate_section(self, value):
        if not value or str(value).strip() == '' or str(value).strip().lower() in ('none', 'null'):
            return 'All'
        return str(value).strip()

class ClubSerializer(serializers.ModelSerializer):
    applications_count = serializers.IntegerField(source='applications.count', read_only=True)
    is_applied_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Club
        fields = ('id', 'name', 'description', 'logo_url', 'coordinator_name', 'contact_email', 'applications_count', 'is_applied_by_me')

    def get_is_applied_by_me(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == 'student':
            if hasattr(request.user, 'student_profile'):
                return obj.applications.filter(student=request.user.student_profile).exists()
        return False

class ClubApplicationSerializer(serializers.ModelSerializer):
    student_detail = serializers.SerializerMethodField()
    club_detail = serializers.SerializerMethodField()

    class Meta:
        model = ClubApplication
        fields = ('id', 'club', 'student', 'student_detail', 'club_detail', 'applied_at', 'status')
        read_only_fields = ('student', 'applied_at')

    def get_student_detail(self, obj):
        from authentication.serializers import StudentProfileSerializer
        return StudentProfileSerializer(obj.student).data

    def get_club_detail(self, obj):
        return {'id': obj.club.id, 'name': obj.club.name}

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'title', 'message', 'is_read', 'created_at')
