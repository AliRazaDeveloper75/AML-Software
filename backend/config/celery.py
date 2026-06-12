import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('almerak')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# ─── Periodic Tasks ───────────────────────────────────────────
app.conf.beat_schedule = {
    # Refresh OFAC watchlist daily at 2 AM GST
    'refresh-ofac-watchlist': {
        'task': 'tasks.aml_tasks.refresh_ofac_watchlist',
        'schedule': crontab(hour=2, minute=0),
    },
    # Refresh UN consolidated list weekly Sunday 3 AM
    'refresh-un-watchlist': {
        'task': 'tasks.aml_tasks.refresh_un_watchlist',
        'schedule': crontab(hour=3, minute=0, day_of_week='sunday'),
    },
    # Run scheduled reports every hour
    'run-scheduled-reports': {
        'task': 'tasks.report_tasks.run_scheduled_reports',
        'schedule': crontab(minute=0),
    },
    # Reset monthly API/KYC quotas on 1st of month
    'reset-monthly-quotas': {
        'task': 'tasks.maintenance_tasks.reset_monthly_quotas',
        'schedule': crontab(hour=0, minute=0, day_of_month=1),
    },
    # VAT quarter-end reminder (last day of Mar, Jun, Sep, Dec)
    'vat-filing-reminder': {
        'task': 'tasks.notification_tasks.send_vat_reminders',
        'schedule': crontab(hour=9, minute=0, day_of_month='28'),
    },
    # Clean up expired OTPs and blacklisted tokens
    'cleanup-expired-tokens': {
        'task': 'tasks.maintenance_tasks.cleanup_expired_tokens',
        'schedule': crontab(hour=4, minute=0),
    },
    # Re-screen high-risk customers monthly
    'reschedule-high-risk-screening': {
        'task': 'tasks.aml_tasks.reschedule_periodic_screening',
        'schedule': crontab(hour=1, minute=0, day_of_month=1),
    },
}
