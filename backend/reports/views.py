from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

from .serializers import (
    TopUsersReportSerializer,
    DocumentActivityReportSerializer,
    DownloadActivityReportSerializer,
    SharingReportSerializer,
    RolesReportSerializer,
    DailyActivityReportSerializer,
    SuspiciousActivityReportSerializer,
    GraphNodeSerializer, 
    GraphEdgeSerializer, 
    CentralitySerializer
)
from .permissions import IsReportAdmin
from .services import ReportsService
from .graph_service import GraphAnalyticsService

class ReportsViewSet(viewsets.ViewSet):
    permission_classes = [IsReportAdmin]

    @action(detail=False, methods=['get'])
    def top_users(self, request):
        data = ReportsService.top_active_users()
        serializer = TopUsersReportSerializer(data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def document_activity(self, request):
        data = ReportsService.document_activity_report()
        serializer = DocumentActivityReportSerializer(data, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def download_activity(self, request):
        data = ReportsService.download_activity()
        return Response(DownloadActivityReportSerializer(data, many=True).data)

    @action(detail=False, methods=['get'])
    def sharing_activity(self, request):
        data = ReportsService.sharing_report()
        return Response(SharingReportSerializer(data, many=True).data)

    @action(detail=False, methods=['get'])
    def roles_distribution(self, request):
        data = ReportsService.roles_report()
        return Response(RolesReportSerializer(data, many=True).data)

    @action(detail=False, methods=['get'])
    def daily_activity(self, request):
        data = ReportsService.daily_activity()
        return Response(DailyActivityReportSerializer(data, many=True).data)

    @action(detail=False, methods=['get'])
    def suspicious_activity(self, request):
        data = ReportsService.suspicious_activity()
        return Response(SuspiciousActivityReportSerializer(data, many=True).data)
    
    @action(detail=False, methods=['get'], url_path='document-graph/(?P<document_id>[^/.]+)')
    def document_graph(self, request, document_id=None):
        graph = GraphAnalyticsService.document_sharing_graph(document_id)
        return Response(graph)

    @action(detail=False, methods=['get'])
    def user_centrality(self, request):
        data = GraphAnalyticsService.user_centrality()
        return Response(CentralitySerializer(data, many=True).data)