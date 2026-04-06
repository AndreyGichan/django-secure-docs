import { API } from "./index"

export const getAuditLogs = (params?: any) =>
  API.get("audit/", { params })