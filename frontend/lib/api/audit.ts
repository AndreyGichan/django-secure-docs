import { API } from "./index"

export const getAuditLogs = (params?: any) =>
  API.get("audit/", { params })

export const getAuditActionCounts = (params?: any) =>
  API.get("audit/action_counts/", { params })

export const getUserWeekActivity = () =>
  API.get("audit/user_week_activity/")