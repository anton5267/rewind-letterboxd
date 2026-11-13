import type { HttpRouteContext } from "../context.ts";
import { optionalInteger, parseRouteId } from "../parsers/query.ts";
import { parseAddListMovie, parseCreateMyList, parseOrderedItemIds, parseUpdateMyList } from "../parsers/lists.ts";
import { PUBLIC_CATALOG_CACHE, confirmedAuthUser, json, repositoryFailure } from "../response.ts";

const PUBLIC_LIST_FEED_PATTERN = /^\/api\/lists\/public(?:\/(popular|recently-liked|team|featured))?$/;
const PUBLIC_LIST_DETAILS_PATTERN = /^\/api\/lists\/public\/(\d+)(?:\/(like-status))?$/;
const PUBLIC_LIST_LIKE_PATTERN = /^\/api\/lists\/(\d+)\/likes$/;
const POPULAR_TAGS_PATH = "/api/tags/popular";
const MY_LISTS_PATH = "/api/lists/my";
const MY_LISTS_PAGE_PATH = "/api/lists/my/page";
const LIST_ID_PATTERN = /^\/api\/lists\/(\d+)$/;
const LIST_ITEMS_PATTERN = /^\/api\/lists\/(\d+)\/items$/;
const LIST_REORDER_PATTERN = /^\/api\/lists\/(\d+)\/items\/reorder$/;
const LIST_ADD_MOVIE_PATTERN = /^\/api\/lists\/(\d+)\/(?:items|movies)$/;
const LIST_REMOVE_MOVIE_PATTERN = /^\/api\/lists\/(\d+)\/(?:items|movies)\/(\d+)$/;

