import type { HttpRouteContext } from "../context.ts";
import { json } from "../response.ts";

const WATCHED_FILMS_PATH = "/api/stats/watched-films";
const CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300";

export async function handlePublicStatsRoutes(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, corsHeaders, repository } = context;
  if (path !== WATCHED_FILMS_PATH) return null;
  if (request.method !== "GET") {
    corsHeaders.set("Allow", "GET, OPTIONS");
    return json({ message: "Method not allowed" }, 405, corsHeaders);
  }
  if (!repository.getPublicWatchedFilmCount) {
    return json({ message: "Public statistics are unavailable" }, 503, corsHeaders);
  }
  try {
    const count = await repository.getPublicWatchedFilmCount();
    if (!Number.isSafeInteger(count) || count < 0) {
      return json({ message: "Public statistics are unavailable" }, 503, corsHeaders);
    }
    corsHeaders.set("Cache-Control", CACHE_CONTROL);
    return json({ count }, 200, corsHeaders);
  } catch {
    return json({ message: "Unable to load public statistics" }, 500, corsHeaders);
  }
}
