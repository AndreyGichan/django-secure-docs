import base64
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from django.db import models
from django.http import FileResponse
from io import BytesIO

from .models import Document, DocumentVersion, DocumentAccess, DownloadLink
from .serializers import (
    DocumentSerializer,
    DocumentCreateSerializer,
    DocumentVersionSerializer,
    DocumentVersionCreateSerializer,
    ShareDocumentSerializer,
    DownloadLinkSerializer
)
from .permissions import IsOwnerOrHasAccess, CanEditDocument
from .utils.crypto import decrypt_dek_for_user, decrypt_file

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]

    def get_queryset(self): # type: ignore
        user = self.request.user

        return Document.objects.filter(
            is_active=True
        ).filter(
            models.Q(owner=user) |
            models.Q(access_list__user=user)
        ).distinct()
    
    def get_serializer_class(self): # type: ignore
        if self.action == 'create':
            return DocumentCreateSerializer
        return DocumentSerializer
    
    def get_permissions(self):
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOwnerOrHasAccess()]
        return [IsAuthenticated()]

    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsOwnerOrHasAccess])
    def versions(self, request, pk=None):
        document = self.get_object()
        versions = document.versions.all()
        serializer = DocumentVersionSerializer(versions, many=True)
        return Response(serializer.data)
    

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanEditDocument])
    def upload_version(self, request, pk=None):
        document = self.get_object()

        serializer = DocumentVersionCreateSerializer(
            data=request.data,
            context={'request': request, 'document': document}
        )

        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "New version uploaded"}, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def share(self, request, pk=None):
        document = self.get_object()

        if document.owner != request.user:
            return Response(
                {"detail": "Only owner can share document."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ShareDocumentSerializer(
            data=request.data,
            context={'request': request, 'document': document}
        )

        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "Access granted"}, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsOwnerOrHasAccess])
    def create_download_link(self, request, pk=None):
        document = self.get_object()
        version = document.versions.first()

        expires_at = timezone.now() + timedelta(hours=1)

        link = DownloadLink.objects.create(
            document_version=version,
            expires_at=expires_at,
            created_by=request.user
        )

        serializer = DownloadLinkSerializer(link)
        return Response(serializer.data)
    

    @action(detail=False, methods=['get'], url_path='download/(?P<token>[^/.]+)')
    def download(self, request, token=None):
        link = get_object_or_404(DownloadLink, token=token)

        if link.is_expired():
            return Response({"detail": "Link expired"}, status=status.HTTP_400_BAD_REQUEST)

        file = link.document_version.file
        return FileResponse(file.open('rb'), as_attachment=True)
    

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsOwnerOrHasAccess])
    def my_dek(self, request, pk=None):
        document = self.get_object()

        access = DocumentAccess.objects.get(
            document=document,
            user=request.user
        )

        encoded_dek = base64.b64encode(access.encrypted_dek).decode('utf-8')

        return Response({
            "encrypted_dek": encoded_dek
        })


    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsOwnerOrHasAccess])
    def decrypt(self, request, pk=None):
        document = self.get_object()

        access = DocumentAccess.objects.get(
            document=document,
            user=request.user
        )

        dek = decrypt_dek_for_user(
            access.encrypted_dek,
            request.user.private_key.encode()
        )

        version = document.versions.first()
        encrypted_bytes = version.file.read()
        decrypted_bytes = decrypt_file(encrypted_bytes, dek)

        file_like = BytesIO(decrypted_bytes)

        response = FileResponse(
            file_like,
            as_attachment=True,
            filename=version.file.name.replace('.enc', '')
        )
        return response






