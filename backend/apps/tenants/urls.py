from django.urls import path
from .views import OrganizationDetailView, organization_stats

urlpatterns = [
    path('organization/', OrganizationDetailView.as_view(), name='organization-detail'),
    path('organization/stats/', organization_stats, name='organization-stats'),
]
