import uuid
import time
import logging
import threading

logger = logging.getLogger('core.middleware')
_local = threading.local()


def get_current_request():
    return getattr(_local, 'request', None)


class RequestIDMiddleware:
    """Attach a unique X-Request-ID to every request for distributed tracing."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.request_id = request.headers.get('X-Request-ID', str(uuid.uuid4()))
        _local.request = request
        response = self.get_response(request)
        response['X-Request-ID'] = request.request_id
        return response


class TenantMiddleware:
    """
    Resolves the tenant (Organization) for every authenticated request.
    Sets request.organization so views don't need to repeat this lookup.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.organization = None
        response = self.get_response(request)
        # Organization is attached in JWTCookieAuthentication after auth
        return response


class AuditLogMiddleware:
    """
    Logs write operations (POST/PUT/PATCH/DELETE) to the audit trail.
    Runs after the view so it captures the response status.
    """
    WRITE_METHODS = {'POST', 'PUT', 'PATCH', 'DELETE'}
    SKIP_PATHS = {'/api/schema/', '/api/docs/', '/admin/', '/__debug__/'}

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.monotonic()
        response = self.get_response(request)
        duration_ms = int((time.monotonic() - start) * 1000)

        if (request.method in self.WRITE_METHODS
                and request.user
                and request.user.is_authenticated
                and not any(request.path.startswith(p) for p in self.SKIP_PATHS)):
            self._log_async(request, response, duration_ms)

        return response

    def _log_async(self, request, response, duration_ms):
        try:
            from apps.audit.models import AuditLog
            AuditLog.objects.create(
                organization_id=getattr(request.user, 'organization_id', None),
                user_id=request.user.id if request.user.is_authenticated else None,
                action=request.method,
                path=request.path,
                status_code=response.status_code,
                ip_address=self._get_ip(request),
                user_agent=request.headers.get('User-Agent', '')[:500],
                duration_ms=duration_ms,
                request_id=getattr(request, 'request_id', ''),
            )
        except Exception as exc:
            logger.warning("AuditLog write failed: %s", exc)

    @staticmethod
    def _get_ip(request):
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '')
