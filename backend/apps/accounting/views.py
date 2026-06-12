from decimal import Decimal
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
import django_filters

from core.permissions import HasPermission, Perm
from core.pagination import StandardPagination
from .models import Account, JournalEntry, Invoice, Transaction, Expense
from .serializers import (
    AccountSerializer, JournalEntrySerializer, JournalEntryListSerializer,
    InvoiceSerializer, InvoiceListSerializer,
    TransactionSerializer, ExpenseSerializer,
)


class AccountFilter(django_filters.FilterSet):
    account_type = django_filters.ChoiceFilter(choices=Account.AccountType.choices)
    is_active = django_filters.BooleanFilter()
    search = django_filters.CharFilter(method='search_filter')

    class Meta:
        model = Account
        fields = ['account_type', 'is_active']

    def search_filter(self, qs, name, value):
        from django.db.models import Q
        return qs.filter(Q(code__icontains=value) | Q(name__icontains=value))


class AccountViewSet(viewsets.ModelViewSet):
    pagination_class = StandardPagination
    filterset_class = AccountFilter

    def get_queryset(self):
        return Account.objects.filter(organization=self.request.user.organization)

    def get_serializer_class(self):
        return AccountSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [HasPermission.for_perm(Perm.ACCOUNTING_READ)()]
        return [HasPermission.for_perm(Perm.ACCOUNTING_WRITE)()]

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

    def perform_destroy(self, instance):
        if instance.is_system:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('System accounts cannot be deleted.')
        if instance.journal_lines.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Cannot delete an account with journal entries.')
        instance.delete()

    @action(detail=False, methods=['get'], url_path='trial-balance')
    def trial_balance(self, request):
        accounts = Account.objects.filter(
            organization=request.user.organization,
            is_active=True,
        ).prefetch_related('journal_lines__entry')
        data = []
        total_dr = Decimal('0')
        total_cr = Decimal('0')
        for acc in accounts:
            bal = acc.balance
            if bal >= 0:
                total_dr += bal
                data.append({'code': acc.code, 'name': acc.name, 'type': acc.account_type, 'debit': bal, 'credit': Decimal('0')})
            else:
                total_cr += abs(bal)
                data.append({'code': acc.code, 'name': acc.name, 'type': acc.account_type, 'debit': Decimal('0'), 'credit': abs(bal)})
        return Response({'accounts': data, 'total_debit': total_dr, 'total_credit': total_cr, 'balanced': abs(total_dr - total_cr) < Decimal('0.01')})


