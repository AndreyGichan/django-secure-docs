from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    readonly_fields = [f.name for f in AuditLog._meta.fields]
    list_display = ['timestamp', 'user', 'action', 'target_type', 'target_id']
    ordering = ['-timestamp']
