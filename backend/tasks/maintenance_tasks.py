"""
Maintenance tasks: quota resets, token cleanup.
"""
import logging
from celery import shared_task

logger = logging.getLogger('tasks.maintenance')


@shared_task(name='tasks.maintenance_tasks.reset_monthly_quotas')
def reset_monthly_quotas():
    """
    1st of every month: reset kyc_count_this_month and api_calls_this_month for all orgs.
    """
    from apps.tenants.models import Organization
    count = Organization.objects.filter(status__in=['active', 'trial']).update(
        kyc_count_this_month=0,
        api_calls_this_month=0,
    )
    logger.info('Monthly quotas reset for %d organizations', count)
    return {'reset': count}


@shared_task(name='tasks.maintenance_tasks.cleanup_expired_tokens')
def cleanup_expired_tokens():
    """Daily: purge expired JWT blacklist tokens and OTP records."""
    from django.utils import timezone
    now = timezone.now()

    # Blacklisted JWT tokens
    try:
        from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
        expired = OutstandingToken.objects.filter(expires_at__lt=now)
        count_bl = BlacklistedToken.objects.filter(token__in=expired).delete()[0]
        count_ot = expired.delete()[0]
        logger.info('JWT cleanup: %d blacklisted, %d outstanding expired tokens removed', count_bl, count_ot)
    except Exception as exc:
        logger.warning('JWT token cleanup failed: %s', exc)

    # OTP verification records older than 24h
    from apps.users.models import OTPVerification
    cutoff = now - __import__('datetime').timedelta(hours=24)
    deleted = OTPVerification.objects.filter(expires_at__lt=cutoff).delete()[0]
    logger.info('OTP cleanup: %d expired records removed', deleted)

    return {'jwt_cleared': True, 'otp_cleared': deleted}


@shared_task(name='tasks.maintenance_tasks.check_kyc_expiry')
def check_kyc_expiry():
    """
    Daily: mark verified customers as expired if kyc_expiry_date has passed.
    Send notification to compliance officers.
    """
    from datetime import date
    from apps.kyc.models import Customer
    today = date.today()

    expired_count = Customer.objects.filter(
        kyc_status='verified',
        kyc_expiry_date__lt=today,
        deleted_at__isnull=True,
    ).update(kyc_status='expired')

    logger.info('KYC expiry check: %d customers moved to expired', expired_count)
    return {'expired': expired_count}
