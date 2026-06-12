from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from apps.kyc.webhook_views import SumsubWebhookView

urlpatterns = [
    path('admin/', admin.site.urls),

    # External webhooks (no auth, signature-verified internally)
    path('webhooks/sumsub/', SumsubWebhookView.as_view(), name='sumsub-webhook'),

    # API v1
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/tenants/', include('apps.tenants.urls')),
    path('api/v1/users/', include('apps.users.urls')),
    path('api/v1/kyc/', include('apps.kyc.urls')),
    path('api/v1/aml/', include('apps.aml.urls')),
    path('api/v1/accounting/', include('apps.accounting.urls')),
    path('api/v1/tax/', include('apps.tax.urls')),
    path('api/v1/monitoring/', include('apps.monitoring.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/billing/', include('apps.billing.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/audit/', include('apps.audit.urls')),
    path('api/v1/platform-admin/', include('core.admin_urls')),

    # OpenAPI Schema & Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    try:
        import debug_toolbar
        urlpatterns += [path('__debug__/', include(debug_toolbar.urls))]
    except ImportError:
        pass
