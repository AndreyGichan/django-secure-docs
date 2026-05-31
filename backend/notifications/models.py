import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Notification(models.Model):

    TYPE_CHOICES = [
        ("version_added", "Version added"),
        ("access_granted", "Access granted"),
        ("access_revoked", "Access revoked"),
        ("access_expired", "Access expired"),
        ("password_reset_request", "Password reset request"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )

    type = models.CharField(max_length=50, choices=TYPE_CHOICES)

    title = models.CharField(max_length=255)
    message = models.TextField()

    document_id = models.UUIDField(null=True, blank=True)
    document_title = models.CharField(max_length=255, null=True, blank=True)

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.title}"
