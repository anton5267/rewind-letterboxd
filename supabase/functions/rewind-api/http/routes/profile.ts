import type { HttpRouteContext } from "../context.ts";
import type { SocialLinkResponse } from "../../contracts/social.ts";
import { optionalInteger } from "../parsers/query.ts";
import { parseProfileUpdate } from "../parsers/profile.ts";
import { confirmedAuthUser, json, repositoryFailure } from "../response.ts";
import { RewindApiError } from "../errors.ts";

const MY_PROFILE_PATH = "/api/profile/me";
const MY_PROFILE_PASSWORD_PATH = "/api/profile/me/password";
const MY_SOCIAL_LINKS_PATH = "/api/profile/me/social-links";
const MY_PROFILE_COLLECTION_PATTERN = /^\/api\/profile\/me\/(watched|watchlist|favorites|ratings|reviews)$/;

export async function handleProfileRoutes(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, query, corsHeaders, repository, authVerifier } = context;

  if (path === MY_SOCIAL_LINKS_PATH) {
    if (request.method !== "GET" && request.method !== "PUT") {
      corsHeaders.set("Allow", "GET, PUT, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    try {
      if (request.method === "GET") {
        if (!repository.getMySocialLinks) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.getMySocialLinks(authUser), 200, corsHeaders);
      }
      if (!repository.updateMySocialLinks) return json({ message: "Not found" }, 404, corsHeaders);
      let body: unknown;
      try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
      if (!Array.isArray(body) || body.length > 8) return json({ message: "Invalid social links" }, 400, corsHeaders);
      const links: SocialLinkResponse[] = [];
      const platforms = new Set<string>();
      for (const value of body) {
        if (!value || typeof value !== "object") return json({ message: "Invalid social links" }, 400, corsHeaders);
        const platform = (value as { platform?: unknown }).platform;
        const url = (value as { url?: unknown }).url;
        if (typeof platform !== "string" || typeof url !== "string") return json({ message: "Invalid social links" }, 400, corsHeaders);
        const normalizedPlatform = platform.trim().toLowerCase();
        const normalizedUrl = url.trim();
        if (!normalizedPlatform || normalizedPlatform.length > 30 || !["website", "instagram", "tiktok", "letterboxd"].includes(normalizedPlatform)
          || platforms.has(normalizedPlatform) || normalizedUrl.length > 255 || !/^https?:\/\/\S+$/i.test(normalizedUrl)) {
          return json({ message: "Invalid social links" }, 400, corsHeaders);
        }
        platforms.add(normalizedPlatform);
        links.push({ platform: normalizedPlatform, url: normalizedUrl });
      }
      return json(await repository.updateMySocialLinks(authUser, links), 200, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to update social links", corsHeaders);
    }
  }

  if (path === MY_PROFILE_PASSWORD_PATH) {
    if (request.method !== "PUT") {
      corsHeaders.set("Allow", "PUT, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!bearer || !authVerifier) return json({ message: "Authentication required" }, 401, corsHeaders);
    const authUser = await authVerifier.verifyAccessToken(bearer);
    if (!authUser || !authUser.emailConfirmed) return json({ message: "Authentication required" }, 401, corsHeaders);
    if (!authVerifier.changePassword) return json({ message: "Not found" }, 404, corsHeaders);
    let body: unknown;
    try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
    const currentPassword = body && typeof body === "object" ? (body as Record<string, unknown>).currentPassword : null;
    const newPassword = body && typeof body === "object" ? (body as Record<string, unknown>).newPassword : null;
    if (typeof currentPassword !== "string" || !currentPassword.trim()
      || typeof newPassword !== "string" || newPassword.trim().length === 0
      || newPassword.length < 8 || newPassword.length > 72
      || new TextEncoder().encode(newPassword).length > 72) {
      return json({ message: "Invalid password" }, 400, corsHeaders);
    }
    try {
      await authVerifier.changePassword(authUser, currentPassword, newPassword);
      return json("Password changed", 200, corsHeaders);
    } catch (error) {
      if (error instanceof RewindApiError && error.status >= 400 && error.status < 500) {
        return json({ message: error.message }, error.status, corsHeaders);
      }
      return json({ message: "Authentication service is temporarily unavailable" }, 503, corsHeaders);
    }
  }

  const profileCollectionMatch = path.match(MY_PROFILE_COLLECTION_PATTERN);

  if (path === MY_PROFILE_PATH || profileCollectionMatch) {
    const isProfileUpdate = path === MY_PROFILE_PATH && request.method === "PATCH";
    const isAccountDelete = path === MY_PROFILE_PATH && request.method === "DELETE";
    if (request.method !== "GET" && !isProfileUpdate && !isAccountDelete) {
      corsHeaders.set("Allow", path === MY_PROFILE_PATH ? "GET, PATCH, DELETE, OPTIONS" : "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!bearer || !authVerifier) return json({ message: "Authentication required" }, 401, corsHeaders);
    try {
      const authUser = await authVerifier.verifyAccessToken(bearer);
      if (!authUser || !authUser.emailConfirmed) return json({ message: "Authentication required" }, 401, corsHeaders);
      if (path === MY_PROFILE_PATH) {
        if (isAccountDelete) {
          if (!repository.deleteMyAccount || !authVerifier.verifyCurrentPassword) return json({ message: "Not found" }, 404, corsHeaders);
          let body: unknown;
          try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
          const currentPassword = body && typeof body === "object" ? (body as Record<string, unknown>).currentPassword : null;
          if (typeof currentPassword !== "string" || !currentPassword.trim()) return json({ message: "Current password is required" }, 400, corsHeaders);
          try {
            await authVerifier.verifyCurrentPassword(authUser, currentPassword);
            const deleted = await repository.deleteMyAccount(authUser);
            if (!deleted) return json({ message: "The REWIND profile is unavailable" }, 409, corsHeaders);
            // Profile deletion is already committed with an outbox record, so provider cleanup
            // failure is retried asynchronously and must not reverse the completed deletion.
            try { await authVerifier.processPendingIdentityDeletion?.(); } catch { /* durable outbox retry */ }
            return new Response(null, { status: 204, headers: corsHeaders });
          } catch (error) {
            if (error instanceof RewindApiError && error.status >= 400 && error.status < 500) {
              return json({ message: error.message }, error.status, corsHeaders);
            }
            return json({ message: "Unable to delete account" }, 503, corsHeaders);
          }
        }
        if (!repository.getMyProfile) return json({ message: "Not found" }, 404, corsHeaders);
        if (isProfileUpdate) {
          if (!repository.updateMyProfile) return json({ message: "Not found" }, 404, corsHeaders);
          let body: unknown;
          try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
          const update = parseProfileUpdate(body);
          if (!update) return json({ message: "Invalid profile fields" }, 400, corsHeaders);
          await repository.updateMyProfile(authUser, update);
        }
        return json(await repository.getMyProfile(authUser), 200, corsHeaders);
      }
      if (!repository.getMyProfileCollection) return json({ message: "Not found" }, 404, corsHeaders);
      const query = new URL(request.url).searchParams;
      const rawPage = query.get("page");
      const page = rawPage === null ? 0 : optionalInteger(rawPage, -1);
      if (page < 0 || page > 1000) return json({ message: "Invalid page" }, 400, corsHeaders);
      const requestedSize = optionalInteger(query.get("size"), 20);
      if (requestedSize < 1) return json({ message: "Invalid page size" }, 400, corsHeaders);
      const size = Math.min(requestedSize, 50);
      return json(await repository.getMyProfileCollection(authUser, profileCollectionMatch![1], page, size), 200, corsHeaders);
    } catch {
      return json({ message: "Unable to load profile" }, 500, corsHeaders);
    }
  }

  return null;
}

export async function handleCurrentUserRoute(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, corsHeaders, repository, authVerifier } = context;

  if (path === "/api/users/me") {
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!bearer || !authVerifier || !repository.getOrCreateCurrentUser) {
      return json({ message: "Authentication required" }, 401, corsHeaders);
    }
    try {
      const authUser = await authVerifier.verifyAccessToken(bearer);
      if (!authUser || !authUser.emailConfirmed) return json({ message: "Authentication required" }, 401, corsHeaders);
      const user = await repository.getOrCreateCurrentUser(authUser);
      return json(user, 200, corsHeaders);
    } catch (error) {
      if (error instanceof RewindApiError) return json({ message: error.message }, error.status, corsHeaders);
      return json({ message: "Unable to load account" }, 409, corsHeaders);
    }
  }

  return null;
}
