import os
import re
import google.generativeai as genai
from django.conf import settings
from datetime import datetime

from academic.models import Timetable, Faculty, StudentProfile
from core.models import Hostel, BusRoute, CampusInfo, AcademicCalendar, Club
from events.models import Event, Announcement

def extract_database_context(query, user):
    """
    Analyzes the text query and extracts relevant database records to form the RAG context.
    """
    context_parts = []
    query_lower = query.lower()
    
    # 1. TIMETABLE AND PERIODS
    if any(k in query_lower for k in ['timetable', 'schedule', 'class', 'period', 'lecture', 'subject', 'today', 'tomorrow', 'next']):
        profile = getattr(user, 'student_profile', None)
        if profile:
            now = datetime.now()
            current_time_str = now.strftime('%H:%M:%S')

            aiml_aliases = ['AIML', 'CSE(AIML)', 'CSE(AI&ML)', 'CSE (AI & ML)']
            dept = profile.department
            from django.db.models import Q
            if dept in aiml_aliases:
                all_slots = Timetable.objects.filter(
                    Q(department__in=aiml_aliases),
                    (Q(section='All') | Q(section=profile.section) | Q(section='all')),
                    (Q(batch='All') | Q(batch=profile.batch) | Q(batch='all'))
                ).order_by('day_order', 'day_of_week', 'start_time')
            else:
                all_slots = Timetable.objects.filter(
                    Q(department=dept),
                    (Q(section='All') | Q(section=profile.section) | Q(section='all')),
                    (Q(batch='All') | Q(batch=profile.batch) | Q(batch='all'))
                ).order_by('day_order', 'day_of_week', 'start_time')

            uses_day_order = all_slots.filter(day_order__isnull=False).exists()

            if all_slots.exists():
                context_parts.append(f"Student Timetable ({profile.department} Section {profile.section} Batch {profile.batch}):")

                # For 'next class' queries, find the upcoming slot across today's day order
                if any(k in query_lower for k in ['next', 'upcoming', 'now', 'current']):
                    # Try to find slots today that haven't started yet
                    upcoming = [
                        s for s in all_slots
                        if s.slot_type in ('class', 'lab') and
                           s.start_time is not None and
                           str(s.start_time) > current_time_str
                    ]
                    # Sort by start_time
                    upcoming_sorted = sorted(upcoming, key=lambda s: str(s.start_time))
                    if upcoming_sorted:
                        next_cls = upcoming_sorted[0]
                        context_parts.append(
                            f"Next upcoming class today: {next_cls.subject_name} "
                            f"({next_cls.subject_code}) at {str(next_cls.start_time)[:5]} – {str(next_cls.end_time)[:5]}, "
                            f"{'Day Order ' + next_cls.day_order if next_cls.day_order else next_cls.day_of_week}, "
                            f"Period {next_cls.period_number}, "
                            f"Faculty: {next_cls.faculty.name if next_cls.faculty else 'TBA'}"
                        )
                    else:
                        context_parts.append("No more classes remaining today based on current time.")

                # Always include full schedule context for other queries
                if uses_day_order:
                    for day in ['I', 'II', 'III', 'IV', 'V']:
                        day_slots = [s for s in all_slots if s.day_order == day]
                        if day_slots:
                            context_parts.append(f"\nDay Order {day}:")
                            for cls in sorted(day_slots, key=lambda s: str(s.start_time or '')):
                                time_range = f"{str(cls.start_time)[:5]}–{str(cls.end_time)[:5]}" if cls.start_time and cls.end_time else "–"
                                context_parts.append(
                                    f"  - Period {cls.period_number} [{cls.slot_type.upper()}] ({time_range}): "
                                    f"{cls.subject_name} ({cls.subject_code or '–'}) | "
                                    f"Faculty: {cls.faculty.name if cls.faculty else 'TBA'}"
                                )
                else:
                    today_day = now.strftime('%A')
                    if 'tomorrow' in query_lower:
                        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                        today_day = days[(days.index(today_day) + 1) % 7]
                    day_slots = [s for s in all_slots if s.day_of_week == today_day]
                    for cls in sorted(day_slots, key=lambda s: str(s.start_time or '')):
                        time_range = f"{str(cls.start_time)[:5]}–{str(cls.end_time)[:5]}" if cls.start_time and cls.end_time else "–"
                        context_parts.append(
                            f"  - {today_day} Period {cls.period_number} [{cls.slot_type.upper()}] ({time_range}): "
                            f"{cls.subject_name} | Faculty: {cls.faculty.name if cls.faculty else 'TBA'}"
                        )
            else:
                context_parts.append("No timetable records found for the student's department/section/batch.")
        else:
            context_parts.append("Timetable data is only available for onboarded students.")


    # 2. FACULTY DIRECTORY
    if any(k in query_lower for k in ['faculty', 'professor', 'teacher', 'handles', 'cabin', 'cabin no', 'email', 'phone', 'who teaches']):
        faculties = Faculty.objects.all()
        # Filter if a name matches
        matched_faculties = []
        for fac in faculties:
            # Check if name contains a word in the query
            name_words = fac.name.lower().split()
            if any(w in query_lower for w in name_words if len(w) > 2) or fac.department.lower() in query_lower:
                matched_faculties.append(fac)
        
        target_list = matched_faculties if matched_faculties else faculties[:15] # Limit list to prevent token blowup
        if target_list:
            context_parts.append("Faculty Directory Information:")
            for fac in target_list:
                context_parts.append(
                    f"- Name: {fac.name}, Dept: {fac.department}, Designation: {fac.designation}, "
                    f"Cabin: {fac.cabin}, Email: {fac.email}, Phone: {fac.phone or 'N/A'}"
                )

    # 3. BUS ROUTES AND TRANSPORT
    if any(k in query_lower for k in ['bus', 'route', 'timing', 'stop', 'transport', 'srirangam', 'timing of']):
        routes = BusRoute.objects.all()
        if routes.exists():
            context_parts.append("Campus Bus Transport Routes and Timings:")
            for r in routes:
                context_parts.append(f"- Route {r.route_no} from {r.source} to {r.destination}. Stop details:")
                for timing in r.timings_json:
                    context_parts.append(f"  * Stop: {timing.get('stop')}, Time: {timing.get('time')}")
        else:
            context_parts.append("No bus route records found.")

    # 4. HOSTEL INFORMATION
    if any(k in query_lower for k in ['hostel', 'warden', 'mess', 'girls hostel', 'boys hostel', 'hostel timing', 'hostel rules']):
        hostels = Hostel.objects.all()
        if hostels.exists():
            context_parts.append("Hostels Information:")
            for h in hostels:
                context_parts.append(
                    f"- Hostel: {h.name} ({h.type.capitalize()}), Warden: {h.warden_name}, "
                    f"Contact: {h.contact}, Rules: {h.rules or 'Standard campus policies apply'}"
                )
        else:
            context_parts.append("No hostel records found.")

    # 5. CAMPUS LOCATIONS AND MAP DIRECTORY
    if any(k in query_lower for k in ['classroom', 'lab', 'office', 'principal', 'library', 'canteen', 'auditorium', 'where is']):
        locations = CampusInfo.objects.all()
        matched_locs = [l for l in locations if any(w in query_lower for w in l.name.lower().split())]
        target_locs = matched_locs if matched_locs else locations
        if target_locs:
            context_parts.append("Campus Directory & Location Map:")
            for loc in target_locs:
                context_parts.append(
                    f"- Location: {loc.name}, Location Detail: {loc.location}, "
                    f"Category: {loc.get_category_display()}, Details: {loc.description or 'N/A'}"
                )

    # 6. UPCOMING EVENTS
    if any(k in query_lower for k in ['event', 'workshop', 'symposium', 'cultural', 'happenings', 'register event', 'this week']):
        events = Event.objects.filter(date_time__gte=datetime.now())[:10]
        if events.exists():
            context_parts.append("Upcoming College Events:")
            for e in events:
                context_parts.append(
                    f"- Event: {e.title}, Date/Time: {e.date_time.strftime('%Y-%m-%d %I:%M %p')}, "
                    f"Venue: {e.venue}, Deadline: {e.registration_deadline.strftime('%Y-%m-%d')}, Max Capacity: {e.max_seats}"
                )
        else:
            context_parts.append("No upcoming events scheduled.")

    # 7. ANNOUNCEMENTS AND CIRCULARS
    if any(k in query_lower for k in ['announcement', 'circular', 'news', 'placement', 'notice']):
        announcements = Announcement.objects.all()[:5]
        if announcements.exists():
            context_parts.append("Recent Circulars & Announcements:")
            for a in announcements:
                context_parts.append(f"- [{a.category.upper()}] {a.title}: {a.content} (Published: {a.created_at.strftime('%Y-%m-%d')})")
        else:
            context_parts.append("No announcements recorded.")

    # 8. ACADEMIC CALENDAR
    if any(k in query_lower for k in ['calendar', 'academic calendar', 'exams', 'holiday', 'vacation']):
        calendar_events = AcademicCalendar.objects.filter(event_date__gte=datetime.now().date())[:10]
        if calendar_events.exists():
            context_parts.append("Academic Calendar Milestones:")
            for ce in calendar_events:
                context_parts.append(f"- Date: {ce.event_date}, Event: {ce.description} ({ce.get_event_type_display()})")
        else:
            context_parts.append("No future calendar events found.")

    return "\n\n".join(context_parts)

