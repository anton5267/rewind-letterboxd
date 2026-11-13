import type { HttpRouteContext } from "../context.ts";
import { INVALID_QUERY, parseAdminPage, parseOptionalBoolean, parseRouteId } from "../parsers/query.ts";
import { confirmedAuthUser, json, repositoryFailure } from "../response.ts";

const ADMIN_LISTS_PATH = "/api/admin/lists";
const ADMIN_LIST_PATTERN = /^\/api\/admin\/lists\/(\d+)(?:\/(visibility|featured|featured-position))?$/;

export async function handleAdminListRoutes(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, query, corsHeaders, repository, authVerifier } = context;

  const adminListMatch = path.match(ADMIN_LIST_PATTERN);

  if (path === ADMIN_LISTS_PATH || adminListMatch) {
    const isVisibilityRoute = adminListMatch?.[2] === "visibility";
    const isFeaturedRoute = adminListMatch?.[2] === "featured";
    const isFeaturedPositionRoute = adminListMatch?.[2] === "featured-position";
    const allowed = adminListMatch ? (isVisibilityRoute || isFeaturedRoute || isFeaturedPositionRoute ? ["PUT"] : ["DELETE"]) : ["GET"];
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
        const operation = isFeaturedRoute ? repository.setAdminListFeatured : repository.setAdminListVisibility;
        if (!operation) return json({ message: "Not found" }, 404, corsHeaders);
        const result = isFeaturedRoute
          ? await repository.setAdminListFeatured!(authUser, id, value)
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
