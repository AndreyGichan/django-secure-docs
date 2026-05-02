import re
from audit.models import AuditLog
from documents.models import Document, DocumentVersion, DownloadLink, DocumentAccess
from django.db.models import Count, Max, Q
from django.db.models.functions import TruncDate
from datetime import timedelta
from django.utils import timezone
from users.models import User


class ReportsService:

    @staticmethod
    def top_active_users(days=30):
        since = timezone.now() - timedelta(days=days)
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
        docs = Document.objects.prefetch_related("versions")
        report = []

        for doc in docs:
            versions = getattr(doc, "versions")
            total_versions = versions.count()
            total_downloads = DownloadLink.objects.filter(
                document_version__document=doc
            ).count()
            last_accessed = AuditLog.objects.filter(
                target_type="DocumentVersion",
                target_id__in=getattr(doc, "versions").values_list("id", flat=True),
            ).aggregate(last=Max("timestamp"))["last"]

            filename = f"{doc.title}.{doc.type}"

            report.append(
                {
                    "document_id": doc.id,
                    "title": filename,
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
    def user_roles_report():
        queryset = User.objects.values("role").annotate(users_count=Count("id"))

        return [
            {"role": row["role"], "users_count": row["users_count"]} for row in queryset
        ]

    @staticmethod
    def daily_activity(days=30):
        since = timezone.now() - timedelta(days=days)

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
    def suspicious_activity():
        now = timezone.now()

        last_hour = now - timedelta(hours=1)
        last_day = now - timedelta(days=1)

        queryset = (
            AuditLog.objects.filter(action="DOWNLOAD")
            .values("user__id", "user__email")
            .annotate(
                downloads_1h=Count("id", filter=Q(timestamp__gte=last_hour)),
                downloads_24h=Count("id", filter=Q(timestamp__gte=last_day)),
            )
            .filter(Q(downloads_1h__gte=10) | Q(downloads_24h__gte=50))
        )

        return [
            {
                "user_id": r["user__id"],
                "user_email": r["user__email"],
                "downloads_count": r["downloads_24h"],
                "risk": "high" if r["downloads_24h"] > 50 else "medium",
            }
            for r in queryset
        ]

    @staticmethod
    def collaboration_index():
        queryset = (
            AuditLog.objects.values("user__id", "user__email")
            .annotate(
                shares=Count("id", filter=Q(action="SHARE")),
                downloads=Count("id", filter=Q(action="DOWNLOAD")),
                accesses=Count("id"),
            )
            .annotate(
                collaboration_score=(
                    Count("id", filter=Q(action="SHARE")) * 2
                    + Count("id", filter=Q(action="DOWNLOAD")) * 1
                )
            )
            .filter(collaboration_score__gt=0)
            .order_by("-collaboration_score")[:10]
        )

        return [
            {
                "user_id": r["user__id"],
                "user_email": r["user__email"],
                "collaboration_index": r["collaboration_score"],
            }
            for r in queryset
        ]

    @staticmethod
    def dashboard_stats():
        return {
            "documents": Document.objects.count(),
            "users": User.objects.count(),
            "downloads": AuditLog.objects.filter(action="DOWNLOAD").count(),
            "shares": AuditLog.objects.filter(action="SHARE").count(),
            "audit_events": AuditLog.objects.count(),
        }
    
    @staticmethod
    def parse_size_to_bytes(size_str):
        if not size_str:
            return 0

        size_str = size_str.strip().upper()

        match = re.match(r"([\d.]+)\s*(B|KB|MB|GB)?", size_str)
        if not match:
            return 0

        value, unit = match.groups()
        value = float(value)

        if unit == "GB":
            return value * 1024 * 1024 * 1024
        if unit == "MB":
            return value * 1024 * 1024
        if unit == "KB":
            return value * 1024
        return value

    @staticmethod
    def user_dashboard_stats(user):

        docs = Document.objects.filter(
            owner=user,
            is_active=True
        ).prefetch_related("versions")

        total_bytes = 0

        for doc in docs:
            total_bytes += ReportsService.parse_size_to_bytes(doc.size)

            for v in doc.versions.all(): # type: ignore
                pass

        return {
            "my_documents": Document.objects.filter(owner=user, is_active=True).count(),
            "shared_with_me": DocumentAccess.objects.filter(
                user=user,
                document__is_active=True,
                revoked_at__isnull=True,
            )
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()))
            .exclude(document__owner=user)
            .count(),
            "downloads": AuditLog.objects.filter(user=user, action="DOWNLOAD").count(),
            "storage_used_mb": round(total_bytes / (1024 * 1024), 2),
        }
    

   
