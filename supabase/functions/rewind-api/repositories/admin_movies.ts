import {
  buildAdminMovieCreateQuery,
} from "../admin_movie_create.ts";
import {
  replaceAdminMovieCredits,
} from "../admin_movie_credits.ts";
import {
  replaceAdminMovieGenres,
} from "../admin_movie_genres.ts";
import {
  buildAdminMovieAuditMetadata,
  buildAdminMovieUpdateQuery,
} from "../admin_movie_update.ts";
import type { AdminMovieCatalogResponse, AdminMovieResponse, AdminMovieWriteRequest } from "../contracts/admin.ts";
import type { RewindApiRepository } from "../contracts/repository.ts";
import { parseSafeCount } from "../http/parsers/query.ts";
import {
  beginAdminTransaction,
} from "../runtime/transactions.ts";
import {
  recordAdminAudit,
} from "./shared/admin_audit.ts";
import {
  pageResult,
  safeId,
} from "./shared/results.ts";

function toAdminMovie(row: {
  id: string; tmdb_id: string | null; title: string; release_date: string | null;
  rating: string | number | null; photo_url: string | null; is_published: boolean;
}): AdminMovieResponse {
  return {
    id: safeId(row.id, "Movie ID"), tmdbId: row.tmdb_id === null ? null : safeId(row.tmdb_id, "TMDB ID"),
    title: row.title, releaseDate: row.release_date,
    rating: row.rating === null ? null : Number(row.rating), photoUrl: row.photo_url, published: row.is_published,
  };
}

function toAdminMovieCatalog(row: {
  id: string; tmdb_id: string | null; title: string; release_date: string | null;
  rating: string | number | null; photo_url: string | null; duration_minutes: number | null;
  age_rating: string | null; review_count: string | number; is_published: boolean;
}): AdminMovieCatalogResponse {
  return {
    ...toAdminMovie(row), durationMinutes: row.duration_minutes, ageRating: row.age_rating,
    reviewCount: parseSafeCount(String(row.review_count)), published: row.is_published,
  };
}

export const adminMoviesRepository: Pick<RewindApiRepository,
  | "getAdminMovies"
  | "createAdminMovie"
  | "updateAdminMovie"
  | "deleteAdminMovie"
> = {

  async getAdminMovies(authUser, query, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const search = query?.trim() || null;
      const where = search === null ? "" : "WHERE POSITION(LOWER($1::text) IN LOWER(m.title)) > 0";
      const args = search === null ? [] : [search];
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.movies m ${where}`, args }),
        connection.queryObject<{
          id: string; tmdb_id: string | null; title: string; release_date: string | null;
          rating: string | number | null; photo_url: string | null; duration_minutes: number | null;
          age_rating: string | null; review_count: string; is_published: boolean;
        }>({
          text: `SELECT m.id::text AS id, m.tmdb_id::text AS tmdb_id, m.title, m.release_date::text AS release_date,
                        m.rating::text AS rating, m.photo_url, m.duration_minutes, m.age_rating, m.is_published,
                        (SELECT COUNT(*)::text FROM rewind.reviews r
                         JOIN rewind.users author ON author.id = r.user_id AND author.is_active = TRUE
                         WHERE r.movie_id = m.id AND r.is_hidden = FALSE) AS review_count
                 FROM rewind.movies m ${where}
                 ORDER BY m.id DESC LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
          args: [...args, size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toAdminMovieCatalog), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async createAdminMovie(authUser, body: AdminMovieWriteRequest) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        id: string; tmdb_id: string | null; title: string; release_date: string | null;
        rating: string | number | null; photo_url: string | null; is_published: boolean;
      }>(buildAdminMovieCreateQuery(body));
      const movieId = parseSafeCount(result.rows[0]!.id);
      if (body.genreIds !== undefined) await replaceAdminMovieGenres(connection, movieId, body.genreIds);
      if (body.actorCredits !== undefined || body.directorIds !== undefined || body.producerIds !== undefined) {
        await replaceAdminMovieCredits(connection, movieId, body);
      }
      await recordAdminAudit(connection, userId, "MOVIE_CREATED", "MOVIE", movieId, buildAdminMovieAuditMetadata(body));
      await connection.queryObject("COMMIT");
      return toAdminMovie(result.rows[0]!);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async updateAdminMovie(authUser, id, body: AdminMovieWriteRequest) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const updateQuery = buildAdminMovieUpdateQuery(id, body);
      let result;
      if (updateQuery) {
        result = await connection.queryObject<{
          id: string; tmdb_id: string | null; title: string; release_date: string | null;
          rating: string | number | null; photo_url: string | null; is_published: boolean;
        }>({
          text: updateQuery.text,
          args: updateQuery.args,
        });
      } else {
        result = await connection.queryObject<{
          id: string; tmdb_id: string | null; title: string; release_date: string | null;
          rating: string | number | null; photo_url: string | null; is_published: boolean;
        }>({
          text: `SELECT id::text AS id, tmdb_id::text AS tmdb_id, title, release_date::text AS release_date,
                        rating::text AS rating, photo_url, is_published FROM rewind.movies WHERE id=$1`, args: [id],
        });
      }
      if (result.rows[0] && body.genreIds !== undefined) await replaceAdminMovieGenres(connection, id, body.genreIds);
      if (result.rows[0] && (body.actorCredits !== undefined || body.directorIds !== undefined || body.producerIds !== undefined)) {
        await replaceAdminMovieCredits(connection, id, body);
      }
      if (result.rows[0]) {
        const metadata = buildAdminMovieAuditMetadata(body);
        if (metadata) await recordAdminAudit(connection, userId, "MOVIE_UPDATED", "MOVIE", id, metadata);
      }
      await connection.queryObject("COMMIT");
      return result.rows[0] ? toAdminMovie(result.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async deleteAdminMovie(authUser, id) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject({ text: "DELETE FROM rewind.movies WHERE id=$1 RETURNING id", args: [id] });
      if (result.rows.length > 0) await recordAdminAudit(connection, userId, "MOVIE_DELETED", "MOVIE", id, null);
      await connection.queryObject("COMMIT");
      return result.rows.length > 0;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
};
