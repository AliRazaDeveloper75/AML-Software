"""
PDF generation using WeasyPrint.
Renders Django templates to HTML then converts to PDF.
"""
import io
from django.template.loader import render_to_string
from django.conf import settings


def _render_pdf(template_name: str, context: dict) -> bytes:
    html = render_to_string(template_name, context)
    from weasyprint import HTML
    return HTML(string=html, base_url=settings.FRONTEND_URL).write_pdf()


class InvoicePDFGenerator:
    def __init__(self, invoice):
        self.invoice = invoice

    def generate(self) -> bytes:
        context = {
            'invoice': self.invoice,
            'line_items': self.invoice.line_items.all(),
            'org': self.invoice.organization,
        }
        return _render_pdf('reports/invoice.html', context)


class VATReportPDFGenerator:
    def __init__(self, organization, vat_data: dict):
        self.org = organization
        self.data = vat_data

    def generate(self) -> bytes:
        context = {'org': self.org, 'report': self.data}
        return _render_pdf('reports/vat_return.html', context)


class CorporateTaxPDFGenerator:
    def __init__(self, organization, ct_data: dict):
        self.org = organization
        self.data = ct_data

    def generate(self) -> bytes:
        context = {'org': self.org, 'report': self.data}
        return _render_pdf('reports/corporate_tax.html', context)
