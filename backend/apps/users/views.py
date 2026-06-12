import secrets
from django.utils import timezone
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import HasPermission, Perm
from core.pagination import StandardPagination
from .models import User, Role, APIKey
from .serializers import (
    UserListSerializer, UserDetailSerializer, UserInviteSerializer,
    UserUpdateSerializer, ChangePasswordSerializer,
    RoleSerializer, APIKeySerializer, APIKeyCreateSerializer, TOTPSetupSerializer,
)


class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RoleSerializer

    def get_queryset(self):
        return Role.objects.filter(organization=self.request.user.organization)

    def get_permissions(self):
        return [HasPermission.for_perm(Perm.USER_READ)()]


class UserViewSet(viewsets.ModelViewSet):
    pagination_class = StandardPagination
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_queryset(self):
        return User.objects.filter(
            organization=self.request.user.organization
        ).select_related('role').order_by('first_name')

    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        if self.action == 'invite':
            return UserInviteSerializer
        if self.action in ('update', 'partial_update'):
            return UserUpdateSerializer
        if self.action == 'change_password':
            return ChangePasswordSerializer
        return UserDetailSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [HasPermission.for_perm(Perm.USER_READ)()]
        if self.action in ('invite', 'update', 'partial_update', 'deactivate', 'reactivate'):
            return [HasPermission.for_perm(Perm.USER_MANAGE)()]
        if self.action == 'destroy':
            return [HasPermission.for_perm(Perm.USER_MANAGE)()]
        return [HasPermission.for_perm(Perm.USER_READ)()]

    @action(detail=False, methods=['post'])
    def invite(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        org = request.user.organization

        # Check user limit
        from django.conf import settings
        plan_config = settings.STRIPE_PLANS.get(org.plan, {})
        user_limit = plan_config.get('user_limit')
        if user_limit is not None:
            current_count = User.objects.filter(organization=org, is_active=True).count()
            if current_count >= user_limit:
                return Response(
                    {'message': f'User limit of {user_limit} reached. Upgrade plan to add more users.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        try:
            role = Role.objects.get(pk=data['role_id'], organization=org)
        except Role.DoesNotExist:
            return Response({'message': 'Role not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Create user with random temp password; send invite email
        temp_password = secrets.token_urlsafe(16)
        user = User.objects.create_user(
            email=data['email'],
            password=temp_password,
            first_name=data['first_name'],
            last_name=data['last_name'],
            organization=org,
            role=role,
            is_active=True,
        )

        from tasks.notification_tasks import send_user_invitation
        send_user_invitation.delay(str(user.id), temp_password)

        return Response(UserDetailSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        if user == request.user:
            return Response({'message': 'Cannot deactivate your own account.'}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response({'message': f'User {user.email} deactivated.'})

    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.failed_login_count = 0
        user.locked_until = None
        user.save(update_fields=['is_active', 'failed_login_count', 'locked_until'])
        return Response({'message': f'User {user.email} reactivated.'})

    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['current_password']):
            return Response({'message': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])
        return Response({'message': 'Password changed successfully.'})


class TOTPSetupView(generics.GenericAPIView):
    """2FA TOTP setup for the authenticated user."""
    serializer_class = TOTPSetupSerializer

    def get(self, request):
        """Return QR provisioning URI and secret."""
        import pyotp
        if request.user.is_2fa_enabled:
            return Response({'message': '2FA is already enabled.'}, status=status.HTTP_400_BAD_REQUEST)

        secret = pyotp.random_base32()
        # Store temporarily in cache (not yet activated)
        from django.core.cache import cache
        cache.set(f'totp_setup_{request.user.id}', secret, timeout=600)

        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(name=request.user.email, issuer_name='Al Merak AML')
        return Response({'secret': secret, 'provisioning_uri': uri})

    def post(self, request):
        """Confirm TOTP code to activate 2FA."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        import pyotp
        from django.core.cache import cache
        secret = cache.get(f'totp_setup_{request.user.id}')
        if not secret:
            return Response({'message': 'Setup session expired. Start over.'}, status=status.HTTP_400_BAD_REQUEST)

        totp = pyotp.TOTP(secret)
        if not totp.verify(serializer.validated_data['code'], valid_window=1):
            return Response({'message': 'Invalid TOTP code.'}, status=status.HTTP_400_BAD_REQUEST)

        request.user.totp_secret = secret
        request.user.is_2fa_enabled = True
        request.user.preferred_2fa = 'totp'
        request.user.save(update_fields=['totp_secret', 'is_2fa_enabled', 'preferred_2fa'])
        cache.delete(f'totp_setup_{request.user.id}')

        return Response({'message': '2FA enabled successfully.'})

    def delete(self, request):
        """Disable 2FA — requires TOTP code or admin override."""
        code = request.data.get('code')
        if not request.user.verify_totp(code):
            return Response({'message': 'Invalid TOTP code.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.is_2fa_enabled = False
        request.user.totp_secret = ''
        request.user.save(update_fields=['is_2fa_enabled', 'totp_secret'])
        return Response({'message': '2FA disabled.'})


class APIKeyViewSet(viewsets.GenericViewSet):
    """API key management for the authenticated user."""
    serializer_class = APIKeySerializer

    def get_queryset(self):
        return APIKey.objects.filter(user=self.request.user, is_active=True)

    def list(self, request):
        keys = self.get_queryset()
        return Response(APIKeySerializer(keys, many=True).data)

    def create(self, request):
        serializer = APIKeyCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance, raw_key = APIKey.generate(
            user=request.user,
            name=serializer.validated_data['name'],
            expires_at=serializer.validated_data.get('expires_at'),
        )
        return Response({
            'id': str(instance.id),
            'name': instance.name,
            'key': raw_key,
            'prefix': instance.prefix,
            'message': 'Store this key securely — it will not be shown again.',
        }, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        try:
            key = APIKey.objects.get(pk=pk, user=request.user)
        except APIKey.DoesNotExist:
            return Response({'message': 'API key not found.'}, status=status.HTTP_404_NOT_FOUND)
        key.is_active = False
        key.save(update_fields=['is_active'])
        return Response({'message': 'API key revoked.'})
