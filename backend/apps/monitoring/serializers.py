from rest_framework import serializers
from .models import MonitoringRule, TransactionAlert


class MonitoringRuleSerializer(serializers.ModelSerializer):
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)

    class Meta:
        model = MonitoringRule
        fields = [
            'id', 'rule_code', 'name', 'description', 'is_active',
            'severity', 'severity_display', 'threshold_amount',
            'threshold_count', 'window_hours', 'parameters',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TransactionAlertSerializer(serializers.ModelSerializer):
    rule_name = serializers.CharField(source='rule.name', read_only=True)
    rule_code = serializers.CharField(source='rule.rule_code', read_only=True)
    severity = serializers.CharField(source='rule.severity', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True, default=None)
    customer_name = serializers.SerializerMethodField()
    transaction_reference = serializers.CharField(source='transaction.reference', read_only=True)
    transaction_amount = serializers.DecimalField(source='transaction.amount_aed', max_digits=18, decimal_places=2, read_only=True)

    class Meta:
        model = TransactionAlert
        fields = [
            'id', 'transaction', 'transaction_reference', 'transaction_amount',
            'rule', 'rule_code', 'rule_name', 'severity',
            'customer', 'customer_name', 'alert_data',
            'is_reviewed', 'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'review_notes', 'created_at',
        ]
        read_only_fields = [
            'id', 'rule_code', 'rule_name', 'severity', 'customer_name',
            'transaction_reference', 'transaction_amount',
            'reviewed_by', 'reviewed_at', 'created_at',
        ]


class TransactionAlertReviewSerializer(serializers.Serializer):
    review_notes = serializers.CharField()
    action = serializers.ChoiceField(choices=['clear', 'escalate'])
