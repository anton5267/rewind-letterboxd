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

export interface RewindApiRepository {
  listGenres(): Promise<GenreResponse[]>;
  searchMovies(params: MovieSearchParams): Promise<MovieSearchResult>;
  getMovieDetails(id: number): Promise<MovieDetailsResponse | null>;
}

const FUNCTION_PREFIX = "/functions/v1/rewind-api";
const GENRES_PATH = "/api/genres";
const MOVIES_SEARCH_PATH = "/api/movies/search";
const MOVIE_DETAILS_PATTERN = /^\/api\/movies\/(\d+)\/details$/;

function json(body: unknown, status: number, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");
  responseHeaders.set("Cache-Control", "no-store");
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
        return json(await repository.listGenres(), 200, corsHeaders);
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
        return json(await repository.searchMovies({
          q: query.get("q")?.trim() || null,
          genreId,
          year,
          minRating,
          sort: query.get("sort") ?? "newest",
          page,
          size,
        }), 200, corsHeaders);
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
        return details ? json(details, 200, corsHeaders) : json({ message: "Not found" }, 404, corsHeaders);
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
