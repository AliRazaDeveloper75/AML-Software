from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VATReturnViewSet, CorporateTaxReturnViewSet

router = DefaultRouter()
router.register(r'vat', VATReturnViewSet, basename='vat-return')
router.register(r'corporate-tax', CorporateTaxReturnViewSet, basename='ct-return')

urlpatterns = [
    path('', include(router.urls)),
]
