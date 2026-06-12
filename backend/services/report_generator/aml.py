"""
AML-specific report generators (SAR summary, screening summary, transaction monitoring).
"""
from .pdf import _render_pdf


class AMLReportGenerator:
    TEMPLATES = {
        'sar_summary': 'reports/aml_sar.html',
        'screening_summary': 'reports/aml_screening.html',
        'transaction_monitoring': 'reports/aml_transactions.html',
        'kyc_status': 'reports/kyc_status.html',
    }

    def __init__(self, organization, report_type: str, params: dict):
        self.org = organization
        self.report_type = report_type
        self.params = params

    def generate(self) -> bytes:
        template = self.TEMPLATES.get(self.report_type)
        if not template:
            raise ValueError(f'Unknown report type: {self.report_type}')
        context = self._build_context()
        return _render_pdf(template, context)

    def _build_context(self) -> dict:
        from datetime import date
        date_from_raw = self.params.get('date_from')
        date_to_raw = self.params.get('date_to')
        date_from = date.fromisoformat(date_from_raw) if date_from_raw else date.today().replace(day=1)
        date_to = date.fromisoformat(date_to_raw) if date_to_raw else date.today()

        base = {'org': self.org, 'date_from': date_from, 'date_to': date_to, 'params': self.params}

        if self.report_type == 'screening_summary':
            from apps.aml.models import AMLScreening
            base['screenings'] = AMLScreening.objects.filter(
                organization=self.org,
                created_at__date__gte=date_from,
                created_at__date__lte=date_to,
            ).select_related('customer')

        elif self.report_type == 'transaction_monitoring':
            from apps.accounting.models import Transaction
            base['transactions'] = Transaction.objects.filter(
                organization=self.org,
                txn_date__date__gte=date_from,
                txn_date__date__lte=date_to,
                is_flagged=True,
            ).select_related('customer')

        elif self.report_type == 'sar_summary':
            from apps.aml.models import AMLAlert
            base['alerts'] = AMLAlert.objects.filter(
                organization=self.org,
                created_at__date__gte=date_from,
                created_at__date__lte=date_to,
                status='sar_filed',
            ).select_related('customer')

        elif self.report_type == 'kyc_status':
            from apps.kyc.models import Customer
            base['customers'] = Customer.objects.filter(
                organization=self.org,
                deleted_at__isnull=True,
            )

        return base
