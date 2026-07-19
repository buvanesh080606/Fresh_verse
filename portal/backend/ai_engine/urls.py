from django.urls import path
from ai_engine.views import ChatAssistantView, DocumentParserView

urlpatterns = [
    path('chat/', ChatAssistantView.as_view(), name='ai_chat'),
    path('parse-document/', DocumentParserView.as_view(), name='ai_parse_document'),
]
