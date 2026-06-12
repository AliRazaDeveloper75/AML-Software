from rest_framework import serializers
from .models import User, Role, OTPVerification, APIKey


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions', 'is_system', 'created_at']
        read_only_fields = ['id', 'is_system', 'created_at']


class UserListSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True, default=None)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'role_name', 'is_active', 'is_2fa_enabled',
            'last_login', 'created_at',
        ]
        read_only_fields = fields


class UserDetailSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True, default=None)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'role_name', 'permissions',
            'is_active', 'is_2fa_enabled', 'preferred_2fa',
            'failed_login_count', 'locked_until',
            'last_login', 'created_at',
        ]
        read_only_fields = [
            'id', 'permissions', 'failed_login_count', 'locked_until',
            'last_login', 'created_at',
        ]

    def get_permissions(self, obj):
        if obj.role:
            from core.permissions import ROLE_PERMISSIONS
            return ROLE_PERMISSIONS.get(obj.role.name, [])
        return []


class UserInviteSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    role_id = serializers.UUIDField()

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'role']


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=10)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs


class APIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = APIKey
        fields = ['id', 'name', 'prefix', 'is_active', 'last_used_at', 'expires_at', 'created_at']
        read_only_fields = fields


class APIKeyCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    expires_at = serializers.DateTimeField(required=False, allow_null=True)


class TOTPSetupSerializer(serializers.Serializer):
    """For confirming TOTP setup — user submits first code after scanning QR."""
    code = serializers.CharField(min_length=6, max_length=6)
