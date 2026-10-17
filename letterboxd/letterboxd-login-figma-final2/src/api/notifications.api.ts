import api from "./axios";

export type NotificationType = "FOLLOW" | "REVIEW_LIKED";

export interface NotificationActor {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface NotificationItem {
  id: number;
  type: NotificationType;
  createdAt: string;
  readAt: string | null;
  actor: NotificationActor | null;
  relatedUserId: number | null;
  reviewId: number | null;
}

export interface NotificationPage {
  content: NotificationItem[];
  totalPages: number;
  totalElements: number;
}

export const getNotifications = (page = 0, size = 20) =>
  api.get<NotificationPage>("/notifications", { params: { page, size } });

export const getUnreadNotificationCount = () =>
  api.get<{ count: number }>("/notifications/unread-count");

export const markNotificationRead = (id: number) =>
  api.post(`/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  api.post("/notifications/read-all");
