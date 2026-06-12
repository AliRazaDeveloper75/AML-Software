from django.db import models
from core.models import TenantScopedModel


class GeneratedReport(TenantScopedModel):
    class ReportType(models.TextChoices):
        AML_SAR_SUMMARY = 'sar_summary', 'SAR Summary'
        SCREENING_SUMMARY = 'screening_summary', 'Screening Summary'
        TRANSACTION_MONITORING = 'transaction_monitoring', 'Transaction Monitoring'
        KYC_STATUS = 'kyc_status', 'KYC Status Report'
        VAT_RETURN = 'vat_return', 'VAT Return (VAT-201)'
        CORPORATE_TAX = 'corporate_tax', 'Corporate Tax Return'
        GL_TRIAL_BALANCE = 'trial_balance', 'Trial Balance'
        INCOME_STATEMENT = 'income_statement', 'Income Statement (P&L)'
        BALANCE_SHEET = 'balance_sheet', 'Balance Sheet'
        CASH_FLOW = 'cash_flow', 'Cash Flow Statement'

    class Status(models.TextChoices):
        QUEUED = 'queued', 'Queued'
        PROCESSING = 'processing', 'Processing'
        READY = 'ready', 'Ready'
        FAILED = 'failed', 'Failed'

    report_type = models.CharField(max_length=30, choices=ReportType.choices)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.QUEUED)
    params = models.JSONField(default=dict)
    requested_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='reports'
    )
    file_url = models.TextField(blank=True)
    blob_name = models.CharField(max_length=500, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        db_table = 'generated_reports'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_report_type_display()} — {self.organization} ({self.status})"
