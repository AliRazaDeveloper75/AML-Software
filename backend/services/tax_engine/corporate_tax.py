"""
UAE Corporate Tax Engine.

Effective: 1 June 2023 (Federal Decree-Law No. 47 of 2022)
Rate: 9% on taxable income exceeding AED 375,000
Small Business Relief: 0% if revenue ≤ AED 3,000,000
Free Zone: Qualifying Free Zone Persons (QFZP) → 0% on qualifying income

Key Adjustments to Accounting Profit:
+ Disallowable expenses (entertainment > 50%, fines, owner drawings)
- Exempt income (dividends from qualifying subsidiaries, capital gains)
- Small Business Relief deduction (if applicable)
- Free zone qualifying income (if applicable)
"""
from __future__ import annotations
from decimal import Decimal, ROUND_HALF_UP
from datetime import date
from django.conf import settings


CT_RATE = Decimal(str(settings.UAE_CT_RATE))
CT_EXEMPTION_THRESHOLD = Decimal(str(settings.UAE_CT_THRESHOLD))  # AED 375,000
SMALL_BUSINESS_THRESHOLD = Decimal(str(settings.UAE_SMALL_BUSINESS_RELIEF))  # AED 3,000,000


class CorporateTaxEngine:

    def __init__(self, organization, tax_year: int):
        self.org = organization
        self.tax_year = tax_year
        self.year_start = date(tax_year, 6, 1) if tax_year >= 2023 else date(tax_year, 1, 1)
        self.year_end = date(tax_year + 1, 5, 31) if tax_year >= 2023 else date(tax_year, 12, 31)

    def calculate(self) -> dict:
        accounting_profit = self._get_accounting_profit()
        total_revenue = self._get_total_revenue()
        adjustments = self._get_adjustments()
        exempt_income = self._get_exempt_income()

        taxable_income = accounting_profit + adjustments - exempt_income
        taxable_income = max(taxable_income, Decimal('0'))

        # Small Business Relief
        sbr_applicable = total_revenue <= SMALL_BUSINESS_THRESHOLD
        if sbr_applicable:
            ct_liability = Decimal('0')
            effective_rate = Decimal('0')
        else:
            # 0% on first AED 375,000 / 9% above
            if taxable_income <= CT_EXEMPTION_THRESHOLD:
                ct_liability = Decimal('0')
                effective_rate = Decimal('0')
            else:
                ct_liability = (taxable_income - CT_EXEMPTION_THRESHOLD) * CT_RATE
                effective_rate = ct_liability / taxable_income if taxable_income else Decimal('0')

        ct_liability = self._round(ct_liability)

        return {
            'tax_year': self.tax_year,
            'period_start': self.year_start.isoformat(),
            'period_end': self.year_end.isoformat(),
            'total_revenue': total_revenue,
            'accounting_profit': accounting_profit,
            'add_back_disallowable': adjustments,
            'less_exempt_income': exempt_income,
            'taxable_income': taxable_income,
            'exemption_threshold': CT_EXEMPTION_THRESHOLD,
            'taxable_income_above_threshold': max(taxable_income - CT_EXEMPTION_THRESHOLD, Decimal('0')),
            'ct_rate': float(CT_RATE),
            'ct_liability': ct_liability,
            'effective_rate': float(effective_rate),
            'small_business_relief': sbr_applicable,
            'standard_rate_applies': not sbr_applicable,
            'filing_deadline': date(self.tax_year + 1, 9, 30).isoformat(),
        }

    def _get_accounting_profit(self) -> Decimal:
        """P&L net income for the CT period from the GL."""
        from apps.accounting.models import JournalLine, Account
        income = JournalLine.objects.filter(
            entry__organization=self.org,
            entry__date__gte=self.year_start,
            entry__date__lte=self.year_end,
            entry__is_posted=True,
            account__account_type='income',
        ).aggregate(total=Decimal('0') or __import__('django.db.models', fromlist=['Sum']).Sum('credit') - __import__('django.db.models', fromlist=['Sum']).Sum('debit'))['total'] or Decimal('0')

        expenses = JournalLine.objects.filter(
            entry__organization=self.org,
            entry__date__gte=self.year_start,
            entry__date__lte=self.year_end,
            entry__is_posted=True,
            account__account_type='expense',
        ).aggregate(total=Decimal('0'))['total'] or Decimal('0')

        return Decimal(str(income)) - Decimal(str(expenses))

    def _get_total_revenue(self) -> Decimal:
        from django.db.models import Sum
        from apps.accounting.models import JournalLine
        result = JournalLine.objects.filter(
            entry__organization=self.org,
            entry__date__gte=self.year_start,
            entry__date__lte=self.year_end,
            entry__is_posted=True,
            account__account_type='income',
        ).aggregate(total=Sum('credit'))['total']
        return Decimal(str(result)) if result else Decimal('0')

    def _get_adjustments(self) -> Decimal:
        """
        Disallowable expenses per UAE CT law:
        - Entertainment > 50% threshold
        - Owner drawings/personal expenses
        - Fines and penalties
        - Bribes / illegal payments
        """
        return Decimal('0')  # Simplified — real impl reads expense category adjustments

    def _get_exempt_income(self) -> Decimal:
        """
        Exempt income per UAE CT law:
        - Dividends from qualifying UAE subsidiaries
        - Capital gains on qualifying shares
        - Income earned by a QFZP on qualifying activities
        """
        return Decimal('0')  # Simplified

    @staticmethod
    def _round(val: Decimal) -> Decimal:
        return val.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
