import type { AdminCommentResponse, AdminModerationQueueItem, AdminModerationTarget, AdminReportedReviewResponse, AdminReviewResponse } from "../contracts/admin.ts";
import type { RewindApiRepository } from "../contracts/repository.ts";
import type { ReviewReportReason } from "../contracts/reviews.ts";
import { RewindApiError } from "../http/errors.ts";
import {
  type PgConnection,
} from "../runtime/database.ts";
import {
  beginAdminTransaction,
} from "../runtime/transactions.ts";
import {
  recordAdminAudit,
} from "./shared/admin_audit.ts";
import {
  dismissContentReport,
} from "./shared/content_reports.ts";
import {
  toAdminList,
} from "./shared/lists.ts";
import {
  pageResult,
  safeId,
} from "./shared/results.ts";

async function setReviewModeration(connection: PgConnection, userId: number, id: number, hidden: boolean, reason: string | null) {
  const result = await connection.queryObject<{ id: string }>({
    text: `UPDATE rewind.reviews SET is_hidden=$2, moderated_reason=$3, moderated_at=CURRENT_TIMESTAMP, moderated_by=$4
           WHERE id=$1 RETURNING id`, args: [id, hidden, hidden ? reason : null, userId],
  });
  if (result.rows.length === 0) throw new RewindApiError(404, "Review not found");
  if (hidden) {
    await connection.queryObject({
      text: `UPDATE rewind.review_reports
             SET status='ACTION_TAKEN', reviewed_at=CURRENT_TIMESTAMP, reviewed_by=$2
             WHERE review_id=$1 AND status='OPEN'`, args: [id, userId],
    });
  }
  await recordAdminAudit(connection, userId, hidden ? "REVIEW_HIDDEN" : "REVIEW_UNHIDDEN", "REVIEW", id, hidden ? reason : null);
}

async function setCommentModeration(connection: PgConnection, userId: number, id: number, hidden: boolean, reason: string | null) {
  const result = await connection.queryObject<{ id: string }>({
    text: `UPDATE rewind.comments SET is_hidden=$2, moderated_reason=$3, moderated_at=CURRENT_TIMESTAMP, moderated_by=$4
           WHERE id=$1 RETURNING id`, args: [id, hidden, hidden ? reason : null, userId],
  });
  if (result.rows.length === 0) throw new RewindApiError(404, "Comment not found");
  await recordAdminAudit(connection, userId, hidden ? "COMMENT_HIDDEN" : "COMMENT_UNHIDDEN", "COMMENT", id, hidden ? reason : null);
}

function toAdminReview(row: {
  id: string; movie_id: string; movie_title: string; user_id: string; username: string; content: string;
  rating: number | null; is_hidden: boolean; moderated_reason: string | null; moderated_at: string | null; created_at: string;
}): AdminReviewResponse {
  return {
    id: safeId(row.id, "Review ID"), movieId: safeId(row.movie_id, "Movie ID"), movieTitle: row.movie_title,
    userId: safeId(row.user_id, "User ID"), username: row.username, content: row.content, rating: row.rating,
    isHidden: row.is_hidden, moderatedReason: row.moderated_reason, moderatedAt: row.moderated_at, createdAt: row.created_at,
  };
}

function toAdminComment(row: {
  id: string; review_id: string; user_id: string; username: string; content: string; is_hidden: boolean;
  moderated_reason: string | null; moderated_at: string | null; created_at: string;
}): AdminCommentResponse {
  return {
    id: safeId(row.id, "Comment ID"), reviewId: safeId(row.review_id, "Review ID"),
    userId: safeId(row.user_id, "User ID"), username: row.username, content: row.content,
    isHidden: row.is_hidden, moderatedReason: row.moderated_reason, moderatedAt: row.moderated_at, createdAt: row.created_at,
  };
}

