export interface TmdbPerson { tmdbId: number; name: string; photoUrl: string | null }
export interface TmdbCast extends TmdbPerson { characterName: string | null; castOrder: number | null }
export interface TmdbGenre { tmdbId: number; name: string }
export interface TmdbMovieCandidate {
  tmdbId: number; title: string; releaseDate: string | null; overview: string | null; posterUrl: string | null;
}
export interface TmdbMovie {
  tmdbId: number; imdbId: string | null; title: string; runtime: number | null; releaseDate: string | null;
  overview: string | null; posterUrl: string | null; backdropUrl: string | null; trailerUrl: string | null;
  voteAverage: number | null; voteCount: number | null; genres: TmdbGenre[]; cast: TmdbCast[];
  directors: TmdbPerson[]; producers: TmdbPerson[]; similarTmdbIds: number[];
}
export class TmdbError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

const API_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/";
const text = (v: unknown): string | null => typeof v === "string" ? v : null;
const number = (v: unknown): number | null => typeof v === "number" && Number.isFinite(v) ? v : null;
const records = (v: unknown): Record<string, unknown>[] => Array.isArray(v)
  ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object") : [];
function image(path: unknown, size: string): string | null {
  const value = text(path);
  return value && value.startsWith("/") ? `${IMAGE_URL}${size}${value}` : null;
}
function person(value: Record<string, unknown>): TmdbPerson | null {
  const tmdbId = number(value.id), name = text(value.name)?.trim();
  return tmdbId && name ? { tmdbId, name, photoUrl: image(value.profile_path, "w185") } : null;
}