class JournalEntryViewSet(viewsets.ModelViewSet):
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['date', 'created_at']
    ordering = ['-date']

    def get_queryset(self):
        qs = JournalEntry.objects.filter(
            organization=self.request.user.organization
        ).prefetch_related('lines__account')
        is_posted = self.request.query_params.get('is_posted')
        source = self.request.query_params.get('source')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if is_posted is not None:
            qs = qs.filter(is_posted=is_posted.lower() == 'true')
        if source:
            qs = qs.filter(source=source)
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return JournalEntryListSerializer
        return JournalEntrySerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [HasPermission.for_perm(Perm.ACCOUNTING_READ)()]
        return [HasPermission.for_perm(Perm.ACCOUNTING_WRITE)()]

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

    @action(detail=True, methods=['post'])
    def post(self, request, pk=None):
        entry = self.get_object()
        if not HasPermission.for_perm(Perm.ACCOUNTING_WRITE)().has_permission(request, self):
            return Response({'message': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        if entry.is_posted:
            return Response({'message': 'Entry is already posted.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            entry.post(request.user)
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'message': 'Journal entry posted successfully.'})

    @action(detail=True, methods=['post'])
    def reverse(self, request, pk=None):
        entry = self.get_object()
        if not entry.is_posted:
            return Response({'message': 'Only posted entries can be reversed.'}, status=status.HTTP_400_BAD_REQUEST)
        if entry.is_reversed:
            return Response({'message': 'Entry is already reversed.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create reversal entry with negated lines
        reversal = JournalEntry.objects.create(
            organization=entry.organization,
            date=timezone.now().date(),
            reference=f"REV-{entry.reference}",
            description=f"Reversal of {entry.description}",
            source=entry.source,
        )
        from .models import JournalLine
        for line in entry.lines.all():
            JournalLine.objects.create(
                entry=reversal,
                account=line.account,
                description=line.description,
                debit=line.credit,
                credit=line.debit,
                currency=line.currency,
                exchange_rate=line.exchange_rate,
            )
        reversal.post(request.user)
        entry.is_reversed = True
        entry.reversal_entry = reversal
        entry.save(update_fields=['is_reversed', 'reversal_entry'])

        return Response({'message': 'Reversal entry created.', 'reversal_id': str(reversal.id)})


class InvoiceFilter(django_filters.FilterSet):
    status = django_filters.MultipleChoiceFilter(choices=Invoice.Status.choices)
    issue_date_from = django_filters.DateFilter(field_name='issue_date', lookup_expr='gte')
    issue_date_to = django_filters.DateFilter(field_name='issue_date', lookup_expr='lte')
    customer = django_filters.UUIDFilter()
    is_overdue = django_filters.BooleanFilter(method='filter_overdue')
    search = django_filters.CharFilter(method='search_filter')

    class Meta:
        model = Invoice
        fields = ['status']

    def filter_overdue(self, qs, name, value):
        from django.utils import timezone
        today = timezone.now().date()
        if value:
            return qs.filter(status__in=['sent', 'partially_paid'], due_date__lt=today)
        return qs.exclude(status__in=['sent', 'partially_paid'], due_date__lt=today)

    def search_filter(self, qs, name, value):
        from django.db.models import Q
        return qs.filter(Q(invoice_number__icontains=value) | Q(customer__company_name__icontains=value))


class InvoiceViewSet(viewsets.ModelViewSet):
    pagination_class = StandardPagination
    filterset_class = InvoiceFilter
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['issue_date', 'due_date', 'total_amount', 'created_at']
    ordering = ['-issue_date']

    def get_queryset(self):
        return Invoice.objects.filter(
            organization=self.request.user.organization,
            deleted_at__isnull=True,
        ).select_related('customer', 'created_by')

    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [HasPermission.for_perm(Perm.ACCOUNTING_READ)()]
        return [HasPermission.for_perm(Perm.ACCOUNTING_WRITE)()]

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization, created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_sent(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status != 'draft':
            return Response({'message': 'Only draft invoices can be marked as sent.'}, status=status.HTTP_400_BAD_REQUEST)
        invoice.status = 'sent'
        invoice.save(update_fields=['status'])
        return Response({'message': 'Invoice marked as sent.'})

    @action(detail=True, methods=['post'])
    def record_payment(self, request, pk=None):
        invoice = self.get_object()
        amount = Decimal(str(request.data.get('amount', '0')))
        if amount <= 0:
            return Response({'message': 'Payment amount must be positive.'}, status=status.HTTP_400_BAD_REQUEST)

        invoice.amount_paid += amount
        if invoice.amount_paid >= invoice.total_amount:
            invoice.amount_paid = invoice.total_amount
            invoice.status = Invoice.Status.PAID
            invoice.paid_at = timezone.now()
        else:
            invoice.status = Invoice.Status.PARTIALLY_PAID
        invoice.save(update_fields=['amount_paid', 'status', 'paid_at'])
        return Response({'message': f'Payment of AED {amount} recorded.', 'amount_due': str(invoice.amount_due)})

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        invoice = self.get_object()
        from services.report_generator.pdf import InvoicePDFGenerator
        pdf_bytes = InvoicePDFGenerator(invoice).generate()
        from django.http import HttpResponse
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice-{invoice.invoice_number}.pdf"'
        return response


class TransactionFilter(django_filters.FilterSet):
    txn_type = django_filters.ChoiceFilter(choices=Transaction.TransactionType.choices)
    status = django_filters.ChoiceFilter(choices=Transaction.Status.choices)
    is_flagged = django_filters.BooleanFilter()
    date_from = django_filters.DateTimeFilter(field_name='txn_date', lookup_expr='gte')
    date_to = django_filters.DateTimeFilter(field_name='txn_date', lookup_expr='lte')
    amount_min = django_filters.NumberFilter(field_name='amount_aed', lookup_expr='gte')
    amount_max = django_filters.NumberFilter(field_name='amount_aed', lookup_expr='lte')
    customer = django_filters.UUIDFilter()
    payment_method = django_filters.ChoiceFilter(choices=Transaction.PaymentMethod.choices)
    counterparty_country = django_filters.CharFilter(lookup_expr='iexact')

    class Meta:
        model = Transaction
        fields = ['txn_type', 'status', 'is_flagged', 'payment_method']


class TransactionViewSet(viewsets.ModelViewSet):
    http_method_names = ['get', 'post', 'patch']
    pagination_class = StandardPagination
    filterset_class = TransactionFilter
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['txn_date', 'amount_aed', 'risk_score', 'created_at']
    ordering = ['-txn_date']
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(
            organization=self.request.user.organization
        ).select_related('customer')

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [HasPermission.for_perm(Perm.ACCOUNTING_READ)()]
        return [HasPermission.for_perm(Perm.ACCOUNTING_WRITE)()]

    def perform_create(self, serializer):
        txn = serializer.save(organization=self.request.user.organization)
        # Run monitoring rules synchronously or async
        from tasks.aml_tasks import evaluate_transaction_rules
        evaluate_transaction_rules.delay(str(txn.id))

    @action(detail=True, methods=['post'])
    def flag(self, request, pk=None):
        txn = self.get_object()
        reason = request.data.get('reason', '')
        txn.is_flagged = True
        txn.flag_reason = reason
        txn.status = Transaction.Status.FLAGGED
        txn.save(update_fields=['is_flagged', 'flag_reason', 'status'])
        return Response({'message': 'Transaction flagged for review.'})


class ExpenseFilter(django_filters.FilterSet):
    category = django_filters.ChoiceFilter(choices=Expense.Category.choices)
    is_vat_recoverable = django_filters.BooleanFilter()
    date_from = django_filters.DateFilter(field_name='expense_date', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='expense_date', lookup_expr='lte')
    vendor_name = django_filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = Expense
        fields = ['category', 'is_vat_recoverable']


class ExpenseViewSet(viewsets.ModelViewSet):
    pagination_class = StandardPagination
    filterset_class = ExpenseFilter
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['expense_date', 'amount', 'created_at']
    ordering = ['-expense_date']
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        return Expense.objects.filter(
            organization=self.request.user.organization,
            deleted_at__isnull=True,
        ).select_related('created_by')

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [HasPermission.for_perm(Perm.ACCOUNTING_READ)()]
        return [HasPermission.for_perm(Perm.ACCOUNTING_WRITE)()]

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization, created_by=self.request.user)

    def perform_destroy(self, instance):
        instance.delete()  # SoftDeleteModel
