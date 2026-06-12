from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from core.permissions import HasPermission, Perm
from .models import Organization
from .serializers import OrganizationSerializer, OrganizationUpdateSerializer


class OrganizationDetailView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/v1/tenants/organization/ — retrieve current org
    PATCH /api/v1/tenants/organization/ — update org settings
    """
    def get_object(self):
        return self.request.user.organization

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return OrganizationUpdateSerializer
        return OrganizationSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH'):
            return [HasPermission.for_perm(Perm.ORG_MANAGE)()]
        return [HasPermission.for_perm(Perm.ORG_READ)()]

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


@api_view(['GET'])
@permission_classes([HasPermission.for_perm(Perm.ORG_READ)])
def organization_stats(request):
    """Dashboard stats: KYC count, API calls, plan limits."""
    from django.conf import settings
    org = request.user.organization
    plan_config = settings.STRIPE_PLANS.get(org.plan, {})

    return Response({
        'plan': org.plan,
        'status': org.status,
        'kyc': {
            'used': org.kyc_count_this_month,
            'limit': plan_config.get('kyc_limit'),
        },
        'api_calls': {
            'used': org.api_calls_this_month,
            'limit': plan_config.get('api_limit'),
        },
        'users': {
            'limit': plan_config.get('user_limit'),
        },
    })