export function mapTmdbMovie(value: unknown, requestedId?: number): TmdbMovie {
  if (!value || typeof value !== "object") throw new TmdbError(502, "TMDB returned an empty movie");
  const body = value as Record<string, unknown>;
  const tmdbId = number(body.id) ?? requestedId;
  const title = text(body.title)?.trim();
  if (!tmdbId || !title) throw new TmdbError(502, "TMDB returned an invalid movie");
  const credits = (body.credits && typeof body.credits === "object" ? body.credits : {}) as Record<string, unknown>;
  const genres = records(body.genres).flatMap((g) => {
    const id = number(g.id), name = text(g.name)?.trim();
    return id && name ? [{ tmdbId: id, name }] : [];
  });
  const cast = records(credits.cast).flatMap((entry) => {
    const p = person(entry);
    return p ? [{ ...p, characterName: text(entry.character)?.slice(0, 150) ?? null, castOrder: number(entry.order) }]: [];
  }).slice(0, 20);
  const directorMap = new Map<number, TmdbPerson>(), producerMap = new Map<number, TmdbPerson>();
  for (const entry of records(credits.crew)) {
    const p = person(entry); if (!p) continue;
    const job = (text(entry.job) ?? "").toLowerCase();
    if (job === "director") directorMap.set(p.tmdbId, p);
    if (job.includes("producer") && !producerMap.has(p.tmdbId)) producerMap.set(p.tmdbId, p);
  }
  const videos = (body.videos && typeof body.videos === "object" ? body.videos : {}) as Record<string, unknown>;
  let trailerUrl: string | null = null;
  for (const video of records(videos.results)) {
    if (text(video.site)?.toLowerCase() !== "youtube" || text(video.type)?.toLowerCase() !== "trailer") continue;
    const key = text(video.key)?.trim(); if (!key) continue;
    trailerUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(key)}`;
    if (video.official === true) break;
  }
  const similar = (body.similar && typeof body.similar === "object" ? body.similar : {}) as Record<string, unknown>;
  const similarTmdbIds = [...new Set(records(similar.results).map((x) => number(x.id)).filter((x): x is number => !!x && x !== tmdbId))].slice(0, 20);
  const external = (body.external_ids && typeof body.external_ids === "object" ? body.external_ids : {}) as Record<string, unknown>;
  return {
    tmdbId, imdbId: text(external.imdb_id), title, runtime: number(body.runtime),
    releaseDate: text(body.release_date), overview: text(body.overview), posterUrl: image(body.poster_path, "w500"),
    backdropUrl: image(body.backdrop_path, "original"), trailerUrl, voteAverage: number(body.vote_average),
    voteCount: number(body.vote_count), genres, cast, directors: [...directorMap.values()], producers: [...producerMap.values()], similarTmdbIds,
  };
}

async function apiGet(path: string, params: Record<string, string>, apiKey: string, fetcher: typeof fetch, baseUrl = API_URL): Promise<Record<string, unknown>> {
  const url = new URL(`${baseUrl.replace(/\/$/, "")}${path}`);
  url.searchParams.set("api_key", apiKey);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  let response: Response;
  try { response = await fetcher(url, { headers: { Accept: "application/json" } }); }
  catch { throw new TmdbError(502, "TMDB request failed"); }
  if (response.status === 404) throw new TmdbError(404, "TMDB movie not found");
  if (!response.ok) throw new TmdbError(502, "TMDB request failed");
  try {
    const body: unknown = await response.json();
    if (!body || typeof body !== "object") throw new Error();
    return body as Record<string, unknown>;
  } catch { throw new TmdbError(502, "TMDB returned invalid data"); }
}

export async function fetchTmdbMovie(id: number, apiKey: string | undefined, fetcher: typeof fetch = fetch, baseUrl = API_URL): Promise<TmdbMovie> {
  if (!apiKey?.trim()) throw new TmdbError(503, "TMDB integration is disabled");
  const body = await apiGet(`/movie/${id}`, { language: "en-US", append_to_response: "credits,videos,similar,external_ids" }, apiKey, fetcher, baseUrl);
  return mapTmdbMovie(body, id);
}
export async function searchTmdbMovies(query: string, year: number | null, apiKey: string | undefined, fetcher: typeof fetch = fetch, baseUrl = API_URL): Promise<TmdbMovieCandidate[]> {
  const normalized = query.trim();
  if (normalized.length < 2 || normalized.length > 120) throw new TmdbError(400, "Invalid movie search");
  if (!apiKey?.trim()) throw new TmdbError(503, "TMDB integration is disabled");
  const params: Record<string, string> = { language: "en-US", query: normalized, include_adult: "false", page: "1" };
  if (year !== null) params.primary_release_year = String(year);
  const body = await apiGet("/search/movie", params, apiKey, fetcher, baseUrl);
  if (!Array.isArray(body.results)) throw new TmdbError(502, "TMDB returned invalid search results");
  return records(body.results).flatMap((entry) => {
    const tmdbId = number(entry.id), title = text(entry.title)?.trim();
    if (!tmdbId || !title) return [];
    return [{ tmdbId, title, releaseDate: text(entry.release_date), overview: text(entry.overview), posterUrl: image(entry.poster_path, "w185") }];
  }).slice(0, 8);
}
export interface TmdbDiscovery { page: number; totalPages: number; totalResults: number; tmdbIds: number[] }
export async function discoverTmdbMovies(input: { page: number; year: number | null; genreId: number | null; minRating: number | null; limit: number }, apiKey: string | undefined, fetcher: typeof fetch = fetch, baseUrl = API_URL): Promise<TmdbDiscovery> {
  if (!apiKey?.trim()) throw new TmdbError(503, "TMDB integration is disabled");
  const params: Record<string, string> = { language: "en-US", page: String(input.page), sort_by: "popularity.desc", include_adult: "false" };
  if (input.year !== null) params.primary_release_year = String(input.year);
  if (input.genreId !== null) params.with_genres = String(input.genreId);
  if (input.minRating !== null) params["vote_average.gte"] = String(input.minRating);
  const body = await apiGet("/discover/movie", params, apiKey, fetcher, baseUrl);
  if (!Array.isArray(body.results)) throw new TmdbError(502, "TMDB returned an empty discovery page");
  const tmdbIds = [...new Set(records(body.results).map((x) => number(x.id)).filter((x): x is number => !!x))].slice(0, input.limit);
  return { page: input.page, totalPages: number(body.total_pages) ?? input.page, totalResults: number(body.total_results) ?? tmdbIds.length, tmdbIds };
}
