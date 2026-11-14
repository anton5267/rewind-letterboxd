import { enrichCommunityUsers } from "./shared/community.ts";
import type { RewindApiRepository } from "../contracts/repository.ts";
import type { ActivityResponse, FollowStatusResponse, PopularReviewerResponse, PublicSocialUser } from "../contracts/social.ts";
import { RewindApiError } from "../http/errors.ts";
import {
  pool,
  type PgConnection,
} from "../runtime/database.ts";
import {
  beginUserTransaction,
} from "../runtime/transactions.ts";
import {
  pageResult,
  safeId,
} from "./shared/results.ts";

function toPublicUser(row: { id: string; username: string; display_name: string | null; avatar_url: string | null }): PublicSocialUser {
  return { id: safeId(row.id, "User ID"), username: row.username, displayName: row.display_name?.trim() || row.username, avatarUrl: row.avatar_url };
}

function toActivity(row: {
  id: string; activity_type: ActivityResponse["type"]; created_at: string;
  actor_id: string | null; actor_username: string | null; actor_display_name: string | null; actor_avatar_url: string | null;
  movie_id: string | null; movie_title: string | null;
  related_user_id: string | null; related_username: string | null; related_display_name: string | null;
  list_id: string | null; list_name: string | null;
}): ActivityResponse {
  const actor = row.actor_id && row.actor_username ? {
    id: safeId(row.actor_id, "User ID"), username: row.actor_username,
    displayName: row.actor_display_name?.trim() || row.actor_username, avatarUrl: row.actor_avatar_url,
  } : null;
  const relatedUser = row.related_user_id && row.related_username ? {
    id: safeId(row.related_user_id, "User ID"), username: row.related_username,
    displayName: row.related_display_name?.trim() || row.related_username,
  } : null;
  return {
    id: safeId(row.id, "Activity ID"), type: row.activity_type, createdAt: row.created_at,
    actor,
    movie: row.movie_id && row.movie_title ? { id: safeId(row.movie_id, "Movie ID"), title: row.movie_title } : null,
    relatedUser,
    list: row.list_id && row.list_name ? { id: safeId(row.list_id, "List ID"), name: row.list_name } : null,
  };
}

