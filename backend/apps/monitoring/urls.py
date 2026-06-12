from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MonitoringRuleViewSet, TransactionAlertViewSet

router = DefaultRouter()
router.register(r'rules', MonitoringRuleViewSet, basename='monitoring-rule')
router.register(r'alerts', TransactionAlertViewSet, basename='transaction-alert')

urlpatterns = [
    path('', include(router.urls)),
]
