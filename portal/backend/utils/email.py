import threading
import requests
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
            print(f"[Email - Console Fallback] To: {to}\nSubject: {subject}\n{body}", flush=True)
            return
        
        try:
            original_to = ", ".join(to)
            sandbox_recipient = "vsbuvaneshraj06@gmail.com"
            
            modified_subject = f"[For: {original_to}] {subject}"
            modified_body = (
                f"--- SANDBOX FORWARDED EMAIL ---\n"
                f"Original Recipient: {original_to}\n"
                f"---------------------------------\n\n"
                f"{body}"
            )
            
            payload = {
                "from": "FreshVerse Portal <onboarding@resend.dev>",
                "to": [sandbox_recipient],
                "subject": modified_subject,
                "text": modified_body,
            }
            
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            
            response = requests.post("https://api.resend.com/emails", json=payload, headers=headers, timeout=10)
            if response.status_code in [200, 201, 202]:
                print(f"Resend Success (Sandbox Forwarded): Original recipient: {original_to} | Sent to: {sandbox_recipient} | Response: {response.text}", flush=True)
            else:
                print(f"Resend API Error (Status {response.status_code}) sending for {original_to}: {response.text}", flush=True)
        except Exception as e:
            print(f"Resend Connection Exception sending for {to}: {e}", flush=True)

    thread = threading.Thread(target=_send, daemon=True)
    thread.start()
