from rest_framework import serializers
from core.models import Hostel, BusRoute, CampusInfo, AcademicCalendar, Club, Notification

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
    class Meta:
        model = Club
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'title', 'message', 'is_read', 'created_at')
