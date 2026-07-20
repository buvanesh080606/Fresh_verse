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

        import re
        for idx, item in enumerate(data):
            # Skip truly empty rows (no subject, no day, and no slot_type)
            if not item.get('subject_name') and not item.get('subject_code') and not item.get('day_of_week') and not item.get('day_order') and not item.get('slot_type'):
                continue

            # --- Normalize and clean slot_type ---
            slot_type = item.get('slot_type')
            if isinstance(slot_type, str):
                slot_type = slot_type.strip().lower()
                if 'break' in slot_type and 'lunch' not in slot_type:
                    slot_type = 'break'
                elif 'lunch' in slot_type:
                    slot_type = 'lunch'
                elif 'lab' in slot_type or 'practical' in slot_type:
                    slot_type = 'lab'
                elif slot_type in ('free', 'empty', 'none'):
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
                    item['subject_name'] = 'Regular Class'

            # --- Day Order handling (Indian college system: I, II, III, IV, V) ---
            day_order = item.get('day_order')
            if day_order:
                raw_do = str(day_order).strip().upper()
                if raw_do in ('I', 'II', 'III', 'IV', 'V'):
                    item['day_order'] = raw_do
                elif 'V' in raw_do and 'I' not in raw_do:
                    item['day_order'] = 'V'
                elif 'IV' in raw_do or raw_do == '4':
                    item['day_order'] = 'IV'
                elif 'III' in raw_do or raw_do == '3':
                    item['day_order'] = 'III'
                elif 'II' in raw_do or raw_do == '2':
                    item['day_order'] = 'II'
                elif 'I' in raw_do or raw_do == '1':
                    item['day_order'] = 'I'
                else:
                    item['day_order'] = 'I'

            # --- Fallback: clean day_of_week ---
            day = item.get('day_of_week')
            if isinstance(day, str) and day.strip():
                item['day_of_week'] = day.strip().title()

            # Clean period_number (Extract integer digit)
            period = item.get('period_number')
            p_num = 1
            if period is not None:
                p_str = str(period).strip()
                digit_match = re.search(r'\d+', p_str)
                if digit_match:
                    p_num = int(digit_match.group(0))
                elif slot_type in ('break', 'lunch'):
                    p_num = 0
            elif slot_type in ('break', 'lunch'):
                p_num = 0
            
            item['period_number'] = p_num

            # Clean times robustly
            def clean_time_val(time_val, p_number=1):
                if not time_val:
                    return None
                t_str = str(time_val).strip().replace('.', ':')
                # Extract first time token if format is e.g. "9:15-10:05"
                if '-' in t_str:
                    parts = t_str.split('-')
                    t_str = parts[0].strip()
                
                # Check HH:MM or HH:MM:SS regex
                time_match = re.search(r'(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?', t_str)
                if time_match:
                    h = int(time_match.group(1))
                    m = int(time_match.group(2))
                    s = int(time_match.group(3)) if time_match.group(3) else 0
                    ampm = time_match.group(4)

                    if ampm:
                        ampm = ampm.upper()
                        if ampm == 'PM' and h < 12:
                            h += 12
                        elif ampm == 'AM' and h == 12:
                            h = 0
                    else:
                        # Heuristic: Afternoon periods (5, 6, 7, 8) with hours 1..4 are PM
                        if p_number >= 5 and 1 <= h <= 4:
                            h += 12

                    return f"{h:02d}:{m:02d}:{s:02d}"
                return None

            if 'start_time' in item:
                item['start_time'] = clean_time_val(item['start_time'], p_num)
            if 'end_time' in item:
                item['end_time'] = clean_time_val(item['end_time'], p_num)

            # Standard 8-period times fallback (Saranathan College & standard Indian Engineering schedule)
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
            if not item.get('start_time') or not item.get('end_time'):
                if p_num in default_times and slot_type not in ('break', 'lunch'):
                    item['start_time'] = item.get('start_time') or default_times[p_num][0]
                    item['end_time'] = item.get('end_time') or default_times[p_num][1]
                else:
                    if slot_type == 'lunch':
                        item['start_time'] = item.get('start_time') or '12:45:00'
                        item['end_time'] = item.get('end_time') or '13:25:00'
                    else:
                        if p_num <= 2 or (item.get('start_time') and '10:' in str(item.get('start_time'))):
                            item['start_time'] = item.get('start_time') or '10:55:00'
                            item['end_time'] = item.get('end_time') or '11:05:00'
                        else:
                            item['start_time'] = item.get('start_time') or '15:05:00'
                            item['end_time'] = item.get('end_time') or '15:15:00'

            # Ensure required non-null fields
            item['department'] = item.get('department') or 'CSE(AI&ML)'
            item['semester'] = str(item.get('semester') or '1')
            item['section'] = item.get('section') or 'A'
            item['batch'] = item.get('batch') or '2024-2028'

            # Truncate string lengths to match DB constraints
            if item.get('subject_code'):
                item['subject_code'] = str(item['subject_code'])[:50]
            if item.get('subject_name'):
                item['subject_name'] = str(item['subject_name'])[:255]

            # Faculty lookup by email
            faculty_email = item.pop('faculty_email', None)
            if faculty_email:
                try:
                    faculty = Faculty.objects.get(email=faculty_email)
                    item['faculty'] = faculty.id
                except Faculty.DoesNotExist:
                    pass

            # Faculty lookup by name
            faculty_name = item.pop('faculty_name', None)
            if faculty_name and not item.get('faculty'):
                try:
                    faculty = Faculty.objects.filter(name__icontains=str(faculty_name).strip()).first()
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

                # Build upsert lookup
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

                if is_break_or_lunch and validated_data.get('start_time'):
                    upsert_lookup['start_time'] = validated_data['start_time']

                try:
                    timetable_obj, _ = Timetable.objects.update_or_create(
                        **upsert_lookup,
                        defaults=validated_data
                    )
                    created_objects.append(timetable_obj)
                except Exception as db_err:
                    print(f"Database error saving row {idx}: {db_err}", flush=True)
                    errors.append({'index': idx, 'errors': {'database': str(db_err)}})
            else:
                print(f"Validation error on row {idx}: {serializer.errors}", flush=True)
                errors.append({'index': idx, 'errors': serializer.errors})

        if errors:
            print(f"Timetable Bulk Save Finished with {len(errors)} errors: {errors}", flush=True)
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
