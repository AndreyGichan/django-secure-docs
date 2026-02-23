from django.contrib import admin
from .models import Document, DocumentVersion, DocumentAccess, DownloadLink


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "owner",
        "status",
        "type",
        "size",
        "shared_with",
        "is_active",
        "created_at",
        "updated_at",
    )
    list_filter = ("is_active", "created_at", "updated_at")
    search_fields = ("title", "owner__email", "description")


@admin.register(DocumentVersion)
class DocumentVersionAdmin(admin.ModelAdmin):
    list_display = ("id", "document", "version_number", "uploaded_by", "uploaded_at")
    list_filter = ("uploaded_at",)
    search_fields = ("document__title", "uploaded_by__email")


@admin.register(DocumentAccess)
class DocumentAccessAdmin(admin.ModelAdmin):
    list_display = (
        "document",
        "user",
        "role",
        "expires_at",
        "revoked_at",
        "is_active_status",
    )

    list_filter = ("role", "expires_at", "revoked_at")
    search_fields = ("document__title", "user__email")

    def is_active_status(self, obj):
        return obj.is_active

    is_active_status.boolean = True # type: ignore
    is_active_status.short_description = "Active" # type: ignore


@admin.register(DownloadLink)
class DownloadLinkAdmin(admin.ModelAdmin):
    list_display = (
        "document_version",
        "token",
        "expires_at",
        "created_by",
        "created_at",
    )
    list_filter = ("expires_at", "created_at")
    search_fields = ("document_version__document__title", "created_by__email")
