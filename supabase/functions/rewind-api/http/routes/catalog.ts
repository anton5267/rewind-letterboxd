import type { HttpRouteContext } from "../context.ts";
import type { PersonBiography } from "../../contracts/catalog.ts";
import { optionalFiniteNumber, optionalInteger, optionalPositiveInteger } from "../parsers/query.ts";
import { PUBLIC_CATALOG_CACHE, json } from "../response.ts";

const GENRES_PATH = "/api/genres";
const MOVIES_SEARCH_PATH = "/api/movies/search";
const GLOBAL_SEARCH_PATH = "/api/search/global";
const MOVIE_DETAILS_PATTERN = /^\/api\/movies\/(\d+)\/details$/;
const PEOPLE_SEARCH_PATH = "/api/people/search";
const PERSON_FILMOGRAPHY_PATTERN = /^\/api\/(actors|directors|producers)\/([^/]+)$/;

export async function handleCatalogRoutes(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, query, corsHeaders, repository, authVerifier } = context;

  if (path === GENRES_PATH) {
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }

    try {
      const genres = await repository.listGenres();
      corsHeaders.set("Cache-Control", PUBLIC_CATALOG_CACHE);
      return json(genres, 200, corsHeaders);
    } catch {
      return json({ message: "Internal server error" }, 500, corsHeaders);
    }
  }

  if (path === MOVIES_SEARCH_PATH) {
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }

    const query = new URL(request.url).searchParams;
    const genreId = optionalPositiveInteger(query.get("genreId"));
    const year = optionalPositiveInteger(query.get("year"));
    const minRating = optionalFiniteNumber(query.get("minRating"));
    const q = query.get("q")?.trim() || null;
    if ((query.has("genreId") && genreId === null) || (query.has("year") && year === null)
      || (query.has("minRating") && minRating === null)
      || (year !== null && (year < 1888 || year > 2100))
      || (minRating !== null && (minRating < 0 || minRating > 5))) {
      return json({ message: "Invalid search parameters" }, 400, corsHeaders);
    }
    if (q && q.length > 100) return json({ message: "Search query is too long" }, 400, corsHeaders);
    const rawPage = query.get("page");
    const page = rawPage === null ? 0 : optionalInteger(rawPage, -1);
    if (page < 0 || page > 100) return json({ message: "Invalid page" }, 400, corsHeaders);
    const size = Math.max(1, Math.min(optionalInteger(query.get("size"), 20), 50));

    try {
      const result = await repository.searchMovies({
        q,
        genreId,
        year,
        minRating,
        sort: query.get("sort") ?? "newest",
        page,
        size,
      });
      corsHeaders.set("Cache-Control", PUBLIC_CATALOG_CACHE);
      return json(result, 200, corsHeaders);
    } catch {
      return json({ message: "Internal server error" }, 500, corsHeaders);
    }
  }

  if (path === GLOBAL_SEARCH_PATH) {
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    if (!repository.searchGlobal) return json({ message: "Not found" }, 404, corsHeaders);
    const query = new URL(request.url).searchParams;
    const rawQuery = query.get("q");
    if (rawQuery === null || rawQuery.length > 200) return json({ message: "Invalid search query" }, 400, corsHeaders);
    const requestedSize = optionalInteger(query.get("size"), 6);
    if (requestedSize < 1) return json({ message: "Invalid page size" }, 400, corsHeaders);
    const size = Math.min(requestedSize, 12);
    const language = query.get("language") === "en" ? "en" : "uk";
    try {
      const result = await repository.searchGlobal(rawQuery.trim(), language, size);
      corsHeaders.set("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
      return json(result, 200, corsHeaders);
    } catch {
      return json({ message: "Unable to search REWIND" }, 500, corsHeaders);
    }
  }

  if (path === PEOPLE_SEARCH_PATH) {
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const query = new URL(request.url).searchParams;
    const rawType = query.get("type") ?? "actor";
    if (rawType !== "actor" && rawType !== "director" && rawType !== "producer") {
      return json({ message: "Invalid person type" }, 400, corsHeaders);
    }
    const q = query.get("q")?.trim() || null;
    if (q && q.length > 100) return json({ message: "Search query is too long" }, 400, corsHeaders);
    const rawPage = query.get("page");
    const parsedPage = rawPage === null ? 0 : optionalInteger(rawPage, -1);
    if (parsedPage < 0 || parsedPage > 100) return json({ message: "Invalid page" }, 400, corsHeaders);
    const page = parsedPage;
    const size = Math.max(1, Math.min(optionalInteger(query.get("size"), 20), 50));
    try {
      const result = await repository.searchPeople({
        q,
        type: rawType === "actor" ? "ACTOR" : rawType === "director" ? "DIRECTOR" : "PRODUCER",
        page,
        size,
      });
      corsHeaders.set("Cache-Control", PUBLIC_CATALOG_CACHE);
      return json(result, 200, corsHeaders);
    } catch {
      return json({ message: "Internal server error" }, 500, corsHeaders);
    }
  }

  const movieDetailsMatch = path.match(MOVIE_DETAILS_PATTERN);

  if (movieDetailsMatch) {
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const movieId = Number(movieDetailsMatch[1]);
    if (!Number.isSafeInteger(movieId) || movieId <= 0) {
      return json({ message: "Invalid movie ID" }, 400, corsHeaders);
    }
    try {
      const details = await repository.getMovieDetails(movieId);
      if (!details) return json({ message: "Not found" }, 404, corsHeaders);
      const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
      if (bearer && authVerifier && repository.getMyMovieStatus) {
        const authUser = await authVerifier.verifyAccessToken(bearer);
        if (authUser?.emailConfirmed) {
          const status = await repository.getMyMovieStatus(authUser, movieId);
          return json({
            ...details,
            myFlags: { watched: status.watched, watchlist: status.inWatchlist, favorites: status.favorite },
          }, 200, corsHeaders);
        }
      }
      corsHeaders.set("Cache-Control", PUBLIC_CATALOG_CACHE);
      return json(details, 200, corsHeaders);
    } catch {
      return json({ message: "Internal server error" }, 500, corsHeaders);
    }
  }

  const personMatch = path.match(PERSON_FILMOGRAPHY_PATTERN);

  if (personMatch) {
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    if (!/^\d+$/.test(personMatch[2])) return json({ message: "Invalid person ID" }, 400, corsHeaders);
    const personId = Number(personMatch[2]);
    if (!Number.isSafeInteger(personId) || personId <= 0) return json({ message: "Invalid person ID" }, 400, corsHeaders);
    const query = new URL(request.url).searchParams;
    const rawGenreId = query.get("genreId");
    const genreId = rawGenreId === null ? null : optionalPositiveInteger(rawGenreId);
    if (rawGenreId !== null && genreId === null) return json({ message: "Invalid genre ID" }, 400, corsHeaders);
    const language = query.get("language") ?? "en";
    if (language !== "uk" && language !== "en") return json({ message: "Invalid biography language" }, 400, corsHeaders);
    const type = personMatch[1] === "actors" ? "ACTOR" : personMatch[1] === "directors" ? "DIRECTOR" : "PRODUCER";
    try {
      const person = await repository.getPersonFilmography(type, personId, genreId, query.get("sort") ?? "newest");
      if (!person) return json({ message: "Not found" }, 404, corsHeaders);
      let biography: PersonBiography | null = null;
      if (person.tmdbId && context.personBiographyProvider) {
        try { biography = await context.personBiographyProvider(person.tmdbId, language); }
        catch { /* Optional provider failure preserves the catalogue response. */ }
      }
      corsHeaders.set("Cache-Control", PUBLIC_CATALOG_CACHE);
      return json({ ...person, biography: biography?.text ?? null, biographyLanguage: biography?.language ?? null }, 200, corsHeaders);
    } catch {
      return json({ message: "Internal server error" }, 500, corsHeaders);
    }
  }

  return null;
}
