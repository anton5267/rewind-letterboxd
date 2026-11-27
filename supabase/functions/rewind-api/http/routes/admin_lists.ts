import type { HttpRouteContext } from "../context.ts";
import type { FeaturedListCategory } from "../../contracts/lists.ts";
import type { AdminListTextUpdateRequest } from "../../contracts/admin.ts";
import { INVALID_QUERY, parseAdminPage, parseOptionalBoolean, parseRouteId } from "../parsers/query.ts";
import { confirmedAuthUser, json, repositoryFailure } from "../response.ts";

const ADMIN_LISTS_PATH = "/api/admin/lists";
const ADMIN_LIST_PATTERN = /^\/api\/admin\/lists\/(\d+)(?:\/(visibility|featured|featured-position))?$/;
const ADMIN_LIST_FILM_PATTERN = /^\/api\/admin\/lists\/(\d+)\/items$/;
const FEATURED_CATEGORIES = new Set<FeaturedListCategory>(["REWIND_COMMUNITY", "OTHER_TOP_FILM_LISTS", "FILMMAKER_RECOMMENDATIONS"]);

function parseAdminListTextUpdate(value: unknown): AdminListTextUpdateRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const keys = Object.keys(body);
  if (keys.length === 0 || keys.some(key => key !== "name" && key !== "description")) return null;
  const update: AdminListTextUpdateRequest = {};
  if (Object.hasOwn(body, "name")) {
    if (typeof body.name !== "string" || body.name.trim().length === 0 || body.name.length > 120) return null;
    update.name = body.name;
  }
  if (Object.hasOwn(body, "description")) {
    if (body.description !== null && (typeof body.description !== "string" || body.description.length > 5000)) return null;
    update.description = body.description as string | null;
  }
  return update;
}

function parseAdminListFilmAddition(value: unknown): number | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (Object.keys(body).length !== 1 || !Object.hasOwn(body, "movieId")) return null;
  return typeof body.movieId === "number" && Number.isSafeInteger(body.movieId) && body.movieId > 0 ? body.movieId : null;
}

