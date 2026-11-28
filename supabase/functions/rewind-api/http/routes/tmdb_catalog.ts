import type { HttpRouteContext } from "../context.ts";
import { optionalPositiveInteger } from "../parsers/query.ts";
import { confirmedAuthUser, json, repositoryFailure } from "../response.ts";

const SEARCH_PATH = "/api/tmdb/movies/search";
const DISCOVER_PATH = "/api/tmdb/movies/discover";
const IMPORT_PATH = "/api/tmdb/movies/import";

export async function handleTmdbCatalogRoutes(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, query, corsHeaders, repository, authVerifier } = context;

  if (path === SEARCH_PATH) {
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const q = query.get("q")?.trim() ?? "";
    const year = query.has("year") ? optionalPositiveInteger(query.get("year")) : null;
    const rawPage = query.has("page") ? optionalPositiveInteger(query.get("page")) : 1;
    const language = query.get("language") ?? "en";
    if (q.length < 2 || q.length > 120 || (query.has("year") && (year === null || year < 1888 || year > 2100))
      || rawPage === null || rawPage > 500 || (language !== "uk" && language !== "en")) {
      return json({ message: "Invalid TMDB search parameters" }, 400, corsHeaders);
    }
    try {
      if (!repository.searchTmdbCatalog) return json({ message: "TMDB search is unavailable" }, 503, corsHeaders);
      const result = await repository.searchTmdbCatalog(q, year, rawPage, language);
      corsHeaders.set("Cache-Control", "public, max-age=120, stale-while-revalidate=300");
      return json(result, 200, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to search TMDB", corsHeaders);
    }
  }

  if (path === DISCOVER_PATH) {
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const rawPage = query.has("page") ? optionalPositiveInteger(query.get("page")) : 1;
    const year = query.has("year") ? optionalPositiveInteger(query.get("year")) : null;
    const genreId = query.has("genreId") ? optionalPositiveInteger(query.get("genreId")) : null;
    const rawRating = query.get("minRating");
    const minRating = rawRating === null ? null : /^(?:0|[1-9]|10)(?:\.\d)?$/.test(rawRating) ? Number(rawRating) : null;
    const language = query.get("language") ?? "en";
    if (rawPage === null || rawPage > 500
      || (query.has("year") && (year === null || year < 1888 || year > 2100))
      || (query.has("genreId") && genreId === null)
      || (query.has("minRating") && (minRating === null || minRating > 10))
      || (language !== "uk" && language !== "en")) {
      return json({ message: "Invalid TMDB discovery parameters" }, 400, corsHeaders);
    }
    try {
      if (!repository.discoverTmdbCatalog) return json({ message: "TMDB discovery is unavailable" }, 503, corsHeaders);
      const result = await repository.discoverTmdbCatalog({ page: rawPage, year, genreId, minRating, language });
      corsHeaders.set("Cache-Control", "public, max-age=120, stale-while-revalidate=300");
      return json(result, 200, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to discover TMDB movies", corsHeaders);
    }
  }

  if (path === IMPORT_PATH) {
    if (request.method !== "POST") {
      corsHeaders.set("Allow", "POST, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Confirmed sign-in required" }, 401, corsHeaders);
    let raw: unknown;
    try { raw = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return json({ message: "Invalid request body" }, 400, corsHeaders);
    const rawId = (raw as Record<string, unknown>).tmdbId;
    const rawAddToWatchlist = (raw as Record<string, unknown>).addToWatchlist;
    const tmdbId = typeof rawId === "number" && Number.isSafeInteger(rawId) && rawId > 0 ? rawId : null;
    if (tmdbId === null || (rawAddToWatchlist !== undefined && typeof rawAddToWatchlist !== "boolean")) return json({ message: "Invalid TMDB movie ID or Watchlist option" }, 400, corsHeaders);
    try {
      if (!repository.importTmdbCatalogMovie) return json({ message: "TMDB import is unavailable" }, 503, corsHeaders);
      return json(await repository.importTmdbCatalogMovie(authUser, tmdbId, rawAddToWatchlist === true), 200, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to add this movie", corsHeaders);
    }
  }

  return null;
}
