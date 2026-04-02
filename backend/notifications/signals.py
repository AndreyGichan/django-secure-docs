from django.db.models.signals import post_save
from django.db.models.signals import post_delete
from django.dispatch import receiver

from documents.models import DocumentVersion
from documents.models import DocumentAccess
from .services import create_notification


@receiver(post_save, sender=DocumentVersion)
def version_added_notification(sender, instance, created, **kwargs):
    if not created:
        return

    document = instance.document
    uploader = instance.uploaded_by

    accesses = DocumentAccess.objects.filter(document=document)

    for access in accesses:
        if access.user == uploader:
            continue

        create_notification(
            user=access.user,
            type="version_added",
            title="Новая версия документа",
            message=f'Добавлена новая версия документа "{document.title}"',
            document=document,
        )


@receiver(post_save, sender=DocumentAccess)
def access_granted_notification(sender, instance, created, **kwargs):

    if created:
        document_owner = instance.document.owner
        if instance.user == document_owner:
            return

        create_notification(
            user=instance.user,
            type="access_granted",
            title="Доступ предоставлен",
            message=f'Вам предоставлен доступ к документу "{instance.document.title}"',
            document=instance.document,
        )


@receiver(post_save, sender=DocumentAccess)
def access_revoked_notification(sender, instance, created, **kwargs):
    if created:
        return

    if instance.revoked_at:
        create_notification(
            user=instance.user,
            type="access_revoked",
            title="Доступ отозван",
            message=f'Доступ к докуенту "{instance.document.title}" был отозван',
            document=instance.document,
        )
