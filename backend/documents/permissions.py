from rest_framework.permissions import BasePermission
from .models import DocumentAccess
from django.utils import timezone


class IsOwnerOrHasAccess(BasePermission):
    def has_object_permission(self, request, view, obj): # type: ignore
        if obj.owner == request.user:
            return True

        return DocumentAccess.objects.filter(
            document=obj,
            user=request.user
        ).exists()


class CanEditDocument(BasePermission):
    def has_object_permission(self, request, view, obj): # type: ignore
        if obj.owner == request.user:
            return True

        access = DocumentAccess.objects.filter(
            document=obj,
            user=request.user,
            role='editor',
            revoked_at__isnull=True,
        ).first()

        if not access:
            return False

        if access.expires_at and access.expires_at < timezone.now(): # type: ignore
            return False

        return True
