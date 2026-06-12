from decimal import Decimal
from django.db import models
from core.models import TenantScopedModel, SoftDeleteModel


class Account(TenantScopedModel):
    """
    Chart of Accounts — double-entry General Ledger account.
    Each organization gets a default UAE-standard CoA on first setup.
    """
    class AccountType(models.TextChoices):
        ASSET = 'asset', 'Asset'
        LIABILITY = 'liability', 'Liability'
        EQUITY = 'equity', 'Equity'
        INCOME = 'income', 'Income'
        EXPENSE = 'expense', 'Expense'

    code = models.CharField(max_length=20)
    name = models.CharField(max_length=200)
    account_type = models.CharField(max_length=20, choices=AccountType.choices)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_system = models.BooleanField(default=False)  # System accounts cannot be deleted

    class Meta:
        db_table = 'accounts'
        unique_together = ('organization', 'code')
        ordering = ['code']

    def __str__(self):
        return f"{self.code} — {self.name}"

    @property
    def balance(self):
        debit = self.journal_lines.filter(entry__is_posted=True).aggregate(
            total=models.Sum('debit'))['total'] or Decimal('0')
        credit = self.journal_lines.filter(entry__is_posted=True).aggregate(
            total=models.Sum('credit'))['total'] or Decimal('0')
        if self.account_type in ('asset', 'expense'):
            return debit - credit
        return credit - debit


class JournalEntry(TenantScopedModel):
    """
    Double-entry journal entry. Each entry must have balanced DR = CR.
    Immutable once posted.
    """
    date = models.DateField(db_index=True)
    reference = models.CharField(max_length=50, blank=True, db_index=True)
    description = models.CharField(max_length=500)
    is_posted = models.BooleanField(default=False)
    posted_at = models.DateTimeField(null=True, blank=True)
    posted_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='posted_entries')
    source = models.CharField(
        max_length=30,
        choices=[
            ('manual', 'Manual'), ('invoice', 'Invoice'), ('expense', 'Expense'),
            ('payment', 'Payment'), ('vat', 'VAT'), ('ct', 'Corporate Tax'), ('payroll', 'Payroll'),
        ],
        default='manual'
    )
    source_id = models.UUIDField(null=True, blank=True)  # FK to invoice/expense etc
    is_reversed = models.BooleanField(default=False)
    reversal_entry = models.OneToOneField('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='reversed_by')

    class Meta:
        db_table = 'journal_entries'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"JE-{str(self.id)[:8].upper()} {self.date} {self.description[:50]}"

    def is_balanced(self) -> bool:
        lines = self.lines.all()
        total_dr = sum(l.debit for l in lines)
        total_cr = sum(l.credit for l in lines)
        return abs(total_dr - total_cr) < Decimal('0.01')

    def post(self, user):
        from django.utils import timezone
        if not self.is_balanced():
            raise ValueError('Journal entry is not balanced (DR ≠ CR).')
        self.is_posted = True
        self.posted_at = timezone.now()
        self.posted_by = user
        self.save(update_fields=['is_posted', 'posted_at', 'posted_by'])


class JournalLine(models.Model):
    """Individual debit or credit line within a journal entry."""
    entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='journal_lines')
    description = models.CharField(max_length=300, blank=True)
    debit = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal('0'))
    credit = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal('0'))
    currency = models.CharField(max_length=3, default='AED')
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=6, default=Decimal('1'))

    class Meta:
        db_table = 'journal_lines'

    def __str__(self):
        return f"{self.account.code} DR:{self.debit} CR:{self.credit}"


class Invoice(TenantScopedModel, SoftDeleteModel):
    """Sales invoice raised to a customer."""
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SENT = 'sent', 'Sent'
        PAID = 'paid', 'Paid'
        PARTIALLY_PAID = 'partially_paid', 'Partially Paid'
        OVERDUE = 'overdue', 'Overdue'
        CANCELLED = 'cancelled', 'Cancelled'

    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    customer = models.ForeignKey('kyc.Customer', on_delete=models.PROTECT, related_name='invoices')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)

    issue_date = models.DateField()
    due_date = models.DateField()
    paid_at = models.DateTimeField(null=True, blank=True)

    # Amounts (AED)
    subtotal = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal('0'))
    vat_amount = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal('0'))
    discount_amount = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal('0'))
    total_amount = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal('0'))
    amount_paid = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal('0'))

    notes = models.TextField(blank=True)
    payment_terms = models.CharField(max_length=100, blank=True)
    bank_details = models.TextField(blank=True)
    journal_entry = models.ForeignKey(JournalEntry, on_delete=models.SET_NULL, null=True, blank=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'invoices'
        ordering = ['-issue_date']

    def __str__(self):
        return f"{self.invoice_number} — {self.customer}"

    @property
    def amount_due(self):
        return self.total_amount - self.amount_paid

    @property
    def is_overdue(self):
        from django.utils import timezone
        return self.status in (self.Status.SENT, self.Status.PARTIALLY_PAID) and self.due_date < timezone.now().date()


class InvoiceLineItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='line_items')
    description = models.CharField(max_length=300)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('1'))
    unit_price = models.DecimalField(max_digits=18, decimal_places=2)
    vat_rate = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal('0.05'))
    subtotal = models.DecimalField(max_digits=18, decimal_places=2)
    vat_amount = models.DecimalField(max_digits=18, decimal_places=2)
    total = models.DecimalField(max_digits=18, decimal_places=2)

    class Meta:
        db_table = 'invoice_line_items'


