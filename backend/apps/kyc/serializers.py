from decimal import Decimal
from rest_framework import serializers
from .models import Customer, KYCDocument, UBODeclaration


class UBODeclarationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UBODeclaration
        fields = [
            'id', 'full_name', 'nationality', 'date_of_birth',
            'ownership_percentage', 'is_pep', 'passport_number',
            'emirates_id', 'screened_at', 'screening_result', 'created_at',
        ]
        read_only_fields = ['id', 'screened_at', 'screening_result', 'created_at']

    def validate_ownership_percentage(self, value):
        if not (Decimal('0') < value <= Decimal('100')):
            raise serializers.ValidationError('Ownership percentage must be between 0 and 100.')
        return value


class KYCDocumentSerializer(serializers.ModelSerializer):
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True, default=None)
    document_type = serializers.CharField(source='doc_type', read_only=True)
    verification_status = serializers.CharField(source='status', read_only=True)

    class Meta:
        model = KYCDocument
        fields = [
            'id', 'document_type', 'file_name', 'file_size',
            'mime_type', 'verification_status', 'verified_at', 'expires_at',
            'notes', 'verified_by', 'verified_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'verification_status', 'verified_at', 'verified_by', 'created_at']


class CustomerListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    sanctions_match = serializers.BooleanField(source='is_sanctioned', read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id', 'customer_type', 'full_name',
            'kyc_status', 'risk_score', 'risk_level',
            'is_pep', 'sanctions_match', 'requires_edd',
            'kyc_expiry_date', 'created_at',
        ]

    def get_full_name(self, obj):
        if obj.customer_type == 'individual':
            return f"{obj.first_name} {obj.last_name}".strip()
        return obj.company_name or ''


class CustomerDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    sanctions_match = serializers.BooleanField(source='is_sanctioned', read_only=True)
    ubos = UBODeclarationSerializer(many=True, read_only=True)
    documents = KYCDocumentSerializer(many=True, read_only=True)
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            'id', 'customer_type', 'full_name',
            # Individual
            'first_name', 'last_name', 'email', 'phone',
            'date_of_birth', 'nationality', 'gender',
            'emirates_id', 'emirates_id_expiry', 'passport_number', 'passport_expiry',
            # Corporate
            'company_name', 'trade_license_no', 'trade_license_expiry',
            'business_activity', 'incorporation_country', 'expected_annual_turnover',
            'trn',
            # Address
            'address', 'emirate',
            # Risk & KYC
            'source_of_funds', 'source_of_wealth',
            'kyc_status', 'risk_score', 'risk_level',
            'is_pep', 'sanctions_match', 'requires_edd', 'edd_notes',
            'kyc_expiry_date', 'last_screened_at',
            'approved_by', 'approved_by_name', 'approved_at', 'rejection_reason',
            # Related
            'ubos', 'documents',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'risk_score', 'risk_level', 'is_pep', 'is_sanctioned',
            'requires_edd', 'kyc_status', 'approved_by', 'approved_at',
            'last_screened_at', 'created_at', 'updated_at',
        ]

    def get_full_name(self, obj):
        if obj.customer_type == 'individual':
            return f"{obj.first_name} {obj.last_name}".strip()
        return obj.company_name or ''

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name()
        return None

    def validate(self, attrs):
        customer_type = attrs.get('customer_type', getattr(self.instance, 'customer_type', None))
        if customer_type == 'individual':
            if not attrs.get('first_name') and not getattr(self.instance, 'first_name', None):
                raise serializers.ValidationError({'first_name': 'Required for individual customers.'})
            if not attrs.get('last_name') and not getattr(self.instance, 'last_name', None):
                raise serializers.ValidationError({'last_name': 'Required for individual customers.'})
        elif customer_type == 'corporate':
            if not attrs.get('company_name') and not getattr(self.instance, 'company_name', None):
                raise serializers.ValidationError({'company_name': 'Required for corporate customers.'})
        return attrs


class CustomerApproveSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True)
    expiry_date = serializers.DateField(required=False, allow_null=True)
    next_review_date = serializers.DateField(required=False, allow_null=True)


class CustomerRejectSerializer(serializers.Serializer):
    reason = serializers.CharField()


class KYCDocumentUploadSerializer(serializers.Serializer):
    document_type = serializers.ChoiceField(choices=KYCDocument.DocType.choices)
    file = serializers.FileField()
    expiry_date = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_file(self, value):
        allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
        max_size = 10 * 1024 * 1024  # 10 MB
        if value.content_type not in allowed_types:
            raise serializers.ValidationError('Only PDF, JPEG, PNG, and WebP files are accepted.')
        if value.size > max_size:
            raise serializers.ValidationError('File size must not exceed 10 MB.')
        return value


class UBOCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UBODeclaration
        fields = [
            'full_name', 'nationality', 'date_of_birth',
            'ownership_percentage', 'is_pep', 'emirates_id', 'passport_number',
        ]

    def validate_ownership_percentage(self, value):
        if not (Decimal('0') < value <= Decimal('100')):
            raise serializers.ValidationError('Must be between 0 and 100.')
        return value


# Aliases used by views.py
CustomerCreateSerializer = CustomerDetailSerializer
CustomerUpdateSerializer = CustomerDetailSerializer
UBOSerializer = UBODeclarationSerializer
KYCApproveSerializer = CustomerApproveSerializer
KYCRejectSerializer = CustomerRejectSerializer
