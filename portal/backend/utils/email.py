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
            # Since Resend sandbox only allows sending to the owner's registered email:
            original_to = ", ".join(to)
            sandbox_recipient = "vsbuvaneshraj06@gmail.com"
            
            modified_subject = f"[For: {original_to}] {subject}"
            modified_body = (
                f"--- SANDBOX FORWARDED EMAIL ---\n"
                f"Original Recipient: {original_to}\n"
                f"---------------------------------\n\n"
                f"{body}"
            )
            
            params = {
                "from": "FreshVerse Portal <onboarding@resend.dev>",
                "to": [sandbox_recipient],
                "subject": modified_subject,
                "text": modified_body,
            }
            response = resend.Emails.send(params)
            print(f"Resend Success (Sandbox Forwarded): Original recipient: {original_to} | Sent to: {sandbox_recipient} | ID: {response.get('id', 'N/A')}")
        except Exception as e:
            print(f"Resend Error sending sandbox email for {to}: {e}")

    thread = threading.Thread(target=_send, daemon=True)
    thread.start()
