"""
SendGrid email service.
All emails use dynamic templates defined in the SendGrid dashboard.
Falls back to Django console backend in development.
"""
import logging
from django.conf import settings

logger = logging.getLogger('services.sendgrid')

# Template IDs — set in SendGrid dashboard, referenced by slug
TEMPLATES = {
    'welcome': 'd-welcome',
    'email_verification': 'd-email-verify',
    'password_reset': 'd-password-reset',
    'otp_sms_fallback': 'd-otp',
    'kyc_approved': 'd-kyc-approved',
    'kyc_rejected': 'd-kyc-rejected',
    'alert_open': 'd-alert-open',
    'vat_reminder': 'd-vat-reminder',
    'user_invitation': 'd-user-invite',
    'invoice_sent': 'd-invoice',
}


def send_email(to_email: str, template_slug: str, dynamic_data: dict) -> bool:
    """
    Send a transactional email via SendGrid dynamic template.
    Returns True on success, False on failure (never raises — logged instead).
    """
    template_id = TEMPLATES.get(template_slug)
    if not template_id:
        logger.error('Unknown email template slug: %s', template_slug)
        return False

    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail, To, DynamicTemplateData

        sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        message = Mail(
            from_email=(settings.DEFAULT_FROM_EMAIL, 'Al Merak AML'),
            to_emails=to_email,
        )
        message.template_id = template_id
        message.dynamic_template_data = dynamic_data

        response = sg.send(message)
        if response.status_code >= 400:
            logger.error('SendGrid error %s for %s: %s', response.status_code, to_email, response.body)
            return False
        return True
    except Exception as exc:
        logger.exception('Failed to send %s to %s: %s', template_slug, to_email, exc)
        return False


def send_sms_otp(phone: str, code: str) -> bool:
    """Send OTP via Twilio SMS."""
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            body=f'Your Al Merak verification code is: {code}. Valid for 5 minutes.',
            from_=settings.TWILIO_PHONE_NUMBER,
            to=phone,
        )
        return True
    except Exception as exc:
        logger.exception('Failed to send SMS OTP to %s: %s', phone, exc)
        return False
