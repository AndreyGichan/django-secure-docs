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

export const getDailyActivity = () =>
    API.get("reports/daily_activity/")

export const getSuspiciousActivity = () =>
    API.get("reports/suspicious_activity/")

export const getCollaborationIndex = () =>
    API.get("reports/collaboration_index/")