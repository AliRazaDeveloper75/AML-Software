import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404

logger = logging.getLogger('core.exceptions')


class AlMerakException(Exception):
    """Base exception for all custom application errors."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = 'error'
    default_detail = 'An error occurred.'

    def __init__(self, detail=None, code=None):
        self.detail = detail or self.default_detail
        self.code = code or self.default_code


class TenantQuotaExceeded(AlMerakException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_code = 'quota_exceeded'
    default_detail = 'Plan quota exceeded. Please upgrade your subscription.'


class ScreeningInProgress(AlMerakException):
    status_code = status.HTTP_409_CONFLICT
    default_code = 'screening_in_progress'
    default_detail = 'A screening job is already running for this customer.'


class DocumentUploadError(AlMerakException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = 'document_upload_failed'


class TenantNotFound(AlMerakException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = 'tenant_not_found'
    default_detail = 'Organization not found or inactive.'


class InvalidOTP(AlMerakException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = 'invalid_otp'
    default_detail = 'Invalid or expired OTP.'


def custom_exception_handler(exc, context):
    """Standardized error envelope for all API responses."""
    # Let DRF handle standard exceptions first
    response = exception_handler(exc, context)

    # Convert Django ValidationError
    if isinstance(exc, DjangoValidationError):
        response = Response(
            {'success': False, 'code': 'validation_error', 'errors': exc.message_dict if hasattr(exc, 'message_dict') else exc.messages},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Handle 404
    if isinstance(exc, Http404):
        response = Response(
            {'success': False, 'code': 'not_found', 'message': 'Resource not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Wrap custom exceptions
    if isinstance(exc, AlMerakException):
        response = Response(
            {'success': False, 'code': exc.code, 'message': exc.detail},
            status=exc.status_code,
        )

    if response is not None:
        # Normalize all error responses
        if 'success' not in response.data:
            response.data = {
                'success': False,
                'code': response.data.get('code', 'error'),
                'message': _flatten_errors(response.data),
                'errors': response.data,
            }
        request_id = getattr(context.get('request'), 'request_id', '')
        if request_id:
            response['X-Request-ID'] = request_id

    else:
        logger.exception("Unhandled exception in view: %s", exc)
        response = Response(
            {'success': False, 'code': 'server_error', 'message': 'An internal error occurred.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response


def _flatten_errors(data):
    if isinstance(data, dict):
        messages = []
        for key, value in data.items():
            if key in ('detail', 'message', 'non_field_errors'):
                messages.append(str(value) if not isinstance(value, list) else '; '.join(str(v) for v in value))
        return '; '.join(messages) if messages else 'Validation failed.'
    if isinstance(data, list):
        return '; '.join(str(e) for e in data)
    return str(data)
