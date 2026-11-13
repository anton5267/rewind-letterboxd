import type { HttpRouteContext } from "../context.ts";
import { INVALID_QUERY, parseAdminPage, parseOptionalBoolean, parseOptionalLong, parseRouteId } from "../parsers/query.ts";
import { parseBulkModeration, parseModerationReason } from "../parsers/admin.ts";
import { parseAdminReviewContentUpdate } from "../parsers/reviews.ts";
import { confirmedAuthUser, json, repositoryFailure } from "../response.ts";

const ADMIN_REPORTED_REVIEWS_PATH = "/api/admin/reported-reviews";

const ADMIN_REPORTED_REVIEW_DISMISS_PATTERN = /^\/api\/admin\/reported-reviews\/(\d+)\/dismiss$/;

const ADMIN_REPORTED_COMMENTS_PATH = "/api/admin/reported-comments";

const ADMIN_REPORTED_COMMENT_DISMISS_PATTERN = /^\/api\/admin\/reported-comments\/(\d+)\/dismiss$/;

const ADMIN_REPORTED_LISTS_PATH = "/api/admin/reported-lists";

const ADMIN_REPORTED_LIST_DISMISS_PATTERN = /^\/api\/admin\/reported-lists\/(\d+)\/dismiss$/;

const ADMIN_REVIEW_PATTERN = /^\/api\/admin\/reviews(?:\/(\d+)(?:\/(hide|unhide))?)?$/;

const ADMIN_COMMENT_PATTERN = /^\/api\/admin\/comments(?:\/(\d+)(?:\/(hide|unhide))?)?$/;

