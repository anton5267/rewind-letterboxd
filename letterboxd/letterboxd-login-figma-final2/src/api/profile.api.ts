import api from "./axios";
import type { MoviePage } from "./search.api";

export const getProfile = () => api.get("/profile/me");

export const updateProfile = (data: { displayName?: string; avatarUrl?: string }) =>
  api.patch("/profile/me", data);

export const changePassword = (currentPassword: string, newPassword: string) =>
  api.put("/profile/me/password", { currentPassword, newPassword });

export type ProfileCollection = "watched" | "watchlist" | "favorites";

export const getProfileCollection = (collection: ProfileCollection, page: number) =>
  api.get<MoviePage>(`/profile/me/${collection}`, { params: { page, size: 12 } });
