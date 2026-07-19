from rest_framework import serializers
from events.models import Event, EventRegistration, Announcement
from authentication.serializers import UserSerializer, StudentProfileSerializer

class EventSerializer(serializers.ModelSerializer):
    created_by_detail = UserSerializer(source='created_by', read_only=True)
    registrations_count = serializers.IntegerField(source='registrations.count', read_only=True)
    is_registered_by_me = serializers.SerializerMethodField()
    available_seats = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            'id', 'title', 'description', 'poster_url', 'date_time', 'venue', 
            'registration_deadline', 'max_seats', 'created_by', 'created_by_detail', 
            'registrations_count', 'available_seats', 'is_registered_by_me', 'created_at',
            'target_department', 'target_section'
        )
        read_only_fields = ('created_by', 'created_at')

    def get_is_registered_by_me(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == 'student':
            if hasattr(request.user, 'student_profile'):
                return obj.registrations.filter(
                    student=request.user.student_profile,
                    status='registered'
                ).exists()
        return False

    def get_available_seats(self, obj):
        count = obj.registrations.filter(status='registered').count()
        return max(0, obj.max_seats - count)

class EventRegistrationSerializer(serializers.ModelSerializer):
    student_detail = StudentProfileSerializer(source='student', read_only=True)
    event_detail = EventSerializer(source='event', read_only=True)

    class Meta:
        model = EventRegistration
        fields = ('id', 'event', 'student', 'student_detail', 'event_detail', 'registered_at', 'status')
        read_only_fields = ('student', 'registered_at')

class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_detail = UserSerializer(source='created_by', read_only=True)

    class Meta:
        model = Announcement
        fields = ('id', 'title', 'content', 'category', 'created_by', 'created_by_detail', 'created_at', 'target_department', 'target_section')
        read_only_fields = ('created_by', 'created_at')
