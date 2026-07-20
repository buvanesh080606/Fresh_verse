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
            raw_recipients = [to.strip()]
        else:
            raw_recipients = [email.strip() for email in to if email and isinstance(email, str) and email.strip()]

        # Deduplicate recipients while preserving order
        recipients = list(dict.fromkeys(raw_recipients))

        if not recipients:
            return

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        sandbox_owner = "vsbuvaneshraj06@gmail.com"

        # Try sending directly to recipients
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
                return
            else:
                print(f"Resend Notice ({response.status_code}): {response.text}", flush=True)
        except Exception as e:
            print(f"Resend Connection Exception: {e}", flush=True)

        # If batch call failed (e.g., due to Resend free plan sandbox restrictions on unverified emails),
        # attempt individual delivery for verified addresses, and group unverified ones into 1 single fallback email.
        unverified_recipients = []
        for single_recipient in recipients:
            try:
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
                    if single_recipient != sandbox_owner:
                        unverified_recipients.append(single_recipient)
            except Exception as e:
                print(f"Error sending to {single_recipient}: {e}", flush=True)
                if single_recipient != sandbox_owner:
                    unverified_recipients.append(single_recipient)

        # Send EXACTLY ONE consolidated fallback email to sandbox owner if external recipients failed
        if unverified_recipients:
            try:
                recipients_str = ", ".join(unverified_recipients)
                fallback_subject = f"[Forwarded to Admin: {recipients_str}] {subject}"
                fallback_body = (
                    f"--- RESEND SANDBOX FORWARDED EMAIL ---\n"
                    f"Intended Recipient(s): {recipients_str}\n"
                    f"----------------------------------------\n\n"
                    f"{body}"
                )
                fb_payload = {
                    "from": "FreshVerse Portal <onboarding@resend.dev>",
                    "to": [sandbox_owner],
                    "subject": fallback_subject,
                    "text": fallback_body,
                }
                fb_res = requests.post("https://api.resend.com/emails", json=fb_payload, headers=headers, timeout=10)
                print(f"Consolidated fallback email sent to sandbox owner ({sandbox_owner}) for [{recipients_str}] | Status: {fb_res.status_code}", flush=True)
            except Exception as e:
                print(f"Error sending sandbox fallback email: {e}", flush=True)

    thread = threading.Thread(target=_send, daemon=True)
    thread.start()
