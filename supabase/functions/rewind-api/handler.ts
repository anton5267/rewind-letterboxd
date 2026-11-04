export interface GenreResponse {
  id: number;
  name: string;
}

export interface MovieCardResponse {
  id: number;
  title: string;
  releaseDate: string | null;
  rating: number | null;
  photoUrl: string | null;
}

export interface MovieSearchResult {
  content: MovieCardResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface MovieDetailsResponse {
  id: number;
  imdbId: string | null;
  tmdbId: number | null;
  title: string;
  durationMinutes: number | null;
  releaseDate: string | null;
  ageRating: string | null;
  rating: number | null;
  shortPlot: string | null;
  photoUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  genres: { id: number; name: string }[];
  directors: { id: number; name: string; photoUrl: string | null }[];
  producers: { id: number; name: string; photoUrl: string | null }[];
  actors: { id: number; name: string; photoUrl: string | null; characterName: string | null; castOrder: number | null }[];
  externalRatings: { source: string; rating: number; votesCount: number | null; lastUpdatedAt: string | null }[];
  similarMovies: MovieCardResponse[];
  myFlags: { watched: boolean; watchlist: boolean; favorites: boolean } | null;
}

export interface MovieSearchParams {
  q: string | null;
  genreId: number | null;
  year: number | null;
  minRating: number | null;
  sort: string;
  page: number;
  size: number;
}

export interface PersonFilmographyResponse {
  id: number;
  name: string;
  photoUrl: string | null;
  type: "ACTOR" | "DIRECTOR";
  films: {
    id: number;
    title: string;
    releaseDate: string | null;
    rating: number | null;
    photoUrl: string | null;
    characterName: string | null;
  }[];
}

export interface RewindApiRepository {
  listGenres(): Promise<GenreResponse[]>;
  searchMovies(params: MovieSearchParams): Promise<MovieSearchResult>;
  getMovieDetails(id: number): Promise<MovieDetailsResponse | null>;
  getPersonFilmography(type: "ACTOR" | "DIRECTOR", id: number, genreId: number | null, sort: string): Promise<PersonFilmographyResponse | null>;
}

const FUNCTION_PREFIX = "/functions/v1/rewind-api";
const GENRES_PATH = "/api/genres";
const MOVIES_SEARCH_PATH = "/api/movies/search";
const MOVIE_DETAILS_PATTERN = /^\/api\/movies\/(\d+)\/details$/;
const PERSON_FILMOGRAPHY_PATTERN = /^\/api\/(actors|directors)\/([^/]+)$/;
const PUBLIC_CATALOG_CACHE = "public, max-age=300, stale-while-revalidate=600";

function json(body: unknown, status: number, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");
  if (!responseHeaders.has("Cache-Control")) responseHeaders.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

function apiPath(pathname: string): string {
  if (pathname === FUNCTION_PREFIX || pathname === `${FUNCTION_PREFIX}/`) return "/";
  const apiIndex = pathname.indexOf("/api/");
  if (apiIndex >= 0) return pathname.slice(apiIndex);
  return pathname.startsWith(`${FUNCTION_PREFIX}/`)
    ? pathname.slice(FUNCTION_PREFIX.length)
    : pathname;
}

export function createRewindApiHandler(
  repository: RewindApiRepository,
  allowedOrigins: readonly string[],
): (request: Request) => Promise<Response> {
  const origins = new Set(allowedOrigins);

  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("Origin");
    if (origin && !origins.has(origin)) {
      return json({ message: "Origin is not allowed" }, 403, { Vary: "Origin" });
    }

    const corsHeaders = new Headers({
      Vary: "Origin",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, apikey, Content-Type, X-Client-Info",
      "Access-Control-Max-Age": "600",
    });
    if (origin) corsHeaders.set("Access-Control-Allow-Origin", origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const path = apiPath(new URL(request.url).pathname);
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
      if ((query.has("genreId") && genreId === null) || (query.has("year") && year === null)
        || (query.has("minRating") && minRating === null)) {
        return json({ message: "Invalid search parameters" }, 400, corsHeaders);
      }
      const page = Math.max(0, optionalInteger(query.get("page"), 0));
      const size = Math.max(1, Math.min(optionalInteger(query.get("size"), 20), 50));

      try {
        const result = await repository.searchMovies({
          q: query.get("q")?.trim() || null,
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
        if (details) corsHeaders.set("Cache-Control", PUBLIC_CATALOG_CACHE);
        return details ? json(details, 200, corsHeaders) : json({ message: "Not found" }, 404, corsHeaders);
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
      const type = personMatch[1] === "actors" ? "ACTOR" : "DIRECTOR";
      try {
        const person = await repository.getPersonFilmography(type, personId, genreId, query.get("sort") ?? "newest");
        if (person) corsHeaders.set("Cache-Control", PUBLIC_CATALOG_CACHE);
        return person ? json(person, 200, corsHeaders) : json({ message: "Not found" }, 404, corsHeaders);
      } catch {
        return json({ message: "Internal server error" }, 500, corsHeaders);
      }
    }

    return json({ message: "Not found" }, 404, corsHeaders);
  };
}

function optionalInteger(value: string | null, fallback: number): number {
  if (value === null || !/^-?\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : fallback;
}

function optionalPositiveInteger(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function optionalFiniteNumber(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
