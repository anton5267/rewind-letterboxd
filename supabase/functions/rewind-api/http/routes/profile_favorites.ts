import type { HttpRouteContext } from "../context.ts";
import { confirmedAuthUser, json, repositoryFailure } from "../response.ts";

export async function handleFavoriteOrderRoute(context: HttpRouteContext): Promise<Response | null> {
  const { path, request, corsHeaders, authVerifier, repository } = context;
  if (path !== "/api/profile/me/favorites/order") return null;
  if (request.method !== "PUT") {
    corsHeaders.set("Allow", "PUT, OPTIONS");
    return json({ message: "Method not allowed" }, 405, corsHeaders);
  }
  const actor = await confirmedAuthUser(request, authVerifier);
  if (!actor) return json({ message: "Authentication required" }, 401, corsHeaders);
  let body: unknown;
  try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ message: "Invalid favorite move" }, 400, corsHeaders);
  const { movieId, targetMovieId, placement, expectedUserId } = body as Record<string, unknown>;
  const positiveId = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value > 0;
  if (!positiveId(movieId) || !positiveId(targetMovieId) || !positiveId(expectedUserId)
    || movieId === targetMovieId || (placement !== "before" && placement !== "after")) {
    return json({ message: "Invalid favorite move" }, 400, corsHeaders);
  }
  if (!repository.moveMyFavorite) return json({ message: "Not found" }, 404, corsHeaders);
  try {
    const found = await repository.moveMyFavorite(actor, { movieId, targetMovieId, placement, expectedUserId });
    return found ? new Response(null, { status: 204, headers: corsHeaders })
      : json({ message: "Favorite film not found" }, 404, corsHeaders);
  } catch (error) { return repositoryFailure(error, "Unable to reorder favorite films", corsHeaders); }
}
