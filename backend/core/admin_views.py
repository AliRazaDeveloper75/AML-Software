"""
Platform-admin API views — only accessible to is_staff users.
Provides cross-tenant stats, organization management, and user management.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Count, Q, Sum
from django.utils import timezone


class PlatformStatsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        from apps.tenants.models import Organization
        from apps.users.models import User
        from apps.kyc.models import Customer

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        org_qs = Organization.objects.all()
        user_qs = User.objects.filter(is_staff=False)
        customer_qs = Customer.objects.all()

        revenue = 0
        try:
            from apps.billing.models import Invoice
            revenue = Invoice.objects.filter(
                status='paid', paid_at__gte=month_start
            ).aggregate(total=Sum('amount_paid'))['total'] or 0
        except Exception:
            pass

        return Response({
            'success': True,
            'data': {
                'organizations': {
                    'total': org_qs.count(),
                    'active': org_qs.filter(status='active').count(),
                    'trial': org_qs.filter(status='trial').count(),
                    'suspended': org_qs.filter(status='suspended').count(),
                    'new_this_month': org_qs.filter(created_at__gte=month_start).count(),
                },
                'users': {
                    'total': user_qs.count(),
                    'active': user_qs.filter(is_active=True).count(),
                    'new_this_month': user_qs.filter(created_at__gte=month_start).count(),
                },
                'customers': {
                    'total': customer_qs.count(),
                    'verified': customer_qs.filter(kyc_status='verified').count(),
                    'pending': customer_qs.filter(kyc_status='pending').count(),
                },
                'revenue_this_month': float(revenue),
            }
        })


class PlatformOrganizationsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        from apps.tenants.models import Organization
        qs = Organization.objects.annotate(
            user_count=Count('users', filter=Q(users__is_active=True), distinct=True),
            customer_count=Count('customers', distinct=True),
        ).order_by('-created_at')

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(primary_email__icontains=search) |
                Q(trade_license_no__icontains=search)
            )

        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        plan_filter = request.query_params.get('plan')
        if plan_filter:
            qs = qs.filter(plan=plan_filter)

        data = [
            {
                'id': str(org.id),
                'name': org.name,
                'slug': org.slug,
                'primary_email': org.primary_email or '',
                'plan': org.plan,
                'status': org.status,
                'emirate': org.emirate or '',
                'license_type': org.license_type or '',
                'user_count': org.user_count,
                'customer_count': org.customer_count,
                'trial_ends_at': org.trial_ends_at,
                'created_at': org.created_at,
            }
            for org in qs[:200]
        ]
        return Response({'success': True, 'data': data, 'total': len(data)})


class PlatformOrganizationDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, org_id):
        from apps.tenants.models import Organization
        try:
            org = Organization.objects.get(id=org_id)
        except Organization.DoesNotExist:
            return Response({'success': False, 'message': 'Organization not found.'}, status=404)

        allowed_statuses = {s[0] for s in Organization.Status.choices}
        new_status = request.data.get('status')
        if new_status and new_status in allowed_statuses:
            org.status = new_status
            org.save(update_fields=['status', 'updated_at'])

        allowed_plans = {p[0] for p in Organization.Plan.choices}
        new_plan = request.data.get('plan')
        if new_plan and new_plan in allowed_plans:
            org.plan = new_plan
            org.save(update_fields=['plan', 'updated_at'])

        return Response({'success': True, 'message': 'Organization updated.'})


class PlatformUsersView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        from apps.users.models import User
        qs = User.objects.filter(is_staff=False).select_related('organization', 'role').order_by('-id')

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )

        org_filter = request.query_params.get('organization')
        if org_filter:
            qs = qs.filter(organization_id=org_filter)

        role_filter = request.query_params.get('role')
        if role_filter:
            qs = qs.filter(role__name=role_filter)

        data = [
            {
                'id': str(user.id),
                'email': user.email,
                'full_name': user.full_name,
                'phone': user.phone or '',
                'role': user.role.name if user.role else None,
                'organization': {
                    'id': str(user.organization_id),
                    'name': user.organization.name,
                } if user.organization else None,
                'is_active': user.is_active,
                'email_verified': user.email_verified,
                'last_login_at': user.last_login_at,
            }
            for user in qs[:300]
        ]
        return Response({'success': True, 'data': data, 'total': len(data)})


class PlatformUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, user_id):
        from apps.users.models import User
        try:
            user = User.objects.get(id=user_id, is_staff=False)
        except User.DoesNotExist:
            return Response({'success': False, 'message': 'User not found.'}, status=404)

        if 'is_active' in request.data:
            user.is_active = bool(request.data['is_active'])
            user.save(update_fields=['is_active'])

        return Response({'success': True, 'message': 'User updated.'})

    def delete(self, request, user_id):
        from apps.users.models import User
        if str(request.user.id) == str(user_id):
            return Response({'success': False, 'message': 'Cannot delete your own account.'}, status=400)
        try:
            user = User.objects.get(id=user_id, is_staff=False)
        except User.DoesNotExist:
            return Response({'success': False, 'message': 'User not found.'}, status=404)
        user.delete()
        return Response({'success': True, 'message': 'User permanently deleted.'}, status=200)
