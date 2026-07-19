from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from ai_engine.services.gemini_chat import get_gemini_campus_response
from ai_engine.services.gemini_vision import parse_document_with_gemini
from utils.permissions import IsAdminUserRole

from ai_engine.models import AIQueryLog

class ChatAssistantView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        query = request.data.get('query')
        chat_history = request.data.get('chat_history', [])
        
        if not query:
            return Response({'error': 'query field is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get AI Response based on DB Context
        response_text = get_gemini_campus_response(query, request.user, chat_history)
        
        # Log to DB
        try:
            AIQueryLog.objects.create(
                user=request.user,
                query=query,
                response=response_text
            )
        except Exception as e:
            print("Error logging query:", e)
        
        return Response({
            'response': response_text,
            'query': query
        }, status=status.HTTP_200_OK)

class DocumentParserView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAdminUserRole]

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'error': 'No file uploaded under key "file".'}, status=status.HTTP_400_BAD_REQUEST)

        # Read file bytes
        file_bytes = uploaded_file.read()
        mime_type = uploaded_file.content_type
        filename = uploaded_file.name

        # Extract structured data
        parsed_data = parse_document_with_gemini(file_bytes, mime_type, filename)
        
        return Response(parsed_data, status=status.HTTP_200_OK)
