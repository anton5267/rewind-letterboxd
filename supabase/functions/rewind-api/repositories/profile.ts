import type { MovieCardResponse } from "../contracts/catalog.ts";
import type { PublicListCardResponse } from "../contracts/lists.ts";
import type { PublicProfileResponse, ReplyPreference } from "../contracts/profile.ts";
import type { RewindApiRepository } from "../contracts/repository.ts";
import { RewindApiError } from "../http/errors.ts";
import { syncVerifiedProfileEmail } from "../runtime/profile_email.ts";
import {
  supabaseSecretKey,
  supabaseUrl,
} from "../runtime/config.ts";
import {
  pool,
} from "../runtime/database.ts";
import {
  beginUserTransaction,
} from "../runtime/transactions.ts";
import {
  ensureSystemLists,
  loadListTags,
} from "./shared/lists.ts";
import {
  pageResult,
  safeId,
} from "./shared/results.ts";

export const profileRepository: Pick<RewindApiRepository,
  | "getPublicProfile"
  | "getPublicProfileCollection"
  | "getPublicProfileLists"
  | "getPublicProfileLikedReviews"
  | "getOrCreateCurrentUser"
  | "getMyProfile"
  | "updateMyProfile"
  | "deleteMyAccount"
  | "getMyProfileCollection"
