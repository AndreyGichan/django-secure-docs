import django_filters
from .models import AuditLog


class AuditLogFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(
        field_name="timestamp",
        lookup_expr="date__gte"
    )
    date_to = django_filters.DateFilter(
        field_name="timestamp",
        lookup_expr="date__lte"
    )

    class Meta:
        model = AuditLog
        fields = ["action"]