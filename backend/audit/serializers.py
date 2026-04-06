from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'user',
            'user_name',
            'user_email',
            'action',
            'target_type',
            'target_id',
            'timestamp',
            'old_data',
            'new_data',
            'ip_address',
        ]