export async function handleAdminListRoutes(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, query, corsHeaders, repository, authVerifier } = context;

  const adminListFilmMatch = path.match(ADMIN_LIST_FILM_PATTERN);
  if (adminListFilmMatch) {
    if (request.method !== "POST") {
      corsHeaders.set("Allow", "POST, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    const listId = parseRouteId(adminListFilmMatch[1]);
    if (listId === null) return json({ message: "Invalid list ID" }, 400, corsHeaders);
    let body: unknown;
    try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
    const movieId = parseAdminListFilmAddition(body);
    if (movieId === null) return json({ message: "Invalid movie ID" }, 400, corsHeaders);
    if (!repository.addAdminListMovie) return json({ message: "Not found" }, 404, corsHeaders);
    try {
      const result = await repository.addAdminListMovie(authUser, listId, movieId);
      if (result === "NOT_FOUND") return json({ message: "List not found" }, 404, corsHeaders);
      if (result === "SYSTEM_LIST") return json({ message: "System lists cannot be edited" }, 400, corsHeaders);
      if (result === "UNPUBLISHED") return json({ message: "Only published films can be added" }, 409, corsHeaders);
      if (result === "DUPLICATE") return json({ message: "Film is already in this list" }, 409, corsHeaders);
      return json(result, 200, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to add film to list", corsHeaders);
    }
  }

  const adminListMatch = path.match(ADMIN_LIST_PATTERN);

  if (path === ADMIN_LISTS_PATH || adminListMatch) {
    const isVisibilityRoute = adminListMatch?.[2] === "visibility";
    const isFeaturedRoute = adminListMatch?.[2] === "featured";
    const isFeaturedPositionRoute = adminListMatch?.[2] === "featured-position";
    const isDetailRoute = adminListMatch !== null && !isVisibilityRoute && !isFeaturedRoute && !isFeaturedPositionRoute;
    const allowed = adminListMatch
      ? isVisibilityRoute || isFeaturedRoute || isFeaturedPositionRoute ? ["PUT"] : ["GET", "PATCH", "DELETE"]
      : ["GET"];
    if (!allowed.includes(request.method)) {
      corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    try {
      if (!adminListMatch) {
        const page = parseAdminPage(query, 100, 50);
        if (!page) return json({ message: "Invalid page or size" }, 400, corsHeaders);
        if (!repository.getAdminLists) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.getAdminLists(authUser, page.page, page.size), 200, corsHeaders);
      }
      const id = parseRouteId(adminListMatch[1]);
      if (id === null) return json({ message: "Invalid list ID" }, 400, corsHeaders);
      if (isDetailRoute && request.method === "GET") {
        const rawReportId = query.get("reportId");
        let reportId: number | undefined;
        if (rawReportId !== null) {
          const parsedReportId = parseRouteId(rawReportId);
          if (parsedReportId === null) return json({ message: "Invalid report ID" }, 400, corsHeaders);
          reportId = parsedReportId;
        }
        if (!repository.getAdminListDetails) return json({ message: "Not found" }, 404, corsHeaders);
        const details = await repository.getAdminListDetails(authUser, id, reportId);
        return details ? json(details, 200, corsHeaders) : json({ message: "List or open report not found" }, 404, corsHeaders);
      }
      if (isDetailRoute && request.method === "PATCH") {
        if (!repository.updateAdminListDetails) return json({ message: "Not found" }, 404, corsHeaders);
        let body: unknown;
        try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        const update = parseAdminListTextUpdate(body);
        if (!update) return json({ message: "Invalid list update" }, 400, corsHeaders);
        const details = await repository.updateAdminListDetails(authUser, id, update);
        return details ? json(details, 200, corsHeaders) : json({ message: "Custom list not found" }, 404, corsHeaders);
      }
      if (isFeaturedPositionRoute) {
        const direction = query.get("direction");
        if (direction !== "up" && direction !== "down") return json({ message: "Invalid featured direction" }, 400, corsHeaders);
        if (!repository.moveAdminListFeatured) return json({ message: "Not found" }, 404, corsHeaders);
        const result = await repository.moveAdminListFeatured(authUser, id, direction);
        if (result === "NOT_FOUND") return json({ message: "List not found" }, 404, corsHeaders);
        if (result === "NOT_ELIGIBLE") return json({ message: "Only active public custom lists can be reordered" }, 409, corsHeaders);
        if (result === "BOUNDARY") return json({ message: "List is already at that end of the featured order" }, 409, corsHeaders);
        return new Response(null, { status: 204, headers: corsHeaders });
      }
      if (isVisibilityRoute || isFeaturedRoute) {
        const visible = parseOptionalBoolean(query.get("visible"));
        const value = isFeaturedRoute ? parseOptionalBoolean(query.get("featured")) : visible;
        if (value === null || value === INVALID_QUERY) return json({ message: isFeaturedRoute ? "Invalid featured value" : "Invalid visibility" }, 400, corsHeaders);
        const rawCategory = query.get("category");
        const category = rawCategory === null ? undefined : FEATURED_CATEGORIES.has(rawCategory as FeaturedListCategory)
          ? rawCategory as FeaturedListCategory : null;
        if (isFeaturedRoute && category === null) return json({ message: "Invalid featured category" }, 400, corsHeaders);
        const operation = isFeaturedRoute ? repository.setAdminListFeatured : repository.setAdminListVisibility;
        if (!operation) return json({ message: "Not found" }, 404, corsHeaders);
        const result = isFeaturedRoute
          ? await repository.setAdminListFeatured!(authUser, id, value, category ?? undefined)
          : await repository.setAdminListVisibility!(authUser, id, value);
        if (result === "NOT_ELIGIBLE") return json({ message: "Only active public custom lists can be featured" }, 409, corsHeaders);
        return result ? json(result, 200, corsHeaders) : json({ message: "List not found" }, 404, corsHeaders);
      }
      if (!repository.deleteAdminList) return json({ message: "Not found" }, 404, corsHeaders);
      const result = await repository.deleteAdminList(authUser, id);
      if (result === "NOT_FOUND") return json({ message: "List not found" }, 404, corsHeaders);
      if (result === "SYSTEM_LIST") return json({ message: "System lists cannot be deleted" }, 400, corsHeaders);
      return new Response(null, { status: 204, headers: corsHeaders });
    } catch (error) {
      return repositoryFailure(error, "Unable to manage list", corsHeaders);
    }
  }

  return null;
}
