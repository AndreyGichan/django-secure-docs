from audit.models import AuditLog

def log_action(user, action, target_type=None, target_id=None,  old_data=None, new_data=None, ip_address=None):
    AuditLog.objects.create(
        user=user,
        action=action,
        target_type=target_type,
        target_id=target_id,
        old_data=old_data,
        new_data=new_data,
        ip_address=ip_address
    )