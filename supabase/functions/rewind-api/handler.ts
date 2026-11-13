import type { InternalWorkerHandler, RewindAuthVerifier } from "./contracts/auth.ts";
import type { RewindApiRepository } from "./contracts/repository.ts";
import { apiPath, json } from "./http/response.ts";

import { handleAdminModerationRoutes, handleAdminReviewRoutes } from "./http/routes/admin_moderation.ts";
import { handleAdminListRoutes } from "./http/routes/admin_lists.ts";
import { handleAdminMovieRoutes } from "./http/routes/admin_movies.ts";
import { handleAdminAccountRoutes } from "./http/routes/admin_accounts.ts";
import { handleAdminCommunicationRoutes } from "./http/routes/admin_communication.ts";
import { handleJournalRoutes } from "./http/routes/journal.ts";
import { handleCommunicationRoutes } from "./http/routes/communication.ts";
import { handleSocialRoutes } from "./http/routes/social.ts";
import { handleListRoutes } from "./http/routes/lists.ts";
import { handleReviewRoutes } from "./http/routes/reviews.ts";
import { handleCurrentUserRoute, handleProfileRoutes } from "./http/routes/profile.ts";
import { handleMovieRatingRoutes, handleMovieStatusRoutes } from "./http/routes/movie_actions.ts";
import { handleCatalogRoutes } from "./http/routes/catalog.ts";

export type * from "./contracts/catalog.ts";
export type * from "./contracts/auth.ts";
export type * from "./contracts/profile.ts";
export type * from "./contracts/social.ts";
export type * from "./contracts/journal.ts";
export type * from "./contracts/reviews.ts";
export type * from "./contracts/lists.ts";
export type * from "./contracts/repository.ts";
export type * from "./contracts/admin.ts";
export { RewindApiError } from "./http/errors.ts";
export { parseSafeCount } from "./http/parsers/query.ts";

const routeHandlers = [
  handleAdminReviewRoutes,
  handleAdminListRoutes,
  handleAdminMovieRoutes,
  handleAdminAccountRoutes,
  handleAdminModerationRoutes,
  handleAdminCommunicationRoutes,
  handleJournalRoutes,
  handleCommunicationRoutes,
  handleSocialRoutes,
  handleListRoutes,
  handleReviewRoutes,
  handleProfileRoutes,
  handleMovieStatusRoutes,
  handleCurrentUserRoute,
  handleMovieRatingRoutes,
  handleCatalogRoutes,
];

export function createRewindApiHandler(
  repository: RewindApiRepository,
  allowedOrigins: readonly string[],
  authVerifier?: RewindAuthVerifier,
  internalWorker?: InternalWorkerHandler,
): (request: Request) => Promise<Response> {
  const origins = new Set(allowedOrigins);

  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("Origin");

    if (origin && !origins.has(origin)) {
      return json({ message: "Origin is not allowed" }, 403, { Vary: "Origin" });
    }

    const corsHeaders = new Headers({
      Vary: "Origin",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, apikey, Content-Type, X-Client-Info",
      "Access-Control-Max-Age": "600",
    });

    if (origin) corsHeaders.set("Access-Control-Allow-Origin", origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const pathname = new URL(request.url).pathname.replace(/\/+$/, "");

    const path = apiPath(pathname);

    if (path === "/internal/tmdb-refresh" || pathname.endsWith("/internal/tmdb-refresh")) {
      if (request.method !== "POST") {
        return json({ message: "Method not allowed" }, 405, { Allow: "POST" });
      }
      if (!internalWorker) return json({ message: "Not found" }, 404);
      try { return await internalWorker(request); }
      catch { return json({ message: "Unable to refresh catalog" }, 503); }
    }

    const query = new URL(request.url).searchParams;

    const context = { request, path, query, corsHeaders, repository, authVerifier };
    for (const handleRoute of routeHandlers) {
      const response = await handleRoute(context);
      if (response) return response;
    }

    return json({ message: "Not found" }, 404, corsHeaders);
  };
}
