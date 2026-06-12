from django.utils import timezone
from django.db.models import Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import HasPermission, Perm
from core.pagination import StandardPagination
from .models import Watchlist, WatchlistEntry, AMLScreening, AMLAlert, TransactionRule
from .serializers import (
    WatchlistSerializer, WatchlistEntrySerializer,
    AMLScreeningSerializer, AMLScreeningDetailSerializer,
    AMLAlertSerializer, AMLAlertResolveSerializer, AMLAlertAssignSerializer,
    TransactionRuleSerializer, FalsePositiveSerializer,
)


class WatchlistViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only access to global watchlists (org-scoped custom lists are writable)."""
    pagination_class = StandardPagination

    def get_queryset(self):
        return Watchlist.objects.annotate(
            entry_count=Count('entries', filter=__import__('django.db.models', fromlist=['Q']).Q(entries__is_active=True))
        ).filter(is_active=True)

    def get_serializer_class(self):
        return WatchlistSerializer

    def get_permissions(self):
        return [HasPermission.for_perm(Perm.AML_READ)()]

    @action(detail=True, methods=['get'])
    def entries(self, request, pk=None):
        watchlist = self.get_object()
        entries = WatchlistEntry.objects.filter(watchlist=watchlist, is_active=True)
        search = request.query_params.get('search')
        if search:
            from django.db.models import Q
            entries = entries.filter(
                Q(full_name__icontains=search) | Q(aliases__icontains=search)
            )
        page = self.paginate_queryset(entries)
        serializer = WatchlistEntrySerializer(page, many=True)
        return self.get_paginated_response(serializer.data)


class AMLScreeningViewSet(viewsets.ReadOnlyModelViewSet):
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['screened_at', 'match_score', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return AMLScreening.objects.filter(
            organization=self.request.user.organization
        ).select_related('customer', 'screened_by')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AMLScreeningDetailSerializer
        return AMLScreeningSerializer

    def get_permissions(self):
        return [HasPermission.for_perm(Perm.AML_READ)()]

    @action(detail=True, methods=['post'], url_path='mark-false-positive')
    def mark_false_positive(self, request, pk=None):
        screening = self.get_object()
        if not HasPermission.for_perm(Perm.AML_RESOLVE)().has_permission(request, self):
            return Response({'message': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = FalsePositiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        screening.is_false_positive = True
        screening.false_positive_reason = serializer.validated_data['reason']
        screening.save(update_fields=['is_false_positive', 'false_positive_reason'])

        return Response({'message': 'Marked as false positive.'})


class AMLAlertViewSet(viewsets.ModelViewSet):
    http_method_names = ['get', 'patch', 'post']
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['created_at', 'severity']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = AMLAlert.objects.filter(
            organization=self.request.user.organization
        ).select_related('customer', 'screening', 'assigned_to', 'resolved_by')

        # Quick filters
        alert_type = self.request.query_params.get('alert_type')
        severity = self.request.query_params.get('severity')
        alert_status = self.request.query_params.get('status')
        assigned_to_me = self.request.query_params.get('assigned_to_me')

        if alert_type:
            qs = qs.filter(alert_type=alert_type)
        if severity:
            qs = qs.filter(severity=severity)
        if alert_status:
            qs = qs.filter(status=alert_status)
        if assigned_to_me == 'true':
            qs = qs.filter(assigned_to=self.request.user)

        return qs

    def get_serializer_class(self):
        if self.action == 'resolve':
            return AMLAlertResolveSerializer
        if self.action == 'assign':
            return AMLAlertAssignSerializer
        return AMLAlertSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [HasPermission.for_perm(Perm.AML_READ)()]
        return [HasPermission.for_perm(Perm.AML_RESOLVE)()]

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        alert.status = data['resolution']
        alert.resolution_notes = data['resolution_notes']
        alert.sar_reference = data.get('sar_reference', '')
        alert.resolved_by = request.user
        alert.resolved_at = timezone.now()
        alert.save(update_fields=['status', 'resolution_notes', 'sar_reference', 'resolved_by', 'resolved_at'])

        return Response({'message': f'Alert resolved as {data["resolution"]}.'})

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        alert = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.users.models import User
        try:
            user = User.objects.get(
                pk=serializer.validated_data['user_id'],
                organization=request.user.organization,
                is_active=True,
            )
        except User.DoesNotExist:
            return Response({'message': 'User not found in your organization.'}, status=status.HTTP_404_NOT_FOUND)

        alert.assigned_to = user
        alert.status = 'in_review'
        alert.save(update_fields=['assigned_to', 'status'])

        return Response({'message': f'Alert assigned to {user.full_name}.'})

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Dashboard-level alert counts by severity and status."""
        from django.db.models import Count
        qs = AMLAlert.objects.filter(organization=request.user.organization)
        by_severity = qs.values('severity').annotate(count=Count('id'))
        by_status = qs.values('status').annotate(count=Count('id'))
        open_count = qs.filter(status__in=['open', 'in_review']).count()

        return Response({
            'open_alerts': open_count,
            'by_severity': {row['severity']: row['count'] for row in by_severity},
            'by_status': {row['status']: row['count'] for row in by_status},
        })


class TransactionRuleViewSet(viewsets.ModelViewSet):
    pagination_class = StandardPagination
    serializer_class = TransactionRuleSerializer

    def get_queryset(self):
        return TransactionRule.objects.filter(
            organization=self.request.user.organization
        )

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [HasPermission.for_perm(Perm.AML_READ)()]
        return [HasPermission.for_perm(Perm.AML_RESOLVE)()]

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        rule = self.get_object()
        rule.is_active = not rule.is_active
        rule.save(update_fields=['is_active'])
        state = 'activated' if rule.is_active else 'deactivated'
        return Response({'message': f'Rule {rule.rule_code} {state}.', 'is_active': rule.is_active})
