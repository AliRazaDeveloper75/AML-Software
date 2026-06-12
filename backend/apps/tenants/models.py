from django.db import models
from core.models import TimeStampedModel


class Organization(TimeStampedModel):
    """
    The top-level tenant. Every piece of data in the system belongs to one Organization.
    Represents a UAE-registered business entity using the Al Merak platform.
    """
    class Plan(models.TextChoices):
        STARTER = 'starter', 'Starter'
        PROFESSIONAL = 'professional', 'Professional'
        ENTERPRISE = 'enterprise', 'Enterprise'

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        SUSPENDED = 'suspended', 'Suspended'
        TRIAL = 'trial', 'Trial'
        CANCELLED = 'cancelled', 'Cancelled'

    class LicenseType(models.TextChoices):
        BANK = 'bank', 'Bank'
        EXCHANGE = 'exchange', 'Exchange House'
        BROKER = 'broker', 'Broker'
        ACCOUNTING = 'accounting', 'Accounting Firm'
        TRADING = 'trading', 'Trading Company'
        FINTECH = 'fintech', 'FinTech'
        OTHER = 'other', 'Other'

    # Identity
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    logo_url = models.URLField(blank=True)

    # UAE Business Details
    trade_license_no = models.CharField(max_length=50, unique=True)
    license_type = models.CharField(max_length=30, choices=LicenseType.choices, default=LicenseType.OTHER)
    trn = models.CharField(max_length=20, blank=True, help_text='UAE Tax Registration Number (15 digits)')
    cbuae_license_no = models.CharField(max_length=50, blank=True, help_text='CBUAE regulated entity license')
    emirate = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)

    # Contacts
    primary_email = models.EmailField()
    primary_phone = models.CharField(max_length=20, blank=True)
    compliance_email = models.EmailField(blank=True)

    # Plan / Billing
    plan = models.CharField(max_length=20, choices=Plan.choices, default=Plan.STARTER)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TRIAL)
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    plan_expires_at = models.DateTimeField(null=True, blank=True)

    # Monthly usage counters (reset on 1st of month)
    kyc_count_this_month = models.PositiveIntegerField(default=0)
    api_calls_this_month = models.PositiveIntegerField(default=0)
    screening_count_this_month = models.PositiveIntegerField(default=0)

    # Settings
    webhook_url = models.URLField(blank=True)
    webhook_secret = models.CharField(max_length=64, blank=True)
    timezone = models.CharField(max_length=50, default='Asia/Dubai')
    currency = models.CharField(max_length=3, default='AED')

    class Meta:
        db_table = 'organizations'

    def __str__(self):
        return self.name

    @property
    def is_active(self):
        return self.status in (self.Status.ACTIVE, self.Status.TRIAL)

    def increment_kyc_count(self):
        Organization.objects.filter(id=self.id).update(
            kyc_count_this_month=models.F('kyc_count_this_month') + 1
        )

    def increment_api_calls(self):
        Organization.objects.filter(id=self.id).update(
            api_calls_this_month=models.F('api_calls_this_month') + 1
        )
