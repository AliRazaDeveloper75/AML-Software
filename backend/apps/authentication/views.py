import random
import string
import logging
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from apps.users.models import User, OTPVerification
from .serializers import (
    OrganizationRegisterSerializer, LoginSerializer,
    TwoFactorSetupSerializer, TwoFactorEnableSerializer,
    OTPVerifySerializer, PasswordChangeSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
)

logger = logging.getLogger('apps.authentication')


def _issue_tokens(user) -> dict:
    """Issue access + refresh tokens with full custom claims."""
    refresh = RefreshToken.for_user(user)
    # Add custom claims
    refresh['email'] = user.email
    refresh['full_name'] = user.full_name
    refresh['org_id'] = str(user.organization_id) if user.organization_id else None
    refresh['org_name'] = user.organization.name if user.organization else None
    refresh['role'] = user.role.name if user.role else None
    refresh['permissions'] = user.permissions_list
    refresh['plan'] = user.organization.plan if user.organization else None
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


def _set_refresh_cookie(response, refresh_token: str):
    response.set_cookie(
        key=settings.JWT_COOKIE_NAME,
        value=refresh_token,
        max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax',
        path='/api/v1/auth/',
    )


def _generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=settings.OTP_LENGTH))


def _create_otp(user, purpose: str) -> OTPVerification:
    # Invalidate existing active OTPs for same purpose
    OTPVerification.objects.filter(
        user=user, purpose=purpose, used_at__isnull=True
    ).update(used_at=timezone.now())

    return OTPVerification.objects.create(
        user=user,
        code=_generate_otp(),
        purpose=purpose,
        expires_at=timezone.now() + timedelta(seconds=settings.OTP_EXPIRY_SECONDS),
    )


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        serializer = OrganizationRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, org = serializer.save()

        # Send email verification OTP
        otp = _create_otp(user, OTPVerification.Purpose.EMAIL_VERIFY)
        from tasks.notification_tasks import send_email_verification
        send_email_verification.delay(str(user.id), otp.code)

        tokens = _issue_tokens(user)
        response = Response({
            'success': True,
            'message': 'Account created. Please verify your email.',
            'data': {
                'access': tokens['access'],
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'full_name': user.full_name,
                    'organization': {'id': str(org.id), 'name': org.name, 'plan': org.plan},
                    'email_verified': user.email_verified,
                    'is_2fa_enabled': user.is_2fa_enabled,
                },
            },
        }, status=status.HTTP_201_CREATED)
        _set_refresh_cookie(response, tokens['refresh'])
        return response


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        # If 2FA is enabled, issue a short-lived temp token instead
        if user.is_2fa_enabled:
            temp_refresh = RefreshToken.for_user(user)
            temp_refresh['is_2fa_pending'] = True
            temp_token = str(temp_refresh)

            # If SMS 2FA, send code now
            if user.preferred_2fa == 'sms' and user.phone:
                otp = _create_otp(user, OTPVerification.Purpose.SMS_2FA)
                from tasks.notification_tasks import send_sms_otp
                send_sms_otp.delay(user.phone, otp.code)

            return Response({
                'success': True,
                'requires_2fa': True,
                'method': user.preferred_2fa,
                'temp_token': temp_token,
            })

        ip = request.META.get('REMOTE_ADDR', '')
        user.record_login_success(ip)
        tokens = _issue_tokens(user)

        response = Response({
            'success': True,
            'data': {
                'access': tokens['access'],
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'full_name': user.full_name,
                    'role': user.role.name if user.role else None,
                    'permissions': user.permissions_list,
                    'is_staff': user.is_staff,
                    'organization': {
                        'id': str(user.organization_id),
                        'name': user.organization.name,
                        'plan': user.organization.plan,
                    } if user.organization else None,
                    'is_2fa_enabled': user.is_2fa_enabled,
                    'email_verified': user.email_verified,
                },
            },
        })
        _set_refresh_cookie(response, tokens['refresh'])
        logger.info("User %s logged in from %s", user.email, ip)
        return response


class TwoFactorVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        temp_token = request.data.get('temp_token')
        code = request.data.get('code', '')
        method = request.data.get('method', 'totp')

        # Validate the temp token
        try:
            refresh = RefreshToken(temp_token)
            if not refresh.payload.get('is_2fa_pending'):
                return Response({'success': False, 'message': 'Invalid token.'}, status=400)
            user_id = refresh.payload.get('user_id')
            user = User.objects.select_related('organization', 'role').get(id=user_id)
        except (TokenError, User.DoesNotExist):
            return Response({'success': False, 'message': 'Invalid or expired session.'}, status=400)

        # Verify code
        if method == 'totp':
            valid = user.verify_totp(code)
        else:  # sms
            try:
                otp = OTPVerification.objects.filter(
                    user=user, purpose=OTPVerification.Purpose.SMS_2FA, used_at__isnull=True
                ).latest('created_at')
                valid = otp.is_valid and otp.code == code
                if valid:
                    otp.mark_used()
            except OTPVerification.DoesNotExist:
                valid = False

        if not valid:
            return Response({'success': False, 'message': 'Invalid 2FA code.'}, status=400)

        ip = request.META.get('REMOTE_ADDR', '')
        user.record_login_success(ip)
        tokens = _issue_tokens(user)

        response = Response({'success': True, 'data': {'access': tokens['access']}})
        _set_refresh_cookie(response, tokens['refresh'])
        return response


class TokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_COOKIE_NAME) or request.data.get('refresh')
        if not refresh_token:
            return Response({'success': False, 'message': 'No refresh token.'}, status=401)
        try:
            refresh = RefreshToken(refresh_token)
            access = str(refresh.access_token)
            new_refresh = str(refresh)
        except TokenError as e:
            return Response({'success': False, 'message': str(e)}, status=401)

        response = Response({'success': True, 'data': {'access': access}})
        _set_refresh_cookie(response, new_refresh)
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_COOKIE_NAME) or request.data.get('refresh')
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass

        response = Response({'success': True, 'message': 'Logged out successfully.'})
        response.delete_cookie(settings.JWT_COOKIE_NAME, path='/api/v1/auth/')
        return response


class TwoFactorSetupView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.totp_secret:
            user.generate_totp_secret()
            user.save(update_fields=['totp_secret'])
        return Response({
            'success': True,
            'data': {
                'totp_uri': user.get_totp_uri(),
                'secret': user.totp_secret,
            }
        })

    def post(self, request):
        serializer = TwoFactorEnableSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'success': True, 'message': '2FA enabled successfully.'})


class OTPVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        purpose = serializer.validated_data['purpose']

        if purpose == OTPVerification.Purpose.EMAIL_VERIFY:
            request.user.email_verified = True
            request.user.email_verified_at = timezone.now()
            request.user.save(update_fields=['email_verified', 'email_verified_at'])

        return Response({'success': True, 'message': 'Verified successfully.'})


class OTPResendView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        purpose = request.data.get('purpose', OTPVerification.Purpose.EMAIL_VERIFY)
        if purpose not in dict(OTPVerification.Purpose.choices):
            return Response({'success': False, 'message': 'Invalid purpose.'}, status=400)

        if purpose == OTPVerification.Purpose.EMAIL_VERIFY and request.user.email_verified:
            return Response({'success': False, 'message': 'Email already verified.'}, status=400)

        otp = _create_otp(request.user, purpose)
        if purpose == OTPVerification.Purpose.EMAIL_VERIFY:
            from tasks.notification_tasks import send_email_verification
            send_email_verification.delay(str(request.user.id), otp.code)

        return Response({'success': True, 'message': 'Verification code resent.'})


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'success': True, 'message': 'Password changed. Please log in again.'})


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            otp = _create_otp(user, OTPVerification.Purpose.PASSWORD_RESET)
            from tasks.notification_tasks import send_password_reset
            send_password_reset.delay(str(user.id), otp.code)
        except User.DoesNotExist:
            pass  # Silent — don't reveal email existence
        return Response({'success': True, 'message': 'If an account exists, a reset code has been sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'success': True, 'message': 'Password reset successfully. Please log in.'})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'success': True,
            'data': {
                'id': str(user.id),
                'email': user.email,
                'full_name': user.full_name,
                'phone': user.phone,
                'avatar_url': user.avatar_url,
                'role': user.role.name if user.role else None,
                'permissions': user.permissions_list,
                'is_staff': user.is_staff,
                'is_2fa_enabled': user.is_2fa_enabled,
                'email_verified': user.email_verified,
                'organization': {
                    'id': str(user.organization_id),
                    'name': user.organization.name,
                    'plan': user.organization.plan,
                    'status': user.organization.status,
                    'trial_ends_at': user.organization.trial_ends_at,
                } if user.organization else None,
            }
        })
