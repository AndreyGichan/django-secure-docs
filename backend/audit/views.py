from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated  
from rest_framework.filters import SearchFilter
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from datetime import timedelta
from django.utils import timezone

from .models import AuditLog
from .serializers import AuditLogSerializer
from .permissions import IsAuditAdmin
from .utils.pagination import AuditLimitOffsetPagination
from .filters import AuditLogFilter
from config.constants import AuditAction

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("user").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = AuditLimitOffsetPagination

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = AuditLogFilter
    search_fields = ["user__email", "user__full_name", "target_type"]
    ordering_fields = ["timestamp"]


    def get_queryset(self):  # type: ignore
        user = self.request.user

        qs = AuditLog.objects.select_related("user")

        if getattr(user, "role", None) == "admin":
            return qs.all()

        return qs.filter(user=user).exclude(
            action__in=[AuditAction.LOGIN, AuditAction.LOGOUT]
    )
    

    @action(detail=False, methods=['get'])
    def action_counts(self, request):
        queryset = self.filter_queryset(self.get_queryset())  
        counts = queryset.values('action').annotate(count=Count('id'))
        return Response({item['action']: item['count'] for item in counts})
    
    @action(detail=False, methods=["get"])
    def user_week_activity(self, request):
        user = request.user
        today = timezone.now().date()
        start_date = today - timedelta(days=6)

        qs = self.get_queryset().filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=today,
            user=user
        )

        data = (
            qs.annotate(date=TruncDate("timestamp"))
            .values("date")
            .annotate(
                document_actions=Count(
                    "id",
                    filter=~Q(action=AuditAction.DOWNLOAD)
                ),
                downloads=Count(
                    "id",
                    filter=Q(action=AuditAction.DOWNLOAD)
                ),
            )
            .order_by("date")
        )

        return Response(data)