> = {

  async getPublicProfile(userId): Promise<PublicProfileResponse | null> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const userResult = await connection.queryObject<{
        id: string; username: string; display_name: string | null; avatar_url: string | null; bio: string | null; location: string | null; pronoun: string | null; is_hq: boolean;
      }>({
        text: "SELECT id::text AS id, username, display_name, avatar_url, bio, location, pronoun, is_hq FROM rewind.users WHERE id = $1 AND is_active",
        args: [userId],
      });
      const user = userResult.rows[0];
      if (!user) return null;
      const [counts, distribution, lists, reviews, socialLinks] = await Promise.all([
        connection.queryObject<{ ratings: string; reviews: string; watched: string; watchlist: string; favorites: string }>({
          text: `SELECT
            (SELECT COUNT(*)::text FROM rewind.ratings r JOIN rewind.movies m ON m.id = r.movie_id WHERE r.user_id = $1 AND m.is_published) AS ratings,
            (SELECT COUNT(*)::text FROM rewind.reviews r JOIN rewind.movies m ON m.id = r.movie_id WHERE r.user_id = $1 AND NOT r.is_hidden AND m.is_published) AS reviews,
            (SELECT COUNT(*)::text FROM rewind.list_items i JOIN rewind.lists l ON l.id = i.list_id JOIN rewind.movies m ON m.id = i.movie_id WHERE l.user_id = $1 AND l.list_type = 'WATCHED' AND m.is_published) AS watched,
            (SELECT COUNT(*)::text FROM rewind.list_items i JOIN rewind.lists l ON l.id = i.list_id JOIN rewind.movies m ON m.id = i.movie_id WHERE l.user_id = $1 AND l.list_type = 'WATCHLIST' AND m.is_published) AS watchlist,
            (SELECT COUNT(*)::text FROM rewind.list_items i JOIN rewind.lists l ON l.id = i.list_id JOIN rewind.movies m ON m.id = i.movie_id WHERE l.user_id = $1 AND l.list_type = 'FAVORITES' AND m.is_published) AS favorites`, args: [userId],
        }),
        connection.queryObject<{ rating: number; count: string }>({
          text: "SELECT r.rating, COUNT(*)::text AS count FROM rewind.ratings r JOIN rewind.movies m ON m.id = r.movie_id WHERE r.user_id = $1 AND m.is_published GROUP BY r.rating ORDER BY r.rating",
          args: [userId],
        }),
        connection.queryObject<{ id: string; name: string; description: string | null }>({
          text: `SELECT id::text AS id, name, description FROM rewind.lists
                 WHERE user_id = $1 AND list_type = 'CUSTOM' AND is_public
                 ORDER BY updated_at DESC, id DESC`, args: [userId],
        }),
        connection.queryObject<{ id: string; movie_id: string; movie_title: string; content: string; rating: number | null; updated_at: string }>({
          text: `SELECT r.id::text AS id, r.movie_id::text AS movie_id, m.title AS movie_title,
                        r.content, r.rating, r.updated_at::text AS updated_at
                  FROM rewind.reviews r JOIN rewind.movies m ON m.id = r.movie_id
                  WHERE r.user_id = $1 AND NOT r.is_hidden AND m.is_published
                 ORDER BY r.updated_at DESC, r.id DESC LIMIT 10`, args: [userId],
        }),
        connection.queryObject<{ platform: string; url: string }>({
          text: "SELECT platform, url FROM rewind.user_social_links WHERE user_id = $1 ORDER BY platform", args: [userId],
        }),
      ]);
      const stats = counts.rows[0];
      return {
        id: safeId(user.id, "User ID"), username: user.username,
        displayName: user.display_name?.trim() || user.username, avatarUrl: user.avatar_url, bio: user.bio, location: user.location, pronoun: user.pronoun, hq: user.is_hq,
        stats: {
          ratings: Number(stats?.ratings ?? 0), reviews: Number(stats?.reviews ?? 0),
          watched: Number(stats?.watched ?? 0), watchlist: Number(stats?.watchlist ?? 0), favorites: Number(stats?.favorites ?? 0),
        },
        ratingDistribution: distribution.rows.map((row) => ({ rating: row.rating, count: Number(row.count) })),
        socialLinks: socialLinks.rows,
        lists: lists.rows.map((row) => ({ id: safeId(row.id, "List ID"), name: row.name, description: row.description })),
        recentReviews: reviews.rows.map((row) => ({
          id: safeId(row.id, "Review ID"), movieId: safeId(row.movie_id, "Movie ID"), movieTitle: row.movie_title,
          content: row.content, rating: row.rating, updatedAt: row.updated_at,
        })),
      };
    } finally { connection.release(); }
  },

  async getPublicProfileCollection(userId, collection, page, size) {
    const listType = collection.toUpperCase();
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const user = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [userId] });
      if (!user.rows.length) return null;
      const list = await connection.queryObject<{ id: string }>({
        text: "SELECT id::text AS id FROM rewind.lists WHERE user_id = $1 AND list_type = $2 ORDER BY id LIMIT 1",
        args: [userId, listType],
      });
      if (!list.rows[0]) return { content: [], totalPages: 0, totalElements: 0, number: page };
      const listId = safeId(list.rows[0].id, "List ID");
      const [count, movies] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: "SELECT COUNT(*)::text AS total FROM rewind.list_items i JOIN rewind.movies m ON m.id = i.movie_id WHERE i.list_id = $1 AND m.is_published", args: [listId] }),
        connection.queryObject<{ id: string; title: string; release_date: string | null; rating: string | null; photo_url: string | null }>({
          text: `SELECT m.id::text AS id, m.title, m.release_date::text AS release_date, m.rating::text AS rating, m.photo_url
                 FROM rewind.list_items i JOIN rewind.movies m ON m.id = i.movie_id
                  WHERE i.list_id = $1 AND m.is_published ORDER BY i.added_at DESC, i.id DESC LIMIT $2 OFFSET $3`,
          args: [listId, size, page * size],
        }),
      ]);
      return pageResult(movies.rows.map((movie) => ({
        id: safeId(movie.id, "Movie ID"), title: movie.title, releaseDate: movie.release_date,
        rating: movie.rating === null ? null : Number(movie.rating), photoUrl: movie.photo_url,
      })), count.rows[0]?.total ?? "0", page, size);
    } finally { connection.release(); }
  },

  async getPublicProfileLists(userId, page, size) {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const active = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [userId] });
      if (!active.rows.length) return null;
      const count = await connection.queryObject<{ total: string }>({
        text: "SELECT COUNT(*)::text AS total FROM rewind.lists WHERE user_id = $1 AND list_type = 'CUSTOM' AND is_public", args: [userId],
      });
      const rows = await connection.queryObject<{
        id: string; name: string; description: string | null; owner_username: string; owner_avatar_url: string | null;
      }>({
        text: `SELECT l.id::text AS id, l.name, l.description, u.username AS owner_username, u.avatar_url AS owner_avatar_url
               FROM rewind.lists l JOIN rewind.users u ON u.id = l.user_id
               WHERE l.user_id = $1 AND l.list_type = 'CUSTOM' AND l.is_public AND u.is_active
               ORDER BY l.updated_at DESC, l.id DESC LIMIT $2 OFFSET $3`, args: [userId, size, page * size],
      });
      const ids = rows.rows.map((row) => safeId(row.id, "List ID"));
      const [tags, counts, previews, likes] = await Promise.all([
        loadListTags(connection, ids),
        ids.length ? connection.queryObject<{ list_id: string; total: string }>({
           text: "SELECT i.list_id::text AS list_id, COUNT(*)::text AS total FROM rewind.list_items i JOIN rewind.movies m ON m.id = i.movie_id WHERE i.list_id = ANY($1::bigint[]) AND m.is_published GROUP BY i.list_id", args: [ids],
        }) : Promise.resolve({ rows: [] as { list_id: string; total: string }[] }),
        ids.length ? connection.queryObject<{ list_id: string; id: string; title: string; release_date: string | null; rating: string | null; photo_url: string | null }>({
          text: `SELECT list_id::text AS list_id, id::text AS id, title, release_date::text AS release_date,
                        rating::text AS rating, photo_url FROM (
                   SELECT i.list_id, m.id, m.title, m.release_date, m.rating, m.photo_url,
                          ROW_NUMBER() OVER (PARTITION BY i.list_id ORDER BY i.position NULLS LAST, i.id) AS rn
                   FROM rewind.list_items i JOIN rewind.movies m ON m.id = i.movie_id
                    WHERE i.list_id = ANY($1::bigint[]) AND m.is_published
                 ) ranked WHERE rn <= 3 ORDER BY list_id, rn`, args: [ids],
        }) : Promise.resolve({ rows: [] as { list_id: string; id: string; title: string; release_date: string | null; rating: string | null; photo_url: string | null }[] }),
        ids.length ? connection.queryObject<{ list_id: string; total: string }>({
          text: `SELECT list_id::text AS list_id, COUNT(*)::text AS total FROM rewind.list_likes ll
                 JOIN rewind.users liker ON liker.id = ll.user_id AND liker.is_active
                 WHERE list_id = ANY($1::bigint[]) GROUP BY list_id`, args: [ids],
        }) : Promise.resolve({ rows: [] as { list_id: string; total: string }[] }),
      ]);
      const itemCounts = new Map(counts.rows.map((row) => [safeId(row.list_id, "List ID"), Number(row.total)]));
      const likeCounts = new Map(likes.rows.map((row) => [safeId(row.list_id, "List ID"), Number(row.total)]));
      const previewMap = new Map<number, MovieCardResponse[]>();
      for (const movie of previews.rows) {
        const id = safeId(movie.list_id, "List ID");
        const list = previewMap.get(id) ?? [];
        list.push({ id: safeId(movie.id, "Movie ID"), title: movie.title, releaseDate: movie.release_date,
          rating: movie.rating === null ? null : Number(movie.rating), photoUrl: movie.photo_url });
        previewMap.set(id, list);
      }
      const content: PublicListCardResponse[] = rows.rows.map((row) => {
        const id = safeId(row.id, "List ID");
        return { id, name: row.name, description: row.description, isPublic: true, ownerId: userId,
          ownerUsername: row.owner_username, ownerAvatarUrl: row.owner_avatar_url, tags: tags.get(id) ?? [],
          likeCount: likeCounts.get(id) ?? 0, itemCount: itemCounts.get(id) ?? 0, previewMovies: previewMap.get(id) ?? [] };
      });
      return pageResult(content, count.rows[0]?.total ?? "0", page, size);
    } finally { connection.release(); }
  },

  async getPublicProfileLikedReviews(userId, page, size) {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const active = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [userId] });
      if (!active.rows.length) return null;
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({
          text: `SELECT COUNT(*)::text AS total FROM rewind.review_likes rl
                 JOIN rewind.reviews r ON r.id = rl.review_id AND NOT r.is_hidden
                  JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
                 JOIN rewind.users author ON author.id = r.user_id AND author.is_active
                 WHERE rl.user_id = $1`, args: [userId],
        }),
        connection.queryObject<{ id: string; movie_id: string; movie_title: string; content: string; rating: number | null; updated_at: string }>({
          text: `SELECT r.id::text AS id, r.movie_id::text AS movie_id, m.title AS movie_title,
                        r.content, r.rating, r.updated_at::text AS updated_at
                 FROM rewind.review_likes rl JOIN rewind.reviews r ON r.id = rl.review_id AND NOT r.is_hidden
                 JOIN rewind.users author ON author.id = r.user_id AND author.is_active
                  JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
                 WHERE rl.user_id = $1 ORDER BY rl.created_at DESC, rl.id DESC LIMIT $2 OFFSET $3`, args: [userId, size, page * size],
        }),
      ]);
      return pageResult(rows.rows.map((row) => ({ id: safeId(row.id, "Review ID"), movieId: safeId(row.movie_id, "Movie ID"),
        movieTitle: row.movie_title, content: row.content, rating: row.rating, updatedAt: row.updated_at })), count.rows[0]?.total ?? "0", page, size);
    } finally { connection.release(); }
  },

  async getOrCreateCurrentUser(authUser) {
    const connection = await pool.connect();
    try {
      await connection.queryObject("BEGIN");
      await connection.queryObject("SET LOCAL ROLE rewind_edge_app");
      await connection.queryObject({
        text: "SELECT set_config('rewind.supabase_user_id', $1, TRUE)",
        args: [authUser.id],
      });
      const existing = await connection.queryObject<{
        id: string; username: string; role: string; avatar_url: string | null; is_active: boolean;
      }>({
        text: `SELECT id::text AS id, username, role, avatar_url, is_active
               FROM rewind.users WHERE supabase_user_id = $1`,
        args: [authUser.id],
      });
      if (existing.rows[0]) {
        const row = existing.rows[0];
        if (!row.is_active) throw new RewindApiError(403, "Account is inactive");
        const userId = Number(row.id);
        if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error("The REWIND user ID is invalid.");
        await connection.queryObject({
          text: "SELECT set_config('rewind.user_id', $1, TRUE)",
          args: [String(userId)],
        });
        await syncVerifiedProfileEmail(connection, userId, authUser);
        await ensureSystemLists(connection, userId);
        await connection.queryObject("COMMIT");
        return { id: userId, username: row.username, role: row.role, avatarUrl: row.avatar_url };
      }

      const unusablePassword = `supabase-auth:${crypto.randomUUID()}`;
      const requested = authUser.username ?? `user_${authUser.id.slice(0, 8)}`;
      let row: { id: string; username: string; role: string; avatar_url: string | null } | undefined;
      for (let attempt = 0; attempt < 5; attempt++) {
        const suffix = attempt === 0 ? "" : `_${crypto.randomUUID().slice(0, 6)}`;
        const username = `${requested.slice(0, 50 - suffix.length)}${suffix}`;
        try {
          const inserted = await connection.queryObject<{
            id: string; username: string; role: string; avatar_url: string | null;
          }>({
            text: `INSERT INTO rewind.users (username, email, password_hash, supabase_user_id)
                   VALUES ($1, $2, $3, $4)
                   ON CONFLICT DO NOTHING
                   RETURNING id::text AS id, username, role, avatar_url`,
            args: [username, authUser.email, unusablePassword, authUser.id],
          });
          row = inserted.rows[0];
          if (row) break;

          // A concurrent /users/me request may have linked this UUID while
          // the insert was waiting on the unique constraint.
          const linked = await connection.queryObject<{
            id: string; username: string; role: string; avatar_url: string | null; is_active: boolean;
          }>({
            text: `SELECT id::text AS id, username, role, avatar_url, is_active
                   FROM rewind.users WHERE supabase_user_id = $1`,
            args: [authUser.id],
          });
          if (linked.rows[0]) {
            if (!linked.rows[0].is_active) throw new RewindApiError(403, "Account is inactive");
            row = linked.rows[0];
            break;
          }
        } catch (error) {
          throw error;
        }
      }
      if (!row) throw new Error("Unable to allocate a unique username.");
      const userId = Number(row.id);
      if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error("The REWIND user ID is invalid.");
      await connection.queryObject({
        text: "SELECT set_config('rewind.user_id', $1, TRUE)",
        args: [String(userId)],
      });
      await syncVerifiedProfileEmail(connection, userId, authUser);
      await ensureSystemLists(connection, userId);
      await connection.queryObject("COMMIT");
      return { id: userId, username: row.username, role: row.role, avatarUrl: row.avatar_url };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },

  async getMyProfile(authUser) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const userResult = await connection.queryObject<{
        id: string; username: string; display_name: string | null; role: string; avatar_url: string | null; bio: string | null; location: string | null; pronoun: string | null; reply_preference: ReplyPreference;
      }>({
        text: `SELECT id::text AS id, username, display_name, role, avatar_url, bio, location, pronoun, reply_preference
               FROM rewind.users WHERE id = $1`,
        args: [userId],
      });
      const user = userResult.rows[0];
      if (!user) throw new Error("The REWIND profile is unavailable.");
      const [statsResult, listsResult, ratingsResult, reviewsResult] = await Promise.all([
        connection.queryObject<{
          ratings: string; reviews: string; watched: string; watchlist: string; favorites: string;
        }>({
          text: `SELECT
            (SELECT COUNT(*)::text FROM rewind.ratings r JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE WHERE r.user_id = $1) AS ratings,
            (SELECT COUNT(*)::text FROM rewind.reviews r JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE WHERE r.user_id = $1 AND r.is_hidden = FALSE) AS reviews,
            (SELECT COUNT(*)::text FROM rewind.list_items i JOIN rewind.lists l ON l.id = i.list_id JOIN rewind.movies m ON m.id = i.movie_id AND m.is_published = TRUE WHERE l.user_id = $1 AND l.list_type = 'WATCHED') AS watched,
            (SELECT COUNT(*)::text FROM rewind.list_items i JOIN rewind.lists l ON l.id = i.list_id JOIN rewind.movies m ON m.id = i.movie_id AND m.is_published = TRUE WHERE l.user_id = $1 AND l.list_type = 'WATCHLIST') AS watchlist,
            (SELECT COUNT(*)::text FROM rewind.list_items i JOIN rewind.lists l ON l.id = i.list_id JOIN rewind.movies m ON m.id = i.movie_id AND m.is_published = TRUE WHERE l.user_id = $1 AND l.list_type = 'FAVORITES') AS favorites`,
          args: [userId],
        }),
        connection.queryObject<{ id: string; name: string; list_type: string; is_public: boolean }>({
          text: `SELECT id::text AS id, name, list_type, is_public FROM rewind.lists
                 WHERE user_id = $1 ORDER BY updated_at DESC, id DESC`,
          args: [userId],
        }),
        connection.queryObject<{
          movie_id: string; title: string; photo_url: string | null; rating: number; updated_at: string;
        }>({
          text: `SELECT r.movie_id::text AS movie_id, m.title, m.photo_url, r.rating, r.updated_at::text AS updated_at
                 FROM rewind.ratings r JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
                 WHERE r.user_id = $1 ORDER BY r.updated_at DESC, r.id DESC LIMIT 10`,
          args: [userId],
        }),
        connection.queryObject<{
          review_id: string; movie_id: string; title: string; photo_url: string | null; content: string; updated_at: string;
        }>({
          text: `SELECT r.id::text AS review_id, r.movie_id::text AS movie_id, m.title, m.photo_url,
                        r.content, r.updated_at::text AS updated_at
                 FROM rewind.reviews r JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
                 WHERE r.user_id = $1 ORDER BY r.updated_at DESC, r.id DESC LIMIT 10`,
          args: [userId],
        }),
      ]);
      const numericId = Number(user.id);
      if (!Number.isSafeInteger(numericId)) throw new Error("User ID is outside the safe JSON integer range.");
      const toId = (value: string) => {
        const id = Number(value);
        if (!Number.isSafeInteger(id)) throw new Error("Profile item ID is outside the safe JSON integer range.");
        return id;
      };
      const stats = statsResult.rows[0];
      const response = {
        id: numericId,
        username: user.username,
        displayName: user.display_name?.trim() || user.username,
        email: authUser.email,
        role: user.role,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        location: user.location,
        pronoun: user.pronoun,
        replyPreference: user.reply_preference,
        supabaseLinked: true,
        stats: {
          ratings: Number(stats?.ratings ?? 0),
          reviews: Number(stats?.reviews ?? 0),
          watched: Number(stats?.watched ?? 0),
          watchlist: Number(stats?.watchlist ?? 0),
          favorites: Number(stats?.favorites ?? 0),
        },
        lists: listsResult.rows.map((row) => ({
          id: toId(row.id), name: row.name, listType: row.list_type, isPublic: row.is_public,
        })),
        recentRatings: ratingsResult.rows.map((row) => ({
          movieId: toId(row.movie_id), movieTitle: row.title, moviePhotoUrl: row.photo_url,
          rating: row.rating, updatedAt: row.updated_at,
        })),
        recentReviews: reviewsResult.rows.map((row) => ({
          reviewId: toId(row.review_id), movieId: toId(row.movie_id), movieTitle: row.title,
          moviePhotoUrl: row.photo_url, content: row.content, updatedAt: row.updated_at,
        })),
      };
      await connection.queryObject("COMMIT");
      return response;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateMyProfile(authUser, update) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      await connection.queryObject({
        text: `UPDATE rewind.users
               SET display_name = CASE WHEN $2 THEN NULLIF(BTRIM($3), '') ELSE display_name END,
                   avatar_url = CASE WHEN $4 THEN NULLIF(BTRIM($5), '') ELSE avatar_url END,
                   bio = CASE WHEN $6 THEN NULLIF(BTRIM($7), '') ELSE bio END,
                   location = CASE WHEN $8 THEN NULLIF(BTRIM($9), '') ELSE location END,
                   pronoun = CASE WHEN $10 THEN NULLIF(BTRIM($11), '') ELSE pronoun END,
                   reply_preference = CASE WHEN $12 THEN $13 ELSE reply_preference END
               WHERE id = $1`,
        args: [
          userId,
          Object.hasOwn(update, "displayName"), update.displayName ?? null,
          Object.hasOwn(update, "avatarUrl"), update.avatarUrl ?? null,
          Object.hasOwn(update, "bio"), update.bio ?? null,
          Object.hasOwn(update, "location"), update.location ?? null,
          Object.hasOwn(update, "pronoun"), update.pronoun ?? null,
          Object.hasOwn(update, "replyPreference"), update.replyPreference ?? null,
        ],
      });
      await connection.queryObject("COMMIT");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },

  async deleteMyAccount(authUser): Promise<boolean> {
    // Do not remove the REWIND profile until the server has the key needed to
    // delete its hosted identity. Provider outages are retryable after enqueue;
    // missing credentials are a setup error and must fail before any mutation.
    if (!supabaseUrl || !supabaseSecretKey) {
      throw new RewindApiError(503, "Account deletion is not configured");
    }
    const { connection } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{ deleted: boolean }>({
        text: "SELECT rewind.delete_current_supabase_profile() AS deleted",
      });
      await connection.queryObject("COMMIT");
      return result.rows[0]?.deleted === true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },

  async getMyProfileCollection(authUser, collection, page, size) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      let count = 0;
      let content: unknown[] = [];
      const offset = page * size;
      if (collection === "watched" || collection === "watchlist" || collection === "favorites") {
        const listType = collection === "favorites" ? "FAVORITES" : collection.toUpperCase();
        const args = [userId, listType];
        const [countResult, rows] = await Promise.all([
          connection.queryObject<{ total: string }>({
            text: `SELECT COUNT(*)::text AS total FROM rewind.list_items i
                   JOIN rewind.lists l ON l.id = i.list_id
                   JOIN rewind.movies m ON m.id = i.movie_id AND m.is_published = TRUE
                   WHERE l.user_id = $1 AND l.list_type = $2`, args,
          }),
          connection.queryObject<{
            id: string; title: string; release_date: string | null; rating: string | null; photo_url: string | null;
          }>({
            text: `SELECT m.id::text AS id, m.title, m.release_date::text AS release_date,
                          m.rating::text AS rating, m.photo_url
                   FROM rewind.list_items i JOIN rewind.lists l ON l.id = i.list_id
                   JOIN rewind.movies m ON m.id = i.movie_id AND m.is_published = TRUE
                   WHERE l.user_id = $1 AND l.list_type = $2
                   ORDER BY i.added_at DESC, i.id DESC LIMIT $3 OFFSET $4`,
            args: [...args, size, offset],
          }),
        ]);
        count = Number(countResult.rows[0]?.total ?? 0);
        content = rows.rows.map((row) => ({
          id: Number(row.id), title: row.title, releaseDate: row.release_date,
          rating: row.rating === null ? null : Number(row.rating), photoUrl: row.photo_url,
        }));
      } else if (collection === "ratings") {
        const [countResult, rows] = await Promise.all([
          connection.queryObject<{ total: string }>({
            text: `SELECT COUNT(*)::text AS total FROM rewind.ratings r
                   JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
                   WHERE r.user_id = $1`, args: [userId],
          }),
          connection.queryObject<{
            movie_id: string; title: string; photo_url: string | null; rating: number; updated_at: string;
          }>({
            text: `SELECT r.movie_id::text AS movie_id, m.title, m.photo_url, r.rating, r.updated_at::text AS updated_at
                   FROM rewind.ratings r JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
                   WHERE r.user_id = $1 ORDER BY r.updated_at DESC, r.id DESC LIMIT $2 OFFSET $3`,
            args: [userId, size, offset],
          }),
        ]);
        count = Number(countResult.rows[0]?.total ?? 0);
        content = rows.rows.map((row) => ({
          movieId: Number(row.movie_id), movieTitle: row.title, moviePhotoUrl: row.photo_url,
          rating: row.rating, updatedAt: row.updated_at,
        }));
      } else {
        const [countResult, rows] = await Promise.all([
          connection.queryObject<{ total: string }>({
            text: `SELECT COUNT(*)::text AS total FROM rewind.reviews r
                   JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
                   WHERE r.user_id = $1`, args: [userId],
          }),
          connection.queryObject<{
            review_id: string; movie_id: string; title: string; photo_url: string | null; content: string; updated_at: string;
          }>({
            text: `SELECT r.id::text AS review_id, r.movie_id::text AS movie_id, m.title, m.photo_url,
                          r.content, r.updated_at::text AS updated_at
                   FROM rewind.reviews r JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
                   WHERE r.user_id = $1 ORDER BY r.updated_at DESC, r.id DESC LIMIT $2 OFFSET $3`,
            args: [userId, size, offset],
          }),
        ]);
        count = Number(countResult.rows[0]?.total ?? 0);
        content = rows.rows.map((row) => ({
          reviewId: Number(row.review_id), movieId: Number(row.movie_id), movieTitle: row.title,
          moviePhotoUrl: row.photo_url, content: row.content, updatedAt: row.updated_at,
        }));
      }
      await connection.queryObject("COMMIT");
      return { content, totalPages: Math.ceil(count / size), totalElements: count, number: page };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }
  },
};
