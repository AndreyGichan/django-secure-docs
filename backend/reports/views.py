from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated

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
    CentralitySerializer,
    DashboardStatsSerializer
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
    def user_roles_distribution(self, request):
        data = ReportsService.user_roles_report()
        return Response(data)

    @action(detail=False, methods=['get'])
    def daily_activity(self, request):
        days = int(request.query_params.get("days", 30))
        data = ReportsService.daily_activity(days=days)
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
    def collaboration_index(self, request):
        data = ReportsService.collaboration_index()
        return Response(data)
    
    @action(detail=False, methods=['get'], url_path='dashboard-stats')
    def dashboard_stats(self, request):
        data = ReportsService.dashboard_stats()
        return Response(DashboardStatsSerializer(data).data)
    
    @action(detail=False, methods=['get'], url_path='user-dashboard-stats', permission_classes=[IsAuthenticated])
    def user_dashboard_stats(self, request):
        data = ReportsService.user_dashboard_stats(request.user)
        return Response(data)