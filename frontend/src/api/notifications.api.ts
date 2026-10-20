import api from "./axios";
import type { Page } from "./types";

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

export type NotificationPage = Page<NotificationItem>;

export interface NotificationPreferences {
  followsEnabled: boolean;
  reviewLikesEnabled: boolean;
}

export const getNotifications = (page = 0, size = 20) =>
  api.get<NotificationPage>("/notifications", { params: { page, size } });

export const getUnreadNotificationCount = () =>
  api.get<{ count: number }>("/notifications/unread-count");

export const markNotificationRead = (id: number) =>
  api.post<void>(`/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  api.post<void>("/notifications/read-all");

export const getNotificationPreferences = () =>
  api.get<NotificationPreferences>("/notifications/preferences");

export const updateNotificationPreferences = (preferences: NotificationPreferences) =>
  api.put<NotificationPreferences>("/notifications/preferences", preferences);
