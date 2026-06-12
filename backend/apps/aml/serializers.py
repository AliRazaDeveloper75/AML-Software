from rest_framework import serializers
from .models import Watchlist, WatchlistEntry, AMLScreening, AMLAlert, TransactionRule


class WatchlistSerializer(serializers.ModelSerializer):
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    entry_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Watchlist
        fields = [
            'id', 'name', 'source', 'source_display', 'description',
            'is_active', 'last_updated', 'entry_count', 'created_at',
        ]
        read_only_fields = ['id', 'last_updated', 'entry_count', 'created_at']


class WatchlistEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = WatchlistEntry
        fields = [
            'id', 'watchlist', 'entry_type', 'full_name', 'aliases',
            'date_of_birth', 'nationality', 'national_id',
            'listed_date', 'delisted_date', 'is_active',
            'reason', 'programs', 'source_reference', 'additional_info',
        ]
        read_only_fields = ['id']


class AMLScreeningSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    screening_type_display = serializers.CharField(source='get_screening_type_display', read_only=True)
    customer_name = serializers.SerializerMethodField()
    screened_by_name = serializers.CharField(source='screened_by.full_name', read_only=True, default=None)

    class Meta:
        model = AMLScreening
        fields = [
            'id', 'customer', 'customer_name', 'screening_type', 'screening_type_display',
            'status', 'status_display', 'match_score', 'matched_entries',
            'is_false_positive', 'false_positive_reason',
            'screened_by', 'screened_by_name', 'screened_at',
            'created_at',
        ]
        read_only_fields = fields

    def get_customer_name(self, obj):
        c = obj.customer
        if not c:
            return None
        if c.customer_type == 'individual':
            return f"{c.first_name} {c.last_name}".strip()
        return c.company_name


class AMLScreeningDetailSerializer(AMLScreeningSerializer):
    class Meta(AMLScreeningSerializer.Meta):
        fields = AMLScreeningSerializer.Meta.fields + ['raw_results', 'notes']


class AMLAlertSerializer(serializers.ModelSerializer):
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    customer_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True, default=None)
    resolved_by_name = serializers.CharField(source='resolved_by.full_name', read_only=True, default=None)

    class Meta:
        model = AMLAlert
        fields = [
            'id', 'customer', 'customer_name', 'screening',
            'alert_type', 'alert_type_display', 'severity', 'severity_display',
            'status', 'status_display', 'title', 'description',
            'assigned_to', 'assigned_to_name',
            'resolved_by', 'resolved_by_name', 'resolved_at',
            'resolution_notes', 'sar_reference',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'customer', 'screening', 'resolved_by', 'resolved_at',
            'created_at', 'updated_at',
        ]


class AMLAlertResolveSerializer(serializers.Serializer):
    resolution = serializers.ChoiceField(choices=['cleared', 'sar_filed', 'escalated', 'closed'])
    resolution_notes = serializers.CharField()
    sar_reference = serializers.CharField(required=False, allow_blank=True)


class AMLAlertAssignSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()


class TransactionRuleSerializer(serializers.ModelSerializer):
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)

    class Meta:
        model = TransactionRule
        fields = [
            'id', 'rule_code', 'name', 'description', 'is_active',
            'severity', 'severity_display', 'threshold_amount',
            'threshold_count', 'window_hours', 'parameters',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'rule_code', 'created_at', 'updated_at']


class FalsePositiveSerializer(serializers.Serializer):
    reason = serializers.CharField()
