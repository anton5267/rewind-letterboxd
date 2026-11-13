import type { RewindApiRepository } from "../contracts/repository.ts";
import type { CommentPageResponse, CommentResponse, CreateCommentResult, ReviewDetailsResponse, ReviewMutationRequest, ReviewPageResponse, ReviewReportReason, ReviewReportResponse, ReviewReportStatusResponse, ReviewResponse } from "../contracts/reviews.ts";
import { PostgresError } from "@db/postgres";
import { RewindApiError } from "../http/errors.ts";
import {
  pool,
} from "../runtime/database.ts";
import {
  beginUserTransaction,
} from "../runtime/transactions.ts";
import {
  getMyContentReport,
  submitContentReport,
} from "./shared/content_reports.ts";
import {
  safeId,
} from "./shared/results.ts";

function reviewResponse(row: {
  id: string; user_id: string; username: string; user_avatar_url: string | null;
  content: string; rating: number | null; created_at: string;
}): ReviewResponse {
  return {
    id: safeId(row.id, "Review ID"), userId: safeId(row.user_id, "User ID"), username: row.username,
    userAvatarUrl: row.user_avatar_url, content: row.content, rating: row.rating, createdAt: row.created_at,
  };
}

function commentResponse(row: {
  id: string; review_id: string; user_id: string; username: string; user_avatar_url: string | null;
  content: string; created_at: string; updated_at: string;
}): CommentResponse {
  return {
    id: safeId(row.id, "Comment ID"), reviewId: safeId(row.review_id, "Review ID"),
    userId: safeId(row.user_id, "User ID"), username: row.username, userAvatarUrl: row.user_avatar_url,
    text: row.content, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export const reviewsRepository: Pick<RewindApiRepository,
  | "getPublicReviewFeed"
  | "getMovieReviews"
  | "getMyMovieReview"
  | "createReview"
  | "getReviewDetails"
  | "updateMyReview"
  | "deleteMyReview"
  | "getMyReviewReport"
  | "reportReview"
  | "getMyCommentReport"
  | "reportComment"
  | "getReviewComments"
  | "createReviewComment"
  | "updateReviewComment"
  | "deleteReviewComment"
  | "getReviewLikes"
  | "getReviewLikeStatus"
  | "likeReview"
  | "unlikeReview"
> = {

  async getPublicReviewFeed(feed, page, size) {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const countResult = await connection.queryObject<{ total: string }>({
        text: `SELECT COUNT(*)::text AS total
                FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id
                JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
               WHERE r.is_hidden = FALSE AND author.is_active = TRUE`,
      });
      const rows = await connection.queryObject<{
        id: string; movie_id: string; movie_title: string; user_id: string; username: string;
        content: string; rating: string | null; created_at: string; movie_photo_url: string | null;
        user_avatar_url: string | null;
      }>({
        text: feed === "recent"
          ? `SELECT r.id::text AS id, r.movie_id::text AS movie_id, m.title AS movie_title,
                    author.id::text AS user_id, author.username, r.content, r.rating::text AS rating,
                    r.created_at::text AS created_at, m.photo_url AS movie_photo_url,
                    author.avatar_url AS user_avatar_url
              FROM rewind.reviews r
             JOIN rewind.users author ON author.id = r.user_id
              JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
             WHERE r.is_hidden = FALSE AND author.is_active = TRUE
             ORDER BY r.created_at DESC, r.id DESC LIMIT $1 OFFSET $2`
          : `SELECT r.id::text AS id, r.movie_id::text AS movie_id, m.title AS movie_title,
                    author.id::text AS user_id, author.username, r.content, r.rating::text AS rating,
                    r.created_at::text AS created_at, m.photo_url AS movie_photo_url,
                    author.avatar_url AS user_avatar_url
              FROM rewind.reviews r
             JOIN rewind.users author ON author.id = r.user_id
              JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
             LEFT JOIN rewind.review_likes rl ON rl.review_id = r.id
             LEFT JOIN rewind.users liker ON liker.id = rl.user_id AND liker.is_active = TRUE
             WHERE r.is_hidden = FALSE AND author.is_active = TRUE
             GROUP BY r.id, m.title, author.id, author.username, r.content, r.rating,
                      r.created_at, m.photo_url, author.avatar_url
             ORDER BY COUNT(liker.id) DESC, r.created_at DESC, r.id DESC LIMIT $1 OFFSET $2`,
        args: [size, page * size],
      });
      const toId = (value: string) => {
        const id = Number(value);
        if (!Number.isSafeInteger(id)) throw new Error("Review feed ID is outside the safe JSON integer range.");
        return id;
      };
      const totalElements = Number(countResult.rows[0]?.total ?? "0");
      const content = rows.rows.map((row) => ({
        id: toId(row.id), movieId: toId(row.movie_id), movieTitle: row.movie_title,
        userId: toId(row.user_id), username: row.username, content: row.content,
        rating: row.rating === null ? null : Number(row.rating), createdAt: row.created_at,
        moviePhotoUrl: row.movie_photo_url, userAvatarUrl: row.user_avatar_url,
      }));
      return { content, totalPages: Math.ceil(totalElements / size), totalElements, number: page };
    } finally {
      connection.release();
    }
  },

  async getMovieReviews(movieId, page, size): Promise<ReviewPageResponse> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({
          text: `SELECT COUNT(*)::text AS total FROM rewind.reviews r
                 JOIN rewind.users author ON author.id = r.user_id
                 JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
                 WHERE r.movie_id = $1 AND r.is_hidden = FALSE AND author.is_active = TRUE`,
          args: [movieId],
        }),
        connection.queryObject<{
          id: string; user_id: string; username: string; user_avatar_url: string | null;
          content: string; rating: number | null; created_at: string;
        }>({
          text: `SELECT r.id::text AS id, author.id::text AS user_id, author.username,
                        author.avatar_url AS user_avatar_url, r.content, r.rating, r.created_at::text AS created_at
                 FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id
                 JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
                 WHERE r.movie_id = $1 AND r.is_hidden = FALSE AND author.is_active = TRUE
                 ORDER BY r.created_at DESC, r.id DESC LIMIT $2 OFFSET $3`,
          args: [movieId, size, page * size],
        }),
      ]);
      const totalElements = Number(count.rows[0]?.total ?? "0");
      return {
        content: rows.rows.map(reviewResponse), totalPages: Math.ceil(totalElements / size), totalElements, number: page,
      };
    } finally { connection.release(); }
  },

  async getMyMovieReview(authUser, movieId): Promise<ReviewResponse | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        id: string; user_id: string; username: string; user_avatar_url: string | null;
        content: string; rating: number | null; created_at: string;
      }>({
        text: `SELECT r.id::text AS id, author.id::text AS user_id, author.username,
                      author.avatar_url AS user_avatar_url, r.content, r.rating, r.created_at::text AS created_at
               FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id
               WHERE r.user_id = $1 AND r.movie_id = $2`,
        args: [userId, movieId],
      });
      await connection.queryObject("COMMIT");
      return result.rows[0] ? reviewResponse(result.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async createReview(authUser, movieId, content, rating): Promise<ReviewResponse> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const movie = await connection.queryObject({ text: "SELECT 1 FROM rewind.movies WHERE id = $1 AND is_published = TRUE", args: [movieId] });
      if (!movie.rows.length) throw new RewindApiError(400, "Movie not found");
      const inserted = await connection.queryObject<{ id: string }>(
        { text: `INSERT INTO rewind.reviews (user_id, movie_id, content, rating)
                 VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, movie_id) DO NOTHING RETURNING id::text AS id`,
          args: [userId, movieId, content, rating] },
      );
      if (!inserted.rows[0]) throw new RewindApiError(409, "You already reviewed this movie");
      const reviewId = safeId(inserted.rows[0].id, "Review ID");
      await connection.queryObject({
        text: `INSERT INTO rewind.ratings (user_id, movie_id, rating) VALUES ($1, $2, $3)
               ON CONFLICT (user_id, movie_id) DO UPDATE SET rating = EXCLUDED.rating`,
        args: [userId, movieId, rating],
      });
      await connection.queryObject({
        text: "INSERT INTO rewind.user_activities (user_id, activity_type, movie_id, review_id) VALUES ($1, 'REVIEW', $2, $3)",
        args: [userId, movieId, reviewId],
      });
      const saved = await connection.queryObject<{
        id: string; user_id: string; username: string; user_avatar_url: string | null;
        content: string; rating: number | null; created_at: string;
      }>({
        text: `SELECT r.id::text AS id, author.id::text AS user_id, author.username,
                      author.avatar_url AS user_avatar_url, r.content, r.rating, r.created_at::text AS created_at
               FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id WHERE r.id = $1`,
        args: [reviewId],
      });
      if (!saved.rows[0]) throw new Error("Review insert was not persisted.");
      await connection.queryObject("COMMIT");
      return reviewResponse(saved.rows[0]);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getReviewDetails(reviewId): Promise<ReviewDetailsResponse | null> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const result = await connection.queryObject<{
        id: string; content: string; rating: number | null; created_at: string;
        author_id: string; username: string; display_name: string | null; avatar_url: string | null;
        movie_id: string; title: string; release_date: string | null; duration_minutes: number | null;
        age_rating: string | null; photo_url: string | null; backdrop_url: string | null; trailer_url: string | null;
      }>({
        text: `SELECT r.id::text AS id, r.content, r.rating, r.created_at::text AS created_at,
                      author.id::text AS author_id, author.username, author.display_name, author.avatar_url,
                      m.id::text AS movie_id, m.title, m.release_date::text AS release_date,
                      m.duration_minutes, m.age_rating, m.photo_url, m.backdrop_url, m.trailer_url
               FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id
               JOIN rewind.movies m ON m.id = r.movie_id
                WHERE r.id = $1 AND r.is_hidden = FALSE AND author.is_active = TRUE AND m.is_published = TRUE`,
        args: [reviewId],
      });
      const review = result.rows[0];
      if (!review) return null;
      const [likes, likedBy] = await Promise.all([
        connection.queryObject<{ total: string }>({
          text: `SELECT COUNT(*)::text AS total FROM rewind.review_likes rl
                 JOIN rewind.users liker ON liker.id = rl.user_id
                 WHERE rl.review_id = $1 AND liker.is_active = TRUE`, args: [reviewId],
        }),
        connection.queryObject<{
          id: string; username: string; display_name: string | null; avatar_url: string | null;
        }>({
          text: `SELECT liker.id::text AS id, liker.username, liker.display_name, liker.avatar_url
                 FROM rewind.review_likes rl JOIN rewind.users liker ON liker.id = rl.user_id
                 WHERE rl.review_id = $1 AND liker.is_active = TRUE
                 ORDER BY rl.created_at DESC, rl.id DESC LIMIT 12`, args: [reviewId],
        }),
      ]);
      return {
        id: safeId(review.id, "Review ID"), content: review.content, rating: review.rating,
        createdAt: review.created_at,
        author: { id: safeId(review.author_id, "User ID"), username: review.username,
          displayName: review.display_name, avatarUrl: review.avatar_url },
        movie: { id: safeId(review.movie_id, "Movie ID"), title: review.title,
          releaseDate: review.release_date, durationMinutes: review.duration_minutes, ageRating: review.age_rating,
          photoUrl: review.photo_url, backdropUrl: review.backdrop_url, trailerUrl: review.trailer_url },
        likes: Number(likes.rows[0]?.total ?? "0"),
        likedBy: likedBy.rows.map((liker) => ({ id: safeId(liker.id, "User ID"), username: liker.username,
          displayName: liker.display_name, avatarUrl: liker.avatar_url })),
      };
    } finally { connection.release(); }
  },

  async updateMyReview(authUser, reviewId, update: ReviewMutationRequest): Promise<ReviewResponse | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const updated = await connection.queryObject<{ id: string }>(
        { text: `UPDATE rewind.reviews SET
                   content = CASE WHEN $3 THEN $4 ELSE content END,
                   rating = CASE WHEN $5 THEN $6 ELSE rating END,
                   updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1 AND user_id = $2 RETURNING id::text AS id`,
          args: [reviewId, userId, Object.hasOwn(update, "content"), update.content ?? null,
            Object.hasOwn(update, "rating") && update.rating !== null, update.rating ?? null] },
      );
      if (!updated.rows[0]) throw new RewindApiError(400, "Review not found");
      if (update.rating !== undefined && update.rating !== null) {
        const movie = await connection.queryObject<{ movie_id: string }>(
          { text: "SELECT movie_id::text AS movie_id FROM rewind.reviews WHERE id = $1", args: [reviewId] },
        );
        await connection.queryObject({
          text: `INSERT INTO rewind.ratings (user_id, movie_id, rating) VALUES ($1, $2, $3)
                 ON CONFLICT (user_id, movie_id) DO UPDATE SET rating = EXCLUDED.rating`,
          args: [userId, Number(movie.rows[0].movie_id), update.rating],
        });
      }
      const saved = await connection.queryObject<{
        id: string; user_id: string; username: string; user_avatar_url: string | null;
        content: string; rating: number | null; created_at: string;
      }>({
        text: `SELECT r.id::text AS id, author.id::text AS user_id, author.username,
                      author.avatar_url AS user_avatar_url, r.content, r.rating, r.created_at::text AS created_at
               FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id WHERE r.id = $1`,
        args: [reviewId],
      });
      await connection.queryObject("COMMIT");
      return saved.rows[0] ? reviewResponse(saved.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async deleteMyReview(authUser, reviewId): Promise<boolean> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject({ text: "DELETE FROM rewind.reviews WHERE id = $1 AND user_id = $2 RETURNING id", args: [reviewId, userId] });
      await connection.queryObject("COMMIT");
      if (result.rows.length === 0) throw new RewindApiError(400, "Review not found");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getMyReviewReport(authUser, reviewId): Promise<ReviewReportStatusResponse | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const visible = await connection.queryObject<{ id: string; user_id: string }>(
        { text: `SELECT r.id::text AS id, r.user_id::text AS user_id
                 FROM rewind.reviews r
                 JOIN rewind.users author ON author.id=r.user_id
                 JOIN rewind.movies m ON m.id=r.movie_id AND m.is_published=TRUE
                 WHERE r.id=$1 AND r.is_hidden=FALSE AND author.is_active=TRUE`, args: [reviewId] },
      );
      if (!visible.rows[0]) { await connection.queryObject("COMMIT"); return null; }
      if (safeId(visible.rows[0].user_id, "Review author ID") === userId) {
        await connection.queryObject("COMMIT");
        return { reported: false, report: null };
      }
      const result = await connection.queryObject<{ id: string; reason: ReviewReportReason; created_at: string }>({
        text: `SELECT id::text AS id, reason, created_at::text AS created_at
               FROM rewind.review_reports WHERE review_id=$1 AND reporter_id=$2 AND status='OPEN'`, args: [reviewId, userId],
      });
      await connection.queryObject("COMMIT");
      const row = result.rows[0];
      return row ? { reported: true, report: { id: safeId(row.id, "Report ID"), reason: row.reason, createdAt: row.created_at } }
        : { reported: false, report: null };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async reportReview(authUser, reviewId, reason): Promise<ReviewReportResponse | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const findExisting = async () => connection.queryObject<{ id: string; reason: ReviewReportReason; created_at: string }>({
        text: `SELECT rr.id::text AS id, rr.reason, rr.created_at::text AS created_at
               FROM rewind.review_reports rr
               JOIN rewind.reviews r ON r.id=rr.review_id
               JOIN rewind.users author ON author.id=r.user_id
               JOIN rewind.movies m ON m.id=r.movie_id AND m.is_published=TRUE
               WHERE rr.review_id=$1 AND rr.reporter_id=$2 AND rr.status='OPEN' AND r.is_hidden=FALSE AND author.is_active=TRUE`,
        args: [reviewId, userId],
      });
      const existing = await findExisting();
      if (existing.rows[0]) {
        const row = existing.rows[0];
        await connection.queryObject("COMMIT");
        return { id: safeId(row.id, "Report ID"), reason: row.reason, createdAt: row.created_at };
      }
      const inserted = await connection.queryObject<{ id: string; reason: ReviewReportReason; created_at: string }>({
        text: `INSERT INTO rewind.review_reports (review_id, reporter_id, reason)
               SELECT r.id, $2, $3
               FROM rewind.reviews r JOIN rewind.users author ON author.id=r.user_id
               JOIN rewind.movies m ON m.id=r.movie_id AND m.is_published=TRUE
               WHERE r.id=$1 AND r.user_id<>$2 AND r.is_hidden=FALSE AND author.is_active=TRUE
               ON CONFLICT (review_id, reporter_id) WHERE status='OPEN' DO NOTHING
               RETURNING id::text AS id, reason, created_at::text AS created_at`,
        args: [reviewId, userId, reason],
      });
      const row = inserted.rows[0] ?? (await findExisting()).rows[0];
      await connection.queryObject("COMMIT");
      return row ? { id: safeId(row.id, "Report ID"), reason: row.reason, createdAt: row.created_at } : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getMyCommentReport(authUser, commentId) {
    return await getMyContentReport(authUser, "comment", commentId);
  },

  async reportComment(authUser, commentId, reason) {
    return await submitContentReport(authUser, "comment", commentId, reason);
  },

  async getReviewComments(reviewId, page, size): Promise<CommentPageResponse> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const visible = await connection.queryObject({
        text: `SELECT 1 FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id
               JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
               WHERE r.id = $1 AND r.is_hidden = FALSE AND author.is_active = TRUE`, args: [reviewId],
      });
      if (!visible.rows.length) throw new RewindApiError(404, "Review not found");
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({
          text: `SELECT COUNT(*)::text AS total FROM rewind.comments c
                 JOIN rewind.users author ON author.id = c.user_id
                 WHERE c.review_id = $1 AND c.is_hidden = FALSE AND author.is_active = TRUE`, args: [reviewId],
        }),
        connection.queryObject<{
          id: string; review_id: string; user_id: string; username: string; user_avatar_url: string | null;
          content: string; created_at: string; updated_at: string;
        }>({
          text: `SELECT c.id::text AS id, c.review_id::text AS review_id, author.id::text AS user_id,
                        author.username, author.avatar_url AS user_avatar_url, c.content,
                        c.created_at::text AS created_at, c.updated_at::text AS updated_at
                 FROM rewind.comments c JOIN rewind.users author ON author.id = c.user_id
                 WHERE c.review_id = $1 AND c.is_hidden = FALSE AND author.is_active = TRUE
                 ORDER BY c.created_at ASC, c.id ASC LIMIT $2 OFFSET $3`,
          args: [reviewId, size, page * size],
        }),
      ]);
      const totalElements = Number(count.rows[0]?.total ?? "0");
      return { content: rows.rows.map(commentResponse), totalPages: Math.ceil(totalElements / size), totalElements, number: page };
    } finally { connection.release(); }
  },

  async createReviewComment(authUser, reviewId, text): Promise<CreateCommentResult> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const review = await connection.queryObject<{ can_reply: boolean }>({
        text: `SELECT (
                 r.user_id = $2 OR (
                   NOT EXISTS (
                     SELECT 1 FROM rewind.user_blocks b
                     WHERE (b.blocker_id = r.user_id AND b.blocked_id = $2)
                        OR (b.blocker_id = $2 AND b.blocked_id = r.user_id)
                   ) AND (
                     author.reply_preference = 'ANYONE'
                     OR (author.reply_preference = 'FOLLOWED' AND EXISTS (
                       SELECT 1 FROM rewind.follows f
                       WHERE f.follower_id = r.user_id AND f.following_id = $2
                     ))
                   )
                 )
               ) AS can_reply
               FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id
               JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
               WHERE r.id = $1 AND r.is_hidden = FALSE AND author.is_active = TRUE`, args: [reviewId, userId],
      });
      if (!review.rows.length) { await connection.queryObject("COMMIT"); return null; }
      if (!review.rows[0].can_reply) { await connection.queryObject("COMMIT"); return "FORBIDDEN"; }
      const inserted = await connection.queryObject<{ id: string }>({
        text: "INSERT INTO rewind.comments (review_id, user_id, content) VALUES ($1, $2, $3) RETURNING id::text AS id",
        args: [reviewId, userId, text.trim()],
      });
      const commentId = safeId(inserted.rows[0].id, "Comment ID");
      const result = await connection.queryObject<{
        id: string; review_id: string; user_id: string; username: string; user_avatar_url: string | null;
        content: string; created_at: string; updated_at: string;
      }>({
        text: `SELECT c.id::text AS id, c.review_id::text AS review_id, author.id::text AS user_id,
                      author.username, author.avatar_url AS user_avatar_url, c.content,
                      c.created_at::text AS created_at, c.updated_at::text AS updated_at
               FROM rewind.comments c JOIN rewind.users author ON author.id = c.user_id WHERE c.id = $1`,
        args: [commentId],
      });
      await connection.queryObject("COMMIT");
      return result.rows[0] ? commentResponse(result.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      if (error instanceof PostgresError && error.fields.code === "42501"
        && error.fields.table === "comments" && error.message.includes("row-level security")) {
        return "FORBIDDEN";
      }
      throw error;
    } finally { connection.release(); }
  },

  async updateReviewComment(authUser, commentId, text): Promise<CommentResponse | null | "FORBIDDEN"> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const owner = await connection.queryObject<{ user_id: string }>(
        { text: "SELECT user_id::text AS user_id FROM rewind.comments WHERE id = $1", args: [commentId] },
      );
      if (!owner.rows[0]) { await connection.queryObject("COMMIT"); return null; }
      if (safeId(owner.rows[0].user_id, "User ID") !== userId) { await connection.queryObject("COMMIT"); return "FORBIDDEN"; }
      await connection.queryObject({
        text: "UPDATE rewind.comments SET content = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2",
        args: [commentId, userId, text.trim()],
      });
      const result = await connection.queryObject<{
        id: string; review_id: string; user_id: string; username: string; user_avatar_url: string | null;
        content: string; created_at: string; updated_at: string;
      }>({
        text: `SELECT c.id::text AS id, c.review_id::text AS review_id, author.id::text AS user_id,
                      author.username, author.avatar_url AS user_avatar_url, c.content,
                      c.created_at::text AS created_at, c.updated_at::text AS updated_at
               FROM rewind.comments c JOIN rewind.users author ON author.id = c.user_id WHERE c.id = $1`,
        args: [commentId],
      });
      await connection.queryObject("COMMIT");
      return result.rows[0] ? commentResponse(result.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async deleteReviewComment(authUser, commentId): Promise<"OK" | "NOT_FOUND" | "FORBIDDEN"> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{ user_id: string; role: string }>(
        { text: `SELECT c.user_id::text AS user_id, actor.role FROM rewind.comments c
                 CROSS JOIN rewind.users actor WHERE c.id = $1 AND actor.id = $2`, args: [commentId, userId] },
      );
      const row = result.rows[0];
      if (!row) { await connection.queryObject("COMMIT"); return "NOT_FOUND"; }
      if (safeId(row.user_id, "User ID") !== userId && row.role !== "ADMIN") {
        await connection.queryObject("COMMIT"); return "FORBIDDEN";
      }
      await connection.queryObject({ text: "DELETE FROM rewind.comments WHERE id = $1", args: [commentId] });
      await connection.queryObject("COMMIT");
      return "OK";
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getReviewLikes(reviewId): Promise<number | null> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const result = await connection.queryObject<{ total: string }>({
        text: `SELECT COUNT(liker.id)::text AS total FROM rewind.reviews r
               JOIN rewind.users author ON author.id = r.user_id
               JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
               LEFT JOIN rewind.review_likes rl ON rl.review_id = r.id
               LEFT JOIN rewind.users liker ON liker.id = rl.user_id AND liker.is_active = TRUE
               WHERE r.id = $1 AND r.is_hidden = FALSE AND author.is_active = TRUE
               GROUP BY r.id`, args: [reviewId],
      });
      return result.rows[0] ? Number(result.rows[0].total) : null;
    } finally { connection.release(); }
  },

  async getReviewLikeStatus(authUser, reviewId): Promise<{ liked: boolean; likes: number } | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{ liked: boolean; likes: string }>(
        { text: `SELECT EXISTS (SELECT 1 FROM rewind.review_likes mine
                                  WHERE mine.review_id = r.id AND mine.user_id = $2) AS liked,
                        COUNT(liker.id)::text AS likes
                  FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id
                  JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
                 LEFT JOIN rewind.review_likes rl ON rl.review_id = r.id
                 LEFT JOIN rewind.users liker ON liker.id = rl.user_id AND liker.is_active = TRUE
                 WHERE r.id = $1 AND r.is_hidden = FALSE AND author.is_active = TRUE
                 GROUP BY r.id`, args: [reviewId, userId] },
      );
      await connection.queryObject("COMMIT");
      return result.rows[0] ? { liked: result.rows[0].liked, likes: Number(result.rows[0].likes) } : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async likeReview(authUser, reviewId): Promise<boolean> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const review = await connection.queryObject<{ user_id: string }>(
        { text: `SELECT r.user_id::text AS user_id FROM rewind.reviews r
                 JOIN rewind.users author ON author.id = r.user_id
                 JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
                 WHERE r.id = $1 AND r.is_hidden = FALSE AND author.is_active = TRUE`, args: [reviewId] },
      );
      if (!review.rows[0]) { await connection.queryObject("COMMIT"); return false; }
      const inserted = await connection.queryObject({
        text: `INSERT INTO rewind.review_likes (review_id, user_id) VALUES ($1, $2)
               ON CONFLICT (review_id, user_id) DO NOTHING RETURNING id`, args: [reviewId, userId],
      });
      const recipientId = safeId(review.rows[0].user_id, "User ID");
      if (inserted.rows.length > 0 && recipientId !== userId) {
        const preference = await connection.queryObject<{ enabled: boolean }>(
          { text: `SELECT COALESCE((SELECT review_likes_enabled FROM rewind.notification_preferences
                                   WHERE user_id = $1), TRUE) AS enabled`, args: [recipientId] },
        );
        if (preference.rows[0]?.enabled !== false) {
          await connection.queryObject({
            text: `INSERT INTO rewind.notifications (recipient_id, actor_id, notification_type, review_id)
                   VALUES ($1, $2, 'REVIEW_LIKED', $3)`, args: [recipientId, userId, reviewId],
          });
        }
      }
      await connection.queryObject("COMMIT");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async unlikeReview(authUser, reviewId): Promise<boolean> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const visible = await connection.queryObject({
        text: `SELECT 1 FROM rewind.reviews r JOIN rewind.users author ON author.id = r.user_id
               JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
               WHERE r.id = $1 AND r.is_hidden = FALSE AND author.is_active = TRUE`, args: [reviewId],
      });
      if (!visible.rows.length) { await connection.queryObject("COMMIT"); return false; }
      await connection.queryObject({ text: "DELETE FROM rewind.review_likes WHERE review_id = $1 AND user_id = $2", args: [reviewId, userId] });
      await connection.queryObject("COMMIT");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
};
