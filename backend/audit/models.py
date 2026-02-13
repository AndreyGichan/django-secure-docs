import uuid
from django.db import models
from django.conf import settings
from config.constants import AuditAction

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=AuditAction.choices)
    target_type = models.CharField(max_length=50, blank=True, null=True)  
    target_id = models.UUIDField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    old_data = models.JSONField(blank=True, null=True)
    new_data = models.JSONField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)


    class Meta:
        ordering = ['-timestamp']
        indexes = [
        models.Index(fields=['user']),
        models.Index(fields=['action']),
        models.Index(fields=['timestamp']),
        models.Index(fields=['target_type']),
        models.Index(fields=['user', 'timestamp']),
    ]

    def __str__(self):
        return f"{self.timestamp} | {self.user} | {self.action}"