async function readUsersPage(where: string, args: unknown[], page: number, size: number, orderBy: string) {
  const connection = await pool.connect();
  try {
    await connection.queryObject("SET ROLE rewind_edge_app");
    const count = await connection.queryObject<{ total: string }>({
      text: `SELECT COUNT(*)::text AS total FROM rewind.users u WHERE u.is_active AND ${where}`, args,
    });
    const rows = await connection.queryObject<{ id: string; username: string; display_name: string | null; avatar_url: string | null }>({
      text: `SELECT u.id::text AS id, u.username, u.display_name, u.avatar_url FROM rewind.users u
             WHERE u.is_active AND ${where} ORDER BY ${orderBy} LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
      args: [...args, size, page * size],
    });
    return pageResult(await enrichCommunityUsers(connection, rows.rows.map(toPublicUser)), count.rows[0]?.total ?? "0", page, size);
  } finally { connection.release(); }
}

async function readFollowPage(userId: number, page: number, size: number, outgoing: boolean) {
  const connection = await pool.connect();
  try {
    await connection.queryObject("SET ROLE rewind_edge_app");
    const active = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [userId] });
    if (!active.rows.length) return null;
    const ownerColumn = outgoing ? "f.follower_id" : "f.following_id";
    const targetColumn = outgoing ? "f.following_id" : "f.follower_id";
    const [count, rows] = await Promise.all([
      connection.queryObject<{ total: string }>({
        text: `SELECT COUNT(*)::text AS total FROM rewind.follows f JOIN rewind.users u ON u.id = ${targetColumn} AND u.is_active WHERE ${ownerColumn} = $1`, args: [userId],
      }),
      connection.queryObject<{ id: string; username: string; display_name: string | null; avatar_url: string | null }>({
        text: `SELECT u.id::text AS id, u.username, u.display_name, u.avatar_url FROM rewind.follows f
               JOIN rewind.users u ON u.id = ${targetColumn} AND u.is_active
               WHERE ${ownerColumn} = $1 ORDER BY f.created_at DESC, f.id DESC LIMIT $2 OFFSET $3`, args: [userId, size, page * size],
      }),
    ]);
    return pageResult(rows.rows.map(toPublicUser), count.rows[0]?.total ?? "0", page, size);
  } finally { connection.release(); }
}

async function queryActivityPage(connection: PgConnection, predicate: string, predicateArgs: unknown[], page: number, size: number) {
  const [count, rows] = await Promise.all([
    connection.queryObject<{ total: string }>({
      text: `SELECT COUNT(*)::text AS total FROM rewind.user_activities a
             JOIN rewind.users actor ON actor.id = a.user_id AND actor.is_active
             LEFT JOIN rewind.movies visible_movie ON visible_movie.id = a.movie_id AND visible_movie.is_published = TRUE
             LEFT JOIN rewind.lists l ON l.id = a.list_id AND l.is_public
               AND EXISTS (SELECT 1 FROM rewind.users list_owner WHERE list_owner.id = l.user_id AND list_owner.is_active = TRUE)
             WHERE ${predicate} AND (a.list_id IS NULL OR l.id IS NOT NULL)
               AND (a.movie_id IS NULL OR visible_movie.id IS NOT NULL)`, args: predicateArgs,
    }),
    connection.queryObject<{
      id: string; activity_type: ActivityResponse["type"]; created_at: string;
      actor_id: string | null; actor_username: string | null; actor_display_name: string | null; actor_avatar_url: string | null;
      movie_id: string | null; movie_title: string | null;
      related_user_id: string | null; related_username: string | null; related_display_name: string | null;
      list_id: string | null; list_name: string | null;
    }>({
      text: `SELECT a.id::text AS id, a.activity_type, a.created_at::text AS created_at,
                    actor.id::text AS actor_id, actor.username AS actor_username, actor.display_name AS actor_display_name, actor.avatar_url AS actor_avatar_url,
                    m.id::text AS movie_id, m.title AS movie_title,
                    related.id::text AS related_user_id, related.username AS related_username, related.display_name AS related_display_name,
                    l.id::text AS list_id, l.name AS list_name
             FROM rewind.user_activities a JOIN rewind.users actor ON actor.id = a.user_id AND actor.is_active
              LEFT JOIN rewind.movies m ON m.id = a.movie_id AND m.is_published = TRUE
             LEFT JOIN rewind.users related ON related.id = a.related_user_id AND related.is_active
              LEFT JOIN rewind.lists l ON l.id = a.list_id AND l.is_public
                AND EXISTS (SELECT 1 FROM rewind.users list_owner WHERE list_owner.id = l.user_id AND list_owner.is_active = TRUE)
              WHERE ${predicate} AND (a.list_id IS NULL OR l.id IS NOT NULL)
                AND (a.movie_id IS NULL OR m.id IS NOT NULL)
             ORDER BY a.created_at DESC, a.id DESC LIMIT $${predicateArgs.length + 1} OFFSET $${predicateArgs.length + 2}`,
      args: [...predicateArgs, size, page * size],
    }),
  ]);
  return pageResult(rows.rows.map(toActivity), count.rows[0]?.total ?? "0", page, size);
}

async function readActivityPage(userId: number, page: number, size: number) {
  const connection = await pool.connect();
  try {
    await connection.queryObject("SET ROLE rewind_edge_app");
    const active = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [userId] });
    if (!active.rows.length) return null;
    return await queryActivityPage(connection, "a.user_id = $1", [userId], page, size);
  } finally { connection.release(); }
}

export const socialRepository: Pick<RewindApiRepository,
  | "getFollowers"
  | "getFollowing"
  | "getUserActivity"
  | "getFollowingActivity"
  | "getRecentWatched"
  | "getPopularReviewers"
  | "getHqUsers"
  | "getDirectoryUsers"
  | "getPublicUser"
  | "getFollowStatus"
  | "setFollow"
  | "getBlockStatus"
  | "setBlock"
  | "getMySocialLinks"
  | "updateMySocialLinks"
> = {

  async getFollowers(userId, page, size) { return readFollowPage(userId, page, size, false); },

  async getFollowing(userId, page, size) { return readFollowPage(userId, page, size, true); },

  async getUserActivity(userId, page, size) { return readActivityPage(userId, page, size); },

  async getFollowingActivity(authUser, page, size) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await queryActivityPage(connection, "a.user_id = ANY($1::bigint[])", [
        (await connection.queryObject<{ id: string }>({
          text: "SELECT following_id::text AS id FROM rewind.follows WHERE follower_id = $1 ORDER BY following_id", args: [userId],
        })).rows.map((row) => safeId(row.id, "User ID")),
      ], page, size);
      await connection.queryObject("COMMIT");
      return result;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getRecentWatched(size) {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({
          text: `SELECT COUNT(*)::text AS total FROM rewind.user_activities a
                  JOIN rewind.users u ON u.id = a.user_id AND u.is_active
                  JOIN rewind.movies m ON m.id = a.movie_id AND m.is_published = TRUE WHERE a.activity_type = 'WATCHED'`,
        }),
        connection.queryObject<{ id: string; created_at: string; actor_id: string | null; username: string | null; display_name: string | null; movie_id: string | null; title: string | null }>({
          text: `SELECT a.id::text AS id, a.created_at::text AS created_at, u.id::text AS actor_id,
                        u.username, u.display_name, m.id::text AS movie_id, m.title
                 FROM rewind.user_activities a JOIN rewind.users u ON u.id = a.user_id AND u.is_active
                  JOIN rewind.movies m ON m.id = a.movie_id AND m.is_published = TRUE
                 WHERE a.activity_type = 'WATCHED'
                 ORDER BY a.created_at DESC, a.id DESC LIMIT $1`, args: [size],
        }),
      ]);
      const totalElements = Number(count.rows[0]?.total ?? "0");
      return { content: rows.rows.map((row) => ({ id: safeId(row.id, "Activity ID"), createdAt: row.created_at,
        actor: row.actor_id && row.username ? { id: safeId(row.actor_id, "User ID"), username: row.username,
          displayName: row.display_name?.trim() || row.username } : null,
        movie: row.movie_id && row.title ? { id: safeId(row.movie_id, "Movie ID"), title: row.title } : null })),
        totalPages: Math.ceil(totalElements / size), totalElements, number: 0 };
    } finally { connection.release(); }
  },

  async getPopularReviewers(size): Promise<PopularReviewerResponse[]> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const rows = await connection.queryObject<{
        id: string; username: string; display_name: string | null; avatar_url: string | null; likes: string;
      }>({
        text: `SELECT u.id::text AS id, u.username, u.display_name, u.avatar_url, COUNT(rl.id)::text AS likes
               FROM rewind.review_likes rl JOIN rewind.reviews r ON r.id = rl.review_id AND NOT r.is_hidden
               JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
               JOIN rewind.users u ON u.id = r.user_id AND u.is_active
               JOIN rewind.users liker ON liker.id = rl.user_id AND liker.is_active
               GROUP BY u.id, u.username, u.display_name, u.avatar_url
               ORDER BY COUNT(rl.id) DESC, u.id DESC LIMIT $1`, args: [size],
      });
      return enrichCommunityUsers(connection, rows.rows.map((row) => ({ ...toPublicUser(row), likes: Number(row.likes) })));
    } finally { connection.release(); }
  },

  async getHqUsers(page, size) { return readUsersPage("u.is_hq = TRUE", [], page, size, "u.created_at DESC, u.id DESC"); },

  async getDirectoryUsers(query, page, size) {
    const term = query?.toLowerCase() || null;
    return readUsersPage("($1::text IS NULL OR POSITION($1 IN LOWER(u.username)) > 0 OR POSITION($1 IN LOWER(COALESCE(u.display_name, ''))) > 0)", [term], page, size, "u.username ASC, u.id ASC");
  },

  async getPublicUser(userId) {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const result = await connection.queryObject<{ id: string; username: string; display_name: string | null; avatar_url: string | null }>({
        text: "SELECT id::text AS id, username, display_name, avatar_url FROM rewind.users WHERE id = $1 AND is_active", args: [userId],
      });
      return result.rows[0] ? toPublicUser(result.rows[0]) : null;
    } finally { connection.release(); }
  },

  async getFollowStatus(authUser, targetId): Promise<FollowStatusResponse | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const target = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [targetId] });
      if (!target.rows.length) { await connection.queryObject("COMMIT"); return null; }
      const result = await connection.queryObject<{ following: boolean; followers: string; following_count: string }>({
        text: `SELECT EXISTS(SELECT 1 FROM rewind.follows WHERE follower_id = $1 AND following_id = $2) AS following,
                      (SELECT COUNT(*)::text FROM rewind.follows f JOIN rewind.users u ON u.id = f.follower_id AND u.is_active WHERE f.following_id = $2) AS followers,
                      (SELECT COUNT(*)::text FROM rewind.follows f JOIN rewind.users u ON u.id = f.following_id AND u.is_active WHERE f.follower_id = $1) AS following_count`,
        args: [userId, targetId],
      });
      await connection.queryObject("COMMIT");
      return { following: result.rows[0]?.following ?? false, followers: Number(result.rows[0]?.followers ?? 0), followingCount: Number(result.rows[0]?.following_count ?? 0) };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async setFollow(authUser, targetId, following) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const target = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [targetId] });
      if (!target.rows.length) { await connection.queryObject("COMMIT"); return false; }
      if (userId === targetId) throw new RewindApiError(400, "You cannot follow yourself");
      if (!following) {
        await connection.queryObject({ text: "DELETE FROM rewind.follows WHERE follower_id = $1 AND following_id = $2", args: [userId, targetId] });
        await connection.queryObject("COMMIT");
        return true;
      }
      const block = await connection.queryObject({
        text: `SELECT 1 FROM rewind.user_blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1) LIMIT 1`,
        args: [userId, targetId],
      });
      if (block.rows.length) throw new RewindApiError(403, "User interaction is blocked");
      const inserted = await connection.queryObject({
        text: "INSERT INTO rewind.follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT (follower_id, following_id) DO NOTHING RETURNING id",
        args: [userId, targetId],
      });
      if (inserted.rows.length) {
        await connection.queryObject({ text: "INSERT INTO rewind.user_activities (user_id, activity_type, related_user_id) VALUES ($1, 'FOLLOW', $2)", args: [userId, targetId] });
        const preference = await connection.queryObject<{ follows_enabled: boolean }>({
          text: "SELECT follows_enabled FROM rewind.notification_preferences WHERE user_id = $1", args: [targetId],
        });
        if (preference.rows[0]?.follows_enabled ?? true) {
          await connection.queryObject({
            text: "INSERT INTO rewind.notifications (recipient_id, actor_id, related_user_id, notification_type) VALUES ($1, $2, $2, 'FOLLOW')",
            args: [targetId, userId],
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

  async getBlockStatus(authUser, targetId) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const target = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [targetId] });
      if (!target.rows.length) { await connection.queryObject("COMMIT"); return null; }
      const result = await connection.queryObject<{ blocked: boolean }>({
        text: `SELECT EXISTS(SELECT 1 FROM rewind.user_blocks WHERE
               (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)) AS blocked`,
        args: [userId, targetId],
      });
      await connection.queryObject("COMMIT");
      return { blocked: result.rows[0]?.blocked ?? false };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async setBlock(authUser, targetId, blocked): Promise<boolean | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const target = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [targetId] });
      if (!target.rows.length) { await connection.queryObject("COMMIT"); return null; }
      if (userId === targetId) throw new RewindApiError(400, "You cannot block yourself");
      if (blocked) {
        await connection.queryObject({
          text: "INSERT INTO rewind.user_blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT (blocker_id, blocked_id) DO NOTHING",
          args: [userId, targetId],
        });
        await connection.queryObject({
          text: `DELETE FROM rewind.follows WHERE (follower_id = $1 AND following_id = $2)
                 OR (follower_id = $2 AND following_id = $1)`, args: [userId, targetId],
        });
      } else {
        await connection.queryObject({ text: "DELETE FROM rewind.user_blocks WHERE blocker_id = $1 AND blocked_id = $2", args: [userId, targetId] });
      }
      await connection.queryObject("COMMIT");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getMySocialLinks(authUser) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{ platform: string; url: string }>({
        text: "SELECT platform, url FROM rewind.user_social_links WHERE user_id = $1 ORDER BY platform", args: [userId],
      });
      await connection.queryObject("COMMIT");
      return result.rows;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async updateMySocialLinks(authUser, links) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      await connection.queryObject({ text: "DELETE FROM rewind.user_social_links WHERE user_id = $1", args: [userId] });
      for (const link of links) {
        await connection.queryObject({
          text: "INSERT INTO rewind.user_social_links (user_id, platform, url) VALUES ($1, $2, $3)",
          args: [userId, link.platform, link.url],
        });
      }
      const result = await connection.queryObject<{ platform: string; url: string }>({
        text: "SELECT platform, url FROM rewind.user_social_links WHERE user_id = $1 ORDER BY platform", args: [userId],
      });
      await connection.queryObject("COMMIT");
      return result.rows;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
};
