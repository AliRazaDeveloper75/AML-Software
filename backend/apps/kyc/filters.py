import django_filters
from .models import Customer


class CustomerFilter(django_filters.FilterSet):
    customer_type = django_filters.ChoiceFilter(choices=Customer.CustomerType.choices)
    kyc_status = django_filters.MultipleChoiceFilter(choices=Customer.KYCStatus.choices)
    risk_level = django_filters.MultipleChoiceFilter(choices=Customer.RiskLevel.choices)
    is_pep = django_filters.BooleanFilter()
    is_sanctioned = django_filters.BooleanFilter()
    requires_edd = django_filters.BooleanFilter()
    nationality = django_filters.CharFilter(lookup_expr='iexact')
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='date__lte')
    search = django_filters.CharFilter(method='search_filter')

    class Meta:
        model = Customer
        fields = ['customer_type', 'kyc_status', 'risk_level', 'is_pep', 'is_sanctioned']

    def search_filter(self, queryset, name, value):
        from django.db.models import Q
        return queryset.filter(
            Q(first_name__icontains=value) |
            Q(last_name__icontains=value) |
            Q(company_name__icontains=value) |
            Q(email__icontains=value) |
            Q(emirates_id__icontains=value) |
            Q(trade_license_no__icontains=value)
        )
