import { API } from "./index";

export const getNotifications = () => API.get("notifications/");
export const markNotificationRead = (id: string) => API.patch(`notifications/${id}/mark_read/`);
export const markAllNotificationsRead = () => API.patch(`notifications/mark_all_read/`);