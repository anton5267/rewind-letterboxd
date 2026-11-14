import type { HttpRouteContext } from "../context.ts";
import { parseCommentText } from "../parsers/reviews.ts";
import { optionalInteger, parseRouteId } from "../parsers/query.ts";
import { confirmedAuthUser, json, repositoryFailure } from "../response.ts";

const REVIEW_COMMENTS_PATTERN = /^\/api\/reviews\/(\d+)\/comments$/;
const LIST_COMMENTS_PATTERN = /^\/api\/lists\/public\/(\d+)\/comments$/;
const COMMENT_PATTERN = /^\/api\/comments\/(\d+)$/;

export async function handleCommentRoutes(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, repository, authVerifier, corsHeaders } = context;
  const reviewMatch = path.match(REVIEW_COMMENTS_PATTERN);
  const listMatch = path.match(LIST_COMMENTS_PATTERN);
  const threadMatch = reviewMatch ?? listMatch;
  if (threadMatch) {
    const kind = reviewMatch ? "Review" : "List";
    const targetId = parseRouteId(threadMatch[1]);
    if (targetId === null) return json({ message: `Invalid ${kind.toLowerCase()} ID` }, 400, corsHeaders);
    if (request.method !== "GET" && request.method !== "POST") {
      corsHeaders.set("Allow", "GET, POST, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    if (request.method === "GET") {
      const load = reviewMatch ? repository.getReviewComments : repository.getListComments;
      if (!load) return json({ message: "Not found" }, 404, corsHeaders);
      const query = new URL(request.url).searchParams;
      const page = Math.max(0, optionalInteger(query.get("page"), 0));
      const size = Math.max(1, Math.min(optionalInteger(query.get("size"), 20), 50));
      try { return json(await load(targetId, page, size), 200, corsHeaders); }
      catch (error) { return repositoryFailure(error, "Unable to load comments", corsHeaders); }
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    const create = reviewMatch ? repository.createReviewComment : repository.createListComment;
    if (!create) return json({ message: "Not found" }, 404, corsHeaders);
    let body: unknown;
    try { body = await request.json(); }
    catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
    const text = parseCommentText(body);
    if (text === null) return json({ message: "Invalid comment details" }, 400, corsHeaders);
    try {
      const comment = await create(authUser, targetId, text);
      if (comment === "FORBIDDEN") return json({ message: reviewMatch ? "The review author does not allow this reply" : "The list owner does not allow this reply" }, 403, corsHeaders);
      return comment ? json(comment, 200, corsHeaders) : json({ message: `${kind} not found` }, 404, corsHeaders);
    } catch (error) { return repositoryFailure(error, "Unable to create comment", corsHeaders); }
  }

  const commentMatch = path.match(COMMENT_PATTERN);
  if (!commentMatch) return null;
  const commentId = parseRouteId(commentMatch[1]);
  if (commentId === null) return json({ message: "Invalid comment ID" }, 400, corsHeaders);
  if (request.method !== "PATCH" && request.method !== "DELETE") {
    corsHeaders.set("Allow", "PATCH, DELETE, OPTIONS");
    return json({ message: "Method not allowed" }, 405, corsHeaders);
  }
  const authUser = await confirmedAuthUser(request, authVerifier);
  if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
  try {
    if (request.method === "PATCH") {
      if (!repository.updateReviewComment) return json({ message: "Not found" }, 404, corsHeaders);
      let body: unknown;
      try { body = await request.json(); }
      catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
      const text = parseCommentText(body);
      if (text === null) return json({ message: "Invalid comment details" }, 400, corsHeaders);
      const comment = await repository.updateReviewComment(authUser, commentId, text);
      if (comment === "FORBIDDEN") return json({ message: "You cannot change this comment" }, 403, corsHeaders);
      return comment ? json(comment, 200, corsHeaders) : json({ message: "Comment not found" }, 404, corsHeaders);
    }
    if (!repository.deleteReviewComment) return json({ message: "Not found" }, 404, corsHeaders);
    const result = await repository.deleteReviewComment(authUser, commentId);
    if (result === "FORBIDDEN") return json({ message: "You cannot change this comment" }, 403, corsHeaders);
    return result === "OK" ? new Response(null, { status: 204, headers: corsHeaders }) : json({ message: "Comment not found" }, 404, corsHeaders);
  } catch (error) { return repositoryFailure(error, "Unable to update comment", corsHeaders); }
}
