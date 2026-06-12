from django.db import models
from core.models import TenantScopedModel


class Subscription(TenantScopedModel):
    """Tracks the active Stripe subscription for an organization."""
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        TRIALING = 'trialing', 'Trialing'
        PAST_DUE = 'past_due', 'Past Due'
        CANCELLED = 'cancelled', 'Cancelled'
        PAUSED = 'paused', 'Paused'

    stripe_subscription_id = models.CharField(max_length=100, unique=True)
    plan = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    cancel_at_period_end = models.BooleanField(default=False)

    class Meta:
        db_table = 'subscriptions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.organization} — {self.plan} ({self.status})"


class Invoice(TenantScopedModel):
    """Stripe invoice record (billing invoice, not accounting invoice)."""
    stripe_invoice_id = models.CharField(max_length=100, unique=True)
    subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, blank=True)
    amount_due = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20)
    invoice_url = models.URLField(blank=True)
    pdf_url = models.URLField(blank=True)
    invoice_date = models.DateTimeField()
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'billing_invoices'
        ordering = ['-invoice_date']
