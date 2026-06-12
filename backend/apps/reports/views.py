from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import serializers

from core.permissions import HasPermission, Perm
from core.pagination import StandardPagination
from .models import GeneratedReport


class GeneratedReportSerializer(serializers.ModelSerializer):
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.full_name', read_only=True, default=None)

    class Meta:
        model = GeneratedReport
        fields = [
            'id', 'report_type', 'report_type_display', 'status', 'status_display',
            'params', 'requested_by', 'requested_by_name',
            'error_message', 'created_at',
        ]
        read_only_fields = fields


class GenerateReportSerializer(serializers.Serializer):
    report_type = serializers.ChoiceField(choices=GeneratedReport.ReportType.choices)
    params = serializers.DictField(required=False, default=dict)


class ReportViewSet(viewsets.ReadOnlyModelViewSet):
    pagination_class = StandardPagination
    serializer_class = GeneratedReportSerializer

    def get_queryset(self):
        return GeneratedReport.objects.filter(
            organization=self.request.user.organization
        ).select_related('requested_by')

    def get_permissions(self):
        return [HasPermission.for_perm(Perm.REPORTS_VIEW)()]

    @action(detail=False, methods=['post'])
    def generate(self, request):
        if not HasPermission.for_perm(Perm.REPORTS_GENERATE)().has_permission(request, self):
            return Response({'message': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = GenerateReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report_type = serializer.validated_data['report_type']
        params = serializer.validated_data['params']

        report = GeneratedReport.objects.create(
            organization=request.user.organization,
            report_type=report_type,
            status='queued',
            params=params,
            requested_by=request.user,
        )

        from tasks.report_tasks import generate_aml_report
        generate_aml_report.delay(
            str(request.user.organization_id),
            report_type,
            params,
            str(request.user.id),
        )

        return Response({
            'message': 'Report queued. You will be notified when it is ready.',
            'report_id': str(report.id),
        }, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        report = self.get_object()
        if report.status != 'ready':
            return Response({'message': f'Report is not ready yet (status: {report.status}).'}, status=status.HTTP_400_BAD_REQUEST)
        if not report.blob_name:
            return Response({'message': 'Report file not available.'}, status=status.HTTP_404_NOT_FOUND)

        from services.external.azure_storage import AzureStorageService
        url = AzureStorageService().generate_sas_url(report.blob_name, expiry_minutes=15)
        return Response({'download_url': url, 'expires_in': 900})
