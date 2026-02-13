from django.db import models


class AuditAction(models.TextChoices):
    CREATE = "CREATE", "Создание"
    UPDATE = "UPDATE", "Обновление"
    DELETE = "DELETE", "Удаление"
    LOGIN = "LOGIN", "Вход"
    LOGOUT = "LOGOUT", "Выход"
    SHARE = "SHARE", "Предоставление доступа"
    APPROVE = "APPROVE", "Подтверждение версии"
    DOWNLOAD = "DOWNLOAD", "Скачивание"
    UPLOAD_VERSION = "UPLOAD_VERSION", "Загрузка новой версии"


ROLE_CHOICES = (
    ("admin", "Admin"),
    ("employee", "Employee"),
    ("external", "External"),
)


STATUS_CHOICES = [
    ('pending', 'Pending approval'),  
    ('approved', 'Approved'),         
]

