import django_filters
from django.db.models import Q
from ..models import Document

class DocumentFilter(django_filters.FilterSet):
    owner = django_filters.CharFilter(method='filter_owner')

    class Meta:
        model = Document
        fields = ['status', 'type', 'owner']

    def filter_owner(self, queryset, name, value):
        user = self.request.user # type: ignore
        value = str(value).lower()

        if value == 'mine':
            return queryset.filter(owner=user)
        elif value == 'others':
            return queryset.filter(access_list__user=user).exclude(owner=user).distinct()
        else:
            try:
                owner_id = int(value)
                return queryset.filter(owner__id=owner_id)
            except ValueError:
                return queryset.none()
