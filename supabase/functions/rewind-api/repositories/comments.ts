import { PostgresError, type PoolClient } from "@db/postgres";
import type { HostedAuthUser } from "../contracts/auth.ts";
import type { RewindApiRepository } from "../contracts/repository.ts";
import type { CommentPageResponse, CommentResponse, CreateCommentResult } from "../contracts/reviews.ts";
import { RewindApiError } from "../http/errors.ts";
import { pool } from "../runtime/database.ts";
import { beginUserTransaction } from "../runtime/transactions.ts";
import { getMyContentReport, submitContentReport } from "./shared/content_reports.ts";
import { safeId } from "./shared/results.ts";

type ParentColumn = "review_id" | "list_id";
interface CommentRow {
  id: string;
  review_id: string | null;
  list_id: string | null;
  user_id: string;
  username: string;
  user_avatar_url: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

const commentSelection = `SELECT c.id::text AS id, c.review_id::text AS review_id, c.list_id::text AS list_id,
    author.id::text AS user_id, author.username, author.avatar_url AS user_avatar_url,
    c.content, c.created_at::text AS created_at, c.updated_at::text AS updated_at
    FROM rewind.comments c JOIN rewind.users author ON author.id = c.user_id`;
const targetStateSql = `SELECT rewind.comment_target_is_visible($1, $2) AS is_visible,
    rewind.comment_reply_is_allowed($1, $2, $3) AS can_reply`;

function commentResponse(row: CommentRow): CommentResponse {
  return {
    id: safeId(row.id, "Comment ID"),
    reviewId: row.review_id === null ? null : safeId(row.review_id, "Review ID"),
    ...(row.list_id === null ? {} : { listId: safeId(row.list_id, "List ID") }),
    userId: safeId(row.user_id, "User ID"), username: row.username, userAvatarUrl: row.user_avatar_url,
    text: row.content, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

async function loadComment(connection: PoolClient, id: number): Promise<CommentResponse | null> {
  const result = await connection.queryObject<CommentRow>({ text: `${commentSelection} WHERE c.id = $1`, args: [id] });
  return result.rows[0] ? commentResponse(result.rows[0]) : null;
}

async function getCommentPage(column: ParentColumn, id: number, page: number, size: number): Promise<CommentPageResponse> {
  const connection = await pool.connect();
  const parents = column === "review_id" ? [id, null] : [null, id];
  try {
    await connection.queryObject("SET ROLE rewind_edge_app");
    const visible = await connection.queryObject<{ is_visible: boolean }>({
      text: "SELECT rewind.comment_target_is_visible($1, $2) AS is_visible", args: parents,
    });
    if (!visible.rows[0]?.is_visible) throw new RewindApiError(404, column === "review_id" ? "Review not found" : "List not found");
    // The column comes from the internal union above; IDs remain bound parameters.
    const where = `c.${column} = $1 AND NOT c.is_hidden AND author.is_active`;
    const [count, rows] = await Promise.all([
      connection.queryObject<{ total: string }>({
        text: `SELECT COUNT(*)::text AS total FROM rewind.comments c JOIN rewind.users author ON author.id = c.user_id WHERE ${where}`,
        args: [id],
      }),
      connection.queryObject<CommentRow>({
        text: `${commentSelection} WHERE ${where} ORDER BY c.created_at ASC, c.id ASC LIMIT $2 OFFSET $3`,
        args: [id, size, page * size],
      }),
    ]);
    const totalElements = Number(count.rows[0]?.total ?? "0");
    return { content: rows.rows.map(commentResponse), totalElements, totalPages: Math.ceil(totalElements / size), number: page };
  } finally { connection.release(); }
}

async function createComment(authUser: HostedAuthUser, column: ParentColumn, id: number, text: string): Promise<CreateCommentResult> {
  const { connection, userId } = await beginUserTransaction(authUser);
  const parents = column === "review_id" ? [id, null] : [null, id];
  try {
    const result = await connection.queryObject<{ is_visible: boolean; can_reply: boolean }>({ text: targetStateSql, args: [...parents, userId] });
    if (!result.rows[0]?.is_visible) {
      await connection.queryObject("COMMIT");
      return null;
    }
    if (!result.rows[0].can_reply) {
      await connection.queryObject("COMMIT");
      return "FORBIDDEN";
    }
    const inserted = await connection.queryObject<{ id: string }>({
      text: "INSERT INTO rewind.comments (review_id, list_id, user_id, content) VALUES ($1, $2, $3, $4) RETURNING id::text AS id",
      args: [...parents, userId, text.trim()],
    });
    const saved = await loadComment(connection, safeId(inserted.rows[0].id, "Comment ID"));
    await connection.queryObject("COMMIT");
    return saved;
  } catch (error) {
    try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
    if (error instanceof PostgresError && error.fields.code === "42501") return "FORBIDDEN";
    throw error;
  } finally { connection.release(); }
}

export const commentsRepository: Pick<RewindApiRepository,
  | "getReviewComments" | "getListComments" | "createReviewComment" | "createListComment"
  | "updateReviewComment" | "deleteReviewComment" | "getMyCommentReport" | "reportComment"
> = {
  getReviewComments(reviewId, page, size) { return getCommentPage("review_id", reviewId, page, size); },
  getListComments(listId, page, size) { return getCommentPage("list_id", listId, page, size); },
  createReviewComment(authUser, reviewId, text) { return createComment(authUser, "review_id", reviewId, text); },
  createListComment(authUser, listId, text) { return createComment(authUser, "list_id", listId, text); },
  getMyCommentReport(authUser, commentId) { return getMyContentReport(authUser, "comment", commentId); },
  reportComment(authUser, commentId, reason) { return submitContentReport(authUser, "comment", commentId, reason); },

  async updateReviewComment(authUser, commentId, text) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const owner = await connection.queryObject<{ user_id: string }>({
        text: "SELECT user_id::text AS user_id FROM rewind.comments WHERE id = $1", args: [commentId],
      });
      if (!owner.rows[0]) { await connection.queryObject("COMMIT"); return null; }
      if (safeId(owner.rows[0].user_id, "User ID") !== userId) { await connection.queryObject("COMMIT"); return "FORBIDDEN"; }
      await connection.queryObject({
        text: "UPDATE rewind.comments SET content = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2",
        args: [commentId, userId, text.trim()],
      });
      const saved = await loadComment(connection, commentId);
      await connection.queryObject("COMMIT");
      return saved;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async deleteReviewComment(authUser, commentId) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{ user_id: string; role: string }>({
        text: `SELECT c.user_id::text AS user_id, actor.role FROM rewind.comments c
               CROSS JOIN rewind.users actor WHERE c.id = $1 AND actor.id = $2`, args: [commentId, userId],
      });
      const row = result.rows[0];
      if (!row) { await connection.queryObject("COMMIT"); return "NOT_FOUND"; }
      if (safeId(row.user_id, "User ID") !== userId && row.role !== "ADMIN") { await connection.queryObject("COMMIT"); return "FORBIDDEN"; }
      await connection.queryObject({ text: "DELETE FROM rewind.comments WHERE id = $1", args: [commentId] });
      await connection.queryObject("COMMIT");
      return "OK";
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
};
