from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import authenticate
from django.conf import settings
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from apps.users.models import User, OTPVerification
from apps.tenants.models import Organization
from core.utils import validate_emirates_id
import random
import string


# ─── Registration ─────────────────────────────────────────────
class OrganizationRegisterSerializer(serializers.Serializer):
    # Organization fields
    org_name = serializers.CharField(max_length=255)
    trade_license_no = serializers.CharField(max_length=50)
    license_type = serializers.ChoiceField(choices=Organization.LicenseType.choices)
    trn = serializers.CharField(max_length=20, required=False, allow_blank=True)
    emirate = serializers.ChoiceField(choices=[
        'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman',
        'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'
    ])
    # Owner user fields
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=10, write_only=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value.lower()

    def validate_trade_license_no(self, value):
        if Organization.objects.filter(trade_license_no=value).exists():
            raise serializers.ValidationError('This trade license is already registered.')
        return value

    def validate_password(self, value):
        if value.isdigit():
            raise serializers.ValidationError('Password cannot be entirely numeric.')
        return value

    def create(self, validated_data):
        from django.utils.text import slugify
        import uuid
        from apps.users.models import Role
        from core.permissions import ROLE_PERMISSIONS

        # Create organization
        base_slug = slugify(validated_data['org_name'])
        slug = base_slug
        i = 1
        while Organization.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{i}"
            i += 1

        org = Organization.objects.create(
            name=validated_data['org_name'],
            slug=slug,
            trade_license_no=validated_data['trade_license_no'],
            license_type=validated_data['license_type'],
            trn=validated_data.get('trn', ''),
            emirate=validated_data['emirate'],
            primary_email=validated_data['email'],
            plan=Organization.Plan.STARTER,
            status=Organization.Status.TRIAL,
            trial_ends_at=timezone.now() + timedelta(days=14),
        )

        # Create system roles for this org
        for role_name, perms in ROLE_PERMISSIONS.items():
            Role.objects.create(
                organization=org,
                name=role_name,
                display_name=role_name.replace('_', ' ').title(),
                permissions=perms,
                is_system=True,
            )

        owner_role = org.roles.get(name='owner')

        # Create owner user
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=validated_data.get('phone', ''),
            organization=org,
            role=owner_role,
        )

        return user, org


# ─── Login ────────────────────────────────────────────────────
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data['email'].lower()
        password = data['password']

        try:
            user = User.objects.select_related('organization', 'role').get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'Invalid credentials.'})

        if user.is_locked():
            raise serializers.ValidationError({'email': 'Account is temporarily locked. Try again in 30 minutes.'})

        if not user.check_password(password):
            user.record_login_failure()
            raise serializers.ValidationError({'password': 'Invalid credentials.'})

        if not user.is_active:
            raise serializers.ValidationError({'email': 'Account is inactive.'})

        # Staff/superusers have no organization — let them through
        if not user.is_staff:
            if not user.organization or not user.organization.is_active:
                raise serializers.ValidationError({'email': 'Your organization account is suspended.'})

        data['user'] = user
        return data


# ─── Token customization ──────────────────────────────────────
class CustomTokenObtainSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['full_name'] = user.full_name
        token['org_id'] = str(user.organization_id) if user.organization_id else None
        token['org_name'] = user.organization.name if user.organization else None
        token['role'] = user.role.name if user.role else None
        token['permissions'] = user.permissions_list
        token['plan'] = user.organization.plan if user.organization else None
        return token


class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    pass


# ─── 2FA ──────────────────────────────────────────────────────
class TwoFactorSetupSerializer(serializers.Serializer):
    """Returns TOTP provisioning URI and QR code data."""
    def validate(self, data):
        user = self.context['request'].user
        if not user.totp_secret:
            user.generate_totp_secret()
            user.save(update_fields=['totp_secret'])
        data['totp_uri'] = user.get_totp_uri()
        data['secret'] = user.totp_secret
        return data


class TwoFactorEnableSerializer(serializers.Serializer):
    code = serializers.CharField(min_length=6, max_length=6)

    def validate_code(self, value):
        user = self.context['request'].user
        if not user.verify_totp(value):
            raise serializers.ValidationError('Invalid TOTP code.')
        return value

    def save(self):
        user = self.context['request'].user
        user.is_2fa_enabled = True
        user.preferred_2fa = 'totp'
        user.save(update_fields=['is_2fa_enabled', 'preferred_2fa'])


class TwoFactorVerifySerializer(serializers.Serializer):
    temp_token = serializers.CharField()
    code = serializers.CharField(min_length=6, max_length=6)
    method = serializers.ChoiceField(choices=['totp', 'sms'], default='totp')


# ─── OTP ──────────────────────────────────────────────────────
class OTPRequestSerializer(serializers.Serializer):
    purpose = serializers.ChoiceField(choices=OTPVerification.Purpose.choices)


class OTPVerifySerializer(serializers.Serializer):
    code = serializers.CharField(min_length=6, max_length=6)
    purpose = serializers.ChoiceField(choices=OTPVerification.Purpose.choices)

    def validate(self, data):
        user = self.context['request'].user
        try:
            otp = OTPVerification.objects.filter(
                user=user,
                purpose=data['purpose'],
                used_at__isnull=True,
            ).latest('created_at')
        except OTPVerification.DoesNotExist:
            raise serializers.ValidationError({'code': 'No active OTP found.'})

        otp.attempt_count += 1
        otp.save(update_fields=['attempt_count'])

        if not otp.is_valid:
            raise serializers.ValidationError({'code': 'OTP has expired or too many attempts.'})

        if otp.code != data['code']:
            raise serializers.ValidationError({'code': 'Invalid OTP code.'})

        otp.mark_used()
        data['otp'] = otp
        return data


# ─── Password ─────────────────────────────────────────────────
class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=10, write_only=True)

    def validate_current_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            self.user = User.objects.get(email=value.lower())
        except User.DoesNotExist:
            pass  # Don't reveal if email exists
        return value.lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(min_length=10)

    def validate(self, data):
        try:
            user = User.objects.get(email=data['email'].lower())
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'Invalid request.'})

        try:
            otp = OTPVerification.objects.filter(
                user=user,
                purpose=OTPVerification.Purpose.PASSWORD_RESET,
                used_at__isnull=True,
            ).latest('created_at')
        except OTPVerification.DoesNotExist:
            raise serializers.ValidationError({'otp_code': 'No active reset code.'})

        if not otp.is_valid or otp.code != data['otp_code']:
            raise serializers.ValidationError({'otp_code': 'Invalid or expired code.'})

        otp.mark_used()
        data['user'] = user
        return data

    def save(self):
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password'])
        user.failed_login_count = 0
        user.locked_until = None
        user.save(update_fields=['password', 'failed_login_count', 'locked_until'])
