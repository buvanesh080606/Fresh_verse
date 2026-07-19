from datetime import datetime
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from academic.models import Faculty, Timetable, StudentProfile
from academic.serializers import FacultySerializer, TimetableSerializer
from utils.permissions import IsAdminUserRole

from rest_framework.validators import UniqueTogetherValidator

class FacultyViewSet(viewsets.ModelViewSet):
    queryset = Faculty.objects.all().order_by('name')
    serializer_class = FacultySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsAdminUserRole]
        return [permission() for permission in permission_classes]

class TimetableViewSet(viewsets.ModelViewSet):
    queryset = Timetable.objects.all()
    serializer_class = TimetableSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'today', 'weekly', 'current_next']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsAdminUserRole]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        queryset = Timetable.objects.all()

        # If student, restrict to their schedule
        if user.role == 'student':
            if hasattr(user, 'student_profile'):
                profile = user.student_profile
                dept = profile.department
                aiml_aliases = ['AIML', 'CSE(AIML)', 'CSE(AI&ML)', 'CSE (AI & ML)']
                from django.db.models import Q
                
                if dept in aiml_aliases:
                    return queryset.filter(
                        Q(department__in=aiml_aliases),
                        (Q(semester='All') | Q(semester=profile.semester) | Q(semester='all')),
                        (Q(section='All') | Q(section=profile.section) | Q(section='all')),
                        (Q(batch='All') | Q(batch=profile.batch) | Q(batch='all'))
                    ).order_by('day_order', 'day_of_week', 'start_time')
                else:
                    return queryset.filter(
                        Q(department=dept),
                        (Q(semester='All') | Q(semester=profile.semester) | Q(semester='all')),
                        (Q(section='All') | Q(section=profile.section) | Q(section='all')),
                        (Q(batch='All') | Q(batch=profile.batch) | Q(batch='all'))
                    ).order_by('day_order', 'day_of_week', 'start_time')
            else:
                return queryset.none()
        
        # If admin, allow filtering by department, semester, section, batch
        dept = self.request.query_params.get('department')
        sem = self.request.query_params.get('semester')
        sect = self.request.query_params.get('section')
        batch = self.request.query_params.get('batch')
        if dept:
            queryset = queryset.filter(department=dept)
        if sem:
            queryset = queryset.filter(semester=sem)
        if sect:
            queryset = queryset.filter(section=sect)
        if batch:
            queryset = queryset.filter(batch=batch)
        return queryset

    @action(detail=False, methods=['get'])
    def today(self, request):
        user = request.user
        if user.role == 'student' and not hasattr(user, 'student_profile'):
            return Response({'error': 'Student profile not onboarded yet.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get day of week
        today_day = datetime.now().strftime('%A')
        
        # Get timetable queryset (filtered by role in get_queryset)
        qs = self.get_queryset()

        # Try filtering by day_of_week first (works for both day-of-week and day-order systems
        # IF the parser stored day_of_week alongside day_order)
        timetable_today = qs.filter(day_of_week=today_day).order_by('start_time')

        # If no results and Day Order records exist, the timetable was stored without day_of_week.
        # In this case return everything sorted by start_time for today's browsing context.
        # (In a full implementation the admin would map day orders to weekdays.)
        if not timetable_today.exists() and qs.filter(day_order__isnull=False).exists():
            # Fallback: return all slots across all day orders sorted by start_time
            # so the student can at least see the full week schedule on the dashboard
            timetable_today = qs.order_by('day_order', 'start_time')

        serializer = self.get_serializer(timetable_today, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def weekly(self, request):
        # Simply serialize student schedule (already filtered by student profile in get_queryset)
        weekly_timetable = self.get_queryset().order_by('day_of_week', 'period_number')
        serializer = self.get_serializer(weekly_timetable, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def current_next(self, request):
        user = request.user
        if user.role == 'student' and not hasattr(user, 'student_profile'):
            return Response({'error': 'Student profile not onboarded yet.'}, status=status.HTTP_400_BAD_REQUEST)

        today_day = datetime.now().strftime('%A')
        current_time = datetime.now().time()

        # Filter by today's classes (all slot types including breaks/lunch)
        today_classes = self.get_queryset().filter(day_of_week=today_day).order_by('start_time')
        
        current_class = None
        next_class = None

        for cls in today_classes:
            if cls.start_time <= current_time <= cls.end_time:
                current_class = cls
            elif cls.start_time > current_time:
                if next_class is None:
                    next_class = cls

        return Response({
            'current': TimetableSerializer(current_class).data if current_class else None,
            'next': TimetableSerializer(next_class).data if next_class else None,
            'current_time': current_time.strftime('%H:%M:%S'),
            'day': today_day
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='bulk-save')
    def bulk_save(self, request):
        # Expects a list of timetable objects
        data = request.data
        if not isinstance(data, list):
            return Response({'error': 'Expected a list of timetable objects'}, status=status.HTTP_400_BAD_REQUEST)

        created_objects = []
        errors = []

        for idx, item in enumerate(data):
            # Skip truly empty rows (no subject, no day, and no slot_type)
            if not item.get('subject_name') and not item.get('day_of_week') and not item.get('day_order') and not item.get('slot_type'):
                continue

            # --- Normalize and clean slot_type ---
            slot_type = item.get('slot_type')
            if isinstance(slot_type, str):
                slot_type = slot_type.strip().lower()
                if slot_type in ('break', 'short break'):
                    slot_type = 'break'
                elif slot_type in ('lunch', 'lunch break'):
                    slot_type = 'lunch'
                elif slot_type in ('lab', 'practical', 'lab / practical'):
                    slot_type = 'lab'
                elif slot_type in ('free', 'empty', 'none'):
                    slot_type = 'class'
                elif slot_type in ('class', 'regular class'):
                    slot_type = 'class'
                else:
                    slot_type = 'class'
            else:
                slot_type = 'class'
            item['slot_type'] = slot_type

            # Default subject_name for break/lunch slots if empty or null
            if not item.get('subject_name'):
                if slot_type == 'break':
                    item['subject_name'] = 'Break'
                elif slot_type == 'lunch':
                    item['subject_name'] = 'Lunch Break'
                else:
                    item['subject_name'] = ''

            # --- Day Order handling (Indian college system) ---
            day_order = item.get('day_order')
            if isinstance(day_order, str):
                item['day_order'] = day_order.strip().upper()

            # --- Fallback: clean day_of_week ---
            day = item.get('day_of_week')
            if isinstance(day, str):
                item['day_of_week'] = day.strip().title()

            # Clean period_number
            period = item.get('period_number')
            if period is not None:
                try:
                    item['period_number'] = int(str(period).strip())
                except ValueError:
                    pass

            # Clean times robustly
            def clean_time(time_val):
                if not time_val:
                    return None
                time_str = str(time_val).strip()
                for fmt in ('%I:%M %p', '%I:%M%p', '%H:%M:%S', '%H:%M', '%I:%M:%S %p', '%I:%M:%S%p'):
                    try:
                        dt = datetime.strptime(time_str, fmt)
                        return dt.strftime('%H:%M:%S')
                    except ValueError:
                        continue
                return time_str

            if 'start_time' in item:
                item['start_time'] = clean_time(item['start_time'])
            if 'end_time' in item:
                item['end_time'] = clean_time(item['end_time'])

            # Fallback for start_time / end_time if missing or invalid
            try:
                p_num = int(str(item.get('period_number', 1)).strip())
            except ValueError:
                p_num = 1
            s_type = item.get('slot_type', 'class')
            
            if not item.get('start_time') or not item.get('end_time'):
                default_times = {
                    1: ('09:15:00', '10:05:00'),
                    2: ('10:05:00', '10:55:00'),
                    3: ('11:05:00', '11:55:00'),
                    4: ('11:55:00', '12:45:00'),
                    5: ('13:25:00', '14:15:00'),
                    6: ('14:15:00', '15:05:00'),
                    7: ('15:15:00', '16:00:00'),
                    8: ('16:00:00', '16:45:00'),
                }
                if p_num in default_times and s_type not in ('break', 'lunch'):
                    item['start_time'] = item.get('start_time') or default_times[p_num][0]
                    item['end_time'] = item.get('end_time') or default_times[p_num][1]
                else:
                    if s_type == 'lunch':
                        item['start_time'] = item.get('start_time') or '12:45:00'
                        item['end_time'] = item.get('end_time') or '13:25:00'
                    else:
                        if p_num <= 2:
                            item['start_time'] = item.get('start_time') or '10:55:00'
                            item['end_time'] = item.get('end_time') or '11:05:00'
                        else:
                            item['start_time'] = item.get('start_time') or '15:05:00'
                            item['end_time'] = item.get('end_time') or '15:15:00'

            # Faculty lookup by email
            faculty_email = item.pop('faculty_email', None)
            if faculty_email:
                try:
                    faculty = Faculty.objects.get(email=faculty_email)
                    item['faculty'] = faculty.id
                except Faculty.DoesNotExist:
                    pass

            # Faculty lookup by name (from OCR extracted faculty_name)
            faculty_name = item.pop('faculty_name', None)
            if faculty_name and not item.get('faculty'):
                try:
                    faculty = Faculty.objects.filter(name__icontains=faculty_name.strip()).first()
                    if faculty:
                        item['faculty'] = faculty.id
                except Exception:
                    pass

            # If faculty is a string ID, cast to int
            faculty_val = item.get('faculty')
            if isinstance(faculty_val, str):
                if faculty_val.isdigit():
                    item['faculty'] = int(faculty_val)
                else:
                    item.pop('faculty', None)

            serializer = TimetableSerializer(data=item)
            serializer.validators = [v for v in serializer.validators if not isinstance(v, UniqueTogetherValidator)]
            
            if serializer.is_valid():
                validated_data = serializer.validated_data
                slot_type = validated_data.get('slot_type', 'class')
                is_break_or_lunch = slot_type in ('break', 'lunch')

                # Build upsert lookup: prefer day_order, fall back to day_of_week
                upsert_lookup = {
                    'period_number': validated_data['period_number'],
                    'department':    validated_data['department'],
                    'semester':      validated_data.get('semester', '1'),
                    'section':       validated_data['section'],
                    'batch':         validated_data['batch'],
                }
                if validated_data.get('day_order'):
                    upsert_lookup['day_order'] = validated_data['day_order']
                else:
                    upsert_lookup['day_of_week'] = validated_data.get('day_of_week')

                # For break/lunch slots (period_number=0), include start_time in the
                # upsert key so that multiple breaks per day are saved separately
                # and don't overwrite each other.
                if is_break_or_lunch and validated_data.get('start_time'):
                    upsert_lookup['start_time'] = validated_data['start_time']

                timetable_obj, _ = Timetable.objects.update_or_create(
                    **upsert_lookup,
                    defaults=validated_data
                )
                created_objects.append(timetable_obj)
            else:
                errors.append({'index': idx, 'errors': serializer.errors})

        if errors:
            return Response({
                'message': f'Bulk save completed with {len(errors)} errors.',
                'errors': errors,
                'saved_count': len(created_objects)
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'message': f'Successfully saved {len(created_objects)} timetable periods.',
            'saved_count': len(created_objects)
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['delete'], url_path='clear')
    def clear_timetable(self, request):
        dept = request.query_params.get('department')
        sem = request.query_params.get('semester')
        sect = request.query_params.get('section')
        batch = request.query_params.get('batch')
        
        if not dept:
            return Response({'error': 'Department parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        from django.db.models import Q
        queryset = Timetable.objects.filter(department=dept)
        
        if sem:
            if str(sem).lower() == 'all':
                queryset = queryset.filter(Q(semester='All') | Q(semester='all') | Q(semester='') | Q(semester__isnull=True))
            else:
                queryset = queryset.filter(semester=sem)
                
        if sect:
            if str(sect).lower() == 'all':
                queryset = queryset.filter(Q(section='All') | Q(section='all') | Q(section='') | Q(section__isnull=True))
            else:
                queryset = queryset.filter(section=sect)
                
        if batch:
            if str(batch).lower() == 'all':
                queryset = queryset.filter(Q(batch='All') | Q(batch='all') | Q(batch='') | Q(batch__isnull=True))
            else:
                queryset = queryset.filter(batch=batch)
            
        deleted_count, _ = queryset.delete()
        return Response({
            'message': f'Successfully cleared {deleted_count} timetable slots for {dept} Sem {sem or "All"} (Section: {sect or "All"}).'
        }, status=status.HTTP_200_OK)
