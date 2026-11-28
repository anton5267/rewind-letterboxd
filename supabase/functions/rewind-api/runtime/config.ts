import { readPublishableKey, readSecretKey } from "../hosted_auth.ts";
import { resolveAllowedOrigins } from "./allowed_origins.ts";

export const supabaseUrl = Deno.env.get("SUPABASE_URL");

export const publicBaseUrl = Deno.env.get("PUBLIC_BASE_URL") ??
  "https://anton5267.github.io/rewind-letterboxd/";

export const supabaseAnonKey = readPublishableKey((name) => Deno.env.get(name));

export const supabaseSecretKey = readSecretKey((name) => Deno.env.get(name));

export const allowedOrigins = resolveAllowedOrigins(
  Deno.env.get("REWIND_ALLOWED_ORIGINS"),
);

export const tmdbApiKey = Deno.env.get("TMDB_API_KEY");

export const tmdbApiBaseUrl = Deno.env.get("TMDB_API_BASE_URL");
