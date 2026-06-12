"""
Stripe subscription billing.
Handles plan upgrades, downgrades, webhook processing, and portal sessions.
"""
import logging
from django.conf import settings

logger = logging.getLogger('services.stripe')

PLAN_PRICE_IDS = {
    'starter': settings.STRIPE_PRICE_STARTER if hasattr(settings, 'STRIPE_PRICE_STARTER') else '',
    'professional': settings.STRIPE_PRICE_PROFESSIONAL if hasattr(settings, 'STRIPE_PRICE_PROFESSIONAL') else '',
    'enterprise': settings.STRIPE_PRICE_ENTERPRISE if hasattr(settings, 'STRIPE_PRICE_ENTERPRISE') else '',
}


def get_stripe():
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def get_or_create_customer(organization) -> str:
    """Return Stripe customer ID, creating one if needed."""
    if organization.stripe_customer_id:
        return organization.stripe_customer_id

    stripe = get_stripe()
    customer = stripe.Customer.create(
        email=organization.email,
        name=organization.name,
        metadata={'org_id': str(organization.id), 'org_slug': organization.slug},
    )
    organization.stripe_customer_id = customer.id
    organization.save(update_fields=['stripe_customer_id'])
    return customer.id


def create_subscription(organization, plan: str) -> dict:
    """Create a Stripe subscription for the given plan."""
    stripe = get_stripe()
    customer_id = get_or_create_customer(organization)
    price_id = PLAN_PRICE_IDS.get(plan)
    if not price_id:
        raise ValueError(f'No Stripe price ID configured for plan: {plan}')

    subscription = stripe.Subscription.create(
        customer=customer_id,
        items=[{'price': price_id}],
        metadata={'org_id': str(organization.id)},
        trial_period_days=0,
    )
    return subscription


def create_billing_portal_session(organization, return_url: str) -> str:
    """Return a Stripe billing portal URL for self-service plan management."""
    stripe = get_stripe()
    customer_id = get_or_create_customer(organization)
    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=return_url,
    )
    return session.url


def create_checkout_session(organization, plan: str, success_url: str, cancel_url: str) -> str:
    """Return a Stripe Checkout URL for upgrading to a new plan."""
    stripe = get_stripe()
    customer_id = get_or_create_customer(organization)
    price_id = PLAN_PRICE_IDS.get(plan)
    if not price_id:
        raise ValueError(f'No price ID for plan: {plan}')

    session = stripe.checkout.Session.create(
        customer=customer_id,
        mode='subscription',
        line_items=[{'price': price_id, 'quantity': 1}],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={'org_id': str(organization.id), 'plan': plan},
    )
    return session.url


def handle_webhook(payload: bytes, sig_header: str) -> dict:
    """Verify and parse a Stripe webhook event."""
    stripe = get_stripe()
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        raise ValueError('Invalid Stripe webhook signature.')
    return event


def process_subscription_event(event: dict) -> None:
    """
    Handle subscription lifecycle events from Stripe webhooks.
    Updates the Organization.plan and status fields.
    """
    from apps.tenants.models import Organization
    event_type = event['type']
    data = event['data']['object']

    if event_type in ('customer.subscription.updated', 'customer.subscription.created'):
        org_id = data.get('metadata', {}).get('org_id')
        if not org_id:
            return
        plan_items = data.get('items', {}).get('data', [])
        if not plan_items:
            return

        price_id = plan_items[0]['price']['id']
        # Reverse-lookup plan from price ID
        plan = next((p for p, pid in PLAN_PRICE_IDS.items() if pid == price_id), None)
        if not plan:
            logger.warning('Unknown price ID in Stripe event: %s', price_id)
            return

        sub_status = data.get('status', 'active')
        org_status = 'active' if sub_status == 'active' else 'suspended'

        Organization.objects.filter(pk=org_id).update(plan=plan, status=org_status)
        logger.info('Org %s upgraded to plan=%s status=%s', org_id, plan, org_status)

    elif event_type == 'customer.subscription.deleted':
        org_id = data.get('metadata', {}).get('org_id')
        if org_id:
            Organization.objects.filter(pk=org_id).update(status='cancelled')
            logger.info('Org %s subscription cancelled', org_id)

    elif event_type == 'invoice.payment_failed':
        customer_id = data.get('customer')
        Organization.objects.filter(stripe_customer_id=customer_id).update(status='past_due')
