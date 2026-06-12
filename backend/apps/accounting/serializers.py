from decimal import Decimal
from rest_framework import serializers
from .models import Account, JournalEntry, JournalLine, Invoice, InvoiceLineItem, Transaction, Expense


class AccountSerializer(serializers.ModelSerializer):
    account_type_display = serializers.CharField(source='get_account_type_display', read_only=True)
    balance = serializers.DecimalField(max_digits=18, decimal_places=2, read_only=True)
    children_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Account
        fields = [
            'id', 'code', 'name', 'account_type', 'account_type_display',
            'parent', 'description', 'is_active', 'is_system',
            'balance', 'children_count', 'created_at',
        ]
        read_only_fields = ['id', 'is_system', 'balance', 'created_at']

    def validate_code(self, value):
        org = self.context['request'].user.organization
        qs = Account.objects.filter(organization=org, code=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Account code already exists in your chart of accounts.')
        return value


class JournalLineSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    account_code = serializers.CharField(source='account.code', read_only=True)

    class Meta:
        model = JournalLine
        fields = [
            'id', 'account', 'account_code', 'account_name',
            'description', 'debit', 'credit', 'currency', 'exchange_rate',
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        if attrs.get('debit', Decimal('0')) > 0 and attrs.get('credit', Decimal('0')) > 0:
            raise serializers.ValidationError('A line cannot have both debit and credit amounts.')
        if attrs.get('debit', Decimal('0')) == 0 and attrs.get('credit', Decimal('0')) == 0:
            raise serializers.ValidationError('A line must have either a debit or credit amount.')
        return attrs


class JournalEntrySerializer(serializers.ModelSerializer):
    lines = JournalLineSerializer(many=True)
    posted_by_name = serializers.CharField(source='posted_by.full_name', read_only=True, default=None)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    is_balanced = serializers.BooleanField(read_only=True)

    class Meta:
        model = JournalEntry
        fields = [
            'id', 'date', 'reference', 'description', 'source', 'source_display',
            'is_posted', 'posted_at', 'posted_by', 'posted_by_name',
            'is_reversed', 'reversal_entry', 'is_balanced', 'lines',
            'created_at',
        ]
        read_only_fields = ['id', 'is_posted', 'posted_at', 'posted_by', 'is_reversed', 'reversal_entry', 'created_at']

    def validate_lines(self, lines):
        if len(lines) < 2:
            raise serializers.ValidationError('A journal entry must have at least 2 lines.')
        total_dr = sum(l.get('debit', Decimal('0')) for l in lines)
        total_cr = sum(l.get('credit', Decimal('0')) for l in lines)
        if abs(total_dr - total_cr) > Decimal('0.01'):
            raise serializers.ValidationError(
                f'Journal entry is not balanced. DR={total_dr}, CR={total_cr}.'
            )
        return lines

    def create(self, validated_data):
        lines_data = validated_data.pop('lines')
        entry = JournalEntry.objects.create(**validated_data)
        for line_data in lines_data:
            JournalLine.objects.create(entry=entry, **line_data)
        return entry


class JournalEntryListSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntry
        fields = [
            'id', 'date', 'reference', 'description', 'source',
            'is_posted', 'posted_at', 'is_reversed', 'created_at',
        ]


class InvoiceLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceLineItem
        fields = [
            'id', 'description', 'quantity', 'unit_price',
            'vat_rate', 'subtotal', 'vat_amount', 'total',
        ]
        read_only_fields = ['id', 'subtotal', 'vat_amount', 'total']

    def validate(self, attrs):
        qty = attrs.get('quantity', Decimal('1'))
        price = attrs.get('unit_price', Decimal('0'))
        vat_rate = attrs.get('vat_rate', Decimal('0.05'))
        attrs['subtotal'] = (qty * price).quantize(Decimal('0.01'))
        attrs['vat_amount'] = (attrs['subtotal'] * vat_rate).quantize(Decimal('0.01'))
        attrs['total'] = attrs['subtotal'] + attrs['vat_amount']
        return attrs


class InvoiceSerializer(serializers.ModelSerializer):
    line_items = InvoiceLineItemSerializer(many=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    amount_due = serializers.DecimalField(max_digits=18, decimal_places=2, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    customer_name = serializers.CharField(source='customer.display_name', read_only=True, default='')

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'customer_name',
            'status', 'status_display', 'issue_date', 'due_date', 'paid_at',
            'subtotal', 'vat_amount', 'discount_amount', 'total_amount',
            'amount_paid', 'amount_due', 'is_overdue',
            'notes', 'payment_terms', 'bank_details',
            'line_items', 'created_at',
        ]
        read_only_fields = [
            'id', 'invoice_number', 'status', 'subtotal', 'vat_amount',
            'total_amount', 'amount_paid', 'paid_at', 'amount_due', 'is_overdue', 'created_at',
        ]

    def create(self, validated_data):
        line_items_data = validated_data.pop('line_items')
        from django.conf import settings
        # Auto-generate invoice number
        org = validated_data['organization']
        count = Invoice.objects.filter(organization=org).count() + 1
        validated_data['invoice_number'] = f"INV-{org.id.hex[:6].upper()}-{count:05d}"

        subtotal = sum(li['subtotal'] for li in line_items_data)
        vat_amount = sum(li['vat_amount'] for li in line_items_data)
        discount = validated_data.get('discount_amount', Decimal('0'))
        validated_data['subtotal'] = subtotal
        validated_data['vat_amount'] = vat_amount
        validated_data['total_amount'] = subtotal + vat_amount - discount

        invoice = Invoice.objects.create(**validated_data)
        for li_data in line_items_data:
            InvoiceLineItem.objects.create(invoice=invoice, **li_data)
        return invoice


class InvoiceListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    amount_due = serializers.DecimalField(max_digits=18, decimal_places=2, read_only=True)
    customer_name = serializers.CharField(source='customer.display_name', read_only=True, default='')

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'customer_name',
            'status', 'status_display', 'issue_date', 'due_date',
            'total_amount', 'amount_paid', 'amount_due', 'is_overdue',
            'created_at',
        ]


class TransactionSerializer(serializers.ModelSerializer):
    txn_type_display = serializers.CharField(source='get_txn_type_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id', 'reference', 'customer', 'customer_name',
            'txn_type', 'txn_type_display', 'amount', 'currency',
            'exchange_rate', 'amount_aed', 'payment_method', 'payment_method_display',
            'status', 'status_display',
            'counterparty_name', 'counterparty_account', 'counterparty_bank',
            'counterparty_country', 'description', 'txn_date',
            'risk_score', 'is_flagged', 'flag_reason', 'rules_triggered',
            'created_at',
        ]
        read_only_fields = [
            'id', 'risk_score', 'is_flagged', 'flag_reason', 'rules_triggered', 'created_at',
        ]

    def get_customer_name(self, obj):
        if not obj.customer:
            return obj.counterparty_name
        c = obj.customer
        if c.customer_type == 'individual':
            return f"{c.first_name} {c.last_name}".strip()
        return c.company_name


class ExpenseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, default=None)

    class Meta:
        model = Expense
        fields = [
            'id', 'category', 'category_display', 'description',
            'amount', 'vat_amount', 'total_amount', 'is_vat_recoverable',
            'expense_date', 'receipt_url', 'vendor_name', 'vendor_trn',
            'payment_method', 'created_by', 'created_by_name',
            'created_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at']

    def validate(self, attrs):
        amount = attrs.get('amount', Decimal('0'))
        vat_amount = attrs.get('vat_amount', Decimal('0'))
        attrs['total_amount'] = amount + vat_amount
        return attrs
