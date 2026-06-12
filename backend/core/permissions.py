from rest_framework.permissions import BasePermission, SAFE_METHODS


# ─── Permission Constants ─────────────────────────────────────
class Perm:
    # KYC
    KYC_READ = 'kyc:read'
    KYC_WRITE = 'kyc:write'
    KYC_DELETE = 'kyc:delete'
    KYC_APPROVE = 'kyc:approve'

    # AML
    AML_READ = 'aml:read'
    AML_WRITE = 'aml:write'
    AML_RESOLVE = 'aml:resolve'
    AML_SCREEN = 'aml:screen'

    # Accounting
    ACCOUNTING_READ = 'accounting:read'
    ACCOUNTING_WRITE = 'accounting:write'

    # Tax
    TAX_READ = 'tax:read'
    TAX_WRITE = 'tax:write'
    TAX_FILE = 'tax:file'

    # Monitoring
    MONITORING_READ = 'monitoring:read'
    MONITORING_CONFIGURE = 'monitoring:configure'

    # Reports
    REPORTS_READ = 'reports:read'
    REPORTS_GENERATE = 'reports:generate'
    REPORTS_SCHEDULE = 'reports:schedule'

    # Users
    USERS_READ = 'users:read'
    USERS_WRITE = 'users:write'
    USERS_DELETE = 'users:delete'
    # Aliases used in views
    USER_READ = 'users:read'
    USER_MANAGE = 'users:write'

    # Organization
    ORG_READ = 'org:read'
    ORG_MANAGE = 'org:manage'

    # Billing
    BILLING_READ = 'billing:read'
    BILLING_MANAGE = 'billing:manage'

    # Reports
    REPORTS_VIEW = 'reports:read'

    # Audit
    AUDIT_READ = 'audit:read'

    # Settings
    SETTINGS_READ = 'settings:read'
    SETTINGS_WRITE = 'settings:write'


# Role permission maps
ROLE_PERMISSIONS = {
    'owner': [v for v in vars(Perm).values() if isinstance(v, str) and ':' in v],  # All permissions
    'admin': [
        Perm.KYC_READ, Perm.KYC_WRITE, Perm.KYC_DELETE, Perm.KYC_APPROVE,
        Perm.AML_READ, Perm.AML_WRITE, Perm.AML_RESOLVE, Perm.AML_SCREEN,
        Perm.ACCOUNTING_READ, Perm.ACCOUNTING_WRITE,
        Perm.TAX_READ, Perm.TAX_WRITE, Perm.TAX_FILE,
        Perm.MONITORING_READ, Perm.MONITORING_CONFIGURE,
        Perm.REPORTS_READ, Perm.REPORTS_GENERATE, Perm.REPORTS_SCHEDULE, Perm.REPORTS_VIEW,
        Perm.USERS_READ, Perm.USERS_WRITE, Perm.USER_READ, Perm.USER_MANAGE,
        Perm.BILLING_READ, Perm.BILLING_MANAGE,
        Perm.ORG_READ, Perm.ORG_MANAGE,
        Perm.AUDIT_READ,
        Perm.SETTINGS_READ, Perm.SETTINGS_WRITE,
    ],
    'compliance_officer': [
        Perm.KYC_READ, Perm.KYC_WRITE, Perm.KYC_APPROVE,
        Perm.AML_READ, Perm.AML_WRITE, Perm.AML_RESOLVE, Perm.AML_SCREEN,
        Perm.MONITORING_READ, Perm.MONITORING_CONFIGURE,
        Perm.REPORTS_READ, Perm.REPORTS_GENERATE, Perm.REPORTS_VIEW,
        Perm.AUDIT_READ, Perm.ORG_READ,
    ],
    'accountant': [
        Perm.KYC_READ,
        Perm.ACCOUNTING_READ, Perm.ACCOUNTING_WRITE,
        Perm.TAX_READ, Perm.TAX_WRITE, Perm.TAX_FILE,
        Perm.REPORTS_READ, Perm.REPORTS_GENERATE,
    ],
    'analyst': [
        Perm.KYC_READ,
        Perm.AML_READ, Perm.AML_SCREEN,
        Perm.ACCOUNTING_READ,
        Perm.MONITORING_READ,
        Perm.REPORTS_READ,
    ],
    'viewer': [
        Perm.KYC_READ, Perm.AML_READ, Perm.ACCOUNTING_READ,
        Perm.TAX_READ, Perm.MONITORING_READ, Perm.REPORTS_READ,
    ],
}


class HasPermission(BasePermission):
    """Generic permission check against JWT payload permissions list."""
    required_permission = None

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        perms = getattr(request.user, '_permissions', None)
        if perms is None:
            perms = getattr(request.user, 'permissions_list', [])
        return self.required_permission in perms

    @classmethod
    def for_perm(cls, perm):
        return type(f'Has_{perm.replace(":", "_")}', (cls,), {'required_permission': perm})


class IsSameTenant(BasePermission):
    """Ensures the accessed object belongs to the requesting user's organization."""
    def has_object_permission(self, request, view, obj):
        if not hasattr(obj, 'organization_id'):
            return True
        return obj.organization_id == request.user.organization_id


class IsOwnerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('owner', 'admin')


class IsReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS


class IsAPIKey(BasePermission):
    """Allows access via X-API-Key header for external integrations."""
    def has_permission(self, request, view):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return False
        from apps.users.models import APIKey
        try:
            key_obj = APIKey.objects.select_related('organization').get(
                key=api_key, is_active=True
            )
            request.organization = key_obj.organization
            request.api_key = key_obj
            return True
        except APIKey.DoesNotExist:
            return False
