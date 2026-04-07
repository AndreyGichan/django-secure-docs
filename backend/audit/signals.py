from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver
from audit.utils.audit import log_action
from config.constants import AuditAction
from audit.utils.request import get_client_ip


@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    log_action(
        user=user,
        action=AuditAction.LOGIN,
        target_type="User",
        target_id=user.id,
        ip_address=get_client_ip(request),
    )


@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    if user:
        log_action(
            user=user,
            action=AuditAction.LOGOUT,
            target_type="User",
            target_id=user.id,
            ip_address=get_client_ip(request),
        )