from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from core.permissions import HasPermission, Perm
from .models import Subscription, Invoice


@api_view(['GET'])
@permission_classes([HasPermission.for_perm(Perm.BILLING_READ)])
def subscription_detail(request):
    """Current subscription and plan limits."""
    from django.conf import settings
    org = request.user.organization
    plan_config = settings.STRIPE_PLANS.get(org.plan, {})
    sub = Subscription.objects.filter(organization=org).order_by('-created_at').first()

    return Response({
        'plan': org.plan,
        'status': org.status,
        'trial_ends_at': org.trial_ends_at,
        'subscription': {
            'stripe_id': sub.stripe_subscription_id if sub else None,
            'current_period_end': sub.current_period_end if sub else None,
            'cancel_at_period_end': sub.cancel_at_period_end if sub else False,
        } if sub else None,
        'limits': plan_config,
        'usage': {
            'kyc_count': org.kyc_count_this_month,
            'api_calls': org.api_calls_this_month,
        },
    })


@api_view(['POST'])
@permission_classes([HasPermission.for_perm(Perm.BILLING_MANAGE)])
def create_checkout_session(request):
    """Generate Stripe Checkout URL to upgrade plan."""
    plan = request.data.get('plan')
    if plan not in ('starter', 'professional', 'enterprise'):
        return Response({'message': 'Invalid plan.'}, status=status.HTTP_400_BAD_REQUEST)

    from django.conf import settings
    from services.external.stripe_client import create_checkout_session as stripe_checkout
    try:
        url = stripe_checkout(
            organization=request.user.organization,
            plan=plan,
            success_url=f"{settings.FRONTEND_URL}/settings/billing?success=1",
            cancel_url=f"{settings.FRONTEND_URL}/settings/billing",
        )
        return Response({'checkout_url': url})
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([HasPermission.for_perm(Perm.BILLING_MANAGE)])
def billing_portal(request):
    """Generate Stripe Customer Portal URL for self-service billing management."""
    from django.conf import settings
    from services.external.stripe_client import create_billing_portal_session
    try:
        url = create_billing_portal_session(
            organization=request.user.organization,
            return_url=f"{settings.FRONTEND_URL}/settings/billing",
        )
        return Response({'portal_url': url})
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([HasPermission.for_perm(Perm.BILLING_READ)])
def billing_invoices(request):
    invoices = Invoice.objects.filter(organization=request.user.organization)[:12]
    data = [{
        'id': str(inv.id),
        'stripe_invoice_id': inv.stripe_invoice_id,
        'amount_due': str(inv.amount_due),
        'amount_paid': str(inv.amount_paid),
        'currency': inv.currency,
        'status': inv.status,
        'invoice_url': inv.invoice_url,
        'pdf_url': inv.pdf_url,
        'invoice_date': inv.invoice_date,
        'paid_at': inv.paid_at,
    } for inv in invoices]
    return Response({'invoices': data})


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        try:
            from services.external.stripe_client import handle_webhook, process_subscription_event
            event = handle_webhook(payload, sig_header)
            process_subscription_event(event)
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import logging
            logging.getLogger('billing').exception('Stripe webhook error: %s', e)
            return Response({'message': 'Webhook processing error.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'status': 'ok'})
