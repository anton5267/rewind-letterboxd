import api from "./axios";
import { authRedirectUrl, getSupabaseClient, usesHostedSupabaseAuth } from "./supabaseClient";

export interface CurrentUser {
  id: number;
  username: string;
  role: string;
  avatarUrl?: string | null;
}

export const getCurrentUser = () => api.get<CurrentUser>("/users/me");

export const login = async (email: string, password: string) => {
  if (usesHostedSupabaseAuth) {
    const { error } = await getSupabaseClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    return { data: undefined };
  }
  return api.post<void>("/auth/login", { email: email.trim(), password });
};

export const register = (
  email: string,
  password: string,
  username: string,
  language: "uk" | "en" = "uk"
) => {
  if (usesHostedSupabaseAuth) {
    return getSupabaseClient().auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: authRedirectUrl(language, "login"),
        data: { username: username.trim(), language },
      },
    }).then(({ data, error }) => {
      if (error) throw error;
      return { data: { confirmationRequired: !data.session } };
    });
  }
  return api.post<{ confirmationRequired?: boolean }>("/auth/register", { email: email.trim(), password, username: username.trim() }, { headers: { "Accept-Language": language } });
};

export const forgotPassword = async (email: string, language: "uk" | "en" = "uk") => {
  if (usesHostedSupabaseAuth) {
    const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: authRedirectUrl(language, "reset-password"),
    });
    if (error) throw error;
    return { data: undefined };
  }
  return api.post<void>("/auth/forgot-password", { email: email.trim() }, { headers: { "Accept-Language": language } });
};

export const resetPassword = async (token: string, newPassword: string) => {
  if (usesHostedSupabaseAuth) {
    const { data: { session }, error: sessionError } = await getSupabaseClient().auth.getSession();
    if (sessionError) throw sessionError;
    if (!session || (token && token !== session.access_token)) throw new Error("The recovery session is invalid or expired.");
    const { error } = await getSupabaseClient().auth.updateUser({ password: newPassword });
    if (error) throw error;
    return { data: undefined };
  }
  return api.post<void>("/auth/reset-password", { token, newPassword });
};

export const logout = async () => {
  if (usesHostedSupabaseAuth) {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throw error;
    return { data: undefined };
  }
  return api.post<void>("/auth/logout");
};

export const startSupabaseLink = (currentPassword: string, language: "uk" | "en" = "uk") =>
  api.post<{ confirmationRequired: boolean }>("/auth/supabase-link/start", { currentPassword }, { headers: { "Accept-Language": language } });

export const completeSupabaseLink = (accessToken: string, currentPassword: string) =>
  api.post<void>("/auth/supabase-link/complete", { accessToken, currentPassword });
