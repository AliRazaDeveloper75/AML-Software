from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AccountViewSet, JournalEntryViewSet, InvoiceViewSet, TransactionViewSet, ExpenseViewSet

router = DefaultRouter()
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'journal-entries', JournalEntryViewSet, basename='journal-entry')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'expenses', ExpenseViewSet, basename='expense')

urlpatterns = [
    path('', include(router.urls)),
]
