from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, KYCDocumentViewSet, UBODeclarationViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'documents', KYCDocumentViewSet, basename='kyc-document')
router.register(r'ubos', UBODeclarationViewSet, basename='ubo')

urlpatterns = [
    path('', include(router.urls)),
]
