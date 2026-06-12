from django.db import models
from core.models import TenantScopedModel


class Watchlist(TenantScopedModel):
    """
    Global and organization-specific watchlists.
    Global ones (OFAC, UN etc) have organization set to the system org.
    """
    class Source(models.TextChoices):
        OFAC_SDN = 'ofac_sdn', 'OFAC SDN List'
        UN_CONSOLIDATED = 'un_consolidated', 'UN Consolidated List'
        EU_CONSOLIDATED = 'eu_consolidated', 'EU Consolidated List'
        HM_TREASURY = 'hm_treasury', 'HM Treasury (UK)'
        UAE_LOCAL = 'uae_local_terrorist', 'UAE Local Terrorist List'
        CUSTOM = 'custom', 'Custom Watchlist'

    name = models.CharField(max_length=200)
    source = models.CharField(max_length=30, choices=Source.choices)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_global = models.BooleanField(default=False, help_text='Global lists apply to all tenants.')
    last_updated_at = models.DateTimeField(null=True, blank=True)
    record_count = models.PositiveIntegerField(default=0)
    update_url = models.URLField(blank=True)

    class Meta:
        db_table = 'watchlists'

    def __str__(self):
        return self.name


class WatchlistEntry(models.Model):
    """Individual entry in a watchlist."""
    watchlist = models.ForeignKey(Watchlist, on_delete=models.CASCADE, related_name='entries')
    name = models.CharField(max_length=500, db_index=True)
    aliases = models.JSONField(default=list)
    entity_type = models.CharField(
        max_length=20,
        choices=[('individual', 'Individual'), ('corporate', 'Corporate'), ('vessel', 'Vessel'), ('aircraft', 'Aircraft')],
        default='individual'
    )
    dob = models.CharField(max_length=30, blank=True)
    nationality = models.CharField(max_length=5, blank=True)
    reference_id = models.CharField(max_length=100, blank=True)
    program = models.CharField(max_length=200, blank=True)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'watchlist_entries'
        indexes = [models.Index(fields=['watchlist', 'entity_type'])]


class AMLScreening(TenantScopedModel):
    """
    Audit record of every AML screening run for a customer.
    Immutable — never updated, only created.
    """
    class ScreeningType(models.TextChoices):
        SANCTIONS = 'sanctions', 'Sanctions Screening'
        PEP = 'pep', 'PEP Screening'
        ADVERSE_MEDIA = 'adverse_media', 'Adverse Media'
        FULL = 'full', 'Full Screening (All)'

    class Result(models.TextChoices):
        CLEAR = 'clear', 'Clear'
        POTENTIAL_MATCH = 'potential_match', 'Potential Match'
        MATCH = 'match', 'Match'
        ERROR = 'error', 'Error'

    customer = models.ForeignKey('kyc.Customer', on_delete=models.CASCADE, related_name='screenings')
    screening_type = models.CharField(max_length=20, choices=ScreeningType.choices, default=ScreeningType.FULL)
    triggered_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='triggered_screenings'
    )

    # Results
    result = models.CharField(max_length=20, choices=Result.choices)
    match_score = models.FloatField(default=0.0)
    sanctions_result = models.CharField(max_length=20, blank=True)
    pep_result = models.CharField(max_length=20, blank=True)
    adverse_media_result = models.CharField(max_length=20, blank=True)

    # Detail data
    matched_lists = models.JSONField(default=list)
    matched_entries = models.JSONField(default=list)
    risk_factors = models.JSONField(default=list)

    screened_at = models.DateTimeField(auto_now_add=True)
    duration_ms = models.PositiveIntegerField(default=0)
    error_detail = models.TextField(blank=True)

    class Meta:
        db_table = 'aml_screenings'
        ordering = ['-screened_at']

    def __str__(self):
        return f"{self.customer} — {self.get_result_display()} ({self.screened_at.date()})"