def get_gemini_campus_response(query, user, chat_history=[]):
    """
    Injects database context and queries Gemini API, enforcing constraints.
    """
    db_context = extract_database_context(query, user)
    
    # Base Instruction
    system_instruction = (
        "You are a helpful, friendly campus assistant for students. Your name is FreshVerse Assistant.\n"
        "You talk like a real person — naturally, warmly, and conversationally. No bullet points, no bold text, no markdown formatting at all.\n"
        "Never say phrases like 'according to the database', 'the college database shows', 'based on the context', or anything that reveals you are reading from a system.\n"
        "Just answer directly as if you know the information yourself, the way a helpful senior student or campus staff member would.\n\n"
        f"Here is the information you know about this student and their college:\n{db_context}\n\n"
        "How to respond:\n"
        "- Use plain, friendly sentences. No asterisks, no headers, no bullet lists unless it genuinely helps readability.\n"
        "- If you don't know the answer, say so naturally, like: 'I don't have that info handy, sorry!' or 'That one I'm not sure about.'\n"
        "- Keep answers short and to the point unless the student needs details.\n"
        "- Be warm, helpful, and feel like a real person, not a bot."
    )
    
    # Check if Gemini key is set to a real value
    api_key = settings.GEMINI_API_KEY
    if not api_key or api_key.startswith('mock-') or api_key == '':
        # Return a mocked response for development
        return mock_gemini_response(query, db_context)

    try:
        genai.configure(api_key=api_key)
        
        # Configure model
        model = genai.GenerativeModel(
            model_name='gemini-1.5-flash',
            system_instruction=system_instruction
        )
        
        # Build prompt
        prompt = f"Student Question: {query}"
        
        # Call model
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini Chat Error: {e}", flush=True)
        return mock_gemini_response(query, db_context)

