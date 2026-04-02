from .models import Notification


def create_notification(user, type, title, message, document=None):

    Notification.objects.create(
        user=user,
        type=type,
        title=title,
        message=message,
        document_id=document.id if document else None,
        document_title=document.title if document else None,
    )
