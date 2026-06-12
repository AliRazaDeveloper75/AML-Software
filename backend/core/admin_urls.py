from django.urls import path
from . import admin_views

urlpatterns = [
    path('stats/', admin_views.PlatformStatsView.as_view(), name='admin-stats'),
    path('organizations/', admin_views.PlatformOrganizationsView.as_view(), name='admin-organizations'),
    path('organizations/<uuid:org_id>/', admin_views.PlatformOrganizationDetailView.as_view(), name='admin-organization-detail'),
    path('users/', admin_views.PlatformUsersView.as_view(), name='admin-users'),
    path('users/<uuid:user_id>/', admin_views.PlatformUserDetailView.as_view(), name='admin-user-detail'),
]
