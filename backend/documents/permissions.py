from rest_framework.permissions import BasePermission
from .models import DocumentAccess


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

        return DocumentAccess.objects.filter(
            document=obj,
            user=request.user,
            role='editor'
        ).exists()