class AMLAlert(TenantScopedModel):
    """
    Compliance alert triggered by AML screening or transaction monitoring rule.
    Central record for compliance officers to review and resolve.
    """
    class AlertType(models.TextChoices):
        SANCTIONS_MATCH = 'sanctions_match', 'Sanctions Match'
        PEP_IDENTIFIED = 'pep_identified', 'PEP Identified'
        ADVERSE_MEDIA = 'adverse_media', 'Adverse Media'
        HIGH_RISK_TXN = 'high_risk_txn', 'High-Risk Transaction'
        STRUCTURING = 'structuring', 'Potential Structuring'
        VELOCITY = 'velocity', 'Velocity Alert'
        THRESHOLD = 'threshold', 'Threshold Breach'
        GEOGRAPHIC = 'geographic', 'Geographic Anomaly'
        MANUAL = 'manual', 'Manually Created'

    class Severity(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        CRITICAL = 'critical', 'Critical'

    class AlertStatus(models.TextChoices):
        OPEN = 'open', 'Open'
        UNDER_REVIEW = 'under_review', 'Under Review'
        ESCALATED = 'escalated', 'Escalated'
        CLOSED_FALSE = 'closed_false_positive', 'Closed — False Positive'
        CLOSED_SAR = 'closed_sar', 'Closed — SAR Filed'
        CLOSED_RESOLVED = 'closed_resolved', 'Closed — Resolved'

    customer = models.ForeignKey('kyc.Customer', on_delete=models.CASCADE, related_name='aml_alerts', null=True, blank=True)
    transaction = models.ForeignKey('accounting.Transaction', on_delete=models.SET_NULL, null=True, blank=True, related_name='aml_alerts')
    screening = models.ForeignKey(AMLScreening, on_delete=models.SET_NULL, null=True, blank=True)

    alert_type = models.CharField(max_length=30, choices=AlertType.choices)
    severity = models.CharField(max_length=10, choices=Severity.choices)
    status = models.CharField(max_length=30, choices=AlertStatus.choices, default=AlertStatus.OPEN)

    title = models.CharField(max_length=255)
    description = models.TextField()
    rule_triggered = models.CharField(max_length=50, blank=True)
    match_details = models.JSONField(default=dict)

    assigned_to = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_alerts'
    )
    resolved_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_alerts'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)
    sar_reference = models.CharField(max_length=100, blank=True, help_text='CBUAE STR reference number if filed.')
    due_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'aml_alerts'
        indexes = [
            models.Index(fields=['organization', 'status', 'severity']),
            models.Index(fields=['organization', 'created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_severity_display()}] {self.title}"


class TransactionRule(TenantScopedModel):
    """
    Configurable AML monitoring rules per organization.
    Rules are evaluated against every incoming transaction.
    """
    class RuleCode(models.TextChoices):
        R001_CASH_THRESHOLD = 'R001', 'Cash Reporting Threshold (AED 55,000)'
        R002_STRUCTURING = 'R002', 'Structuring Detection (< 24h aggregate)'
        R003_ROUND_NUMBERS = 'R003', 'Round Number Transactions'
        R004_FATF_COUNTRY = 'R004', 'FATF Grey/Black List Country'
        R005_HIGH_RISK_CUSTOMER = 'R005', 'High-Risk Customer Transaction'
        R006_VELOCITY = 'R006', 'High Velocity (> 10 txns/hour)'
        R007_GEOGRAPHIC = 'R007', 'Geographic Anomaly'
        R008_LARGE_CASH_OUT = 'R008', 'Large Cash Withdrawal'
        CUSTOM = 'CUSTOM', 'Custom Rule'

    rule_code = models.CharField(max_length=10, choices=RuleCode.choices)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    severity = models.CharField(max_length=10, choices=AMLAlert.Severity.choices, default='high')
    threshold_amount = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    threshold_count = models.PositiveIntegerField(null=True, blank=True)
    window_hours = models.PositiveIntegerField(null=True, blank=True)
    parameters = models.JSONField(default=dict, help_text='Rule-specific parameters as JSON.')

    class Meta:
        db_table = 'transaction_rules'
        unique_together = ('organization', 'rule_code')
