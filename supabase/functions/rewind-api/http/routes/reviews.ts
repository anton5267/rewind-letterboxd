import type { HttpRouteContext } from "../context.ts";
import { optionalInteger, parseRouteId } from "../parsers/query.ts";
import { parseCommentText, parseCreateReview, parseReviewReportReason, parseReviewUpdate } from "../parsers/reviews.ts";
import { confirmedAuthUser, json, repositoryFailure } from "../response.ts";

const PUBLIC_REVIEW_FEED_PATTERN = /^\/api\/reviews\/(recent|popular)$/;
const MOVIE_REVIEWS_PATTERN = /^\/api\/movies\/(\d+)\/reviews(?:\/(me))?$/;
const REVIEW_DETAILS_PATTERN = /^\/api\/reviews\/(\d+)$/;
const REVIEW_COMMENTS_PATTERN = /^\/api\/reviews\/(\d+)\/comments$/;
const REVIEW_LIKES_PATTERN = /^\/api\/reviews\/(\d+)\/(likes|like-status)$/;
const COMMENT_PATTERN = /^\/api\/comments\/(\d+)$/;
const REVIEW_REPORT_PATTERN = /^\/api\/reviews\/(\d+)\/report$/;
const COMMENT_REPORT_PATTERN = /^\/api\/comments\/(\d+)\/report$/;
const PUBLIC_LIST_REPORT_PATTERN = /^\/api\/lists\/public\/(\d+)\/report$/;

