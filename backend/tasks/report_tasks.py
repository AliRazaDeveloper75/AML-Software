"""
Report generation tasks — async PDF/CSV report generation.
"""
import logging
from celery import shared_task

logger = logging.getLogger('tasks.reports')


@shared_task(name='tasks.report_tasks.generate_aml_report')
def generate_aml_report(org_id: str, report_type: str, params: dict, requested_by_user_id: str):
    """
    Generate an AML report and store it; notify user via WebSocket when ready.
    report_type: 'sar_summary' | 'screening_summary' | 'transaction_monitoring'
    """
    try:
        from apps.tenants.models import Organization
        from apps.reports.models import GeneratedReport

        org = Organization.objects.get(pk=org_id)

        report = GeneratedReport.objects.create(
            organization=org,
            report_type=report_type,
            status='processing',
            params=params,
        )

        from services.report_generator.aml import AMLReportGenerator
        generator = AMLReportGenerator(org, report_type, params)
        pdf_bytes = generator.generate()

        # Upload to Azure
        from services.external.azure_storage import AzureStorageService
        storage = AzureStorageService()
        blob_name = f"reports/{org_id}/{report.id}.pdf"
        _, file_url = storage.upload_kyc_document(
            file=pdf_bytes,
            filename=f'{report_type}.pdf',
            content_type='application/pdf',
            customer_id='reports',
        )

        report.status = 'ready'
        report.file_url = file_url
        report.blob_name = blob_name
        report.save(update_fields=['status', 'file_url', 'blob_name'])

        # Notify user
        _notify_user(requested_by_user_id, {
            'type': 'report_ready',
            'report_id': str(report.id),
            'report_type': report_type,
        })
        logger.info('Report %s ready for org %s', report.id, org_id)
        return str(report.id)

    except Exception as exc:
        logger.exception('Report generation failed: %s', exc)
        raise


@shared_task(name='tasks.report_tasks.generate_vat_report')
def generate_vat_report(org_id: str, period_start: str, period_end: str, user_id: str):
    try:
        from datetime import date
        from apps.tenants.models import Organization
        from services.tax_engine.vat import VATEngine
        from services.report_generator.pdf import VATReportPDFGenerator

        org = Organization.objects.get(pk=org_id)
        ps = date.fromisoformat(period_start)
        pe = date.fromisoformat(period_end)

        engine = VATEngine(org, ps, pe)
        data = engine.calculate()
        pdf_bytes = VATReportPDFGenerator(org, data).generate()

        from services.external.azure_storage import AzureStorageService
        storage = AzureStorageService()
        _, file_url = storage.upload_kyc_document(
            file=pdf_bytes,
            filename=f'vat-return-{period_start}.pdf',
            content_type='application/pdf',
            customer_id='reports',
        )

        _notify_user(user_id, {'type': 'report_ready', 'report_type': 'vat', 'file_url': file_url})
        return file_url

    except Exception as exc:
        logger.exception('VAT report generation failed: %s', exc)
        raise


def _notify_user(user_id: str, message: dict):
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        layer = get_channel_layer()
        async_to_sync(layer.group_send)(f'user_{user_id}', {**message, 'type': 'user.message'})
    except Exception as exc:
        logger.warning('WebSocket user notification failed: %s', exc)
