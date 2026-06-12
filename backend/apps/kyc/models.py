from django.db import models
from core.models import TenantScopedModel, SoftDeleteModel


class Customer(TenantScopedModel, SoftDeleteModel):
    """
    KYC subject — can be an individual (B2C) or a corporate entity (B2B).
    Central entity that all AML screening, transactions, and invoices link to.
    """
    class CustomerType(models.TextChoices):
        INDIVIDUAL = 'individual', 'Individual'
        CORPORATE = 'corporate', 'Corporate'

    class KYCStatus(models.TextChoices):
        PENDING = 'pending', 'Pending Review'
        UNDER_REVIEW = 'under_review', 'Under Review'
        VERIFIED = 'verified', 'Verified'
        REJECTED = 'rejected', 'Rejected'
        EXPIRED = 'expired', 'Expired'
        SUSPENDED = 'suspended', 'Suspended'

    class RiskLevel(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        CRITICAL = 'critical', 'Critical'

    class Nationality(models.TextChoices):
        UAE = 'AE', 'UAE'
        SA = 'SA', 'Saudi Arabia'
        IN = 'IN', 'India'
        PK = 'PK', 'Pakistan'
        EG = 'EG', 'Egypt'
        GB = 'GB', 'United Kingdom'
        US = 'US', 'United States'
        OTHER = 'OTHER', 'Other'

    customer_type = models.CharField(max_length=20, choices=CustomerType.choices, default=CustomerType.INDIVIDUAL)

    # Individual fields
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=10, blank=True)
    gender = models.CharField(max_length=10, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], blank=True)

    # Individual UAE documents
    emirates_id = models.CharField(max_length=20, blank=True, db_index=True)
    emirates_id_expiry = models.DateField(null=True, blank=True)
    passport_number = models.CharField(max_length=20, blank=True)
    passport_expiry = models.DateField(null=True, blank=True)
    visa_status = models.CharField(max_length=50, blank=True)

    # Corporate fields
    company_name = models.CharField(max_length=255, blank=True)
    trade_license_no = models.CharField(max_length=50, blank=True)
    trade_license_expiry = models.DateField(null=True, blank=True)
    business_activity = models.CharField(max_length=255, blank=True)
    incorporation_country = models.CharField(max_length=3, blank=True)
    trn = models.CharField(max_length=20, blank=True)

    # Contact
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    emirate = models.CharField(max_length=30, blank=True)

    # Risk & Compliance
    risk_score = models.PositiveSmallIntegerField(default=0)  # 0–100
    risk_level = models.CharField(max_length=10, choices=RiskLevel.choices, default=RiskLevel.LOW)
    kyc_status = models.CharField(max_length=20, choices=KYCStatus.choices, default=KYCStatus.PENDING)
    kyc_expiry_date = models.DateField(null=True, blank=True)

    # PEP / Sanctions
    is_pep = models.BooleanField(default=False)
    is_sanctioned = models.BooleanField(default=False)
    pep_detail = models.TextField(blank=True)

    # Enhanced Due Diligence
    requires_edd = models.BooleanField(default=False)
    edd_notes = models.TextField(blank=True)

    # Source of funds
    source_of_funds = models.CharField(max_length=100, blank=True)
    source_of_wealth = models.CharField(max_length=100, blank=True)
    expected_annual_turnover = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)

    # Industry (for risk scoring)
    industry = models.CharField(max_length=100, blank=True)

    # Internal
    assigned_officer = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_customers'
    )
    approved_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='approved_customers'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    last_screened_at = models.DateTimeField(null=True, blank=True)
    next_review_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'customers'
        indexes = [
            models.Index(fields=['organization', 'kyc_status']),
            models.Index(fields=['organization', 'risk_level']),
            models.Index(fields=['emirates_id']),
        ]

    def __str__(self):
        if self.customer_type == self.CustomerType.INDIVIDUAL:
            return f"{self.first_name} {self.last_name}"
        return self.company_name

    @property
    def display_name(self):
        return str(self)

    @property
    def customer_id(self):
        return str(self.id)[:8].upper()


class KYCDocument(TenantScopedModel):
    """Uploaded documents for a KYC customer (stored in Azure Blob)."""
    class DocType(models.TextChoices):
        EMIRATES_ID_FRONT = 'emirates_id_front', 'Emirates ID (Front)'
        EMIRATES_ID_BACK = 'emirates_id_back', 'Emirates ID (Back)'
        PASSPORT = 'passport', 'Passport'
        VISA = 'visa', 'Visa Copy'
        TRADE_LICENSE = 'trade_license', 'Trade License'
        MOA = 'moa', 'Memorandum of Association'
        BANK_STATEMENT = 'bank_statement', 'Bank Statement'
        UTILITY_BILL = 'utility_bill', 'Utility Bill (Proof of Address)'
        FINANCIAL_STATEMENT = 'financial_statement', 'Financial Statement'
        OTHER = 'other', 'Other'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Review'
        VERIFIED = 'verified', 'Verified'
        REJECTED = 'rejected', 'Rejected'
        EXPIRED = 'expired', 'Expired'

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='documents')
    doc_type = models.CharField(max_length=30, choices=DocType.choices)
    file_name = models.CharField(max_length=255)
    file_url = models.TextField()  # Azure Blob URL
    file_size = models.PositiveIntegerField(help_text='Size in bytes')
    mime_type = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    expires_at = models.DateField(null=True, blank=True)
    verified_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'kyc_documents'

    def __str__(self):
        return f"{self.customer} — {self.get_doc_type_display()}"


class UBODeclaration(TenantScopedModel):
    """
    Ultimate Beneficial Owner declaration for corporate customers.
    CBUAE requires UBO chain for all corporates with > 25% ownership.
    """
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='ubos')
    full_name = models.CharField(max_length=255)
    nationality = models.CharField(max_length=10)
    date_of_birth = models.DateField(null=True, blank=True)
    emirates_id = models.CharField(max_length=20, blank=True)
    passport_number = models.CharField(max_length=20, blank=True)
    ownership_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    is_pep = models.BooleanField(default=False)
    screened_at = models.DateTimeField(null=True, blank=True)
    screening_result = models.CharField(
        max_length=20,
        choices=[('clear', 'Clear'), ('match', 'Match'), ('potential_match', 'Potential Match')],
        blank=True
    )

    class Meta:
        db_table = 'ubo_declarations'

    def __str__(self):
        return f"{self.full_name} ({self.ownership_percentage}%) — {self.customer}"
