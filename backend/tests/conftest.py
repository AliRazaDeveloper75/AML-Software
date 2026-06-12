import pytest
from django.conf import settings


@pytest.fixture(scope='session')
def django_db_setup():
    pass


@pytest.fixture
def organization(db):
    from apps.tenants.models import Organization
    return Organization.objects.create(
        name='Test Organization LLC',
        email='test@testorg.ae',
        plan='professional',
        status='active',
        trade_license_no='TL-TEST-001',
        tax_registration_no='100000000000000',
    )


@pytest.fixture
def owner_user(db, organization):
    from apps.users.models import User, Role
    role, _ = Role.objects.get_or_create(
        organization=organization,
        name='owner',
        defaults={'permissions': ['*'], 'is_system': True}
    )
    return User.objects.create_user(
        email='owner@testorg.ae',
        password='SecurePassword123!',
        first_name='Test',
        last_name='Owner',
        organization=organization,
        role=role,
    )


@pytest.fixture
def api_client(owner_user):
    from rest_framework.test import APIClient
    from rest_framework_simplejwt.tokens import RefreshToken
    client = APIClient()
    refresh = RefreshToken.for_user(owner_user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return client


@pytest.fixture
def individual_customer(db, organization):
    from apps.kyc.models import Customer
    return Customer.objects.create(
        organization=organization,
        customer_type='individual',
        first_name='Ahmed',
        last_name='Al Mansouri',
        email='ahmed@example.ae',
        nationality='AE',
        emirates_id='784-1990-1234567-1',
        kyc_status='pending',
    )


@pytest.fixture
def corporate_customer(db, organization):
    from apps.kyc.models import Customer
    return Customer.objects.create(
        organization=organization,
        customer_type='corporate',
        company_name='Gulf Trading LLC',
        trade_license_no='DED-123456',
        registered_country='AE',
        kyc_status='pending',
    )
