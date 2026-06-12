"""
Notification Celery tasks — all email delivery via Django's EMAIL_BACKEND.
In development this uses Gmail SMTP (configured in settings).
In production this uses SendGrid or any other configured backend.
"""
import logging
from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

logger = logging.getLogger('tasks.notifications')

FROM = settings.DEFAULT_FROM_EMAIL


def _send_html_email(subject, template, context, to_email):
    """Render an HTML template and send email with both plain-text and HTML versions."""
    html_message = render_to_string(template, context)
    # Strip HTML tags for plain-text fallback
    import re
    plain = re.sub(r'<[^>]+>', '', html_message)
    plain = re.sub(r'\s+', ' ', plain).strip()
    send_mail(subject, plain, FROM, [to_email], html_message=html_message, fail_silently=False)


@shared_task(name='tasks.notification_tasks.send_email_verification')
def send_email_verification(user_id: str, code: str):
    try:
        from apps.users.models import User
        user = User.objects.get(pk=user_id)
        _send_html_email(
            subject='Verify your Al Merak AML account',
            template='email/otp_verify.html',
            context={'first_name': user.first_name, 'code': code},
            to_email=user.email,
        )
        logger.info('Email verification sent to %s', user.email)
    except Exception as exc:
        logger.exception('send_email_verification failed for %s: %s', user_id, exc)


@shared_task(name='tasks.notification_tasks.send_password_reset')
def send_password_reset(user_id: str, code: str):
    try:
        from apps.users.models import User
        user = User.objects.get(pk=user_id)
        _send_html_email(
            subject='Reset your Al Merak AML password',
            template='email/password_reset.html',
            context={'first_name': user.first_name, 'code': code},
            to_email=user.email,
        )
        logger.info('Password reset email sent to %s', user.email)
    except Exception as exc:
        logger.exception('send_password_reset failed for %s: %s', user_id, exc)


@shared_task(name='tasks.notification_tasks.send_sms_otp')
def send_sms_otp(phone: str, code: str):
    """Send OTP via Twilio SMS. Falls back to logging if Twilio is not configured."""
    try:
        from twilio.rest import Client
        sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
        token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
        from_number = getattr(settings, 'TWILIO_FROM_NUMBER', '')
        if not all([sid, token, from_number]) or sid.startswith('AC'):
            logger.info('[DEV] SMS OTP for %s: %s', phone, code)
            return
        client = Client(sid, token)
        client.messages.create(
            body=f'Your Al Merak verification code: {code}. Valid 5 minutes.',
            from_=from_number,
            to=phone,
        )
        logger.info('SMS OTP sent to %s', phone)
    except Exception as exc:
        logger.exception('send_sms_otp failed for %s: %s', phone, exc)


@shared_task(name='tasks.notification_tasks.send_user_invitation')
def send_user_invitation(user_id: str, temp_password: str):
    try:
        from apps.users.models import User
        user = User.objects.get(pk=user_id)
        login_url = f"{settings.FRONTEND_URL}/auth/login"
        _send_html_email(
            subject=f"You've been invited to {user.organization.name} on Al Merak AML",
            template='email/user_invitation.html',
            context={
                'first_name': user.first_name,
                'org_name': user.organization.name,
                'email': user.email,
                'temp_password': temp_password,
                'login_url': login_url,
            },
            to_email=user.email,
        )
        logger.info('Invitation sent to %s', user.email)
    except Exception as exc:
        logger.exception('send_user_invitation failed for %s: %s', user_id, exc)


@shared_task(name='tasks.notification_tasks.send_kyc_status_notification')
def send_kyc_status_notification(customer_id: str, new_status: str):
    try:
        from apps.kyc.models import Customer
        from apps.users.models import User
        customer = Customer.objects.select_related('organization').get(pk=customer_id)
        org = customer.organization
        name = customer.company_name or f"{customer.first_name} {customer.last_name}"

        compliance = (
            User.objects.filter(organization=org, role__name='compliance_officer', is_active=True).first()
            or User.objects.filter(organization=org, role__name='owner', is_active=True).first()
        )
        if not compliance:
            return

        approved = new_status == 'verified'
        status_label = 'Approved' if approved else 'Rejected'
        _send_html_email(
            subject=f"KYC {status_label}: {name}",
            template='email/kyc_notification.html',
            context={
                'compliance_officer': compliance.first_name,
                'customer_name': name,
                'approved': approved,
                'review_url': f"{settings.FRONTEND_URL}/kyc/customers",
            },
            to_email=compliance.email,
        )
    except Exception as exc:
        logger.exception('KYC notification failed for %s: %s', customer_id, exc)


@shared_task(name='tasks.notification_tasks.send_vat_reminders')
def send_vat_reminders():
    from datetime import date
    from apps.tenants.models import Organization
    from apps.users.models import User
    from services.tax_engine.vat import VATEngine

    today = date.today()
    sent = 0
    for org in Organization.objects.filter(status='active'):
        _, quarter_end = VATEngine.get_current_quarter(today)
        days_left = (quarter_end - today).days
        if days_left <= 14:
            contact = (
                User.objects.filter(
                    organization=org,
                    role__name__in=['owner', 'compliance_officer'],
                    is_active=True,
                ).first()
            )
            if contact:
                try:
                    _send_html_email(
                        subject=f'VAT Return Due in {days_left} Days — {org.name}',
                        template='email/vat_reminder.html',
                        context={
                            'first_name': contact.first_name,
                            'org_name': org.name,
                            'days_left': days_left,
                            'due_date': quarter_end.strftime('%d %B %Y'),
                            'filing_url': f"{settings.FRONTEND_URL}/accounting/vat-reports",
                        },
                        to_email=contact.email,
                    )
                    sent += 1
                except Exception as exc:
                    logger.warning('VAT reminder failed for %s: %s', org.name, exc)

    logger.info('VAT reminders sent to %d organizations', sent)
    return {'sent': sent}
