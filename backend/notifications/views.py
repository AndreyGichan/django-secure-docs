from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self): # type: ignore
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=["patch"])
    def mark_read(self, request, pk=None):

        notification = self.get_object()
        notification.is_read = True
        notification.save()

        return Response({"status": "ok"})
    
    @action(detail=False, methods=["patch"])
    def mark_all_read(self, request):

        self.get_queryset().update(is_read=True)

        return Response({"status": "ok"})