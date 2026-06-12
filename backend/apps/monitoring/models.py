from django.db import models
from core.models import TenantScopedModel


class MonitoringRule(TenantScopedModel):
    """Real-time transaction monitoring rules evaluated on each transaction."""
    rule_code = models.CharField(max_length=20, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    severity = models.CharField(
        max_length=10,
        choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')],
        default='high'
    )
    threshold_amount = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    threshold_count = models.PositiveIntegerField(null=True, blank=True)
    window_hours = models.PositiveIntegerField(null=True, blank=True)
    parameters = models.JSONField(default=dict)

    class Meta:
        db_table = 'monitoring_rules'
        unique_together = ('organization', 'rule_code')

    def __str__(self):
        return f"{self.rule_code} — {self.name}"


class TransactionAlert(TenantScopedModel):
    """Alert raised by the real-time monitoring engine."""
    transaction = models.ForeignKey('accounting.Transaction', on_delete=models.CASCADE, related_name='monitoring_alerts')
    rule = models.ForeignKey(MonitoringRule, on_delete=models.CASCADE, related_name='alerts')
    customer = models.ForeignKey('kyc.Customer', on_delete=models.SET_NULL, null=True, blank=True)

    alert_data = models.JSONField(default=dict)
    is_reviewed = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)

    class Meta:
        db_table = 'transaction_alerts'
        ordering = ['-created_at']
