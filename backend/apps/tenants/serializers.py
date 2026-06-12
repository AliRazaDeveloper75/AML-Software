from rest_framework import serializers
from .models import Organization


class OrganizationSerializer(serializers.ModelSerializer):
    plan_display = serializers.CharField(source='get_plan_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    license_type_display = serializers.CharField(source='get_license_type_display', read_only=True)
    days_until_trial_end = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'slug', 'email', 'phone',
            'plan', 'plan_display', 'status', 'status_display',
            'license_type', 'license_type_display',
            # UAE fields
            'trade_license_no', 'trade_license_expiry',
            'tax_registration_no', 'legal_structure',
            'registered_emirate', 'po_box',
            # Counts
            'kyc_count_this_month', 'api_calls_this_month',
            # Trial
            'trial_ends_at', 'days_until_trial_end',
            # Stripe
            'stripe_customer_id',
            'is_active', 'created_at',
        ]
        read_only_fields = [
            'id', 'slug', 'plan', 'status', 'kyc_count_this_month',
            'api_calls_this_month', 'stripe_customer_id',
            'trial_ends_at', 'created_at',
        ]

    def get_days_until_trial_end(self, obj):
        if not obj.trial_ends_at:
            return None
        from django.utils import timezone
        delta = obj.trial_ends_at - timezone.now()
        return max(delta.days, 0)


class OrganizationUpdateSerializer(serializers.ModelSerializer):
    """Only allows updating non-sensitive org fields."""
    class Meta:
        model = Organization
        fields = [
            'name', 'email', 'phone',
            'trade_license_no', 'trade_license_expiry',
            'tax_registration_no', 'legal_structure',
            'registered_emirate', 'po_box',
        ]
