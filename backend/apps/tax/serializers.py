from rest_framework import serializers
from .models import VATReturn, CorporateTaxReturn


class VATReturnSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    filed_by_name = serializers.CharField(source='filed_by.full_name', read_only=True, default=None)
    quarter_label = serializers.SerializerMethodField()

    class Meta:
        model = VATReturn
        fields = [
            'id', 'period_start', 'period_end', 'quarter_label', 'status', 'status_display',
            'standard_rated_supplies', 'output_vat', 'zero_rated_supplies', 'exempt_supplies',
            'standard_rated_expenses', 'recoverable_input_vat', 'non_recoverable_input_vat',
            'adjustments', 'net_vat_payable', 'is_refund', 'refund_amount',
            'filed_at', 'filed_by', 'filed_by_name', 'fta_reference', 'notes',
            'created_at',
        ]
        read_only_fields = [
            'id', 'output_vat', 'recoverable_input_vat', 'non_recoverable_input_vat',
            'net_vat_payable', 'is_refund', 'refund_amount',
            'filed_at', 'filed_by', 'created_at',
        ]

    def get_quarter_label(self, obj):
        q = (obj.period_start.month - 1) // 3 + 1
        return f"Q{q} {obj.period_start.year}"


class CorporateTaxReturnSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    filed_by_name = serializers.CharField(source='filed_by.full_name', read_only=True, default=None)
    days_to_deadline = serializers.SerializerMethodField()

    class Meta:
        model = CorporateTaxReturn
        fields = [
            'id', 'tax_year', 'period_start', 'period_end', 'status', 'status_display',
            'total_revenue', 'accounting_profit', 'add_back_disallowable', 'less_exempt_income',
            'taxable_income', 'exemption_threshold', 'taxable_income_above_threshold',
            'ct_rate', 'ct_liability', 'effective_rate', 'small_business_relief',
            'filing_deadline', 'days_to_deadline',
            'filed_at', 'filed_by', 'filed_by_name', 'mof_reference', 'notes',
            'created_at',
        ]
        read_only_fields = [
            'id', 'period_start', 'period_end', 'total_revenue', 'accounting_profit',
            'taxable_income', 'exemption_threshold', 'taxable_income_above_threshold',
            'ct_liability', 'effective_rate', 'small_business_relief',
            'filing_deadline', 'filed_at', 'filed_by', 'created_at',
        ]

    def get_days_to_deadline(self, obj):
        from datetime import date
        return (obj.filing_deadline - date.today()).days
