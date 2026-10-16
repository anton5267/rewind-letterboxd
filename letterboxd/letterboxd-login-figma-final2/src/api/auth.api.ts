import api from "./axios";

export const login = (email: string, password: string) =>
  api.post("/auth/login", { email, password });

export const register = (
  email: string,
  password: string,
  username: string
) =>
  api.post("/auth/register", { email, password, username });

export const forgotPassword = (email: string) =>
  api.post("/auth/forgot-password", { email });

export const resetPassword = (token: string, newPassword: string) =>
  api.post("/auth/reset-password", { token, newPassword });