function toAdminModerationQueueItem(row: {
  type: "REVIEW" | "COMMENT"; id: string; parent_id: string | null; movie_id: string | null;
  subject: string; user_id: string; username: string; content: string; created_at: string;
}): AdminModerationQueueItem {
  return {
    type: row.type, id: safeId(row.id, "Moderation item ID"),
    parentId: row.parent_id === null ? null : safeId(row.parent_id, "Review ID"),
    movieId: row.movie_id === null ? null : safeId(row.movie_id, "Movie ID"), subject: row.subject,
    userId: safeId(row.user_id, "User ID"), username: row.username, content: row.content, createdAt: row.created_at,
  };
}

export const adminModerationRepository: Pick<RewindApiRepository,
  | "getAdminReviews"
  | "getAdminReportedReviews"
  | "dismissAdminReviewReport"
  | "getAdminReportedComments"
  | "dismissAdminCommentReport"
  | "getAdminReportedLists"
  | "dismissAdminListReport"
  | "setAdminReviewHidden"
  | "updateAdminReviewContent"
  | "deleteAdminReview"
  | "getAdminComments"
  | "setAdminCommentHidden"
  | "deleteAdminComment"
  | "getAdminModerationQueue"
  | "hideAdminModerationItem"
  | "bulkHideAdminModeration"
