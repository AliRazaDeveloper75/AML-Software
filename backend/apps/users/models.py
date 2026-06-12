import pyotp
import secrets
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone
from core.models import TimeStampedModel
from core.utils import hash_sensitive


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required.')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class Role(TimeStampedModel):
    """Custom role with permission array. Each org can have custom roles."""
    organization = models.ForeignKey('tenants.Organization', on_delete=models.CASCADE, related_name='roles')
    name = models.CharField(max_length=50)
    display_name = models.CharField(max_length=100)
    permissions = models.JSONField(default=list)
    is_system = models.BooleanField(default=False, help_text='System roles cannot be deleted.')
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'roles'
        unique_together = ('organization', 'name')

    def __str__(self):
        return f"{self.organization.name} / {self.display_name}"


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """
    Custom user model. Users belong to exactly one Organization (tenant).
    Authentication is email + password (no username).
    """
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'
        INVITED = 'invited', 'Invited'
        LOCKED = 'locked', 'Locked'

    organization = models.ForeignKey(
        'tenants.Organization', on_delete=models.CASCADE,
        related_name='users', null=True, blank=True
    )

    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    avatar_url = models.URLField(blank=True)

    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)

    # 2FA
    is_2fa_enabled = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=32, blank=True)
    preferred_2fa = models.CharField(
        max_length=10,
        choices=[('totp', 'Authenticator App'), ('sms', 'SMS')],
        default='totp'
    )

    # Login tracking
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    failed_login_count = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)

    # Email verification
    email_verified = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(null=True, blank=True)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = UserManager()

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def permissions_list(self):
        if self.role:
            return self.role.permissions
        return []

    def has_perm_code(self, perm: str) -> bool:
        return perm in self.permissions_list

    def generate_totp_secret(self):
        self.totp_secret = pyotp.random_base32()
        return self.totp_secret

    def get_totp_uri(self):
        return pyotp.totp.TOTP(self.totp_secret).provisioning_uri(
            name=self.email, issuer_name='Al Merak AML'
        )

    def verify_totp(self, code: str) -> bool:
        if not self.totp_secret:
            return False
        totp = pyotp.TOTP(self.totp_secret)
        return totp.verify(code, valid_window=1)

    def is_locked(self):
        if self.locked_until and timezone.now() < self.locked_until:
            return True
        return False

    def record_login_success(self, ip: str):
        self.failed_login_count = 0
        self.locked_until = None
        self.last_login_ip = ip
        self.last_login_at = timezone.now()
        self.save(update_fields=['failed_login_count', 'locked_until', 'last_login_ip', 'last_login_at'])

    def record_login_failure(self):
        from datetime import timedelta
        self.failed_login_count += 1
        if self.failed_login_count >= 5:
            self.locked_until = timezone.now() + timedelta(minutes=30)
        self.save(update_fields=['failed_login_count', 'locked_until'])


class OTPVerification(TimeStampedModel):
    """Short-lived OTP codes for email verification, SMS 2FA, password reset."""
    class Purpose(models.TextChoices):
        EMAIL_VERIFY = 'email_verify', 'Email Verification'
        SMS_2FA = 'sms_2fa', 'SMS Two-Factor'
        PASSWORD_RESET = 'password_reset', 'Password Reset'
        PHONE_VERIFY = 'phone_verify', 'Phone Verification'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otp_codes')
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=Purpose.choices)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    attempt_count = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'otp_verifications'
        indexes = [models.Index(fields=['user', 'purpose', 'expires_at'])]

    @property
    def is_valid(self):
        return not self.used_at and timezone.now() < self.expires_at and self.attempt_count < 5

    def mark_used(self):
        self.used_at = timezone.now()
        self.save(update_fields=['used_at'])


class APIKey(TimeStampedModel):
    """API keys for external/programmatic access (scoped to an organization)."""
    organization = models.ForeignKey('tenants.Organization', on_delete=models.CASCADE, related_name='api_keys')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=100)
    key_prefix = models.CharField(max_length=8)  # Shown in UI: 'am_live_AbCd...'
    key_hash = models.CharField(max_length=64, unique=True)  # SHA-256 of full key
    permissions = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'api_keys'

    @classmethod
    def generate(cls, organization, created_by, name, permissions):
        raw_key = f"am_live_{secrets.token_urlsafe(32)}"
        return cls.objects.create(
            organization=organization,
            created_by=created_by,
            name=name,
            key_prefix=raw_key[:12],
            key_hash=hash_sensitive(raw_key),
            permissions=permissions,
        ), raw_key

    def matches(self, raw_key: str) -> bool:
        return self.key_hash == hash_sensitive(raw_key)
