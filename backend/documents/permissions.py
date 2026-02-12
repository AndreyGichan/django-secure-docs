from rest_framework.permissions import BasePermission
from .models import DocumentAccess


class IsOwnerOrHasAccess(BasePermission):

    def has_object_permission(self, request, view, obj): # type: ignore
        # owner всегда имеет доступ
        if obj.owner == request.user:
            return True

        # если есть запись в DocumentAccess
        return DocumentAccess.objects.filter(
            document=obj,
            user=request.user
        ).exists()


class CanEditDocument(BasePermission):

    def has_object_permission(self, request, view, obj): # type: ignore
        # owner
        if obj.owner == request.user:
            return True

        # editor
        return DocumentAccess.objects.filter(
            document=obj,
            user=request.user,
            role='editor'
        ).exists()
