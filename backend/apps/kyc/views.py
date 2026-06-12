import logging
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from core.mixins import TenantQuerysetMixin, OrganizationCreateMixin, SuccessResponseMixin
from core.permissions import HasPermission, IsSameTenant, Perm
from core.exceptions import TenantQuotaExceeded, ScreeningInProgress
from .models import Customer, KYCDocument, UBODeclaration
from .serializers import (
    CustomerListSerializer, CustomerDetailSerializer, CustomerCreateSerializer,
    CustomerUpdateSerializer, KYCDocumentSerializer, UBOSerializer,
    UBOCreateSerializer, KYCApproveSerializer, KYCRejectSerializer,
)
from .filters import CustomerFilter
from services.aml_engine.risk_scorer import RiskScorer

logger = logging.getLogger('apps.kyc')


class CustomerViewSet(TenantQuerysetMixin, OrganizationCreateMixin, SuccessResponseMixin, viewsets.ModelViewSet):
    queryset = Customer.objects.select_related('organization', 'assigned_officer', 'approved_by')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = CustomerFilter
    search_fields = ['first_name', 'last_name', 'company_name', 'emirates_id', 'email']
    ordering_fields = ['created_at', 'risk_score', 'kyc_status']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [HasPermission.for_perm(Perm.KYC_READ)()]
        if self.action in ('create', 'update', 'partial_update'):
            return [HasPermission.for_perm(Perm.KYC_WRITE)()]
        if self.action == 'destroy':
            return [HasPermission.for_perm(Perm.KYC_DELETE)()]
        if self.action in ('approve', 'reject', 'suspend'):
            return [HasPermission.for_perm(Perm.KYC_APPROVE)()]
        if self.action == 'screen':
            return [HasPermission.for_perm(Perm.AML_SCREEN)()]
        return [HasPermission.for_perm(Perm.KYC_READ)()]

    def get_serializer_class(self):
        if self.action == 'list':
            return CustomerListSerializer
        if self.action == 'create':
            return CustomerCreateSerializer
        if self.action in ('update', 'partial_update'):
            return CustomerUpdateSerializer
        return CustomerDetailSerializer

    def perform_create(self, serializer):
        org = self.request.user.organization
        # Check plan quota
        from django.conf import settings
        plan = settings.STRIPE_PLANS.get(org.plan, {})
        limit = plan.get('kyc_limit')
        if limit and org.kyc_count_this_month >= limit:
            raise TenantQuotaExceeded(
                f"KYC screening limit ({limit}/month) reached. Upgrade to Professional for unlimited screenings."
            )
        customer = serializer.save(organization=org)
        # Auto-calculate initial risk score
        scorer = RiskScorer(customer)
        score, level = scorer.calculate()
        customer.risk_score = score
        customer.risk_level = level
        customer.save(update_fields=['risk_score', 'risk_level'])
        org.increment_kyc_count()
        logger.info("Customer created: %s by %s", customer.id, self.request.user.email)

    @action(detail=True, methods=['post'])
    def screen(self, request, pk=None):
        customer = self.get_object()
        # Check if screening already in queue
        from django_celery_results.models import TaskResult
        active = TaskResult.objects.filter(
            task_name='tasks.aml_tasks.screen_customer',
            status__in=['PENDING', 'STARTED'],
        ).filter(task_kwargs__icontains=str(customer.id)).exists()
        if active:
            raise ScreeningInProgress()

        from tasks.aml_tasks import screen_customer
        task = screen_customer.delay(str(customer.id), str(request.user.id))

        return Response({
            'success': True,
            'message': 'Screening job queued.',
            'data': {'task_id': task.id}
        })

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        customer = self.get_object()
        serializer = KYCApproveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        customer.kyc_status = Customer.KYCStatus.VERIFIED
        customer.approved_by = request.user
        customer.approved_at = timezone.now()
        customer.kyc_expiry_date = serializer.validated_data.get('expiry_date')
        customer.next_review_date = serializer.validated_data.get('next_review_date')
        customer.save(update_fields=['kyc_status', 'approved_by', 'approved_at', 'kyc_expiry_date', 'next_review_date'])

        return Response({'success': True, 'message': f'Customer {customer.display_name} approved.'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        customer = self.get_object()
        serializer = KYCRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        customer.kyc_status = Customer.KYCStatus.REJECTED
        customer.rejection_reason = serializer.validated_data['reason']
        customer.save(update_fields=['kyc_status', 'rejection_reason'])

        return Response({'success': True, 'message': 'Customer rejected.'})

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        customer = self.get_object()
        reason = request.data.get('reason', 'Suspended by compliance officer.')
        customer.kyc_status = Customer.KYCStatus.SUSPENDED
        customer.rejection_reason = reason
        customer.save(update_fields=['kyc_status', 'rejection_reason'])
        logger.info("Customer %s suspended by %s", customer.id, request.user.email)
        return Response({'success': True, 'message': f'Customer {customer.display_name} has been suspended.'})

    @action(detail=True, methods=['get'], url_path='sumsub-link')
    def sumsub_link(self, request, pk=None):
        """Generate a Sumsub Web SDK link for identity verification."""
        customer = self.get_object()
        from services.external.sumsub import create_applicant_and_get_link
        result = create_applicant_and_get_link(customer)
        if result.get('error'):
            return Response({'success': False, 'message': result['error']}, status=503)
        return Response({'success': True, 'data': result})

    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        """Full compliance timeline for a customer — screenings, alerts, approvals."""
        customer = self.get_object()
        from apps.aml.models import AMLScreening, AMLAlert

        screenings = AMLScreening.objects.filter(customer=customer).order_by('-screened_at')[:10]
        alerts = AMLAlert.objects.filter(customer=customer).order_by('-created_at')[:10]

        from apps.aml.serializers import AMLScreeningSerializer, AMLAlertSerializer
        return Response({
            'success': True,
            'data': {
                'screenings': AMLScreeningSerializer(screenings, many=True).data,
                'alerts': AMLAlertSerializer(alerts, many=True).data,
            }
        })


class KYCDocumentViewSet(TenantQuerysetMixin, SuccessResponseMixin, viewsets.ModelViewSet):
    queryset = KYCDocument.objects.select_related('customer', 'verified_by')
    serializer_class = KYCDocumentSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [HasPermission.for_perm(Perm.KYC_WRITE)]

    def get_queryset(self):
        qs = super().get_queryset()
        customer_id = self.kwargs.get('customer_pk')
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        return qs

    def perform_create(self, serializer):
        customer_id = self.kwargs.get('customer_pk')
        customer = Customer.objects.get(id=customer_id, organization=self.request.user.organization)
        file = self.request.FILES.get('file')

        from services.external.azure_storage import AzureStorageService
        storage = AzureStorageService()
        file_url = storage.upload_kyc_document(
            file=file,
            org_id=str(self.request.user.organization_id),
            customer_id=str(customer_id),
        )

        serializer.save(
            organization=self.request.user.organization,
            customer=customer,
            file_url=file_url,
            file_name=file.name,
            file_size=file.size,
            mime_type=file.content_type,
        )

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None, customer_pk=None):
        doc = self.get_object()
        doc.status = KYCDocument.Status.VERIFIED
        doc.verified_by = request.user
        doc.verified_at = timezone.now()
        doc.save(update_fields=['status', 'verified_by', 'verified_at'])
        return Response({'success': True, 'message': 'Document verified.'})

    @action(detail=True, methods=['get'])
    def download_url(self, request, pk=None, customer_pk=None):
        """Generate a short-lived SAS URL for document download."""
        doc = self.get_object()
        from services.external.azure_storage import AzureStorageService
        url = AzureStorageService().generate_sas_url(doc.file_url)
        return Response({'success': True, 'data': {'url': url, 'expires_in': 900}})


class UBODeclarationViewSet(TenantQuerysetMixin, SuccessResponseMixin, viewsets.ModelViewSet):
    queryset = UBODeclaration.objects.select_related('customer')
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering = ['-id']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [HasPermission.for_perm(Perm.KYC_READ)()]
        return [HasPermission.for_perm(Perm.KYC_WRITE)()]

    def get_serializer_class(self):
        if self.action == 'create':
            return UBOCreateSerializer
        return UBOSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        customer_id = self.kwargs.get('customer_pk') or self.request.query_params.get('customer')
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        return qs

    def perform_create(self, serializer):
        customer_id = self.kwargs.get('customer_pk') or self.request.data.get('customer')
        customer = Customer.objects.get(id=customer_id, organization=self.request.user.organization)
        serializer.save(organization=self.request.user.organization, customer=customer)
