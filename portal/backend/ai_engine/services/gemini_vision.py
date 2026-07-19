import os
import json
import re
import google.generativeai as genai
from django.conf import settings

def parse_document_with_gemini(file_bytes, mime_type, filename):
    """
    Sends document/image bytes to Gemini Vision to extract structured tabular JSON.
    """
    system_instruction = (
        "You are a structured data extractor for Indian college timetables and academic documents. "
        "Analyze the uploaded document and classify it as one of: 'timetable', 'faculty', 'calendar', 'event'.\n"
        "Return ONLY raw JSON with 'document_type' and 'extracted_data'. No markdown, no explanation.\n\n"

        "=== TIMETABLE EXTRACTION RULES ===\n"
        "Indian college timetables use a DAY ORDER system (I, II, III, IV, V) NOT days of the week.\n"
        "The table typically has:\n"
        "  - Rows: Day Orders (I through V)\n"
        "  - Columns: Period 1, Period 2, [Break], Period 3, Period 4, [Lunch], Period 5, Period 6, [Break], Period 7, Period 8\n\n"
        "For 'timetable', return 'extracted_data' as an array of slot objects:\n"
        "[\n"
        "  {\n"
        "    \"day_order\": \"I\",\n"
        "    \"period_number\": 1,\n"
        "    \"start_time\": \"09:15:00\",\n"
        "    \"end_time\": \"10:05:00\",\n"
        "    \"subject_code\": \"24AL501\",\n"
        "    \"subject_name\": \"Computer Networks Security\",\n"
        "    \"slot_type\": \"class\",\n"
        "    \"faculty_name\": \"Mr. P. Manikandan\",\n"
        "    \"faculty_email\": \"\",\n"
        "    \"department\": \"CSE(AI&ML)\",\n"
        "    \"semester\": \"1\",\n"
        "    \"section\": \"A\",\n"
        "    \"batch\": \"2024-2028\"\n"
        "  },\n"
        "  {\n"
        "    \"day_order\": \"I\",\n"
        "    \"period_number\": 0,\n"
        "    \"start_time\": \"10:55:00\",\n"
        "    \"end_time\": \"11:05:00\",\n"
        "    \"subject_code\": \"BREAK\",\n"
        "    \"subject_name\": \"Break\",\n"
        "    \"slot_type\": \"break\",\n"
        "    \"faculty_name\": \"\",\n"
        "    \"faculty_email\": \"\",\n"
        "    \"department\": \"CSE(AI&ML)\",\n"
        "    \"semester\": \"1\",\n"
        "    \"section\": \"A\",\n"
        "    \"batch\": \"2024-2028\"\n"
        "  }\n"
        "]\n\n"
        "IMPORTANT RULES FOR TIMETABLE EXTRACTION:\n"
        "1. day_order must be EXACTLY one of: 'I', 'II', 'III', 'IV', 'V'\n"
        "2. period_number: use 1-8 for class slots. Use 0 for break/lunch (there may be multiple breaks per day).\n"
        "   If there are TWO breaks per day (short break + lunch), use period_number=0 for all break/lunch rows for that day_order.\n"
        "3. slot_type must be: 'class', 'lab', 'break', or 'lunch'\n"
        "4. For lab/practical sessions (marked as L or Lab), set slot_type='lab'\n"
        "5. For combined/elective slots like '24CS902/24CS901', set subject_code='24CS902/24CS901' and subject_name='Recommender Systems / Exploratory Data Analysis'\n"
        "6. For arrow continuation cells (←→), repeat the previous period's subject across those day orders\n"
        "7. Times must be in 24-hour HH:MM:SS format\n"
        "8. Extract ALL day orders (I through V) completely\n"
        "9. Include break and lunch slots — students need to see when their break is\n"
        "10. If the subject code table at bottom lists subject names and faculty names, use those to fill in subject_name and faculty_name\n"
        "11. Parse the target 'department', 'semester', 'section', and 'batch' from the header text, filename, or document title if mentioned (e.g. 'Class: CSE (AI & ML) Semester V Section B Batch 2024-2028'). If found, add them to each slot object in the array.\n\n"
        "=== OTHER DOCUMENT TYPES ===\n"
        "For 'faculty', return array: [{\"name\", \"email\", \"department\", \"designation\", \"cabin\", \"phone\"}]\n"
        "For 'calendar', return array: [{\"event_date\": \"YYYY-MM-DD\", \"description\", \"event_type\": \"holiday|exam|academic_activity\", \"day_order\": \"I|II|III|IV|V|null\", \"department\": \"All|CSE|ECE|AIML|...\", \"section\": \"All|A|B|C|...\"}]\n"
        "  * IMPORTANT FOR MULTI-COLUMN PLANNER CALENDARS: Academic planners often display multiple months side-by-side in vertical columns (e.g. JUL, AUG, SEP, OCT, NOV columns on the same page).\n"
        "    You must read each month column vertically day-by-day (e.g. July 1st to 31st, then August 1st to 31st, etc.).\n"
        "    Extract every date that contains an event, a holiday, an exam, or a Day Order (I, II, III, IV, V). Ensure the date matches the month heading (e.g., AUG column day 15 is 2026-08-15).\n"
        "For 'event', return single object: {\"title\", \"description\", \"date_time\", \"venue\", \"registration_deadline\", \"max_seats\"}"
    )

    api_key = settings.GEMINI_API_KEY
    if not api_key or api_key.startswith('mock-') or api_key == '':
        return generate_mock_extracted_data(filename)

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name='gemini-1.5-flash')
        file_part = {"mime_type": mime_type, "data": file_bytes}
        prompt = (
            f"Analyze this timetable document named '{filename}'. "
            f"This is an Indian college timetable using a Day Order system (I-V). "
            f"Extract ALL slots including breaks and lunch. Use the subject code legend at the bottom to fill subject names and faculty names. "
            f"Follow the system instructions precisely:\n\n{system_instruction}"
        )
        response = model.generate_content([file_part, prompt])
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        return json.loads(text)
    except Exception as e:
        print(f"Gemini Vision Error: {e}", flush=True)
        mock_data = generate_mock_extracted_data(filename)
        mock_data['error'] = f"Gemini Extraction failed: {str(e)}"
        return mock_data

