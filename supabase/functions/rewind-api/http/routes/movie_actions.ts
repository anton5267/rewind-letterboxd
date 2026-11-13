import type { HttpRouteContext } from "../context.ts";
import type { MovieFlagType } from "../../contracts/catalog.ts";
import { json, repositoryFailure } from "../response.ts";
import { RewindApiError } from "../errors.ts";

const MOVIE_RATING_PATTERN = /^\/api\/movies\/(\d+)\/rating(?:\/(me))?$/;
const MOVIE_STATUS_PATTERN = /^\/api\/movies\/(\d+)\/status\/me$/;
const MOVIE_FLAG_PATTERN = /^\/api\/movies\/(\d+)\/(watched|watchlist|favorite)$/;

export async function handleMovieStatusRoutes(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, corsHeaders, repository, authVerifier } = context;

  const statusMatch = path.match(MOVIE_STATUS_PATTERN);

  const flagMatch = path.match(MOVIE_FLAG_PATTERN);

  if (statusMatch || flagMatch) {
    const movieId = Number((statusMatch ?? flagMatch)![1]);
    if (!Number.isSafeInteger(movieId) || movieId <= 0) return json({ message: "Invalid movie ID" }, 400, corsHeaders);
    const isStatus = statusMatch !== null;
    const flag = flagMatch?.[2] as MovieFlagType | undefined;
    const allowedMethod = isStatus ? "GET" : "POST, DELETE";
    if ((isStatus && request.method !== "GET") || (!isStatus && request.method !== "POST" && request.method !== "DELETE")) {
      corsHeaders.set("Allow", `${allowedMethod}, OPTIONS`);
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!bearer || !authVerifier) return json({ message: "Authentication required" }, 401, corsHeaders);
    try {
      const authUser = await authVerifier.verifyAccessToken(bearer);
      if (!authUser || !authUser.emailConfirmed) return json({ message: "Authentication required" }, 401, corsHeaders);
      if (isStatus) {
        if (!repository.getMyMovieStatus) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.getMyMovieStatus(authUser, movieId), 200, corsHeaders);
      }
      if (request.method === "POST") {
        if (!repository.setMyMovieFlag) return json({ message: "Not found" }, 404, corsHeaders);
        await repository.setMyMovieFlag(authUser, movieId, flag!);
        return new Response(null, { status: 200, headers: corsHeaders });
      }
      if (!repository.deleteMyMovieFlag) return json({ message: "Not found" }, 404, corsHeaders);
      await repository.deleteMyMovieFlag(authUser, movieId, flag!);
      return new Response(null, { status: 204, headers: corsHeaders });
    } catch (error) {
      return repositoryFailure(error, "Unable to update movie status", corsHeaders);
    }
  }

  return null;
}

export async function handleMovieRatingRoutes(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, corsHeaders, repository, authVerifier } = context;

  const ratingMatch = path.match(MOVIE_RATING_PATTERN);

  if (ratingMatch) {
    const movieId = Number(ratingMatch[1]);
    if (!Number.isSafeInteger(movieId) || movieId <= 0) return json({ message: "Invalid movie ID" }, 400, corsHeaders);
    const isReadRoute = ratingMatch[2] === "me";
    const allowedMethod = isReadRoute ? "GET" : "PUT, DELETE";
    if ((isReadRoute && request.method !== "GET") || (!isReadRoute && request.method !== "PUT" && request.method !== "DELETE")) {
      corsHeaders.set("Allow", `${allowedMethod}, OPTIONS`);
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!bearer || !authVerifier) return json({ message: "Authentication required" }, 401, corsHeaders);
    try {
      const authUser = await authVerifier.verifyAccessToken(bearer);
      if (!authUser || !authUser.emailConfirmed) return json({ message: "Authentication required" }, 401, corsHeaders);
      if (isReadRoute) {
        if (!repository.getMyRating) return json({ message: "Not found" }, 404, corsHeaders);
        const rating = await repository.getMyRating(authUser, movieId);
        return rating === null
          ? new Response(null, { status: 204, headers: corsHeaders })
          : json({ rating }, 200, corsHeaders);
      }
      if (request.method === "DELETE") {
        if (!repository.deleteMyRating) return json({ message: "Not found" }, 404, corsHeaders);
        await repository.deleteMyRating(authUser, movieId);
        return new Response(null, { status: 204, headers: corsHeaders });
      }
      if (!repository.setMyRating) return json({ message: "Not found" }, 404, corsHeaders);
      let body: unknown;
      try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
      const rating = (body as { rating?: unknown } | null)?.rating;
      if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        return json({ message: "Rating must be an integer from 1 to 5" }, 400, corsHeaders);
      }
      await repository.setMyRating(authUser, movieId, rating);
      return new Response(null, { status: 200, headers: corsHeaders });
    } catch (error) {
      return repositoryFailure(error, "Unable to update rating", corsHeaders);
    }
  }

  return null;
}
