from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser  
from rest_framework.filters import SearchFilter

from .models import AuditLog
from .serializers import AuditLogSerializer
from .permissions import IsAuditAdmin
from .utils.pagination import AuditLimitOffsetPagination

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("user").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuditAdmin]
    pagination_class = AuditLimitOffsetPagination

    filter_backends = [SearchFilter]

    search_fields = [
        "user__email",
        "user__full_name",
        "target_type",
    ]

    ordering_fields = ["timestamp"]