> = {

  async getAdminReviews(authUser, filters, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const predicates: string[] = [];
      const args: unknown[] = [];
      // Preserve the Spring service's established filter semantics: movie/user
      // filters apply only together with hidden, while hidden alone is global.
      const { movieId, userId, hidden } = filters;
      if (movieId !== null && userId !== null && hidden !== null) {
        args.push(movieId, userId, hidden);
        predicates.push(`r.movie_id=$1 AND r.user_id=$2 AND r.is_hidden=$3`);
      } else if (movieId !== null && hidden !== null) {
        args.push(movieId, hidden);
        predicates.push(`r.movie_id=$1 AND r.is_hidden=$2`);
      } else if (userId !== null && hidden !== null) {
        args.push(userId, hidden);
        predicates.push(`r.user_id=$1 AND r.is_hidden=$2`);
      } else if (hidden !== null) {
        args.push(hidden);
        predicates.push(`r.is_hidden=$1`);
      }
      const where = predicates.length ? ` WHERE ${predicates.join(" AND ")}` : "";
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.reviews r${where}`, args }),
        connection.queryObject<Parameters<typeof toAdminReview>[0]>({
          text: `SELECT r.id::text AS id, r.movie_id::text AS movie_id, m.title AS movie_title,
                       r.user_id::text AS user_id, u.username, r.content, r.rating::int AS rating, r.is_hidden,
                       r.moderated_reason, r.moderated_at::text AS moderated_at, r.created_at::text AS created_at
                FROM rewind.reviews r JOIN rewind.movies m ON m.id=r.movie_id JOIN rewind.users u ON u.id=r.user_id${where}
                ORDER BY r.id DESC LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
          args: [...args, size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toAdminReview), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getAdminReportedReviews(authUser, page, size): Promise<{ content: AdminReportedReviewResponse[]; totalPages: number; totalElements: number; number: number }> {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: "SELECT COUNT(*)::text AS total FROM rewind.review_reports WHERE status='OPEN'" }),
        connection.queryObject<{
          report_id: string; report_reason: string; report_created_at: string;
          id: string; movie_id: string; movie_title: string; user_id: string; username: string; content: string;
          rating: number | null; is_hidden: boolean; moderated_reason: string | null; moderated_at: string | null; created_at: string;
          likes_count: string; comments_count: string;
        }>({
          text: `SELECT rr.id::text AS report_id, rr.reason AS report_reason, rr.created_at::text AS report_created_at,
                       r.id::text AS id, r.movie_id::text AS movie_id, m.title AS movie_title,
                       r.user_id::text AS user_id, u.username, r.content, r.rating::int AS rating, r.is_hidden,
                       r.moderated_reason, r.moderated_at::text AS moderated_at, r.created_at::text AS created_at,
                       (SELECT COUNT(*)::text FROM rewind.review_likes rl WHERE rl.review_id=r.id) AS likes_count,
                       (SELECT COUNT(*)::text FROM rewind.comments c WHERE c.review_id=r.id AND c.is_hidden=FALSE) AS comments_count
                FROM rewind.review_reports rr
                JOIN rewind.reviews r ON r.id=rr.review_id
                JOIN rewind.movies m ON m.id=r.movie_id
                JOIN rewind.users u ON u.id=r.user_id
                WHERE rr.status='OPEN'
                ORDER BY rr.created_at DESC, rr.id DESC
                LIMIT $1 OFFSET $2`, args: [size, page * size],
        }),
      ]);
      const content = rows.rows.map(row => ({
        ...toAdminReview(row), reportId: safeId(row.report_id, "Report ID"),
        reportReason: row.report_reason as ReviewReportReason, reportCreatedAt: row.report_created_at,
        likesCount: Number(row.likes_count), commentsCount: Number(row.comments_count),
      }));
      await connection.queryObject("COMMIT");
      return pageResult(content, count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async dismissAdminReviewReport(authUser, reportId): Promise<boolean> {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const updated = await connection.queryObject<{ id: string }>({
        text: `UPDATE rewind.review_reports
               SET status='DISMISSED', reviewed_at=CURRENT_TIMESTAMP, reviewed_by=$2
               WHERE id=$1 AND status='OPEN'
               RETURNING id::text AS id`, args: [reportId, userId],
      });
      if (updated.rows.length) {
        await recordAdminAudit(connection, userId, "REVIEW_REPORT_DISMISSED", "REVIEW_REPORT", reportId, null);
      }
      await connection.queryObject("COMMIT");
      return updated.rows.length > 0;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getAdminReportedComments(authUser, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: "SELECT COUNT(*)::text AS total FROM rewind.comment_reports WHERE status='OPEN'" }),
        connection.queryObject<Parameters<typeof toAdminComment>[0] & { report_id: string; report_reason: ReviewReportReason; report_created_at: string }>({
          text: `SELECT cr.id::text AS report_id, cr.reason AS report_reason, cr.created_at::text AS report_created_at,
                       c.id::text AS id, c.review_id::text AS review_id, c.user_id::text AS user_id,
                       u.username, c.content, c.is_hidden, c.moderated_reason,
                       c.moderated_at::text AS moderated_at, c.created_at::text AS created_at
                FROM rewind.comment_reports cr
                JOIN rewind.comments c ON c.id=cr.comment_id
                JOIN rewind.users u ON u.id=c.user_id
                WHERE cr.status='OPEN'
                ORDER BY cr.created_at DESC, cr.id DESC LIMIT $1 OFFSET $2`, args: [size, page * size],
        }),
      ]);
      const content = rows.rows.map(row => ({
        ...toAdminComment(row), reportId: safeId(row.report_id, "Report ID"),
        reportReason: row.report_reason, reportCreatedAt: row.report_created_at,
      }));
      await connection.queryObject("COMMIT");
      return pageResult(content, count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async dismissAdminCommentReport(authUser, reportId) {
    return await dismissContentReport(authUser, reportId, "comment");
  },

  async getAdminReportedLists(authUser, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: "SELECT COUNT(*)::text AS total FROM rewind.list_reports WHERE status='OPEN'" }),
        connection.queryObject<Parameters<typeof toAdminList>[0] & { report_id: string; report_reason: ReviewReportReason; report_created_at: string }>({
          text: `SELECT lr.id::text AS report_id, lr.reason AS report_reason, lr.created_at::text AS report_created_at,
                       l.id::text AS id, l.user_id::text AS user_id, u.username, l.name, l.description,
                       l.list_type, l.is_public, (SELECT COUNT(*)::text FROM rewind.list_items li WHERE li.list_id=l.id) AS item_count,
                       l.created_at::text AS created_at, l.updated_at::text AS updated_at, l.featured_position
                FROM rewind.list_reports lr JOIN rewind.lists l ON l.id=lr.list_id JOIN rewind.users u ON u.id=l.user_id
                WHERE lr.status='OPEN' ORDER BY lr.created_at DESC, lr.id DESC LIMIT $1 OFFSET $2`, args: [size, page * size],
        }),
      ]);
      const content = rows.rows.map(row => ({
        ...toAdminList(row), reportId: safeId(row.report_id, "Report ID"),
        reportReason: row.report_reason, reportCreatedAt: row.report_created_at,
      }));
      await connection.queryObject("COMMIT");
      return pageResult(content, count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async dismissAdminListReport(authUser, reportId) {
    return await dismissContentReport(authUser, reportId, "list");
  },

  async setAdminReviewHidden(authUser, id, hidden, reason) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      await setReviewModeration(connection, userId, id, hidden, reason);
      const result = await connection.queryObject<Parameters<typeof toAdminReview>[0]>({
        text: `SELECT r.id::text AS id, r.movie_id::text AS movie_id, m.title AS movie_title,
                     r.user_id::text AS user_id, u.username, r.content, r.rating::int AS rating, r.is_hidden,
                     r.moderated_reason, r.moderated_at::text AS moderated_at, r.created_at::text AS created_at
              FROM rewind.reviews r JOIN rewind.movies m ON m.id=r.movie_id JOIN rewind.users u ON u.id=r.user_id
              WHERE r.id=$1`, args: [id],
      });
      await connection.queryObject("COMMIT");
      return result.rows[0] ? toAdminReview(result.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async updateAdminReviewContent(authUser, id, content) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const updated = await connection.queryObject<{ id: string }>({
        text: "UPDATE rewind.reviews SET content=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$1 RETURNING id::text AS id",
        args: [id, content],
      });
      if (updated.rows.length === 0) {
        await connection.queryObject("COMMIT");
        return null;
      }
      await recordAdminAudit(connection, userId, "REVIEW_CONTENT_EDITED", "REVIEW", id, "content edited by administrator");
      const result = await connection.queryObject<Parameters<typeof toAdminReview>[0]>({
        text: `SELECT r.id::text AS id, r.movie_id::text AS movie_id, m.title AS movie_title,
                     r.user_id::text AS user_id, u.username, r.content, r.rating::int AS rating, r.is_hidden,
                     r.moderated_reason, r.moderated_at::text AS moderated_at, r.created_at::text AS created_at
              FROM rewind.reviews r JOIN rewind.movies m ON m.id=r.movie_id JOIN rewind.users u ON u.id=r.user_id
              WHERE r.id=$1`, args: [id],
      });
      await connection.queryObject("COMMIT");
      return result.rows[0] ? toAdminReview(result.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async deleteAdminReview(authUser, id) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{ id: string }>({ text: "DELETE FROM rewind.reviews WHERE id=$1 RETURNING id", args: [id] });
      if (result.rows.length > 0) await recordAdminAudit(connection, userId, "REVIEW_DELETED", "REVIEW", id, null);
      await connection.queryObject("COMMIT");
      return result.rows.length > 0;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getAdminComments(authUser, hidden, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const where = hidden === null ? "" : " WHERE c.is_hidden=$1";
      const args = hidden === null ? [] : [hidden];
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.comments c${where}`, args }),
        connection.queryObject<Parameters<typeof toAdminComment>[0]>({
          text: `SELECT c.id::text AS id, c.review_id::text AS review_id, c.user_id::text AS user_id,
                       u.username, c.content, c.is_hidden, c.moderated_reason,
                       c.moderated_at::text AS moderated_at, c.created_at::text AS created_at
                FROM rewind.comments c JOIN rewind.users u ON u.id=c.user_id${where}
                ORDER BY c.id DESC LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
          args: [...args, size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toAdminComment), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async setAdminCommentHidden(authUser, id, hidden, reason) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      await setCommentModeration(connection, userId, id, hidden, reason);
      const result = await connection.queryObject<Parameters<typeof toAdminComment>[0]>({
        text: `SELECT c.id::text AS id, c.review_id::text AS review_id, c.user_id::text AS user_id,
                     u.username, c.content, c.is_hidden, c.moderated_reason,
                     c.moderated_at::text AS moderated_at, c.created_at::text AS created_at
              FROM rewind.comments c JOIN rewind.users u ON u.id=c.user_id WHERE c.id=$1`, args: [id],
      });
      await connection.queryObject("COMMIT");
      return result.rows[0] ? toAdminComment(result.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async deleteAdminComment(authUser, id) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{ id: string }>({ text: "DELETE FROM rewind.comments WHERE id=$1 RETURNING id", args: [id] });
      if (result.rows.length > 0) await recordAdminAudit(connection, userId, "COMMENT_DELETED", "COMMENT", id, null);
      await connection.queryObject("COMMIT");
      return result.rows.length > 0;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getAdminModerationQueue(authUser, type, query, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const search = query?.trim() || null;
      const candidates = `
        SELECT 'REVIEW'::text AS type, r.id, NULL::bigint AS parent_id, r.movie_id,
               m.title AS subject, r.user_id, u.username, r.content, r.created_at
        FROM rewind.reviews r JOIN rewind.users u ON u.id=r.user_id JOIN rewind.movies m ON m.id=r.movie_id
        WHERE r.moderated_at IS NULL
        UNION ALL
        SELECT 'COMMENT'::text AS type, c.id, c.review_id AS parent_id, NULL::bigint AS movie_id,
               ('Review #' || c.review_id)::text AS subject, c.user_id, u.username, c.content, c.created_at
        FROM rewind.comments c JOIN rewind.users u ON u.id=c.user_id
        WHERE c.moderated_at IS NULL`;
      const predicates = ["($1::text IS NULL OR queued.type=$1)",
        "($2::text IS NULL OR lower(queued.content) LIKE '%' || lower($2) || '%' OR lower(queued.username) LIKE '%' || lower($2) || '%')"];
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM (${candidates}) queued WHERE ${predicates.join(" AND ")}`, args: [type, search] }),
        connection.queryObject<{
          type: "REVIEW" | "COMMENT"; id: string; parent_id: string | null; movie_id: string | null;
          subject: string; user_id: string; username: string; content: string; created_at: string;
        }>({
          text: `SELECT queued.type, queued.id::text AS id, queued.parent_id::text AS parent_id,
                        queued.movie_id::text AS movie_id, queued.subject, queued.user_id::text AS user_id,
                        queued.username, queued.content, queued.created_at::text AS created_at
                 FROM (${candidates}) queued WHERE ${predicates.join(" AND ")}
                 ORDER BY queued.created_at, queued.type, queued.id LIMIT $3 OFFSET $4`,
          args: [type, search, size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toAdminModerationQueueItem), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async hideAdminModerationItem(authUser, type, id, reason) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      if (type === "REVIEW") await setReviewModeration(connection, userId, id, true, reason);
      else await setCommentModeration(connection, userId, id, true, reason);
      await connection.queryObject("COMMIT");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async bulkHideAdminModeration(authUser, items: AdminModerationTarget[], reason) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      for (const item of items) {
        const type = item.type.trim().toUpperCase();
        if (type === "REVIEW") await setReviewModeration(connection, userId, item.id, true, reason);
        else if (type === "COMMENT") await setCommentModeration(connection, userId, item.id, true, reason);
        else throw new RewindApiError(400, "Unsupported moderation item type");
      }
      await connection.queryObject("COMMIT");
      return items.length;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
};
