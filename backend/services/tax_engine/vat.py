"""
UAE VAT Engine (Federal Tax Authority — FTA).

VAT Rate: 5% (Standard Rated)
Filing: Quarterly (Jan–Mar, Apr–Jun, Jul–Sep, Oct–Dec)
Return: VAT-201 equivalent

Key Rules:
- Output VAT: collected on taxable sales/invoices
- Input VAT: paid on business expenses (recoverable if business purpose)
- Net Payable: Output VAT - Input VAT (or refund if negative)
- Cash Accounting: default; Invoice Accounting optional
- TRN format: 15 digits
"""
from __future__ import annotations
from decimal import Decimal, ROUND_HALF_UP
from datetime import date
from django.db.models import Sum
from django.conf import settings


class VATEngine:
    RATE = Decimal(str(settings.UAE_VAT_RATE))

    def __init__(self, organization, period_start: date, period_end: date):
        self.org = organization
        self.period_start = period_start
        self.period_end = period_end

    def calculate(self) -> dict:
        """Compute the VAT return for the given period."""
        output_vat = self._calculate_output_vat()
        input_vat = self._calculate_input_vat()
        adjustments = self._calculate_adjustments()

        net_payable = output_vat['total_vat'] - input_vat['total_recoverable'] + adjustments
        net_payable = self._round(net_payable)

        return {
            'period_start': self.period_start.isoformat(),
            'period_end': self.period_end.isoformat(),
            'standard_rated_supplies': output_vat['taxable_sales'],
            'output_vat': output_vat['total_vat'],
            'zero_rated_supplies': output_vat['zero_rated'],
            'exempt_supplies': output_vat['exempt'],
            'standard_rated_expenses': input_vat['taxable_expenses'],
            'recoverable_input_vat': input_vat['total_recoverable'],
            'non_recoverable_input_vat': input_vat['non_recoverable'],
            'adjustments': adjustments,
            'net_vat_payable': net_payable,
            'is_refund': net_payable < Decimal('0'),
            'refund_amount': abs(net_payable) if net_payable < Decimal('0') else Decimal('0'),
        }

    def _calculate_output_vat(self) -> dict:
        from apps.accounting.models import Invoice
        invoices = Invoice.objects.filter(
            organization=self.org,
            issue_date__gte=self.period_start,
            issue_date__lte=self.period_end,
            status__in=['sent', 'paid', 'partially_paid'],
        ).aggregate(
            taxable_sales=Sum('subtotal'),
            total_vat=Sum('vat_amount'),
        )
        return {
            'taxable_sales': self._safe(invoices['taxable_sales']),
            'total_vat': self._safe(invoices['total_vat']),
            'zero_rated': Decimal('0'),
            'exempt': Decimal('0'),
        }

    def _calculate_input_vat(self) -> dict:
        from apps.accounting.models import Expense
        expenses = Expense.objects.filter(
            organization=self.org,
            expense_date__gte=self.period_start,
            expense_date__lte=self.period_end,
        )
        recoverable = expenses.filter(is_vat_recoverable=True).aggregate(
            taxable_expenses=Sum('amount'),
            total_recoverable=Sum('vat_amount'),
        )
        non_recoverable = expenses.filter(is_vat_recoverable=False).aggregate(
            total=Sum('vat_amount'),
        )
        return {
            'taxable_expenses': self._safe(recoverable['taxable_expenses']),
            'total_recoverable': self._safe(recoverable['total_recoverable']),
            'non_recoverable': self._safe(non_recoverable['total']),
        }

    def _calculate_adjustments(self) -> Decimal:
        """Credit notes, bad debt relief, etc."""
        return Decimal('0')

    @staticmethod
    def _safe(val) -> Decimal:
        return Decimal(str(val)) if val else Decimal('0')

    @staticmethod
    def _round(val: Decimal) -> Decimal:
        return val.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    @staticmethod
    def get_current_quarter(for_date: date = None) -> tuple[date, date]:
        """Returns (quarter_start, quarter_end) for the given date."""
        d = for_date or date.today()
        quarter = (d.month - 1) // 3
        starts = [date(d.year, 1, 1), date(d.year, 4, 1), date(d.year, 7, 1), date(d.year, 10, 1)]
        ends = [date(d.year, 3, 31), date(d.year, 6, 30), date(d.year, 9, 30), date(d.year, 12, 31)]
        return starts[quarter], ends[quarter]
