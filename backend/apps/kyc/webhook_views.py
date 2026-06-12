"""
Webhook handlers for external KYC/AML services.

Sumsub: POST /webhooks/sumsub/
  — receives applicant review status changes and updates customer record.

Register in config/urls.py (outside api/v1/ prefix so Sumsub can call it).
"""
import json
import logging

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

logger = logging.getLogger('apps.kyc.webhooks')


@method_decorator(csrf_exempt, name='dispatch')
class SumsubWebhookView(APIView):
    authentication_classes = []
    permission_classes     = [AllowAny]

    # Sumsub review result codes → our KYC status
    REVIEW_STATUS_MAP = {
        'GREEN':  'verified',
        'RED':    'rejected',
        'YELLOW': 'under_review',
    }

    def post(self, request):
        # ── Verify signature ──────────────────────────────────────────────────
        from services.external.sumsub import verify_webhook_signature
        digest = request.headers.get('X-Payload-Digest', '')
        if not verify_webhook_signature(request.body, digest):
            logger.warning('Sumsub webhook: invalid signature')
            return Response({'ok': False, 'error': 'invalid signature'}, status=400)

        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return Response({'ok': False, 'error': 'invalid JSON'}, status=400)

        event_type    = payload.get('type', '')
        external_id   = payload.get('externalUserId', '')   # e.g. "customer_<uuid>"
        review_result = payload.get('reviewResult', {})
        review_answer = review_result.get('reviewAnswer', '')  # GREEN | RED

        logger.info('Sumsub webhook: type=%s externalUserId=%s answer=%s',
                    event_type, external_id, review_answer)

        # We only care about final review decisions
        if event_type not in ('applicantReviewed', 'applicantOnHold'):
            return Response({'ok': True})

        # Parse customer ID from externalUserId = "customer_<uuid>"
        if not external_id.startswith('customer_'):
            return Response({'ok': True})

        customer_id = external_id.removeprefix('customer_')

        try:
            from apps.kyc.models import Customer
            from django.utils import timezone

            customer = Customer.objects.get(pk=customer_id)

            new_status = self.REVIEW_STATUS_MAP.get(review_answer)
            if not new_status:
                return Response({'ok': True})

            customer.kyc_status = new_status
            if new_status == 'verified':
                from django.contrib.auth import get_user_model
                customer.approved_at = timezone.now()
                # Store Sumsub applicant ID if present
                applicant_id = payload.get('applicantId', '')
                if applicant_id and hasattr(customer, 'sumsub_applicant_id'):
                    customer.sumsub_applicant_id = applicant_id
            elif new_status == 'rejected':
                reject_labels = review_result.get('rejectLabels', [])
                customer.rejection_reason = f'Sumsub: {", ".join(reject_labels)}' if reject_labels else 'Sumsub verification failed'

            customer.save()

            # Trigger AML screening after successful KYC
            if new_status == 'verified':
                from tasks.aml_tasks import screen_customer
                screen_customer.delay(str(customer_id))

            # Notify compliance team
            from tasks.notification_tasks import send_kyc_status_notification
            send_kyc_status_notification.delay(str(customer_id), new_status)

            logger.info('Customer %s updated via Sumsub webhook: %s', customer_id, new_status)

        except Exception as exc:
            logger.exception('Sumsub webhook processing error: %s', exc)
            return Response({'ok': False, 'error': 'internal error'}, status=500)

        return Response({'ok': True})
