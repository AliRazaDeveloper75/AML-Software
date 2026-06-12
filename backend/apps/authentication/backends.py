from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings
from apps.users.models import User


class JWTCookieAuthentication(JWTAuthentication):
    """
    Reads the access token from Authorization header first,
    falls back to httpOnly cookie for web browser sessions.
    Also attaches org and permissions to request.user.
    """
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            # Try cookie
            raw_token = request.COOKIES.get(settings.JWT_COOKIE_NAME)
            if raw_token:
                try:
                    validated = self.get_validated_token(raw_token)
                    user = self.get_user(validated)
                    if hasattr(validated, 'payload'):
                        user._permissions = validated.payload.get('permissions', [])
                        user._org_id = validated.payload.get('org_id')
                    return user, validated
                except (InvalidToken, TokenError):
                    return None
            return None

        user, token = result
        if hasattr(token, 'payload'):
            user._permissions = token.payload.get('permissions', [])
            user._org_id = token.payload.get('org_id')
        return user, token
