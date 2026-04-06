from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    target_name = serializers.SerializerMethodField()

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
            'target_name',
            'timestamp',
            'old_data',
            'new_data',
            'ip_address',
        ]

    def get_target_name(self, obj):
        if obj.new_data and 'name' in obj.new_data:
            return obj.new_data['name']
        return ""