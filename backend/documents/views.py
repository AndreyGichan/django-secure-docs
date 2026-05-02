import base64
import requests
from rest_framework import viewsets, status, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from django.db import models
from django.http import FileResponse
from django.core.files.base import ContentFile
from django.db.models import Count, Q, F
from django.http import HttpResponseRedirect, HttpResponse
from math import ceil
from .models import Document, DocumentVersion, DocumentAccess, DownloadLink
from .serializers import (
    DocumentSerializer,
    DocumentCreateSerializer,
    DocumentVersionSerializer,
    DocumentVersionCreateSerializer,
    ShareDocumentSerializer,
    DownloadLinkSerializer,
)
from .permissions import IsOwnerOrHasAccess, CanEditDocument
from audit.utils.audit import log_action
from config.constants import AuditAction
from audit.utils.request import get_client_ip
from .utils.filter import DocumentFilter
from .utils.pagination import DocumentLimitOffsetPagination
from .utils.file_format import build_encrypted_file_with_header
from config.supabase_utils import upload_to_supabase


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]
    pagination_class = DocumentLimitOffsetPagination

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = DocumentFilter
    search_fields = ["title", "type", "description", "owner__full_name", "owner__email"]
    ordering_fields = [
        "created_at",
        "updated_at",
        "title",
        "status",
        "owner__full_name",
        "shared_with_count",
        "version_number",
    ]
    ordering = ["-updated_at"]

    def get_queryset(self):  # type: ignore
        user = self.request.user

        qs = Document.objects.filter(is_active=True).annotate(
            shared_with_count=Count(
                'access_list',
                filter=Q(access_list__revoked_at__isnull=True) &
                    (Q(access_list__expires_at__isnull=True) | Q(access_list__expires_at__gte=timezone.now())) &
                    ~Q(access_list__user=F('owner'))
            )
        )

        qs = qs.filter(
            Q(owner=user) |
            Q(access_list__user=user, access_list__revoked_at__isnull=True,
            access_list__expires_at__gte=timezone.now()) |
            Q(access_list__user=user, access_list__revoked_at__isnull=True,
            access_list__expires_at__isnull=True)
        ).distinct()

        ordering = self.request.GET.get("ordering")
        if ordering:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by(
                F('owner').desc(nulls_last=True), 
                '-updated_at', 
                '-shared_with_count'
            )

        return qs

    def get_serializer_class(self):  # type: ignore
        if self.action == "create":
            return DocumentCreateSerializer
        return DocumentSerializer

    def get_permissions(self):
        if self.action in ["retrieve", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsOwnerOrHasAccess()]

        if self.action == "upload_version":
            return [IsAuthenticated(), CanEditDocument()]

        return [IsAuthenticated()]
    
    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsAuthenticated, IsOwnerOrHasAccess],
    )
    def versions(self, request, pk=None):
        document = self.get_object()
        versions = document.versions.all()
        serializer = DocumentVersionSerializer(versions, many=True)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, CanEditDocument],
    )
    def upload_version(self, request, pk=None):
        document = self.get_object()
        user = request.user

        serializer = DocumentVersionCreateSerializer(
            data=request.data, context={"request": request, "document": document}
        )

        if serializer.is_valid():
            file = serializer.validated_data["file"]

            encrypted_file_name = f"{file.name}.enc"

            original_bytes = file.read()
            final_bytes = build_encrypted_file_with_header(
                original_bytes,
                document.id
            )
            file_url = upload_to_supabase(final_bytes, file.name, folder=f"documents")
            # encrypted_file = ContentFile(final_bytes, name=encrypted_file_name)

            last_version = document.versions.order_by("-version_number").first()
            new_version_number = last_version.version_number + 1 if last_version else 1

            version_status = "approved" if user == document.owner else "pending"

            version = DocumentVersion.objects.create(
                document=document,
                # file=encrypted_file,
                file=file_url,
                version_number=new_version_number,
                uploaded_by=user,
                status=version_status,
            )

            if version_status == "approved":
                document.current_version = version
                document.save()

            file_size = file.size
            if file_size >= 1024 * 1024:
                document.size = f"{round(file_size / 1024 / 1024, 2)} MB"
            elif file_size >= 1024:
                document.size = f"{round(file_size / 1024, 2)} KB"
            else:
                document.size = f"{file_size} B"
            document.save()

            last_access = DocumentAccess.objects.filter(
                document=document,
                user=user
            ).first()

            if last_access:
                last_access.last_access = timezone.now()
                last_access.save()

            log_action(
                user=user,
                action=AuditAction.UPDATE,
                target_type="DocumentVersion",
                target_id=document.id,
                old_data={
                    "last_version": (
                        last_version.version_number if last_version else None
                    )
                },
                new_data={"new_version": new_version_number, "status": version_status, "name": f"v{new_version_number} ({document.title}.{document.type})",},
                ip_address=get_client_ip(request),
            )

            return Response(
                {"detail": "New version uploaded"}, status=status.HTTP_201_CREATED
            )
        
        # if user != document.owner and not DocumentAccess.objects.filter(
        #     document=document,
        #     user=user,
        #     role="editor",
        #     revoked_at__isnull=True
        # ).exists():
        #     return Response({"detail": "No edit permission"}, status=status.HTTP_403_FORBIDDEN)
        print(serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated],
    )
    def approve_version(self, request, pk=None):
        document = self.get_object()

        if document.owner != request.user:
            return Response(
                {"detail": "Only owner can approve version."},
                status=status.HTTP_403_FORBIDDEN,
            )

        version_id = request.data.get("version_id")
        version = get_object_or_404(DocumentVersion, id=version_id, document_id=pk)

        if version.status != "pending":
            return Response(
                {"detail": "Only pending versions can be approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = version.status
        version.status = "approved"
        version.save()

        document.current_version = version
        document.save()

        log_action(
            user=request.user,
            action=AuditAction.APPROVE,
            target_type="DocumentVersion",
            target_id=version.id,
            old_data={"status": old_status},
            new_data={"status": "approved", "name": f"v{version.version_number} ({document.title}.{document.type})"},
            ip_address=get_client_ip(request),
        )

        return Response({"detail": f"Version {version.version_number} approved"})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def share(self, request, pk=None):
        document = self.get_object()

        if document.owner != request.user:
            return Response(
                {"detail": "Only owner can share document."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ShareDocumentSerializer(
            data=request.data, context={"request": request, "document": document}
        )

        if serializer.is_valid():
            serializer.save()

            log_action(
                user=request.user,
                action=AuditAction.SHARE,
                target_type="Document",
                target_id=document.id,
                old_data=None,
                new_data={
                    "shared_with": str(serializer.validated_data["user_id"]),
                    "role": serializer.validated_data["role"],
                    "name": f"{document.title}.{document.type}"
                },
                ip_address=get_client_ip(request),
            )

            return Response(
                {"detail": "Access granted"}, status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, IsOwnerOrHasAccess],
    )
    def create_download_link(self, request, pk=None):
        document = self.get_object()
        # version = document.versions.first()

        version_id = request.data.get("version_id")  
        if version_id:
            version = get_object_or_404(DocumentVersion, id=version_id, document=document)

            if version.status != "approved" and document.owner != request.user:
                return Response(
                    {"detail": "Version is not approved"}, status=status.HTTP_403_FORBIDDEN
                )
        else:
            # version = document.versions.filter(status="approved").order_by("-version_number").first()
            version = document.current_version

        if not version:
            return Response({"detail": "No approved version available."}, status=status.HTTP_400_BAD_REQUEST)

        expires_at = timezone.now() + timedelta(hours=1)

        link = DownloadLink.objects.create(
            document_version=version, expires_at=expires_at, created_by=request.user
        )

        log_action(
            user=request.user,
            action=AuditAction.CREATE,
            target_type="DownloadLink",
            target_id=link.id,
            old_data=None,
            new_data={
                "document_version_id": str(version.id),
                "expires_at": str(link.expires_at),
                "name": f"{document.title}.{document.type}"
            },
            ip_address=get_client_ip(request),
        )

        serializer = DownloadLinkSerializer(link)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="download/(?P<token>[^/.]+)")
    def download(self, request, token=None):
        link = get_object_or_404(DownloadLink, token=token)

        if link.is_expired():
            return Response(
                {"detail": "Link expired"}, status=status.HTTP_400_BAD_REQUEST
            )
        
        document = link.document_version.document
        user = request.user

        access = DocumentAccess.objects.filter(
            document=document,
            user=user,
            revoked_at__isnull=True
        ).first()

        if access is None:
            return Response({"detail": "No access"}, status=status.HTTP_403_FORBIDDEN)

        if access.role != "editor":
            return Response({"detail": "No download permission"}, status=status.HTTP_403_FORBIDDEN)

        if document.status == "draft" and document.owner != user:
            return Response({"detail": "Only owner can download draft document"}, status=status.HTTP_403_FORBIDDEN)

        file = link.document_version.file

        log_action(
            user=request.user,
            action=AuditAction.DOWNLOAD,
            target_type="DocumentVersion",
            target_id=link.document_version.id,
            old_data=None,
            new_data={"link_token": str(token), "name": f"{document.title}.{document.type}"},
            ip_address=get_client_ip(request),
        )

        # return FileResponse(file.open("rb"), as_attachment=True)
        file_url = link.document_version.file
        resp = requests.get(file_url)
        if resp.status_code != 200:
            return Response({"detail": "File not found"}, status=404)

        file_bytes = resp.content
        file_name = f"{document.title}.enc"  

        response = HttpResponse(file_bytes, content_type="application/octet-stream")
        response['Content-Disposition'] = f'attachment; filename="{file_name}"'
        return response

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsAuthenticated, IsOwnerOrHasAccess],
    )
    def my_dek(self, request, pk=None):
        document = self.get_object()
        access = DocumentAccess.objects.get(document=document, user=request.user)
        encrypted_dek_b64 = base64.b64encode(access.encrypted_dek).decode("utf-8")

        return Response({"encrypted_dek": encrypted_dek_b64})

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, IsOwnerOrHasAccess],
    )
    def archive(self, request, pk=None):
        document = self.get_object()
        document.status = "archived"
        document.save()

        return Response({"detail": "Document archived"})

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsAuthenticated, IsOwnerOrHasAccess],
    )
    def access_list(self, request, pk=None):
        document = self.get_object()

        accesses = (
            DocumentAccess.objects.filter(document=document)
            .exclude(user=document.owner)
            .filter(revoked_at__isnull=True)
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gte=timezone.now()))
            .select_related("user")
        )

        data = []
        for access in accesses:
            data.append(
                {
                    "id": access.id,
                    "user_id": access.user.id,
                    "full_name": access.user.full_name,
                    "email": access.user.email,
                    "role": access.role,
                    "granted_at": access.created_at,
                    "expires_at": access.expires_at,
                }
            )

        return Response(data)

    @action(detail=True, methods=["patch"], url_path="access/(?P<user_id>[^/.]+)")
    def update_access(self, request, pk=None, user_id=None):
        document = self.get_object()
        access = get_object_or_404(DocumentAccess, document=document, user_id=user_id)

        role = request.data.get("role")
        days = request.data.get("days")
        comment = request.data.get("comment")

        if role:
            access.role = role

        if days is not None:
            if days == 0:
                access.expires_at = None
            else:
                access.expires_at = timezone.now() + timedelta(days=int(days))

        if comment is not None:
            access.comment = comment

        access.save()
        return Response({"status": "updated"})

    @action(
        detail=True,
        methods=["post"],
        url_path="revoke/(?P<user_id>[^/.]+)",
        permission_classes=[IsAuthenticated],
    )
    def revoke_access(self, request, pk=None, user_id=None):
        document = self.get_object()

        if document.owner != request.user:
            return Response(
                {"detail": "Only owner can revoke access."},
                status=status.HTTP_403_FORBIDDEN,
            )

        access = get_object_or_404(
            DocumentAccess,
            document=document,
            user_id=user_id,
        )

        access.revoked_at = timezone.now()
        access.save()

        return Response({"detail": "Access revoked"})
    
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def set_current_version(self, request, pk=None):
        document = self.get_object()

        if document.owner != request.user:
            return Response({"detail": "Only owner can change version"}, status=status.HTTP_403_FORBIDDEN)

        version_id = request.data.get("version_id")

        version = get_object_or_404(
            DocumentVersion,
            id=version_id,
            document=document,
            status="approved"
        )

        document.current_version = version
        document.save()

        return Response({
            "detail": f"Current version set to v{version.version_number}"
        })


    def destroy(self, request, *args, **kwargs):
        document = self.get_object()

        log_action(
            user=request.user,
            action=AuditAction.DELETE,
            target_type="Document",
            target_id=document.id,
            old_data={
                "title": document.title,
                "status": document.status
            },
            new_data={"name": f"{document.title}.{document.type}"},
            ip_address=get_client_ip(request),
        )

        document.is_active = False
        document.save()

        return Response(status=status.HTTP_204_NO_CONTENT)


    @action(detail=False, methods=["get"], url_path="expiring-access")
    def expiring_access(self, request):
        user = request.user
        now = timezone.now()
        soon = now + timedelta(days=30)

        accesses = (
            DocumentAccess.objects
            .filter(user=user, revoked_at__isnull=True)
            .filter(expires_at__isnull=False)
            .filter(expires_at__lte=soon, expires_at__gte=now)
            .select_related("document", "document__owner")
        )

        data = []
        for access in accesses:
            delta = access.expires_at - now  # type: ignore
            total_seconds = delta.total_seconds()

            if total_seconds >= 86400:
                expires_in = ceil(total_seconds / 86400)
                unit = "days"
            else:
                expires_in = ceil(total_seconds / 3600)
                unit = "hours"

            data.append({
                "document_id": access.document.id,
                "title": access.document.title,
                "type": access.document.type,
                "owner_name": access.document.owner.full_name,
                "role": access.role,
                "expires_in": expires_in,
                "expires_unit": unit,
            })

        return Response(data)