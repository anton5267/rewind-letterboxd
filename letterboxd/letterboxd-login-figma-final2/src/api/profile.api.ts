import api from "./axios";

export const getProfile = () => api.get("/profile/me");

export const updateProfile = (data: { displayName?: string; avatarUrl?: string }) =>
  api.patch("/profile/me", data);

export const changePassword = (currentPassword: string, newPassword: string) =>
  api.put("/profile/me/password", { currentPassword, newPassword });