export async function handleReviewRoutes(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, query, corsHeaders, repository, authVerifier } = context;

  const reviewFeedMatch = path.match(PUBLIC_REVIEW_FEED_PATTERN);

  if (reviewFeedMatch) {
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    if (!repository.getPublicReviewFeed) return json({ message: "Not found" }, 404, corsHeaders);
    const query = new URL(request.url).searchParams;
    const page = Math.max(0, optionalInteger(query.get("page"), 0));
    const requestedSize = optionalInteger(query.get("size"), 6);
    const size = Math.max(1, Math.min(requestedSize, 20));
    try {
      return json(await repository.getPublicReviewFeed(reviewFeedMatch[1] as "recent" | "popular", page, size), 200, corsHeaders);
    } catch {
      return json({ message: "Unable to load reviews" }, 500, corsHeaders);
    }
  }

  const movieReviewsMatch = path.match(MOVIE_REVIEWS_PATTERN);

  if (movieReviewsMatch) {
    const movieId = parseRouteId(movieReviewsMatch[1]);
    if (movieId === null) return json({ message: "Invalid movie ID" }, 400, corsHeaders);
    const isMine = movieReviewsMatch[2] === "me";
    const allowed = isMine ? ["GET"] : ["GET", "POST"];
    if (!allowed.includes(request.method)) {
      corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    if (isMine || request.method === "POST") {
      const authUser = await confirmedAuthUser(request, authVerifier);
      if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
      try {
        if (isMine) {
          if (!repository.getMyMovieReview) return json({ message: "Not found" }, 404, corsHeaders);
          const review = await repository.getMyMovieReview(authUser, movieId);
          return review ? json(review, 200, corsHeaders) : new Response(null, { status: 204, headers: corsHeaders });
        }
        if (!repository.createReview) return json({ message: "Not found" }, 404, corsHeaders);
        let value: unknown;
        try { value = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        const body = parseCreateReview(value);
        if (!body) return json({ message: "Invalid review details" }, 400, corsHeaders);
        return json(await repository.createReview(authUser, movieId, body.content, body.rating, body.replyPreference), 200, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to update review", corsHeaders);
      }
    }
    if (!repository.getMovieReviews) return json({ message: "Not found" }, 404, corsHeaders);
    const query = new URL(request.url).searchParams;
    const page = Math.max(0, optionalInteger(query.get("page"), 0));
    const size = Math.max(1, Math.min(optionalInteger(query.get("size"), 10), 50));
    try {
      return json(await repository.getMovieReviews(movieId, page, size), 200, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to load reviews", corsHeaders);
    }
  }

  const reviewDetailsMatch = path.match(REVIEW_DETAILS_PATTERN);

  const reviewReportMatch = path.match(REVIEW_REPORT_PATTERN);

  const commentReportMatch = path.match(COMMENT_REPORT_PATTERN);

  const listReportMatch = path.match(PUBLIC_LIST_REPORT_PATTERN);

  const userReportMatch = reviewReportMatch ?? commentReportMatch ?? listReportMatch;

  if (userReportMatch) {
    const reportTarget = reviewReportMatch ? "review" : commentReportMatch ? "comment" : "list";
    const targetId = parseRouteId(userReportMatch[1]);
    if (targetId === null) return json({ message: `Invalid ${reportTarget} ID` }, 400, corsHeaders);
    if (request.method !== "GET" && request.method !== "POST") {
      corsHeaders.set("Allow", "GET, POST, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    try {
      if (request.method === "GET") {
        const getStatus = reportTarget === "review" ? repository.getMyReviewReport
          : reportTarget === "comment" ? repository.getMyCommentReport : repository.getMyListReport;
        if (!getStatus) return json({ message: "Not found" }, 404, corsHeaders);
        const status = await getStatus(authUser, targetId);
        return status ? json(status, 200, corsHeaders) : json({ message: `${reportTarget} not found or cannot be reported` }, 404, corsHeaders);
      }
      const submit = reportTarget === "review" ? repository.reportReview
        : reportTarget === "comment" ? repository.reportComment : repository.reportList;
      if (!submit) return json({ message: "Not found" }, 404, corsHeaders);
      let value: unknown;
      try { value = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
      const reason = parseReviewReportReason(value);
      if (!reason) return json({ message: "Invalid report reason" }, 400, corsHeaders);
      const report = await submit(authUser, targetId, reason);
      return report ? json(report, 200, corsHeaders) : json({ message: `${reportTarget} cannot be reported` }, 404, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, `Unable to submit ${reportTarget} report`, corsHeaders);
    }
  }

  if (reviewDetailsMatch) {
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, PATCH, DELETE, OPTIONS");
      if (request.method !== "PATCH" && request.method !== "DELETE") return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const reviewId = parseRouteId(reviewDetailsMatch[1]);
    if (reviewId === null) return json({ message: "Invalid review ID" }, 400, corsHeaders);
    if (request.method === "GET") {
      if (!repository.getReviewDetails) return json({ message: "Not found" }, 404, corsHeaders);
      try {
        const details = await repository.getReviewDetails(reviewId);
        return details ? json(details, 200, corsHeaders) : json({ message: "Review not found" }, 404, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to load review", corsHeaders);
      }
    }
    if (request.method !== "PATCH" && request.method !== "DELETE") return json({ message: "Method not allowed" }, 405, corsHeaders);
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    try {
      if (request.method === "PATCH") {
        if (!repository.updateMyReview) return json({ message: "Not found" }, 404, corsHeaders);
        let value: unknown;
        try { value = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        const update = parseReviewUpdate(value);
        if (!update) return json({ message: "Invalid review details" }, 400, corsHeaders);
        const review = await repository.updateMyReview(authUser, reviewId, update);
        return review ? json(review, 200, corsHeaders) : json({ message: "Review not found" }, 404, corsHeaders);
      }
      if (!repository.deleteMyReview) return json({ message: "Not found" }, 404, corsHeaders);
      return await repository.deleteMyReview(authUser, reviewId)
        ? new Response(null, { status: 204, headers: corsHeaders })
        : json({ message: "Review not found" }, 404, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to update review", corsHeaders);
    }
  }

  const reviewCommentsMatch = path.match(REVIEW_COMMENTS_PATTERN);

  if (reviewCommentsMatch) {
    const reviewId = parseRouteId(reviewCommentsMatch[1]);
    if (reviewId === null) return json({ message: "Invalid review ID" }, 400, corsHeaders);
    if (request.method !== "GET" && request.method !== "POST") {
      corsHeaders.set("Allow", "GET, POST, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    if (request.method === "GET") {
      if (!repository.getReviewComments) return json({ message: "Not found" }, 404, corsHeaders);
      const query = new URL(request.url).searchParams;
      const page = Math.max(0, optionalInteger(query.get("page"), 0));
      const size = Math.max(1, Math.min(optionalInteger(query.get("size"), 20), 50));
      try {
        return json(await repository.getReviewComments(reviewId, page, size), 200, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to load comments", corsHeaders);
      }
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    if (!repository.createReviewComment) return json({ message: "Not found" }, 404, corsHeaders);
    let value: unknown;
    try { value = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
    const text = parseCommentText(value);
    if (text === null) return json({ message: "Invalid comment details" }, 400, corsHeaders);
    try {
      const comment = await repository.createReviewComment(authUser, reviewId, text);
      if (comment === "FORBIDDEN") return json({ message: "The review author does not allow this reply" }, 403, corsHeaders);
      return comment ? json(comment, 200, corsHeaders) : json({ message: "Review not found" }, 404, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to create comment", corsHeaders);
    }
  }

  const commentMatch = path.match(COMMENT_PATTERN);

  if (commentMatch) {
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
        let value: unknown;
        try { value = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
        const text = parseCommentText(value);
        if (text === null) return json({ message: "Invalid comment details" }, 400, corsHeaders);
        const comment = await repository.updateReviewComment(authUser, commentId, text);
        if (comment === "FORBIDDEN") return json({ message: "You cannot change this comment" }, 403, corsHeaders);
        return comment ? json(comment, 200, corsHeaders) : json({ message: "Comment not found" }, 404, corsHeaders);
      }
      if (!repository.deleteReviewComment) return json({ message: "Not found" }, 404, corsHeaders);
      const result = await repository.deleteReviewComment(authUser, commentId);
      if (result === "FORBIDDEN") return json({ message: "You cannot change this comment" }, 403, corsHeaders);
      return result === "OK" ? new Response(null, { status: 204, headers: corsHeaders })
        : json({ message: "Comment not found" }, 404, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to update comment", corsHeaders);
    }
  }

  const reviewLikesMatch = path.match(REVIEW_LIKES_PATTERN);

  if (reviewLikesMatch) {
    const reviewId = parseRouteId(reviewLikesMatch[1]);
    if (reviewId === null) return json({ message: "Invalid review ID" }, 400, corsHeaders);
    const isStatus = reviewLikesMatch[2] === "like-status";
    const allowed = isStatus ? ["GET"] : ["GET", "POST", "DELETE"];
    if (!allowed.includes(request.method)) {
      corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    if (request.method === "GET" && !isStatus) {
      if (!repository.getReviewLikes) return json({ message: "Not found" }, 404, corsHeaders);
      try {
        const likes = await repository.getReviewLikes(reviewId);
        return likes === null ? json({ message: "Review not found" }, 404, corsHeaders) : json(likes, 200, corsHeaders);
      } catch (error) {
        return repositoryFailure(error, "Unable to load likes", corsHeaders);
      }
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    try {
      if (isStatus) {
        if (!repository.getReviewLikeStatus) return json({ message: "Not found" }, 404, corsHeaders);
        const status = await repository.getReviewLikeStatus(authUser, reviewId);
        return status ? json(status, 200, corsHeaders) : json({ message: "Review not found" }, 404, corsHeaders);
      }
      const action = request.method === "POST" ? repository.likeReview : repository.unlikeReview;
      if (!action) return json({ message: "Not found" }, 404, corsHeaders);
      const exists = await action(authUser, reviewId);
      return exists ? new Response(null, { status: 204, headers: corsHeaders })
        : json({ message: "Review not found" }, 404, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to update review like", corsHeaders);
    }
  }

  return null;
}
