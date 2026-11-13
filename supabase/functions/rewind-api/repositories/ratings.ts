import type { RewindApiRepository } from "../contracts/repository.ts";
import { RewindApiError } from "../http/errors.ts";
import {
  beginUserTransaction,
} from "../runtime/transactions.ts";

export const ratingsRepository: Pick<RewindApiRepository,
  | "getMyRating"
  | "getMyMovieStatus"
  | "setMyMovieFlag"
  | "deleteMyMovieFlag"
  | "setMyRating"
  | "deleteMyRating"
> = {

  async getMyRating(authUser, movieId): Promise<number | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{ rating: number }>({
        text: "SELECT rating FROM rewind.ratings WHERE user_id = $1 AND movie_id = $2",
        args: [userId, movieId],
      });
      await connection.queryObject("COMMIT");
      return result.rows[0]?.rating ?? null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },

  async getMyMovieStatus(authUser, movieId) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{ list_type: string; rating: number | null; has_movie: boolean }>(
        {
          text: `SELECT l.list_type, r.rating, (li.id IS NOT NULL) AS has_movie
                 FROM rewind.lists l
                 LEFT JOIN rewind.list_items li ON li.list_id = l.id AND li.movie_id = $2
                 LEFT JOIN rewind.ratings r ON r.user_id = l.user_id AND r.movie_id = $2
                 WHERE l.user_id = $1 AND l.list_type IN ('WATCHED', 'WATCHLIST', 'FAVORITES')`,
          args: [userId, movieId],
        },
      );
      await connection.queryObject("COMMIT");
      return {
        inWatchlist: result.rows.some((row) => row.list_type === "WATCHLIST" && row.has_movie),
        watched: result.rows.some((row) => row.list_type === "WATCHED" && row.has_movie),
        favorite: result.rows.some((row) => row.list_type === "FAVORITES" && row.has_movie),
        myRating: result.rows.find((row) => row.rating !== null)?.rating ?? null,
      };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },

  async setMyMovieFlag(authUser, movieId, flag) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const movie = await connection.queryObject({ text: "SELECT 1 FROM rewind.movies WHERE id = $1 AND is_published = TRUE", args: [movieId] });
      if (!movie.rows.length) throw new RewindApiError(400, "Movie not found");
      const listType = flag === "favorite" ? "FAVORITES" : flag.toUpperCase();
      const list = await connection.queryObject<{ id: string }>({
        text: "SELECT id::text AS id FROM rewind.lists WHERE user_id = $1 AND list_type = $2",
        args: [userId, listType],
      });
      if (!list.rows[0]) throw new Error("System list is unavailable.");
      const inserted = await connection.queryObject({
        text: `INSERT INTO rewind.list_items (list_id, movie_id)
               VALUES ($1, $2) ON CONFLICT (list_id, movie_id) DO NOTHING RETURNING id`,
        args: [Number(list.rows[0].id), movieId],
      });
      if (flag === "watched" && inserted.rows.length > 0) {
        await connection.queryObject({
          text: "INSERT INTO rewind.user_activities (user_id, activity_type, movie_id) VALUES ($1, 'WATCHED', $2)",
          args: [userId, movieId],
        });
      }
      await connection.queryObject("COMMIT");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },

  async deleteMyMovieFlag(authUser, movieId, flag) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const listType = flag === "favorite" ? "FAVORITES" : flag.toUpperCase();
      await connection.queryObject({
        text: `DELETE FROM rewind.list_items li
               USING rewind.lists l
               WHERE li.list_id = l.id AND l.user_id = $1 AND l.list_type = $2 AND li.movie_id = $3`,
        args: [userId, listType, movieId],
      });
      await connection.queryObject("COMMIT");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },

  async setMyRating(authUser, movieId, rating): Promise<void> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const movie = await connection.queryObject({ text: "SELECT 1 FROM rewind.movies WHERE id = $1 AND is_published = TRUE", args: [movieId] });
      if (!movie.rows.length) throw new RewindApiError(400, "Movie not found");
      await connection.queryObject({
        text: `INSERT INTO rewind.ratings (user_id, movie_id, rating)
               VALUES ($1, $2, $3)
               ON CONFLICT (user_id, movie_id) DO UPDATE SET rating = EXCLUDED.rating`,
        args: [userId, movieId, rating],
      });
      await connection.queryObject({
        text: "INSERT INTO rewind.user_activities (user_id, activity_type, movie_id) VALUES ($1, 'RATING', $2)",
        args: [userId, movieId],
      });
      await connection.queryObject("COMMIT");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },

  async deleteMyRating(authUser, movieId): Promise<void> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      await connection.queryObject({
        text: "DELETE FROM rewind.ratings WHERE user_id = $1 AND movie_id = $2",
        args: [userId, movieId],
      });
      await connection.queryObject("COMMIT");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },
};
