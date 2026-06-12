from django.urls import path
from .views import (
    subscription_detail, create_checkout_session,
    billing_portal, billing_invoices, StripeWebhookView,
)

urlpatterns = [
    path('subscription/', subscription_detail, name='billing-subscription'),
    path('checkout/', create_checkout_session, name='billing-checkout'),
    path('portal/', billing_portal, name='billing-portal'),
    path('invoices/', billing_invoices, name='billing-invoices'),
    path('webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
]
