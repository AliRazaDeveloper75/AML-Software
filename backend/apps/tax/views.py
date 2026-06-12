from datetime import date
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import HasPermission, Perm
from core.pagination import StandardPagination
from services.tax_engine.vat import VATEngine
from services.tax_engine.corporate_tax import CorporateTaxEngine
from .models import VATReturn, CorporateTaxReturn
from .serializers import VATReturnSerializer, CorporateTaxReturnSerializer


class VATReturnViewSet(viewsets.ModelViewSet):
    pagination_class = StandardPagination
    serializer_class = VATReturnSerializer
    http_method_names = ['get', 'post', 'patch']

    def get_queryset(self):
        return VATReturn.objects.filter(organization=self.request.user.organization)

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [HasPermission.for_perm(Perm.TAX_READ)()]
        return [HasPermission.for_perm(Perm.TAX_FILE)()]

    @action(detail=False, methods=['get'], url_path='compute')
    def compute(self, request):
        """Compute (but do not save) the VAT return for a given period."""
        period_start = request.query_params.get('period_start')
        period_end = request.query_params.get('period_end')

        if not period_start or not period_end:
            # Default to current quarter
            period_start, period_end = VATEngine.get_current_quarter()
        else:
            from datetime import date as dt
            try:
                period_start = dt.fromisoformat(period_start)
                period_end = dt.fromisoformat(period_end)
            except ValueError:
                return Response({'message': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        engine = VATEngine(request.user.organization, period_start, period_end)
        result = engine.calculate()
        return Response(result)

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        """Compute and save a VAT return as draft."""
        period_start_raw = request.data.get('period_start')
        period_end_raw = request.data.get('period_end')

        if not period_start_raw or not period_end_raw:
            period_start, period_end = VATEngine.get_current_quarter()
        else:
            try:
                period_start = date.fromisoformat(period_start_raw)
                period_end = date.fromisoformat(period_end_raw)
            except ValueError:
                return Response({'message': 'Invalid date format.'}, status=status.HTTP_400_BAD_REQUEST)

        org = request.user.organization
        # Check for existing return
        existing = VATReturn.objects.filter(organization=org, period_start=period_start, period_end=period_end).first()
        if existing and existing.status == 'filed':
            return Response({'message': 'A filed VAT return already exists for this period.'}, status=status.HTTP_409_CONFLICT)

        engine = VATEngine(org, period_start, period_end)
        data = engine.calculate()

        vat_return, _ = VATReturn.objects.update_or_create(
            organization=org, period_start=period_start, period_end=period_end,
            defaults={
                'status': 'draft',
                'standard_rated_supplies': data['standard_rated_supplies'],
                'output_vat': data['output_vat'],
                'zero_rated_supplies': data['zero_rated_supplies'],
                'exempt_supplies': data['exempt_supplies'],
                'standard_rated_expenses': data['standard_rated_expenses'],
                'recoverable_input_vat': data['recoverable_input_vat'],
                'non_recoverable_input_vat': data['non_recoverable_input_vat'],
                'adjustments': data['adjustments'],
                'net_vat_payable': data['net_vat_payable'],
                'is_refund': data['is_refund'],
                'refund_amount': data['refund_amount'],
            }
        )
        return Response(VATReturnSerializer(vat_return).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def file(self, request, pk=None):
        """Mark a draft VAT return as filed."""
        vat_return = self.get_object()
        if vat_return.status == 'filed':
            return Response({'message': 'Already filed.'}, status=status.HTTP_400_BAD_REQUEST)
        fta_reference = request.data.get('fta_reference', '')
        vat_return.status = 'filed'
        vat_return.filed_at = timezone.now()
        vat_return.filed_by = request.user
        vat_return.fta_reference = fta_reference
        vat_return.save(update_fields=['status', 'filed_at', 'filed_by', 'fta_reference'])
        return Response({'message': 'VAT return filed successfully.', 'fta_reference': fta_reference})


class CorporateTaxReturnViewSet(viewsets.ModelViewSet):
    pagination_class = StandardPagination
    serializer_class = CorporateTaxReturnSerializer
    http_method_names = ['get', 'post', 'patch']

    def get_queryset(self):
        return CorporateTaxReturn.objects.filter(organization=self.request.user.organization)

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [HasPermission.for_perm(Perm.TAX_READ)()]
        return [HasPermission.for_perm(Perm.TAX_FILE)()]

    @action(detail=False, methods=['get'], url_path='compute')
    def compute(self, request):
        tax_year = request.query_params.get('tax_year', date.today().year)
        try:
            tax_year = int(tax_year)
        except ValueError:
            return Response({'message': 'tax_year must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)
        engine = CorporateTaxEngine(request.user.organization, tax_year)
        return Response(engine.calculate())

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        tax_year = request.data.get('tax_year', date.today().year)
        try:
            tax_year = int(tax_year)
        except (ValueError, TypeError):
            return Response({'message': 'tax_year must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)

        org = request.user.organization
        existing = CorporateTaxReturn.objects.filter(organization=org, tax_year=tax_year).first()
        if existing and existing.status == 'filed':
            return Response({'message': 'A filed CT return already exists for this year.'}, status=status.HTTP_409_CONFLICT)

        engine = CorporateTaxEngine(org, tax_year)
        data = engine.calculate()

        ct_return, _ = CorporateTaxReturn.objects.update_or_create(
            organization=org, tax_year=tax_year,
            defaults={
                'status': 'draft',
                'period_start': data['period_start'],
                'period_end': data['period_end'],
                'total_revenue': data['total_revenue'],
                'accounting_profit': data['accounting_profit'],
                'add_back_disallowable': data['add_back_disallowable'],
                'less_exempt_income': data['less_exempt_income'],
                'taxable_income': data['taxable_income'],
                'exemption_threshold': data['exemption_threshold'],
                'taxable_income_above_threshold': data['taxable_income_above_threshold'],
                'ct_rate': data['ct_rate'],
                'ct_liability': data['ct_liability'],
                'effective_rate': data['effective_rate'],
                'small_business_relief': data['small_business_relief'],
                'filing_deadline': data['filing_deadline'],
            }
        )
        return Response(CorporateTaxReturnSerializer(ct_return).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def file(self, request, pk=None):
        ct_return = self.get_object()
        if ct_return.status == 'filed':
            return Response({'message': 'Already filed.'}, status=status.HTTP_400_BAD_REQUEST)
        mof_reference = request.data.get('mof_reference', '')
        ct_return.status = 'filed'
        ct_return.filed_at = timezone.now()
        ct_return.filed_by = request.user
        ct_return.mof_reference = mof_reference
        ct_return.save(update_fields=['status', 'filed_at', 'filed_by', 'mof_reference'])
        return Response({'message': 'Corporate Tax return filed successfully.', 'mof_reference': mof_reference})
