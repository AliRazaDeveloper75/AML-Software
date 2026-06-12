import django_filters
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import HasPermission, Perm
from core.pagination import StandardPagination
from .models import AuditLog
from .serializers import AuditLogSerializer, AuditLogListSerializer


class AuditLogFilter(django_filters.FilterSet):
    user = django_filters.UUIDFilter()
    action = django_filters.CharFilter(lookup_expr='iexact')
    entity_type = django_filters.CharFilter(lookup_expr='iexact')
    entity_id = django_filters.CharFilter()
    status_code = django_filters.NumberFilter()
    date_from = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    date_to = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    path = django_filters.CharFilter(lookup_expr='icontains')
    ip_address = django_filters.CharFilter()

    class Meta:
        model = AuditLog
        fields = ['action', 'entity_type', 'status_code']


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Immutable audit log — read-only API.
    Restricted to compliance officers and owners.
    """
    pagination_class = StandardPagination
    filterset_class = AuditLogFilter
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['created_at', 'duration_ms']
    ordering = ['-created_at']

    def get_queryset(self):
        return AuditLog.objects.filter(
            organization=self.request.user.organization
        ).select_related('user').prefetch_related('changes')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AuditLogSerializer
        return AuditLogListSerializer

    def get_permissions(self):
        return [HasPermission.for_perm(Perm.AUDIT_READ)()]