def generate_mock_extracted_data(filename):
    """
    Returns mock structured JSON based on filename heuristics, for testing local flows.
    """
    filename_lower = filename.lower()
    
    if 'timetable' in filename_lower or 'schedule' in filename_lower:
        return {
            'document_type': 'timetable',
            'extracted_data': [
                # Day Order I
                {'day_order': 'I', 'period_number': 1, 'start_time': '09:15:00', 'end_time': '10:05:00', 'subject_code': '24AL501', 'subject_name': 'Computer Networks Security', 'slot_type': 'class', 'faculty_name': 'Mr. P. Manikandan'},
                {'day_order': 'I', 'period_number': 2, 'start_time': '10:05:00', 'end_time': '10:55:00', 'subject_code': '24AD401', 'subject_name': 'Machine Learning', 'slot_type': 'class', 'faculty_name': 'Mr. S. Amirthalingam'},
                {'day_order': 'I', 'period_number': 0, 'start_time': '10:55:00', 'end_time': '11:05:00', 'subject_code': 'BREAK', 'subject_name': 'Break', 'slot_type': 'break'},
                {'day_order': 'I', 'period_number': 3, 'start_time': '11:05:00', 'end_time': '11:55:00', 'subject_code': '24CS503(L)/24AD303(L)', 'subject_name': 'OOSE Lab / Introduction to AI Lab', 'slot_type': 'lab', 'faculty_name': 'Ms. S. Srimathi'},
                {'day_order': 'I', 'period_number': 4, 'start_time': '11:55:00', 'end_time': '12:45:00', 'subject_code': '24CS503(L)/24AD303(L)', 'subject_name': 'OOSE Lab / Introduction to AI Lab', 'slot_type': 'lab', 'faculty_name': 'Ms. S. Srimathi'},
                {'day_order': 'I', 'period_number': 0, 'start_time': '12:45:00', 'end_time': '13:25:00', 'subject_code': 'LUNCH', 'subject_name': 'Lunch Break', 'slot_type': 'lunch'},
                {'day_order': 'I', 'period_number': 5, 'start_time': '13:25:00', 'end_time': '14:15:00', 'subject_code': 'T&P(A)', 'subject_name': 'Training & Placement (Aptitude)', 'slot_type': 'class', 'faculty_name': 'Dr. T Prabha'},
                {'day_order': 'I', 'period_number': 6, 'start_time': '14:15:00', 'end_time': '15:05:00', 'subject_code': '24AD303', 'subject_name': 'Introduction to Artificial Intelligence', 'slot_type': 'class', 'faculty_name': 'Dr. A. Delphin Carolina Rani'},
                {'day_order': 'I', 'period_number': 0, 'start_time': '15:05:00', 'end_time': '15:15:00', 'subject_code': 'BREAK', 'subject_name': 'Break', 'slot_type': 'break'},
                {'day_order': 'I', 'period_number': 7, 'start_time': '15:15:00', 'end_time': '16:00:00', 'subject_code': '24AD401', 'subject_name': 'Machine Learning', 'slot_type': 'class', 'faculty_name': 'Mr. S. Amirthalingam'},
                {'day_order': 'I', 'period_number': 8, 'start_time': '16:00:00', 'end_time': '16:45:00', 'subject_code': '24CS503', 'subject_name': 'Object Oriented Software Engineering', 'slot_type': 'class', 'faculty_name': 'Ms. S. Srimathi'},
                # Day Order II
                {'day_order': 'II', 'period_number': 1, 'start_time': '09:15:00', 'end_time': '10:05:00', 'subject_code': '24AL501', 'subject_name': 'Computer Networks Security', 'slot_type': 'class', 'faculty_name': 'Mr. P. Manikandan'},
                {'day_order': 'II', 'period_number': 2, 'start_time': '10:05:00', 'end_time': '10:55:00', 'subject_code': 'T&P(V)', 'subject_name': 'Training & Placement (Verbal)', 'slot_type': 'class', 'faculty_name': 'Mr. C. Gnanadesikan'},
                {'day_order': 'II', 'period_number': 0, 'start_time': '10:55:00', 'end_time': '11:05:00', 'subject_code': 'BREAK', 'subject_name': 'Break', 'slot_type': 'break'},
                {'day_order': 'II', 'period_number': 3, 'start_time': '11:05:00', 'end_time': '11:55:00', 'subject_code': '24CS503(L)/24AD303(L)', 'subject_name': 'OOSE Lab / Introduction to AI Lab', 'slot_type': 'lab'},
                {'day_order': 'II', 'period_number': 4, 'start_time': '11:55:00', 'end_time': '12:45:00', 'subject_code': '24CS503(L)/24AD303(L)', 'subject_name': 'OOSE Lab / Introduction to AI Lab', 'slot_type': 'lab'},
                {'day_order': 'II', 'period_number': 0, 'start_time': '12:45:00', 'end_time': '13:25:00', 'subject_code': 'LUNCH', 'subject_name': 'Lunch Break', 'slot_type': 'lunch'},
                {'day_order': 'II', 'period_number': 5, 'start_time': '13:25:00', 'end_time': '14:15:00', 'subject_code': '24CS503', 'subject_name': 'Object Oriented Software Engineering', 'slot_type': 'class', 'faculty_name': 'Ms. S. Srimathi'},
                {'day_order': 'II', 'period_number': 6, 'start_time': '14:15:00', 'end_time': '15:05:00', 'subject_code': '24AD401', 'subject_name': 'Machine Learning', 'slot_type': 'class', 'faculty_name': 'Mr. S. Amirthalingam'},
                {'day_order': 'II', 'period_number': 0, 'start_time': '15:05:00', 'end_time': '15:15:00', 'subject_code': 'BREAK', 'subject_name': 'Break', 'slot_type': 'break'},
                {'day_order': 'II', 'period_number': 7, 'start_time': '15:15:00', 'end_time': '16:00:00', 'subject_code': '24CS502', 'subject_name': 'Web Technologies', 'slot_type': 'class', 'faculty_name': 'Ms. JJ. Arul Sheela'},
                {'day_order': 'II', 'period_number': 8, 'start_time': '16:00:00', 'end_time': '16:45:00', 'subject_code': '24CS902/24CS901', 'subject_name': 'Recommender Systems / Exploratory Data Analysis', 'slot_type': 'class', 'faculty_name': 'Dr. B. Rethina Kumar'},
                # Day Order III
                {'day_order': 'III', 'period_number': 1, 'start_time': '09:15:00', 'end_time': '10:05:00', 'subject_code': '24CS502', 'subject_name': 'Web Technologies', 'slot_type': 'class', 'faculty_name': 'Ms. JJ. Arul Sheela'},
                {'day_order': 'III', 'period_number': 2, 'start_time': '10:05:00', 'end_time': '10:55:00', 'subject_code': '24AD303', 'subject_name': 'Introduction to Artificial Intelligence', 'slot_type': 'class', 'faculty_name': 'Dr. A. Delphin Carolina Rani'},
                {'day_order': 'III', 'period_number': 0, 'start_time': '10:55:00', 'end_time': '11:05:00', 'subject_code': 'BREAK', 'subject_name': 'Break', 'slot_type': 'break'},
                {'day_order': 'III', 'period_number': 3, 'start_time': '11:05:00', 'end_time': '11:55:00', 'subject_code': '24AL501', 'subject_name': 'Computer Networks Security', 'slot_type': 'class', 'faculty_name': 'Mr. P. Manikandan'},
                {'day_order': 'III', 'period_number': 4, 'start_time': '11:55:00', 'end_time': '12:45:00', 'subject_code': '24AD401', 'subject_name': 'Machine Learning', 'slot_type': 'class', 'faculty_name': 'Mr. S. Amirthalingam'},
                {'day_order': 'III', 'period_number': 0, 'start_time': '12:45:00', 'end_time': '13:25:00', 'subject_code': 'LUNCH', 'subject_name': 'Lunch Break', 'slot_type': 'lunch'},
                {'day_order': 'III', 'period_number': 5, 'start_time': '13:25:00', 'end_time': '14:15:00', 'subject_code': '24CS902/24CS901', 'subject_name': 'Recommender Systems / Exploratory Data Analysis', 'slot_type': 'class', 'faculty_name': 'Dr. B. Rethina Kumar'},
                {'day_order': 'III', 'period_number': 0, 'start_time': '15:05:00', 'end_time': '15:15:00', 'subject_code': 'BREAK', 'subject_name': 'Break', 'slot_type': 'break'},
                {'day_order': 'III', 'period_number': 7, 'start_time': '15:15:00', 'end_time': '16:00:00', 'subject_code': '24AD411/24CS511', 'subject_name': 'Machine Learning Lab / Web Technologies Lab', 'slot_type': 'lab', 'faculty_name': 'Mr. S. Amirthalingam'},
                {'day_order': 'III', 'period_number': 8, 'start_time': '16:00:00', 'end_time': '16:45:00', 'subject_code': '24AD411/24CS511', 'subject_name': 'Machine Learning Lab / Web Technologies Lab', 'slot_type': 'lab', 'faculty_name': 'Ms. JJ. Arul Sheela'},
                # Day Order IV
                {'day_order': 'IV', 'period_number': 1, 'start_time': '09:15:00', 'end_time': '10:05:00', 'subject_code': '24AD303', 'subject_name': 'Introduction to Artificial Intelligence', 'slot_type': 'class', 'faculty_name': 'Dr. A. Delphin Carolina Rani'},
                {'day_order': 'IV', 'period_number': 2, 'start_time': '10:05:00', 'end_time': '10:55:00', 'subject_code': '24AL501', 'subject_name': 'Computer Networks Security', 'slot_type': 'class', 'faculty_name': 'Mr. P. Manikandan'},
                {'day_order': 'IV', 'period_number': 0, 'start_time': '10:55:00', 'end_time': '11:05:00', 'subject_code': 'BREAK', 'subject_name': 'Break', 'slot_type': 'break'},
                {'day_order': 'IV', 'period_number': 3, 'start_time': '11:05:00', 'end_time': '11:55:00', 'subject_code': '24CS902/24CS901', 'subject_name': 'Recommender Systems / Exploratory Data Analysis', 'slot_type': 'class', 'faculty_name': 'Dr. B. Rethina Kumar'},
                {'day_order': 'IV', 'period_number': 4, 'start_time': '11:55:00', 'end_time': '12:45:00', 'subject_code': '24CS502', 'subject_name': 'Web Technologies', 'slot_type': 'class', 'faculty_name': 'Ms. JJ. Arul Sheela'},
                {'day_order': 'IV', 'period_number': 0, 'start_time': '12:45:00', 'end_time': '13:25:00', 'subject_code': 'LUNCH', 'subject_name': 'Lunch Break', 'slot_type': 'lunch'},
                {'day_order': 'IV', 'period_number': 5, 'start_time': '13:25:00', 'end_time': '14:15:00', 'subject_code': '24CS902(L)/24CS901(L)', 'subject_name': 'Recommender Systems Lab / Exploratory Data Analysis Lab', 'slot_type': 'lab', 'faculty_name': 'Dr. B. Rethina Kumar'},
                {'day_order': 'IV', 'period_number': 6, 'start_time': '14:15:00', 'end_time': '15:05:00', 'subject_code': '24CS902(L)/24CS901(L)', 'subject_name': 'Recommender Systems Lab / Exploratory Data Analysis Lab', 'slot_type': 'lab'},
                {'day_order': 'IV', 'period_number': 0, 'start_time': '15:05:00', 'end_time': '15:15:00', 'subject_code': 'BREAK', 'subject_name': 'Break', 'slot_type': 'break'},
                {'day_order': 'IV', 'period_number': 7, 'start_time': '15:15:00', 'end_time': '16:00:00', 'subject_code': '24CS502', 'subject_name': 'Web Technologies', 'slot_type': 'class', 'faculty_name': 'Ms. JJ. Arul Sheela'},
                {'day_order': 'IV', 'period_number': 8, 'start_time': '16:00:00', 'end_time': '16:45:00', 'subject_code': '24AL501', 'subject_name': 'Computer Networks Security', 'slot_type': 'class', 'faculty_name': 'Mr. P. Manikandan'},
                # Day Order V
                {'day_order': 'V', 'period_number': 1, 'start_time': '09:15:00', 'end_time': '10:05:00', 'subject_code': '24EM501', 'subject_name': 'Employability Skills III', 'slot_type': 'class', 'faculty_name': 'Ms. S. Srimathi'},
                {'day_order': 'V', 'period_number': 2, 'start_time': '10:05:00', 'end_time': '10:55:00', 'subject_code': '24EM501', 'subject_name': 'Employability Skills III', 'slot_type': 'class', 'faculty_name': 'Ms. L. Manimegalai'},
                {'day_order': 'V', 'period_number': 0, 'start_time': '10:55:00', 'end_time': '11:05:00', 'subject_code': 'BREAK', 'subject_name': 'Break', 'slot_type': 'break'},
                {'day_order': 'V', 'period_number': 3, 'start_time': '11:05:00', 'end_time': '11:55:00', 'subject_code': '24AD303', 'subject_name': 'Introduction to Artificial Intelligence', 'slot_type': 'class', 'faculty_name': 'Dr. A. Delphin Carolina Rani'},
                {'day_order': 'V', 'period_number': 4, 'start_time': '11:55:00', 'end_time': '12:45:00', 'subject_code': '24AL501', 'subject_name': 'Computer Networks Security', 'slot_type': 'class', 'faculty_name': 'Mr. P. Manikandan'},
                {'day_order': 'V', 'period_number': 0, 'start_time': '12:45:00', 'end_time': '13:25:00', 'subject_code': 'LUNCH', 'subject_name': 'Lunch Break', 'slot_type': 'lunch'},
                {'day_order': 'V', 'period_number': 5, 'start_time': '13:25:00', 'end_time': '14:15:00', 'subject_code': '24CS503', 'subject_name': 'Object Oriented Software Engineering', 'slot_type': 'class', 'faculty_name': 'Ms. S. Srimathi'},
                {'day_order': 'V', 'period_number': 0, 'start_time': '15:05:00', 'end_time': '15:15:00', 'subject_code': 'BREAK', 'subject_name': 'Break', 'slot_type': 'break'},
                {'day_order': 'V', 'period_number': 7, 'start_time': '15:15:00', 'end_time': '16:00:00', 'subject_code': '24AD411/24CS511', 'subject_name': 'Machine Learning Lab / Web Technologies Lab', 'slot_type': 'lab', 'faculty_name': 'Mr. S. Amirthalingam'},
                {'day_order': 'V', 'period_number': 8, 'start_time': '16:00:00', 'end_time': '16:45:00', 'subject_code': '24AD411/24CS511', 'subject_name': 'Machine Learning Lab / Web Technologies Lab', 'slot_type': 'lab'},
            ]
        }
        
    elif 'faculty' in filename_lower or 'staff' in filename_lower or 'teacher' in filename_lower:
        return {
            'document_type': 'faculty',
            'extracted_data': [
                {
                    'name': 'Prof. Anita Sharma',
                    'email': 'anita.cse@freshverse.edu',
                    'department': 'CSE',
                    'designation': 'Associate Professor',
                    'cabin': 'CSE Block 204',
                    'phone': '9845123067'
                },
                {
                    'name': 'Dr. Robert Dsouza',
                    'email': 'robert.ece@freshverse.edu',
                    'department': 'ECE',
                    'designation': 'Professor & Head',
                    'cabin': 'ECE Cabin A1',
                    'phone': '9123456780'
                },
                {
                    'name': 'Mrs. Priya Gopalan',
                    'email': 'priya.maths@freshverse.edu',
                    'department': 'Basic Sciences',
                    'designation': 'Assistant Professor',
                    'cabin': 'Science Lab Annex',
                    'phone': '8907654321'
                }
            ]
        }
        
    elif 'calendar' in filename_lower or 'schedule_academic' in filename_lower or 'planner' in filename_lower:
        return {
            'document_type': 'calendar',
            'extracted_data': [
                {
                    'event_date': '2026-08-03',
                    'description': 'Commencement of Classes - Day Order I',
                    'event_type': 'academic_activity',
                    'day_order': 'I',
                    'department': 'All',
                    'section': 'All'
                },
                {
                    'event_date': '2026-08-04',
                    'description': 'Regular Classes - Day Order II',
                    'event_type': 'academic_activity',
                    'day_order': 'II',
                    'department': 'All',
                    'section': 'All'
                },
                {
                    'event_date': '2026-09-21',
                    'description': 'Mid-Term Examinations Start',
                    'event_type': 'exam',
                    'day_order': None,
                    'department': 'CSE',
                    'section': 'A'
                },
                {
                    'event_date': '2026-10-02',
                    'description': 'Gandhi Jayanti Holiday',
                    'event_type': 'holiday',
                    'day_order': None,
                    'department': 'All',
                    'section': 'All'
                }
            ]
        }
        
    else:
        # Default to Event poster mock extraction
        return {
            'document_type': 'event',
            'extracted_data': {
                'title': 'HackVerse 2026',
                'description': '24-hour national level hackathon centered around Generative AI, Sustainable Tech, and Web3 development. Exciting cash prizes worth $5000 up for grabs.',
                'date_time': '2026-10-15T09:00:00Z',
                'venue': 'Campus Central Seminar Hall',
                'registration_deadline': '2026-10-10T18:00:00Z',
                'max_seats': 150
            }
        }
