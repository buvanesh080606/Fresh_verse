import threading
import resend
from django.conf import settings


def send_email(subject: str, body: str, to: list[str]) -> None:
    """
    Send an email using Resend API over HTTPS (works on Render free tier).
    Falls back to console logging if RESEND_API_KEY is not set.
    Runs in a background thread to avoid blocking web requests.
    """
    def _send():
        api_key = getattr(settings, 'RESEND_API_KEY', '')
        if not api_key:
            print(f"[Email - Console Fallback] To: {to}\nSubject: {subject}\n{body}")
            return
        try:
            resend.api_key = api_key
            params = {
                "from": "FreshVerse Portal <onboarding@resend.dev>",
                "to": to,
                "subject": subject,
                "text": body,
            }
            response = resend.Emails.send(params)
            print(f"Resend Success: Email sent to {to} | ID: {response.get('id', 'N/A')}")
        except Exception as e:
            print(f"Resend Error sending to {to}: {e}")

    thread = threading.Thread(target=_send, daemon=True)
    thread.start()