export async function handleListRoutes(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, query, corsHeaders, repository, authVerifier } = context;

  if (path === POPULAR_TAGS_PATH) {
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    if (!repository.getPopularTags) return json({ message: "Not found" }, 404, corsHeaders);
    const query = new URL(request.url).searchParams;
    const rawSize = query.get("size");
    const requestedSize = rawSize === null ? 20 : optionalInteger(rawSize, -2147483649);
    if (requestedSize < -2147483648 || requestedSize > 2147483647) return json({ message: "Invalid size" }, 400, corsHeaders);
    try {
      const tags = await repository.getPopularTags(Math.max(1, Math.min(requestedSize, 30)));
      corsHeaders.set("Cache-Control", PUBLIC_CATALOG_CACHE);
      return json(tags, 200, corsHeaders);
    } catch {
      return json({ message: "Unable to load tags" }, 500, corsHeaders);
    }
  }

  const publicListFeedMatch = path.match(PUBLIC_LIST_FEED_PATTERN);

  if (publicListFeedMatch) {
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    if (!repository.getPublicLists) return json({ message: "Not found" }, 404, corsHeaders);
    const query = new URL(request.url).searchParams;
    const rawPage = query.get("page");
    const requestedPage = rawPage === null ? 0 : optionalInteger(rawPage, -2147483649);
    const rawSize = query.get("size");
    const requestedSize = rawSize === null ? 20 : optionalInteger(rawSize, -2147483649);
    if (requestedPage < -2147483648 || requestedPage > 2147483647
      || requestedSize < -2147483648 || requestedSize > 2147483647) {
      return json({ message: "Invalid page or size" }, 400, corsHeaders);
    }
    const page = Math.max(0, requestedPage);
    const size = Math.max(1, Math.min(requestedSize, 50));
    const feed = (publicListFeedMatch[1] ?? "all") as "all" | "popular" | "recently-liked" | "team" | "featured";
    const tag = feed === "all" ? query.get("tag")?.trim().toLowerCase() || null : null;
    if (tag && tag.length > 60) return json({ message: "Invalid tag" }, 400, corsHeaders);
    try {
      const result = await repository.getPublicLists(feed, tag, page, size);
      corsHeaders.set("Cache-Control", PUBLIC_CATALOG_CACHE);
      return json(result, 200, corsHeaders);
    } catch {
      return json({ message: "Unable to load public lists" }, 500, corsHeaders);
    }
  }

  const publicListDetailsMatch = path.match(PUBLIC_LIST_DETAILS_PATTERN);

  if (publicListDetailsMatch) {
    const listId = Number(publicListDetailsMatch[1]);
    if (!Number.isSafeInteger(listId) || listId <= 0) return json({ message: "Invalid list ID" }, 400, corsHeaders);
    const isLikeStatus = publicListDetailsMatch[2] === "like-status";
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    if (isLikeStatus) {
      const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
      if (!bearer || !authVerifier) return json({ message: "Authentication required" }, 401, corsHeaders);
      try {
        const authUser = await authVerifier.verifyAccessToken(bearer);
        if (!authUser?.emailConfirmed) return json({ message: "Authentication required" }, 401, corsHeaders);
        if (!repository.getPublicListLikeStatus) return json({ message: "Not found" }, 404, corsHeaders);
        const result = await repository.getPublicListLikeStatus(authUser, listId);
        return result ? json(result, 200, corsHeaders) : json({ message: "Public list not found" }, 404, corsHeaders);
      } catch {
        return json({ message: "Unable to load list like status" }, 500, corsHeaders);
      }
    }
    if (!repository.getPublicList) return json({ message: "Not found" }, 404, corsHeaders);
    try {
      const result = await repository.getPublicList(listId);
      if (!result) return json({ message: "Public list not found" }, 404, corsHeaders);
      corsHeaders.set("Cache-Control", PUBLIC_CATALOG_CACHE);
      return json(result, 200, corsHeaders);
    } catch {
      return json({ message: "Unable to load public list" }, 500, corsHeaders);
    }
  }

  const publicListLikeMatch = path.match(PUBLIC_LIST_LIKE_PATTERN);

  if (publicListLikeMatch) {
    const listId = Number(publicListLikeMatch[1]);
    if (!Number.isSafeInteger(listId) || listId <= 0) return json({ message: "Invalid list ID" }, 400, corsHeaders);
    if (request.method !== "POST" && request.method !== "DELETE") {
      corsHeaders.set("Allow", "POST, DELETE, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const bearer = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!bearer || !authVerifier) return json({ message: "Authentication required" }, 401, corsHeaders);
    try {
      const authUser = await authVerifier.verifyAccessToken(bearer);
      if (!authUser?.emailConfirmed) return json({ message: "Authentication required" }, 401, corsHeaders);
      if (request.method === "POST") {
        if (!repository.likePublicList) return json({ message: "Not found" }, 404, corsHeaders);
        if (!await repository.likePublicList(authUser, listId)) return json({ message: "Public list not found" }, 404, corsHeaders);
      } else {
        if (!repository.unlikePublicList) return json({ message: "Not found" }, 404, corsHeaders);
        if (!await repository.unlikePublicList(authUser, listId)) return json({ message: "Public list not found" }, 404, corsHeaders);
      }
      return new Response(null, { status: 204, headers: corsHeaders });
    } catch {
      return json({ message: "Unable to update list like" }, 500, corsHeaders);
    }
  }

  const listIdMatch = path.match(LIST_ID_PATTERN);

  const listItemsMatch = path.match(LIST_ITEMS_PATTERN);

  const listReorderMatch = path.match(LIST_REORDER_PATTERN);

  const listAddMovieMatch = path.match(LIST_ADD_MOVIE_PATTERN);

  const listRemoveMovieMatch = path.match(LIST_REMOVE_MOVIE_PATTERN);

  const isMyListsRoute = path === MY_LISTS_PATH || path === MY_LISTS_PAGE_PATH;

  const isCreateListRoute = path === "/api/lists";

  if (isMyListsRoute || isCreateListRoute || listIdMatch || listItemsMatch || listReorderMatch || listAddMovieMatch || listRemoveMovieMatch) {
    const method = request.method;
    const allowed = isMyListsRoute ? ["GET"]
      : isCreateListRoute ? ["POST"]
      : listIdMatch ? ["PATCH", "DELETE"]
      : listReorderMatch ? ["PUT"]
      : listItemsMatch ? ["GET"]
      : listAddMovieMatch ? ["POST"]
      : ["DELETE"];
    if (!allowed.includes(method)) {
      corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    try {
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);

      if (isMyListsRoute) {
        if (path === MY_LISTS_PATH) {
          if (!repository.getMyLists) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.getMyLists(authUser), 200, corsHeaders);
        }
        if (!repository.getMyListsPage) return json({ message: "Not found" }, 404, corsHeaders);
        const query = new URL(request.url).searchParams;
        const rawPage = query.get("page");
        const rawSize = query.get("size");
        const requestedPage = rawPage === null ? 0 : optionalInteger(rawPage, -2147483649);
        const requestedSize = rawSize === null ? 12 : optionalInteger(rawSize, -2147483649);
        if (requestedPage < -2147483648 || requestedPage > 2147483647
          || requestedSize < -2147483648 || requestedSize > 2147483647) {
          return json({ message: "Invalid page or size" }, 400, corsHeaders);
        }
        return json(await repository.getMyListsPage(authUser, Math.max(0, requestedPage),
          Math.max(1, Math.min(requestedSize, 50))), 200, corsHeaders);
      }

      if (isCreateListRoute) {
        if (!repository.createMyList) return json({ message: "Not found" }, 404, corsHeaders);
        let value: unknown;
        try { value = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        const body = parseCreateMyList(value);
        if (!body) return json({ message: "Invalid list details" }, 400, corsHeaders);
        return json(await repository.createMyList(authUser, body), 200, corsHeaders);
      }

      if (listIdMatch) {
        const listId = parseRouteId(listIdMatch[1]);
        if (listId === null) return json({ message: "Invalid list ID" }, 400, corsHeaders);
        if (method === "PATCH") {
          if (!repository.updateMyList) return json({ message: "Not found" }, 404, corsHeaders);
          let value: unknown;
          try { value = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
          const body = parseUpdateMyList(value);
          if (!body) return json({ message: "Invalid list details" }, 400, corsHeaders);
          const updated = await repository.updateMyList(authUser, listId, body);
          return updated ? json(updated, 200, corsHeaders) : json({ message: "List not found" }, 404, corsHeaders);
        }
        if (!repository.deleteMyList) return json({ message: "Not found" }, 404, corsHeaders);
        const deleted = await repository.deleteMyList(authUser, listId);
        return deleted ? new Response(null, { status: 204, headers: corsHeaders })
          : json({ message: "List not found" }, 404, corsHeaders);
      }

      if (listReorderMatch) {
        const listId = parseRouteId(listReorderMatch[1]);
        if (listId === null) return json({ message: "Invalid list ID" }, 400, corsHeaders);
        if (!repository.reorderMyListItems) return json({ message: "Not found" }, 404, corsHeaders);
        let value: unknown;
        try { value = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        const orderedItemIds = parseOrderedItemIds(value);
        if (!orderedItemIds) return json({ message: "Invalid list item order" }, 400, corsHeaders);
        const result = await repository.reorderMyListItems(authUser, listId, orderedItemIds);
        if (result === "LIST_NOT_FOUND") return json({ message: "List not found" }, 404, corsHeaders);
        if (result === "INVALID_ORDER") return json({ message: "Invalid list item order" }, 400, corsHeaders);
        return new Response(null, { status: 200, headers: corsHeaders });
      }

      if (listItemsMatch) {
        const listId = parseRouteId(listItemsMatch[1]);
        if (listId === null) return json({ message: "Invalid list ID" }, 400, corsHeaders);
        if (!repository.getMyListItems) return json({ message: "Not found" }, 404, corsHeaders);
        const items = await repository.getMyListItems(authUser, listId);
        return items ? json(items, 200, corsHeaders) : json({ message: "List not found" }, 404, corsHeaders);
      }

      if (listAddMovieMatch) {
        const listId = parseRouteId(listAddMovieMatch[1]);
        if (listId === null) return json({ message: "Invalid list ID" }, 400, corsHeaders);
        if (!repository.addMovieToMyList) return json({ message: "Not found" }, 404, corsHeaders);
        let value: unknown;
        try { value = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        const body = parseAddListMovie(value);
        if (!body) return json({ message: "Invalid movie details" }, 400, corsHeaders);
        const result = await repository.addMovieToMyList(authUser, listId, body.movieId, body.position);
        if (result === "LIST_NOT_FOUND") return json({ message: "List not found" }, 404, corsHeaders);
        if (result === "MOVIE_NOT_FOUND") return json({ message: "Movie not found" }, 400, corsHeaders);
        return new Response(null, { status: 200, headers: corsHeaders });
      }

      const listId = parseRouteId(listRemoveMovieMatch![1]);
      const movieId = parseRouteId(listRemoveMovieMatch![2]);
      if (listId === null || movieId === null) return json({ message: "Invalid list or movie ID" }, 400, corsHeaders);
      if (!repository.removeMovieFromMyList) return json({ message: "Not found" }, 404, corsHeaders);
      const result = await repository.removeMovieFromMyList(authUser, listId, movieId);
      if (result === "LIST_NOT_FOUND") return json({ message: "List not found" }, 404, corsHeaders);
      if (result === "LAST_MOVIE") return json({ message: "A custom list must contain at least one movie" }, 400, corsHeaders);
      return new Response(null, { status: 204, headers: corsHeaders });
    } catch (error) {
      return repositoryFailure(error, "Unable to update lists", corsHeaders);
    }
  }

  return null;
}
