import threading
import requests
from django.conf import settings


def send_email(subject: str, body: str, to: list[str]) -> None:
    """
    Send emails directly to intended student/faculty recipients using Resend API.
    Runs in a background thread to avoid blocking web requests.
    """
    def _send():
        api_key = getattr(settings, 'RESEND_API_KEY', '')
        if not api_key:
            print(f"[Email - Console Fallback] To: {to}\nSubject: {subject}\n{body}", flush=True)
            return

        if isinstance(to, str):
            recipients = [to]
        else:
            recipients = [email.strip() for email in to if email and isinstance(email, str) and email.strip()]

        if not recipients:
            return

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        # Send directly to recipient emails
        try:
            payload = {
                "from": "FreshVerse Portal <onboarding@resend.dev>",
                "to": recipients,
                "subject": subject,
                "text": body,
            }
            response = requests.post("https://api.resend.com/emails", json=payload, headers=headers, timeout=10)
            if response.status_code in [200, 201, 202]:
                print(f"Resend Direct Email Success to {recipients} | Response: {response.text}", flush=True)
            else:
                print(f"Resend Batch Notice ({response.status_code}): {response.text}. Retrying individually...", flush=True)
                for single_recipient in recipients:
                    single_payload = {
                        "from": "FreshVerse Portal <onboarding@resend.dev>",
                        "to": [single_recipient],
                        "subject": subject,
                        "text": body,
                    }
                    r = requests.post("https://api.resend.com/emails", json=single_payload, headers=headers, timeout=10)
                    if r.status_code in [200, 201, 202]:
                        print(f"Resend Individual Email Success to {single_recipient}", flush=True)
                    else:
                        print(f"Resend API Notice for {single_recipient} ({r.status_code}): {r.text}", flush=True)
                        # If Resend free sandbox prevents sending to unverified external emails, forward to superadmin email
                        sandbox_owner = "vsbuvaneshraj06@gmail.com"
                        if single_recipient != sandbox_owner:
                            fallback_subject = f"[For Student: {single_recipient}] {subject}"
                            fallback_body = (
                                f"--- RESEND SANDBOX FORWARDED EMAIL ---\n"
                                f"Intended Student Recipient: {single_recipient}\n"
                                f"----------------------------------------\n\n"
                                f"{body}"
                            )
                            fb_payload = {
                                "from": "FreshVerse Portal <onboarding@resend.dev>",
                                "to": [sandbox_owner],
                                "subject": fallback_subject,
                                "text": fallback_body,
                            }
                            requests.post("https://api.resend.com/emails", json=fb_payload, headers=headers, timeout=10)
                            print(f"Forwarded email for {single_recipient} to superadmin sandbox ({sandbox_owner})", flush=True)
        except Exception as e:
            print(f"Resend Connection Exception sending for {recipients}: {e}", flush=True)

    thread = threading.Thread(target=_send, daemon=True)
    thread.start()
