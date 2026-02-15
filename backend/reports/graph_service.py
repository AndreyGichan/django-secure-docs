from collections import defaultdict
from audit.models import AuditLog
from documents.models import Document, DocumentAccess


class GraphAnalyticsService:

    @staticmethod
    def document_sharing_graph(document_id):
        document = Document.objects.get(id=document_id)

        nodes = {}
        edges = []

        owner = document.owner
        nodes[str(owner.id)] = {
            "id": str(owner.id),
            "email": owner.email,
            "type": "owner"
        }

        accesses = DocumentAccess.objects.filter(document=document)

        for access in accesses:
            user = access.user
            nodes[str(user.id)] = {
                "id": str(user.id),
                "email": user.email,
                "type": access.role
            }

        shares = AuditLog.objects.filter(
            action="SHARE",
            target_type="Document",
            target_id=document.id
        )

        for share in shares:
            from_user = share.user
            shared_with = share.new_data.get("shared_with") if share.new_data else None

            if from_user and shared_with:
                edges.append({
                    "from": str(from_user.id),
                    "to": str(shared_with),
                    "type": "SHARE"
                })

        return {
            "nodes": list(nodes.values()),
            "edges": edges
        }

    @staticmethod
    def user_centrality():
        centrality = defaultdict(int)

        shares = AuditLog.objects.filter(action="SHARE")

        for share in shares:
            if share.user:
                centrality[str(share.user.id)] += 1

            if share.new_data and share.new_data.get("shared_with"):
                centrality[str(share.new_data["shared_with"])] += 1

        result = []

        for user_id, score in centrality.items():
            result.append({
                "user_id": user_id,
                "score": score
            })

        result.sort(key=lambda x: x["score"], reverse=True)

        return result
