import type { HttpRouteContext } from "../context.ts";
import { parseSocialPage } from "../parsers/query.ts";
import { confirmedAuthUser, json, repositoryFailure } from "../response.ts";

const PUBLIC_PROFILE_PATTERN = /^\/api\/users\/(\d+)\/(profile|followers|following|follow-status|follow|block-status|block|activity|collections\/(watched|watchlist|favorites)|lists|liked-reviews)$/;
const FOLLOWING_ACTIVITY_PATH = "/api/activity/following";
const RECENT_WATCHED_PATH = "/api/activity/recent-watched";
const POPULAR_REVIEWERS_PATH = "/api/users/popular-reviewers";
const HQ_USERS_PATH = "/api/users/hq";
const USER_DIRECTORY_PATH = "/api/users/directory";
const PUBLIC_USER_PATTERN = /^\/api\/users\/(\d+)$/;

export async function handleSocialRoutes(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, query, corsHeaders, repository, authVerifier } = context;

  const publicUserMatch = path.match(PUBLIC_USER_PATTERN);

  const socialProfileMatch = path.match(PUBLIC_PROFILE_PATTERN);

  if (path === HQ_USERS_PATH || path === USER_DIRECTORY_PATH || path === POPULAR_REVIEWERS_PATH) {
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const { page, size } = parseSocialPage(query);
    try {
      if (path === POPULAR_REVIEWERS_PATH) {
        if (!repository.getPopularReviewers) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.getPopularReviewers(Math.min(size, 20)), 200, corsHeaders);
      }
      const result = path === HQ_USERS_PATH
        ? await repository.getHqUsers?.(page, size)
        : await repository.getDirectoryUsers?.(query.get("q")?.trim() || null, page, size);
      if (!result) return json({ message: "Not found" }, 404, corsHeaders);
      return json(result, 200, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to load users", corsHeaders);
    }
  }

  if (path === FOLLOWING_ACTIVITY_PATH || path === RECENT_WATCHED_PATH) {
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const { page, size } = parseSocialPage(query);
    try {
      if (path === RECENT_WATCHED_PATH) {
        if (!repository.getRecentWatched) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.getRecentWatched(size), 200, corsHeaders);
      }
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      if (!repository.getFollowingActivity) return json({ message: "Not found" }, 404, corsHeaders);
      return json(await repository.getFollowingActivity(authUser, page, size), 200, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to load activity", corsHeaders);
    }
  }

  if (socialProfileMatch || publicUserMatch) {
    const userId = Number((socialProfileMatch ?? publicUserMatch)![1]);
    if (!Number.isSafeInteger(userId) || userId <= 0) return json({ message: "Invalid user ID" }, 400, corsHeaders);
    const route = socialProfileMatch?.[2] ?? "user";
    const isFollowAction = route === "follow";
    const isFollowStatus = route === "follow-status";
    const isBlockAction = route === "block";
    const isBlockStatus = route === "block-status";
    const permittedMethods = isFollowAction || isBlockAction ? ["POST", "DELETE"] : ["GET"];
    if (!permittedMethods.includes(request.method)) {
      corsHeaders.set("Allow", `${permittedMethods.join(", ")}, OPTIONS`);
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    try {
      if (isFollowAction || isFollowStatus || isBlockAction || isBlockStatus) {
        const authUser = await confirmedAuthUser(request, authVerifier);
        if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
        if (isFollowStatus) {
          if (!repository.getFollowStatus) return json({ message: "Not found" }, 404, corsHeaders);
          const status = await repository.getFollowStatus(authUser, userId);
          return status ? json(status, 200, corsHeaders) : json({ message: "User not found" }, 404, corsHeaders);
        }
        if (isBlockStatus) {
          if (!repository.getBlockStatus) return json({ message: "Not found" }, 404, corsHeaders);
          const status = await repository.getBlockStatus(authUser, userId);
          return status ? json(status, 200, corsHeaders) : json({ message: "User not found" }, 404, corsHeaders);
        }
        if (isBlockAction) {
          if (!repository.setBlock) return json({ message: "Not found" }, 404, corsHeaders);
          const blocked = await repository.setBlock(authUser, userId, request.method === "POST");
          return blocked === null ? json({ message: "User not found" }, 404, corsHeaders)
            : json({ blocked: request.method === "POST" }, 200, corsHeaders);
        }
        if (!repository.setFollow) return json({ message: "Not found" }, 404, corsHeaders);
        const ok = await repository.setFollow(authUser, userId, request.method === "POST");
        if (!ok) return json({ message: "User not found" }, 404, corsHeaders);
        return new Response(null, { status: 204, headers: corsHeaders });
      }
      if (route === "profile") {
        if (!repository.getPublicProfile) return json({ message: "Not found" }, 404, corsHeaders);
        const result = await repository.getPublicProfile(userId);
        return result ? json(result, 200, corsHeaders) : json({ message: "User not found" }, 404, corsHeaders);
      }
    const { page, size } = parseSocialPage(query);
      let result: unknown = null;
      if (route === "followers") result = await repository.getFollowers?.(userId, page, size);
      else if (route === "following") result = await repository.getFollowing?.(userId, page, size);
      else if (route === "activity") result = await repository.getUserActivity?.(userId, page, size);
      else if (route === "lists") result = await repository.getPublicProfileLists?.(userId, page, size);
      else if (route === "liked-reviews") result = await repository.getPublicProfileLikedReviews?.(userId, page, size);
      else if (route.startsWith("collections/")) {
        result = await repository.getPublicProfileCollection?.(userId, socialProfileMatch![3] as "watched" | "watchlist" | "favorites", page, size);
      } else result = await repository.getPublicUser?.(userId);
      if (result === null || result === undefined) return json({ message: "User not found" }, 404, corsHeaders);
      return json(result, 200, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to load social profile", corsHeaders);
    }
  }

  return null;
}
