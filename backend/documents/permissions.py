from rest_framework.permissions import BasePermission
from .models import DocumentAccess
from django.utils import timezone


class IsOwnerOrHasAccess(BasePermission):
    def has_object_permission(self, request, view, obj): # type: ignore
        user = request.user

        if obj.owner == user:
            return True

        access = DocumentAccess.objects.filter(
            document=obj,
            user=user,
            revoked_at__isnull=True
        ).first()

        if not access:
            return False

        if access.expires_at and access.expires_at < timezone.now():
            return False

        if obj.status == "draft":
            return False 

        if obj.status in ["active", "archived"]:
            return True

        return False


class CanEditDocument(BasePermission):
    def has_object_permission(self, request, view, obj): # type: ignore
        user = request.user

        if obj.status == "archived":
            return False

        if obj.status == "draft":
            return obj.owner == user

        if obj.owner == user:
            return True

        access = DocumentAccess.objects.filter(
            document=obj,
            user=user,
            role="editor",
            revoked_at__isnull=True
        ).first()

        if not access:
            return False

        if access.expires_at and access.expires_at < timezone.now():
            return False

        return True
