from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import HasPermission, Perm
from core.pagination import StandardPagination
from .models import MonitoringRule, TransactionAlert
from .serializers import MonitoringRuleSerializer, TransactionAlertSerializer, TransactionAlertReviewSerializer


class MonitoringRuleViewSet(viewsets.ModelViewSet):
    pagination_class = StandardPagination
    serializer_class = MonitoringRuleSerializer

    def get_queryset(self):
        return MonitoringRule.objects.filter(organization=self.request.user.organization)

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [HasPermission.for_perm(Perm.AML_READ)()]
        return [HasPermission.for_perm(Perm.AML_RESOLVE)()]

    def perform_create(self, serializer):
        org = self.request.user.organization
        # Auto-generate rule_code if not provided
        count = MonitoringRule.objects.filter(organization=org).count()
        rule_code = serializer.validated_data.get('rule_code') or f'CUSTOM-{count + 1:03d}'
        serializer.save(organization=org, rule_code=rule_code)

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        rule = self.get_object()
        rule.is_active = not rule.is_active
        rule.save(update_fields=['is_active'])
        state = 'activated' if rule.is_active else 'deactivated'
        return Response({'message': f'Rule "{rule.name}" {state}.', 'is_active': rule.is_active})


class TransactionAlertViewSet(viewsets.ModelViewSet):
    http_method_names = ['get', 'patch', 'post']
    pagination_class = StandardPagination
    serializer_class = TransactionAlertSerializer

    def get_queryset(self):
        qs = TransactionAlert.objects.filter(
            organization=self.request.user.organization
        ).select_related('transaction', 'rule', 'customer', 'reviewed_by')

        is_reviewed = self.request.query_params.get('is_reviewed')
        severity = self.request.query_params.get('severity')
        rule_code = self.request.query_params.get('rule_code')

        if is_reviewed is not None:
            qs = qs.filter(is_reviewed=is_reviewed.lower() == 'true')
        if severity:
            qs = qs.filter(rule__severity=severity)
        if rule_code:
            qs = qs.filter(rule__rule_code=rule_code)
        return qs

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [HasPermission.for_perm(Perm.AML_READ)()]
        return [HasPermission.for_perm(Perm.AML_RESOLVE)()]

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        alert = self.get_object()
        serializer = TransactionAlertReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        alert.is_reviewed = True
        alert.reviewed_by = request.user
        alert.reviewed_at = timezone.now()
        alert.review_notes = serializer.validated_data['review_notes']
        alert.save(update_fields=['is_reviewed', 'reviewed_by', 'reviewed_at', 'review_notes'])

        # If escalated, create an AML alert
        if serializer.validated_data['action'] == 'escalate':
            from apps.aml.models import AMLAlert
            AMLAlert.objects.create(
                organization=self.request.user.organization,
                customer=alert.customer,
                alert_type='transaction_monitoring',
                severity=alert.rule.severity,
                title=f'Escalated: {alert.rule.name}',
                description=f'Transaction {alert.transaction.reference} triggered {alert.rule.rule_code}. {alert.review_notes}',
                status='open',
            )

        return Response({'message': 'Alert reviewed.', 'action': serializer.validated_data['action']})

    @action(detail=False, methods=['get'])
    def unreviewed_count(self, request):
        count = TransactionAlert.objects.filter(
            organization=request.user.organization, is_reviewed=False
        ).count()
        return Response({'unreviewed_count': count})
