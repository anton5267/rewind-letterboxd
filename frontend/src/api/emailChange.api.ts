import api from "./axios";
import { getSupabaseClient, usesHostedSupabaseAuth } from "./supabaseClient";

export const requestEmailChange = (email: string, language: "uk" | "en", expectedUserId: number) =>
  api.post<{ confirmationRequired: boolean }>("/profile/me/email", { email: email.trim(), language, expectedUserId });

export async function confirmEmailChange(tokenHash: string): Promise<boolean> {
  if (!usesHostedSupabaseAuth) throw new Error("Hosted email verification is not enabled.");
  const { data, error } = await getSupabaseClient().auth.verifyOtp({ token_hash: tokenHash, type: "email_change" });
  if (error) throw error;
  return Boolean(data.session);
}
