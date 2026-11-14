import { isReplyPreference } from "./reply_preference.ts";
import type { ReviewMutationRequest, ReviewReportReason } from "../../contracts/reviews.ts";

export function parseReviewReportReason(value: unknown): ReviewReportReason | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const reason = (value as Record<string, unknown>).reason;
  return reason === "SPAM" || reason === "INAPPROPRIATE_CONTENT" || reason === "BULLYING" ? reason : null;
}

export function parseCreateReview(value: unknown): ReviewMutationRequest & { content: string; rating: number } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (typeof body.content !== "string" || body.content.length < 1 || body.content.length > 5000 || !/\S/.test(body.content)) return null;
  if (typeof body.rating !== "number" || !Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) return null;
  const result: ReviewMutationRequest & { content: string; rating: number } = { content: body.content, rating: body.rating };
  if (Object.hasOwn(body, "replyPreference")) {
    if (body.replyPreference !== null && !isReplyPreference(body.replyPreference)) return null;
    result.replyPreference = body.replyPreference;
  }
  return result;
}

export function parseReviewUpdate(value: unknown): ReviewMutationRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const update: ReviewMutationRequest = {};
  if (body.content !== undefined) {
    if (typeof body.content !== "string" || body.content.length < 1 || body.content.length > 5000 || !/\S/.test(body.content)) return null;
    update.content = body.content;
  }
  if (body.rating !== undefined && body.rating !== null) {
    if (typeof body.rating !== "number" || !Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) return null;
    update.rating = body.rating;
  }
  if (Object.hasOwn(body, "replyPreference")) {
    if (body.replyPreference !== null && !isReplyPreference(body.replyPreference)) return null;
    update.replyPreference = body.replyPreference;
  }
  return update;
}

export function parseAdminReviewContentUpdate(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (Object.keys(body).length !== 1 || typeof body.content !== "string"
    || !body.content.trim() || body.content.length > 5000) return null;
  return body.content;
}

export function parseCommentText(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const text = (value as Record<string, unknown>).text;
  if (typeof text !== "string" || text.length > 2000 || !/\S/.test(text)) return null;
  return text;
}
