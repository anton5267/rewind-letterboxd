import api from "./axios";

export interface CurrentUser {
  id: number;
  username: string;
  role: string;
}

export const getCurrentUser = () => api.get<CurrentUser>("/users/me");

export const login = (email: string, password: string) =>
  api.post<void>("/auth/login", { email: email.trim(), password });

export const register = (
  email: string,
  password: string,
  username: string
) =>
  api.post<void>("/auth/register", { email: email.trim(), password, username: username.trim() });

export const forgotPassword = (email: string) =>
  api.post<void>("/auth/forgot-password", { email: email.trim() });

export const resetPassword = (token: string, newPassword: string) =>
  api.post<void>("/auth/reset-password", { token, newPassword });

export const logout = () => api.post<void>("/auth/logout");
