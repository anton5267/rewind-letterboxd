import type { HttpRouteContext } from "../context.ts";
import type { AdminTmdbSyncInput } from "../../contracts/admin.ts";
import { parseAdminPage, parsePositiveId, parseRouteId } from "../parsers/query.ts";
import { parseAdminMovieWrite } from "../parsers/admin.ts";
import { confirmedAuthUser, json, repositoryFailure } from "../response.ts";

const ADMIN_MOVIES_PATH = "/api/admin/movies";
const ADMIN_TMDB_QUALITY_PATH = "/api/admin/movies/tmdb-quality";
const ADMIN_TMDB_CANDIDATES_PATTERN = /^\/api\/admin\/movies\/(\d+)\/tmdb-candidates$/;
const ADMIN_TMDB_SYNC_PATTERN = /^\/api\/admin\/movies\/(\d+)\/tmdb-sync$/;
const ADMIN_TMDB_BATCH_PATH = "/api/admin/movies/tmdb-sync/batch";
const ADMIN_TMDB_IMPORT_PATH = "/api/admin/movies/tmdb-import";
const ADMIN_TMDB_DISCOVER_PATH = "/api/admin/movies/tmdb-import/discover";
const ADMIN_MOVIE_PATTERN = /^\/api\/admin\/movies\/(\d+)$/;

