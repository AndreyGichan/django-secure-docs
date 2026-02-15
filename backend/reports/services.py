from audit.models import AuditLog
from documents.models import Document, DocumentVersion, DownloadLink, DocumentAccess
from django.db.models import Count, Max
from django.db.models.functions import TruncDate
from datetime import datetime, timedelta


class ReportsService:

    @staticmethod
    def top_active_users(days=30):
        since = datetime.now() - timedelta(days=days)
        queryset = (
            AuditLog.objects.filter(timestamp__gte=since)
            .values("user__id", "user__email")
            .annotate(actions_count=Count("id"))
            .order_by("-actions_count")[:10]
        )
        return [
            {
                "user_id": row["user__id"],
                "user_email": row["user__email"],
                "actions_count": row["actions_count"],
            }
            for row in queryset
        ]

    @staticmethod
    def document_activity_report():
        docs = Document.objects.all()
        report = []

        for doc in docs:
            total_versions = getattr(doc, "versions").count()
            total_downloads = DownloadLink.objects.filter(
                document_version__document=doc
            ).count()
            last_accessed = AuditLog.objects.filter(
                target_type="DocumentVersion",
                target_id__in=getattr(doc, "versions").values_list("id", flat=True),
            ).aggregate(last=Max("timestamp"))["last"]

            report.append(
                {
                    "document_id": doc.id,
                    "title": doc.title,
                    "total_versions": total_versions,
                    "total_downloads": total_downloads,
                    "last_accessed": last_accessed,
                }
            )
        return report

    @staticmethod
    def download_activity():
        queryset = (
            AuditLog.objects.filter(action="DOWNLOAD")
            .values("user__id", "user__email")
            .annotate(downloads_count=Count("id"))
            .order_by("-downloads_count")
        )
        return [
            {
                "user_id": row["user__id"],
                "user_email": row["user__email"],
                "downloads_count": row["downloads_count"],
            }
            for row in queryset
        ]

    @staticmethod
    def sharing_report():
        queryset = (
            AuditLog.objects.filter(action="SHARE")
            .values("user__id", "user__email")
            .annotate(total_shared=Count("id"))
            .order_by("-total_shared")
        )
        return [
            {
                "owner_id": row["user__id"],
                "owner_email": row["user__email"],
                "total_shared": row["total_shared"],
            }
            for row in queryset
        ]

    @staticmethod
    def roles_report():
        queryset = DocumentAccess.objects.values("role").annotate(
            users_count=Count("user", distinct=True)
        )
        return [
            {"role": row["role"], "users_count": row["users_count"]} for row in queryset
        ]

    @staticmethod
    def daily_activity(days=30):
        since = datetime.now() - timedelta(days=days)

        queryset = (
            AuditLog.objects.filter(timestamp__gte=since)
            .annotate(date=TruncDate("timestamp"))
            .values("date")
            .annotate(actions_count=Count("id"))
            .order_by("date")
        )

        return [
            {"date": row["date"], "actions_count": row["actions_count"]}
            for row in queryset
        ]

    @staticmethod
    def suspicious_activity(threshold=10, hours=1):
        since = datetime.now() - timedelta(hours=hours)

        queryset = (
            AuditLog.objects.filter(action="DOWNLOAD", timestamp__gte=since)
            .values("user__id", "user__email")
            .annotate(downloads_count=Count("id"))
            .filter(downloads_count__gte=threshold)
        )

        return [
            {
                "user_id": row["user__id"],
                "user_email": row["user__email"],
                "downloads_count": row["downloads_count"],
            }
            for row in queryset
        ]
