import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://cuirmicbzspomijgkkwo.supabase.co";
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const usesHostedSupabaseAuth = import.meta.env.VITE_SUPABASE_AUTH_ENABLED === "true";
export const isSupabaseAuthConfigured = Boolean(publishableKey);

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!publishableKey) throw new Error("Supabase Auth is not configured for this build.");
  if (!client) {
    client = createClient(supabaseUrl, publishableKey, {
      auth: {
        flowType: "pkce",
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    });
  }
  return client;
}

export function authRedirectUrl(language: "uk" | "en", route: "login" | "reset-password"): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return new URL(`${base}${language}/${route}/`, window.location.origin).toString();
}
