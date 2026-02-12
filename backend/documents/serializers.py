from rest_framework import serializers
from .models import Document, DocumentVersion, DocumentAccess, DownloadLink
from django.contrib.auth import get_user_model

User = get_user_model()


class DocumentSerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(source='owner.email', read_only=True)

    class Meta:
        model = Document
        fields = [
            'id',
            'title',
            'description',
            'owner',
            'owner_email',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['owner']


class DocumentCreateSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)

    class Meta:
        model = Document
        fields = ['title', 'description', 'file']

    def create(self, validated_data):
        file = validated_data.pop('file')
        user = self.context['request'].user

        document = Document.objects.create(
            owner=user,
            **validated_data
        )

        DocumentVersion.objects.create(
            document=document,
            file=file,
            version_number=1,
            uploaded_by=user
        )

        return document


class DocumentVersionSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.EmailField(source='uploaded_by.email', read_only=True)

    class Meta:
        model = DocumentVersion
        fields = [
            'id',
            'version_number',
            'file',
            'uploaded_by',
            'uploaded_by_email',
            'uploaded_at'
        ]
        read_only_fields = ['version_number', 'uploaded_by']


class DocumentVersionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentVersion
        fields = ['file']

    def create(self, validated_data):
        document = self.context['document']
        user = self.context['request'].user

        last_version = document.versions.first()
        new_version_number = last_version.version_number + 1 if last_version else 1

        return DocumentVersion.objects.create(
            document=document,
            file=validated_data['file'],
            version_number=new_version_number,
            uploaded_by=user
        )


class DocumentAccessSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = DocumentAccess
        fields = ['id', 'user', 'user_email', 'role']


class ShareDocumentSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    role = serializers.ChoiceField(choices=DocumentAccess.ROLE_CHOICES)

    def validate(self, attrs):
        document = self.context['document']
        request_user = self.context['request'].user

        if document.owner != request_user:
            raise serializers.ValidationError("Only owner can share document.")

        return attrs

    def create(self, validated_data):
        document = self.context['document']
        user = User.objects.get(id=validated_data['user_id'])

        access, created = DocumentAccess.objects.update_or_create(
            document=document,
            user=user,
            defaults={'role': validated_data['role']}
        )

        return access
    

class DownloadLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = DownloadLink
        fields = ['id', 'token', 'expires_at', 'created_at']
        read_only_fields = ['token', 'created_at']

