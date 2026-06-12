from django.db import models
from core.models import TenantScopedModel


class VATReturn(TenantScopedModel):
    """Filed or computed VAT-201 return for a quarter."""
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        FILED = 'filed', 'Filed'
        AMENDED = 'amended', 'Amended'

    period_start = models.DateField()
    period_end = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)

    # Output VAT
    standard_rated_supplies = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    output_vat = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    zero_rated_supplies = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    exempt_supplies = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    # Input VAT
    standard_rated_expenses = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    recoverable_input_vat = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    non_recoverable_input_vat = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    adjustments = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    net_vat_payable = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    is_refund = models.BooleanField(default=False)
    refund_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    filed_at = models.DateTimeField(null=True, blank=True)
    filed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    fta_reference = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'vat_returns'
        unique_together = ('organization', 'period_start', 'period_end')
        ordering = ['-period_start']

    def __str__(self):
        return f"VAT {self.period_start} to {self.period_end} — {self.organization}"


class CorporateTaxReturn(TenantScopedModel):
    """Annual Corporate Tax return."""
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        FILED = 'filed', 'Filed'
        AMENDED = 'amended', 'Amended'

    tax_year = models.PositiveIntegerField()
    period_start = models.DateField()
    period_end = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)

    total_revenue = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    accounting_profit = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    add_back_disallowable = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    less_exempt_income = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    taxable_income = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    exemption_threshold = models.DecimalField(max_digits=18, decimal_places=2, default=375000)
    taxable_income_above_threshold = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    ct_rate = models.DecimalField(max_digits=5, decimal_places=4, default='0.09')
    ct_liability = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    effective_rate = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    small_business_relief = models.BooleanField(default=False)

    filing_deadline = models.DateField()
    filed_at = models.DateTimeField(null=True, blank=True)
    filed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    mof_reference = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'ct_returns'
        unique_together = ('organization', 'tax_year')
        ordering = ['-tax_year']

    def __str__(self):
        return f"CT {self.tax_year} — {self.organization}"
