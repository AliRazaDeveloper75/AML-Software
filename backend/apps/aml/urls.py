from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WatchlistViewSet, AMLScreeningViewSet, AMLAlertViewSet, TransactionRuleViewSet

router = DefaultRouter()
router.register(r'watchlists', WatchlistViewSet, basename='watchlist')
router.register(r'screenings', AMLScreeningViewSet, basename='aml-screening')
router.register(r'alerts', AMLAlertViewSet, basename='aml-alert')
router.register(r'rules', TransactionRuleViewSet, basename='transaction-rule')

urlpatterns = [
    path('', include(router.urls)),
]