class Transaction(TenantScopedModel):
    """
    Financial transaction record. Linked to GL via JournalEntry.
    Also the primary input for AML transaction monitoring.
    """
    class TransactionType(models.TextChoices):
        CREDIT = 'credit', 'Credit (Incoming)'
        DEBIT = 'debit', 'Debit (Outgoing)'
        INTERNAL = 'internal', 'Internal Transfer'

    class PaymentMethod(models.TextChoices):
        BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
        CASH = 'cash', 'Cash'
        CHEQUE = 'cheque', 'Cheque'
        CARD = 'card', 'Card'
        CRYPTO = 'crypto', 'Cryptocurrency'
        OTHER = 'other', 'Other'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
        REVERSED = 'reversed', 'Reversed'
        FLAGGED = 'flagged', 'Flagged for Review'

    customer = models.ForeignKey('kyc.Customer', on_delete=models.PROTECT, related_name='transactions', null=True, blank=True)
    reference = models.CharField(max_length=100, unique=True, db_index=True)
    txn_type = models.CharField(max_length=20, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    currency = models.CharField(max_length=3, default='AED')
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=6, default=Decimal('1'))
    amount_aed = models.DecimalField(max_digits=18, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.BANK_TRANSFER)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.COMPLETED)

    # Counterparty details
    counterparty_name = models.CharField(max_length=255, blank=True)
    counterparty_account = models.CharField(max_length=100, blank=True)
    counterparty_bank = models.CharField(max_length=200, blank=True)
    counterparty_country = models.CharField(max_length=3, blank=True)

    description = models.CharField(max_length=500, blank=True)
    txn_date = models.DateTimeField(db_index=True)

    # AML Risk
    risk_score = models.PositiveSmallIntegerField(default=0)
    is_flagged = models.BooleanField(default=False, db_index=True)
    flag_reason = models.TextField(blank=True)
    rules_triggered = models.JSONField(default=list)

    # Linkage
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    journal_entry = models.ForeignKey(JournalEntry, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'transactions'
        indexes = [
            models.Index(fields=['organization', 'txn_date']),
            models.Index(fields=['organization', 'is_flagged']),
            models.Index(fields=['customer', 'txn_date']),
        ]
        ordering = ['-txn_date']

    def __str__(self):
        return f"{self.reference} {self.get_txn_type_display()} AED {self.amount_aed}"


class Expense(TenantScopedModel, SoftDeleteModel):
    """Business expense record with input VAT tracking."""
    class Category(models.TextChoices):
        RENT = 'rent', 'Rent & Office'
        SALARIES = 'salaries', 'Salaries & Wages'
        UTILITIES = 'utilities', 'Utilities'
        MARKETING = 'marketing', 'Marketing'
        TRAVEL = 'travel', 'Travel & Entertainment'
        PROFESSIONAL = 'professional', 'Professional Services'
        TECHNOLOGY = 'technology', 'Technology & Software'
        BANK_CHARGES = 'bank_charges', 'Bank Charges'
        INSURANCE = 'insurance', 'Insurance'
        OTHER = 'other', 'Other'

    category = models.CharField(max_length=30, choices=Category.choices)
    description = models.CharField(max_length=300)
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    vat_amount = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal('0'))
    total_amount = models.DecimalField(max_digits=18, decimal_places=2)
    is_vat_recoverable = models.BooleanField(default=True)
    expense_date = models.DateField(db_index=True)
    receipt_url = models.TextField(blank=True)
    vendor_name = models.CharField(max_length=200, blank=True)
    vendor_trn = models.CharField(max_length=20, blank=True)
    payment_method = models.CharField(max_length=20, blank=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    journal_entry = models.ForeignKey(JournalEntry, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'expenses'
        ordering = ['-expense_date']
