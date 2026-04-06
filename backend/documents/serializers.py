import base64
from rest_framework import serializers
from .models import Document, DocumentVersion, DocumentAccess, DownloadLink
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from audit.utils.audit import log_action
from config.constants import AuditAction
from audit.utils.request import get_client_ip
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q
from .utils.file_format import build_encrypted_file_with_header
from config.supabase_utils import upload_to_supabase

User = get_user_model()


class DocumentSerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(source="owner.email", read_only=True)
    owner_full_name = serializers.CharField(source="owner.full_name", read_only=True)

    shared_with = serializers.SerializerMethodField()
    version = serializers.SerializerMethodField()
    my_role = serializers.SerializerMethodField()
    current_version_number = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            "id",
            "title",
            "description",
            "owner",
            "owner_email",
            "owner_full_name",
            "status",
            "type",
            "size",
            "shared_with",
            "version",
            "created_at",
            "updated_at",
            "my_role",
            "current_version_number"
        ]
        read_only_fields = ["owner", "type", "size", "shared_with", "version"]

    def get_shared_with(self, obj):
        return obj.access_list.filter(
            revoked_at__isnull=True
        ).count()

    def get_version(self, obj):
        # latest_version = obj.versions.order_by("-version_number").first()
        # return latest_version.version_number if latest_version else None
        # latest_version = obj.versions.filter(status="approved").order_by("-version_number").first()
        # return latest_version.version_number if latest_version else None
        if obj.current_version:
            return obj.current_version.version_number
        return None

    def get_current_version_number(self, obj):
        if obj.current_version:
            return obj.current_version.version_number
        return None
    
    def get_my_role(self, obj):
        request = self.context.get("request")
        if not request:
            return None

        user = request.user

        if obj.owner == user:
            return "owner"

        access = DocumentAccess.objects.filter(
            document=obj,
            user=user,
            revoked_at__isnull=True
        ).first()

        if not access:
            return None

        if access.expires_at and access.expires_at < timezone.now():
            return None

        return access.role


class DocumentCreateSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)
    encrypted_dek = serializers.CharField(write_only=True)

    class Meta:
        model = Document
        fields = ["title", "description", "file", "encrypted_dek"]

    def create(self, validated_data):
        file = validated_data.pop("file")
        encrypted_dek_base64 = validated_data.pop("encrypted_dek")

        user = self.context["request"].user
        file_name = file.name
        file_size = file.size

        document = Document.objects.create(owner=user, **validated_data)

        document.type = file_name.split(".")[-1].lower()
        if file_size >= 1024 * 1024:
            document.size = f"{round(file_size / 1024 / 1024, 2)} MB"
        elif file_size >= 1024:
            document.size = f"{round(file_size / 1024, 2)} KB"
        else:
            document.size = f"{file_size} B"
        document.save()

        encrypted_file_name = f"{file.name}.enc"
        original_bytes = file.read()
        final_bytes = build_encrypted_file_with_header(original_bytes, document.id)
        # encrypted_file = ContentFile(final_bytes, name=encrypted_file_name)
        file_url = upload_to_supabase(final_bytes, file.name, folder=f"documents")

        version = DocumentVersion.objects.create(
            document=document,
            # file=encrypted_file,
            file=file_url,
            version_number=1,
            uploaded_by=user,
        )
        document.current_version = version # type: ignore
        document.save()

        encrypted_dek = base64.b64decode(encrypted_dek_base64)

        DocumentAccess.objects.create(
            document=document, user=user, role="editor", encrypted_dek=encrypted_dek
        )

        log_action(
            user=user,
            action=AuditAction.CREATE,
            target_type="Document",
            target_id=document.id,
            old_data=None,
            new_data={"title": document.title, "description": document.description, "name": f"{document.title}.{document.type}"},
            ip_address=get_client_ip(self.context["request"]),
        )

        return document


class DocumentVersionSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.EmailField(
        source="uploaded_by.email", read_only=True
    )

    class Meta:
        model = DocumentVersion
        fields = [
            "id",
            "version_number",
            "file",
            "status",
            "uploaded_by",
            "uploaded_by_email",
            "uploaded_at",
        ]
        read_only_fields = ["version_number", "uploaded_by"]


class DocumentVersionCreateSerializer(serializers.ModelSerializer):
    file = serializers.FileField()
    
    class Meta:
        model = DocumentVersion
        fields = ["file"]

    def create(self, validated_data):
        document = self.context["document"]
        user = self.context["request"].user

        last_version = document.versions.first()
        new_version_number = last_version.version_number + 1 if last_version else 1

        return DocumentVersion.objects.create(
            document=document,
            file=validated_data["file"],
            version_number=new_version_number,
            uploaded_by=user,
        )


class DocumentAccessSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = DocumentAccess
        fields = ["id", "user", "user_email", "role"]


class ShareDocumentSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    role = serializers.ChoiceField(choices=DocumentAccess.ROLE_CHOICES)
    days = serializers.IntegerField(required=False, min_value=1)
    encrypted_dek = serializers.CharField()

    def validate(self, attrs):
        document = self.context["document"]
        request_user = self.context["request"].user

        if document.owner != request_user:
            raise serializers.ValidationError("Only owner can share document.")

        return attrs

    def create(self, validated_data):
        document = self.context["document"]
        new_user = User.objects.get(id=validated_data["user_id"])
        owner = document.owner

        encrypted_dek_base64 = validated_data["encrypted_dek"]
        encrypted_dek = base64.b64decode(encrypted_dek_base64)

        days = validated_data.get("days")
        expires_at = timezone.now() + timedelta(days=days) if days else None
        comment = validated_data.get("comment", "")

        access, created = DocumentAccess.objects.update_or_create(
            document=document,
            user=new_user,
            defaults={
                "role": validated_data["role"],
                "encrypted_dek": encrypted_dek,
                "expires_at": expires_at,
                "comment": comment,
            },
        )
        

        log_action(
            user=owner,
            action=AuditAction.SHARE,
            target_type="Document",
            target_id=document.id,
            old_data=None,
            new_data={
                "shared_with": str(new_user.id),  # type: ignore
                "role": validated_data["role"],
                "expires_at": str(expires_at) if expires_at else "unlimited",
                "name": f"{document.title}.{document.type}"
            },
            ip_address=get_client_ip(self.context["request"]),
        )

        return access


class DownloadLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = DownloadLink
        fields = ["id", "token", "expires_at", "created_at"]
        read_only_fields = ["token", "created_at"]
