import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)    

    def __str__(self):
        return f"{self.title} ({self.owner.email})"


class DocumentVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    document = models.ForeignKey(
        Document,
        related_name='versions',
        on_delete=models.CASCADE
    )

    file = models.FileField(upload_to='documents/')
    version_number = models.PositiveIntegerField()

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-version_number']
        unique_together = ('document', 'version_number')

    def __str__(self):
        return f"{self.document.title} v{self.version_number}"
    

class DownloadLink(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    document_version = models.ForeignKey(
        DocumentVersion,
        on_delete=models.CASCADE,
        related_name='download_links'
    )

    token = models.UUIDField(default=uuid.uuid4, unique=True)
    expires_at = models.DateTimeField()

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.expires_at
    

class DocumentAccess(models.Model):
    ROLE_CHOICES = [
        ('viewer', 'Viewer'),
        ('editor', 'Editor'),
    ]

    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='access_list'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES)

    class Meta:
        unique_together = ('document', 'user')