export async function handleAdminReviewRoutes(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, query, corsHeaders, repository, authVerifier } = context;

  const adminReviewMatch = path.match(ADMIN_REVIEW_PATTERN);

  const adminCommentMatch = path.match(ADMIN_COMMENT_PATTERN);

  const dismissReviewReportMatch = path.match(ADMIN_REPORTED_REVIEW_DISMISS_PATTERN);

  const dismissCommentReportMatch = path.match(ADMIN_REPORTED_COMMENT_DISMISS_PATTERN);

  const dismissListReportMatch = path.match(ADMIN_REPORTED_LIST_DISMISS_PATTERN);

  const reportQueue = path === ADMIN_REPORTED_REVIEWS_PATH
    ? { kind: "review", load: repository.getAdminReportedReviews, dismiss: repository.dismissAdminReviewReport }
    : path === ADMIN_REPORTED_COMMENTS_PATH
      ? { kind: "comment", load: repository.getAdminReportedComments, dismiss: repository.dismissAdminCommentReport }
      : path === ADMIN_REPORTED_LISTS_PATH
        ? { kind: "list", load: repository.getAdminReportedLists, dismiss: repository.dismissAdminListReport }
        : null;

  const dismissMatch = dismissReviewReportMatch ?? dismissCommentReportMatch ?? dismissListReportMatch;

  if (dismissMatch) {
    if (request.method !== "POST") {
      corsHeaders.set("Allow", "POST, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    const reportId = parseRouteId(dismissMatch[1]);
    if (reportId === null) return json({ message: "Invalid report ID" }, 400, corsHeaders);
    const dismiss = dismissReviewReportMatch ? repository.dismissAdminReviewReport
      : dismissCommentReportMatch ? repository.dismissAdminCommentReport : repository.dismissAdminListReport;
    if (!dismiss) return json({ message: "Not found" }, 404, corsHeaders);
    try {
      if (!await dismiss(authUser, reportId)) return json({ message: "Report not found" }, 404, corsHeaders);
      return new Response(null, { status: 204, headers: corsHeaders });
    } catch (error) {
      return repositoryFailure(error, "Unable to dismiss report", corsHeaders);
    }
  }

  if (reportQueue) {
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    const page = parseAdminPage(query);
    if (!page) return json({ message: "Invalid page or size" }, 400, corsHeaders);
    if (!reportQueue.load) return json({ message: "Not found" }, 404, corsHeaders);
    try {
      return json(await reportQueue.load(authUser, page.page, page.size), 200, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, `Unable to load reported ${reportQueue.kind}s`, corsHeaders);
    }
  }

  if (adminReviewMatch || adminCommentMatch) {
    const isReview = adminReviewMatch !== null;
    const match = (adminReviewMatch ?? adminCommentMatch)!;
    const rootPath = isReview ? "/api/admin/reviews" : "/api/admin/comments";
    const idText = match[1] ?? null;
    const action = match[2] ?? null;
    const allowed = idText === null ? ["GET"] : action ? ["POST"] : isReview ? ["PATCH", "DELETE"] : ["DELETE"];
    if (!allowed.includes(request.method)) {
      corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    const id = idText === null ? null : parseRouteId(idText);
    if (idText !== null && id === null) return json({ message: "Invalid moderation item ID" }, 400, corsHeaders);
    try {
      if (id === null) {
        if (path !== rootPath) return json({ message: "Not found" }, 404, corsHeaders);
        const page = parseAdminPage(query);
        if (!page) return json({ message: "Invalid page or size" }, 400, corsHeaders);
        const hidden = parseOptionalBoolean(query.get("hidden"));
        if (hidden === INVALID_QUERY) return json({ message: "Invalid hidden filter" }, 400, corsHeaders);
        if (isReview) {
          const movieId = parseOptionalLong(query.get("movieId"));
          const userId = parseOptionalLong(query.get("userId"));
          if (movieId === INVALID_QUERY || userId === INVALID_QUERY) return json({ message: "Invalid review filter" }, 400, corsHeaders);
          if (!repository.getAdminReviews) return json({ message: "Not found" }, 404, corsHeaders);
          return json(await repository.getAdminReviews(authUser, { movieId, userId, hidden }, page.page, page.size), 200, corsHeaders);
        }
        if (!repository.getAdminComments) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.getAdminComments(authUser, hidden, page.page, page.size), 200, corsHeaders);
      }
      if (action) {
        const hiddenValue = action === "hide";
        let reason: string | null = null;
        if (hiddenValue) {
          let body: unknown;
          try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
          const parsedReason = parseModerationReason(body, 255);
          if (parsedReason === false) return json({ message: "Invalid moderation reason" }, 400, corsHeaders);
          reason = parsedReason;
        }
        const result = isReview
          ? await repository.setAdminReviewHidden?.(authUser, id, hiddenValue, reason)
          : await repository.setAdminCommentHidden?.(authUser, id, hiddenValue, reason);
        if (!result) return json({ message: `${isReview ? "Review" : "Comment"} not found` }, 404, corsHeaders);
        return json(result, 200, corsHeaders);
      }
      if (request.method === "PATCH") {
        if (!isReview) return json({ message: "Not found" }, 404, corsHeaders);
        if (!repository.updateAdminReviewContent) return json({ message: "Not found" }, 404, corsHeaders);
        let body: unknown;
        try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        const content = parseAdminReviewContentUpdate(body);
        if (content === null) return json({ message: "Invalid review content" }, 400, corsHeaders);
        const updated = await repository.updateAdminReviewContent(authUser, id, content);
        return updated ? json(updated, 200, corsHeaders) : json({ message: "Review not found" }, 404, corsHeaders);
      }
      const deleted = isReview
        ? await repository.deleteAdminReview?.(authUser, id)
        : await repository.deleteAdminComment?.(authUser, id);
      if (deleted === undefined) return json({ message: "Not found" }, 404, corsHeaders);
      if (!deleted) return json({ message: `${isReview ? "Review" : "Comment"} not found` }, 404, corsHeaders);
      return new Response(null, { status: 204, headers: corsHeaders });
    } catch (error) {
      return repositoryFailure(error, `Unable to manage ${isReview ? "review" : "comment"}`, corsHeaders);
    }
  }

  return null;
}

const ADMIN_MODERATION_HIDE_PATTERN = /^\/api\/admin\/moderation\/([^/]+)\/(\d+)\/hide$/;

const ADMIN_MODERATION_QUEUE_PATH = "/api/admin/moderation/queue";

const ADMIN_MODERATION_BULK_PATH = "/api/admin/moderation/bulk-hide";

export async function handleAdminModerationRoutes(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, query, corsHeaders, repository, authVerifier } = context;

  if (path === ADMIN_MODERATION_QUEUE_PATH || path === ADMIN_MODERATION_BULK_PATH || path.match(ADMIN_MODERATION_HIDE_PATTERN)) {
    const hideMatch = path.match(ADMIN_MODERATION_HIDE_PATTERN);
    const allowed = path === ADMIN_MODERATION_QUEUE_PATH ? ["GET"] : ["POST"];
    if (!allowed.includes(request.method)) {
      corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    try {
      if (path === ADMIN_MODERATION_QUEUE_PATH) {
        const page = parseAdminPage(query);
        if (!page) return json({ message: "Invalid page or size" }, 400, corsHeaders);
        const rawType = query.get("type")?.trim();
        const type = rawType ? rawType.toUpperCase() : null;
        if (type !== null && type !== "REVIEW" && type !== "COMMENT") return json({ message: "Unsupported moderation item type" }, 400, corsHeaders);
        if (!repository.getAdminModerationQueue) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.getAdminModerationQueue(authUser, type, query.get("query"), page.page, page.size), 200, corsHeaders);
      }
      let body: unknown;
      try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
      if (path === ADMIN_MODERATION_BULK_PATH) {
        const parsed = parseBulkModeration(body);
        if (!parsed) return json({ message: "Invalid bulk moderation request" }, 400, corsHeaders);
        if (!repository.bulkHideAdminModeration) return json({ message: "Not found" }, 404, corsHeaders);
        return json({ hidden: await repository.bulkHideAdminModeration(authUser, parsed.items, parsed.reason) }, 200, corsHeaders);
      }
      const type = hideMatch![1].toUpperCase();
      const id = parseRouteId(hideMatch![2]);
      if (type !== "REVIEW" && type !== "COMMENT") return json({ message: "Unsupported moderation item type" }, 400, corsHeaders);
      if (id === null) return json({ message: "Invalid moderation item ID" }, 400, corsHeaders);
      const reason = parseModerationReason(body, 255);
      if (reason === false) return json({ message: "Invalid moderation reason" }, 400, corsHeaders);
      if (!repository.hideAdminModerationItem) return json({ message: "Not found" }, 404, corsHeaders);
      await repository.hideAdminModerationItem(authUser, type, id, reason);
      return new Response(null, { status: 200, headers: corsHeaders });
    } catch (error) {
      return repositoryFailure(error, "Unable to manage moderation queue", corsHeaders);
    }
  }

  return null;
}
