import { API } from "./index"

export const getTopUsers = () =>
    API.get("reports/top_users/")

export const getDocumentActivity = () =>
    API.get("reports/document_activity/")

export const getDownloadActivity = () =>
    API.get("reports/download_activity/")

export const getSharingActivity = () =>
    API.get("reports/sharing_activity/")

export const getRolesDistribution = () =>
    API.get("reports/roles_distribution/")

export const getUserRolesDistribution = () =>
    API.get("reports/user_roles_distribution/")

export const getDailyActivity = (days?: number) =>
    API.get("reports/daily_activity/", {
        params: { days }
    })

export const getSuspiciousActivity = () =>
    API.get("reports/suspicious_activity/")

export const getCollaborationIndex = () =>
    API.get("reports/collaboration_index/")

export const getDashboardStats = () =>
    API.get("reports/dashboard-stats/")