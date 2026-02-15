from rest_framework import serializers

class TopUsersReportSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    user_email = serializers.EmailField()
    actions_count = serializers.IntegerField()

class DocumentActivityReportSerializer(serializers.Serializer):
    document_id = serializers.UUIDField()
    title = serializers.CharField()
    total_versions = serializers.IntegerField()
    total_downloads = serializers.IntegerField()
    last_accessed = serializers.DateTimeField(allow_null=True)

class DownloadActivityReportSerializer(serializers.Serializer):
    user_id = serializers.UUIDField(allow_null=True)
    user_email = serializers.EmailField(allow_null=True)
    downloads_count = serializers.IntegerField()


class SharingReportSerializer(serializers.Serializer):
    owner_id = serializers.UUIDField()
    owner_email = serializers.EmailField()
    total_shared = serializers.IntegerField()


class RolesReportSerializer(serializers.Serializer):
    role = serializers.CharField()
    users_count = serializers.IntegerField()


class DailyActivityReportSerializer(serializers.Serializer):
    date = serializers.DateField()
    actions_count = serializers.IntegerField()


class SuspiciousActivityReportSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    user_email = serializers.EmailField()
    downloads_count = serializers.IntegerField()

class GraphNodeSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    email = serializers.EmailField()
    type = serializers.CharField()


class GraphEdgeSerializer(serializers.Serializer):
    from_field = serializers.UUIDField(source='from')
    to = serializers.UUIDField()
    type = serializers.CharField()


class CentralitySerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    score = serializers.IntegerField()