def mock_gemini_response(query, db_context):
    """
    Conversational fallback when Gemini API key is not active.
    Responds in plain human language without revealing system internals.
    """
    query_lower = query.lower()

    if not db_context.strip():
        return "Hmm, I don't have that info right now. Try asking your department coordinator!"

    lines = [l.strip() for l in db_context.split('\n') if l.strip()]
    relevant_lines = []

    # Priority: next/upcoming class
    if any(k in query_lower for k in ['next', 'upcoming', 'now', 'current']):
        for line in lines:
            if 'next upcoming class' in line.lower():
                # Parse and restate naturally
                return f"Your next class is {line.replace('Next upcoming class today:', '').strip()}"
            if 'no more classes' in line.lower():
                return "Looks like you're done with classes for today! Enjoy your evening."

    # Timetable / schedule questions
    if any(k in query_lower for k in ['timetable', 'schedule', 'class', 'period', 'lecture', 'today', 'tomorrow']):
        class_lines = [l for l in lines if 'period' in l.lower() and '[class]' in l.lower() or '[lab]' in l.lower()]
        if class_lines:
            result = "Here's what I've got for your schedule:\n"
            result += "\n".join(class_lines[:8])
            return result

    # Faculty questions
    if any(k in query_lower for k in ['faculty', 'teacher', 'professor', 'who teaches', 'cabin', 'email']):
        fac_lines = [l for l in lines if 'name:' in l.lower() or 'cabin:' in l.lower() or 'email:' in l.lower()]
        if fac_lines:
            return "\n".join(fac_lines[:5])

    # Bus / transport
    if any(k in query_lower for k in ['bus', 'route', 'transport', 'timing', 'stop']):
        bus_lines = [l for l in lines if 'route' in l.lower() or 'stop:' in l.lower() or 'time:' in l.lower()]
        if bus_lines:
            return "\n".join(bus_lines[:6])

    # Events
    if any(k in query_lower for k in ['event', 'workshop', 'symposium', 'happening']):
        event_lines = [l for l in lines if 'event:' in l.lower() or 'venue:' in l.lower()]
        if event_lines:
            return "\n".join(event_lines[:5])

    # Announcements / circulars / notices
    if any(k in query_lower for k in ['announcement', 'circular', 'news', 'placement', 'notice']):
        ann_lines = [l for l in lines if 'circular' in l.lower() or 'announcement' in l.lower() or '[academic]' in l.lower() or '[placement]' in l.lower() or '[general]' in l.lower()]
        if ann_lines:
            return "Here are the recent announcements I found:\n" + "\n".join(ann_lines[:5])

    # General keyword matching fallback
    keywords = [re.sub(r'[^\w]', '', w) for w in query_lower.split()]
    keywords = [w for w in keywords if len(w) > 3]
    for line in lines:
        if any(kw in line.lower() for kw in keywords):
            relevant_lines.append(line)

    if relevant_lines:
        return "\n".join(relevant_lines[:6])

    return "I don't have enough info to answer that one right now. You could check with your department office!"
