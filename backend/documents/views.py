from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from django.db import models

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
            return Response({"detail": "New version uploaded"}, status=201)

        return Response(serializer.errors, status=400)
    

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def share(self, request, pk=None):
        document = self.get_object()

        if document.owner != request.user:
            return Response(
                {"detail": "Only owner can share document."},
                status=403
            )

        serializer = ShareDocumentSerializer(
            data=request.data,
            context={'request': request, 'document': document}
        )

        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "Access granted"}, status=201)

        return Response(serializer.errors, status=400)
    

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





