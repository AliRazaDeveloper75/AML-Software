from rest_framework.response import Response
from rest_framework import status


class TenantQuerysetMixin:
    """Automatically filters querysets to the requesting user's organization."""
    def get_queryset(self):
        qs = super().get_queryset()
        if hasattr(self.request, 'user') and self.request.user.is_authenticated:
            return qs.filter(organization=self.request.user.organization)
        return qs.none()


class SuccessResponseMixin:
    """Wraps serialized responses in a consistent success envelope."""
    def success_response(self, data=None, message='', status_code=status.HTTP_200_OK):
        return Response({'success': True, 'message': message, 'data': data}, status=status_code)

    def created_response(self, data=None, message='Created successfully.'):
        return self.success_response(data, message, status.HTTP_201_CREATED)


class OrganizationCreateMixin:
    """Auto-injects the request user's organization on object creation."""
    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)