export async function handleAdminMovieRoutes(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, query, corsHeaders, repository, authVerifier } = context;

  const tmdbCandidatesMatch = path.match(ADMIN_TMDB_CANDIDATES_PATTERN);

  if (tmdbCandidatesMatch) {
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    const movieId = parseRouteId(tmdbCandidatesMatch[1]);
    if (movieId === null) return json({ message: "Invalid movie ID" }, 400, corsHeaders);
    try {
      if (!repository.searchAdminMovieTmdbCandidates) return json({ message: "Not found" }, 404, corsHeaders);
      return json(await repository.searchAdminMovieTmdbCandidates(authUser, movieId), 200, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to search TMDB candidates", corsHeaders);
    }
  }

  const tmdbSyncMatch = path.match(ADMIN_TMDB_SYNC_PATTERN);

  if (tmdbSyncMatch || path === ADMIN_TMDB_BATCH_PATH || path === ADMIN_TMDB_IMPORT_PATH || path === ADMIN_TMDB_DISCOVER_PATH) {
    if (request.method !== "POST") {
      corsHeaders.set("Allow", "POST, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    let raw: unknown;
    try { raw = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return json({ message: "Invalid request body" }, 400, corsHeaders);
    const body = raw as Record<string, unknown>;
    const syncSimilar = body.syncSimilar === undefined ? true : body.syncSimilar;
    if (typeof syncSimilar !== "boolean") return json({ message: "Invalid syncSimilar value" }, 400, corsHeaders);
    try {
      if (tmdbSyncMatch) {
        const movieId = parseRouteId(tmdbSyncMatch[1]);
        const tmdbId = parsePositiveId(body.tmdbId);
        if (movieId === null || tmdbId === null) return json({ message: "Invalid movie or TMDB ID" }, 400, corsHeaders);
        if (!repository.syncAdminTmdbMovie) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.syncAdminTmdbMovie(authUser, { movieId, tmdbId, syncSimilar }), 200, corsHeaders);
      }
      if (path === ADMIN_TMDB_BATCH_PATH) {
        if (!Array.isArray(body.movies) || body.movies.length < 1 || body.movies.length > 20) return json({ message: "Invalid movies" }, 400, corsHeaders);
        const inputs: AdminTmdbSyncInput[] = [];
        for (const item of body.movies) {
          if (!item || typeof item !== "object" || Array.isArray(item)) return json({ message: "Invalid movies" }, 400, corsHeaders);
          const row = item as Record<string, unknown>, movieId = parsePositiveId(row.movieId), tmdbId = parsePositiveId(row.tmdbId);
          if (movieId === null || tmdbId === null) return json({ message: "Invalid movies" }, 400, corsHeaders);
          inputs.push({ movieId, tmdbId, syncSimilar });
        }
        if (!repository.syncAdminTmdbBatch) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.syncAdminTmdbBatch(authUser, inputs, syncSimilar), 200, corsHeaders);
      }
      if (path === ADMIN_TMDB_IMPORT_PATH) {
        if (!Array.isArray(body.tmdbIds) || body.tmdbIds.length < 1 || body.tmdbIds.length > 20) return json({ message: "Invalid TMDB IDs" }, 400, corsHeaders);
        const ids = body.tmdbIds.map(parsePositiveId);
        if (ids.some((id) => id === null) || new Set(ids).size !== ids.length) return json({ message: "Invalid or duplicate TMDB IDs" }, 400, corsHeaders);
        if (!repository.importAdminTmdb) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.importAdminTmdb(authUser, ids as number[], syncSimilar), 200, corsHeaders);
      }
      const page = body.page, year = body.year, genreId = body.genreId, minRating = body.minRating, limit = body.limit;
      if (!Number.isInteger(page) || (page as number) < 1 || (page as number) > 500
        || (year !== undefined && year !== null && (!Number.isInteger(year) || (year as number) < 1888 || (year as number) > 2100))
        || (genreId !== undefined && genreId !== null && parsePositiveId(genreId) === null)
        || (minRating !== undefined && minRating !== null && (typeof minRating !== "number" || !Number.isFinite(minRating) || minRating < 0 || minRating > 10))
        || !Number.isInteger(limit) || (limit as number) < 1 || (limit as number) > 20) {
        return json({ message: "Invalid TMDB discovery request" }, 400, corsHeaders);
      }
      if (!repository.discoverAndImportAdminTmdb) return json({ message: "Not found" }, 404, corsHeaders);
      return json(await repository.discoverAndImportAdminTmdb(authUser, {
        page: page as number, year: year == null ? null : year as number, genreId: genreId == null ? null : genreId as number,
        minRating: minRating == null ? null : minRating as number, limit: limit as number, syncSimilar,
      }), 200, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to synchronize TMDB catalog", corsHeaders);
    }
  }

  if (path === ADMIN_TMDB_QUALITY_PATH) {
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    try {
      if (!repository.getAdminTmdbQuality) return json({ message: "Not found" }, 404, corsHeaders);
      return json(await repository.getAdminTmdbQuality(authUser), 200, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to load TMDB catalog quality", corsHeaders);
    }
  }

  const adminMovieMatch = path.match(ADMIN_MOVIE_PATTERN);

  if (path === ADMIN_MOVIES_PATH || adminMovieMatch) {
    const allowed = !adminMovieMatch ? ["GET", "POST"] : ["GET", "PUT", "DELETE"];
    if (!allowed.includes(request.method)) {
      corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    try {
      if (!adminMovieMatch && request.method === "GET") {
        const page = parseAdminPage(query, 100, 50);
        if (!page) return json({ message: "Invalid page or size" }, 400, corsHeaders);
        const search = query.get("q")?.trim() || null;
        if (search !== null && search.length > 120) return json({ message: "Movie search is too long" }, 400, corsHeaders);
        if (!repository.getAdminMovies) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.getAdminMovies(authUser, search, page.page, page.size), 200, corsHeaders);
      }
      if (!adminMovieMatch && request.method === "POST") {
        let body: unknown;
        try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        const parsed = parseAdminMovieWrite(body, true);
        if (!parsed) return json({ message: "Invalid movie" }, 400, corsHeaders);
        if (!repository.createAdminMovie) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.createAdminMovie(authUser, parsed), 200, corsHeaders);
      }
      const id = parseRouteId(adminMovieMatch![1]);
      if (id === null) return json({ message: "Invalid movie ID" }, 400, corsHeaders);
      if (request.method === "GET") {
        if (!repository.getAdminMovieDetails) return json({ message: "Not found" }, 404, corsHeaders);
        const details = await repository.getAdminMovieDetails(authUser, id);
        return details ? json(details, 200, corsHeaders) : json({ message: "Movie not found" }, 404, corsHeaders);
      }
      if (request.method === "DELETE") {
        if (!repository.deleteAdminMovie) return json({ message: "Not found" }, 404, corsHeaders);
        return await repository.deleteAdminMovie(authUser, id)
          ? new Response(null, { status: 204, headers: corsHeaders })
          : json({ message: "Movie not found" }, 404, corsHeaders);
      }
      let body: unknown;
      try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
      const parsed = parseAdminMovieWrite(body, false);
      if (!parsed) return json({ message: "Invalid movie" }, 400, corsHeaders);
      if (!repository.updateAdminMovie) return json({ message: "Not found" }, 404, corsHeaders);
      const updated = await repository.updateAdminMovie(authUser, id, parsed);
      return updated ? json(updated, 200, corsHeaders) : json({ message: "Movie not found" }, 404, corsHeaders);
    } catch (error) {
      console.error("Admin movie catalog operation failed", error);
      return repositoryFailure(error, "Unable to manage movie catalog", corsHeaders);
    }
  }

  return null;
}
