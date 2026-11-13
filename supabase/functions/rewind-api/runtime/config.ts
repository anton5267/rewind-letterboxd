import {
  readPublishableKey,
  readSecretKey,
} from "../hosted_auth.ts";

export const supabaseUrl = Deno.env.get("SUPABASE_URL");

export const supabaseAnonKey = readPublishableKey((name) => Deno.env.get(name));

export const supabaseSecretKey = readSecretKey((name) => Deno.env.get(name));

export const allowedOrigins = (Deno.env.get("REWIND_ALLOWED_ORIGINS")
  ?? "https://anton5267.github.io,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const tmdbApiKey = Deno.env.get("TMDB_API_KEY");

export const tmdbApiBaseUrl = Deno.env.get("TMDB_API_BASE_URL");
