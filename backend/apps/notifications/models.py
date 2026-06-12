from django.db import models
from core.models import TimeStampedModel, TenantScopedModel


class Notification(TenantScopedModel):
    """In-app notification record for individual users."""
    class NotificationType(models.TextChoices):
        AML_ALERT = 'aml_alert', 'AML Alert'
        KYC_STATUS = 'kyc_status', 'KYC Status Change'
        REPORT_READY = 'report_ready', 'Report Ready'
        INVOICE = 'invoice', 'Invoice'
        SYSTEM = 'system', 'System'
        VAT_REMINDER = 'vat_reminder', 'VAT Reminder'

    recipient = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    action_url = models.CharField(max_length=500, blank=True)
    metadata = models.JSONField(default=dict)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read', 'created_at']),
        ]

    def mark_read(self):
        from django.utils import timezone
        self.is_read = True
        self.read_at = timezone.now()
        self.save(update_fields=['is_read', 'read_at'])
