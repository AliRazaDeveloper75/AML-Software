from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, RoleViewSet, TOTPSetupView, APIKeyViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'api-keys', APIKeyViewSet, basename='api-key')

urlpatterns = [
    path('', include(router.urls)),
    path('2fa/totp/', TOTPSetupView.as_view(), name='totp-setup'),
]
