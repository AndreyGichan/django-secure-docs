from rest_framework import viewsets, filters
from rest_framework.permissions import IsAdminUser  
from rest_framework.filters import SearchFilter
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend

from .models import AuditLog
from .serializers import AuditLogSerializer
from .permissions import IsAuditAdmin
from .utils.pagination import AuditLimitOffsetPagination
from .filters import AuditLogFilter

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("user").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuditAdmin]
    pagination_class = AuditLimitOffsetPagination

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = AuditLogFilter
    search_fields = ["user__email", "user__full_name", "target_type"]
    ordering_fields = ["timestamp"]

    @action(detail=False, methods=['get'])
    def action_counts(self, request):
        queryset = self.filter_queryset(self.get_queryset())  
        counts = queryset.values('action').annotate(count=Count('id'))
        return Response({item['action']: item['count'] for item in counts})