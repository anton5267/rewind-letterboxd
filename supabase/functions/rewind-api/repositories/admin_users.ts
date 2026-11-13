import type { AdminUserResponse, AdminUserUpdateRequest } from "../contracts/admin.ts";
import type { RewindApiRepository } from "../contracts/repository.ts";
import { RewindApiError } from "../http/errors.ts";
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

function toAdminUser(row: {
  id: string; username: string; display_name: string | null; email: string; role: string;
  avatar_url: string | null; is_active: boolean; is_hq: boolean; created_at: string | null;
}): AdminUserResponse {
  return {
    id: safeId(row.id, "User ID"), username: row.username, displayName: row.display_name,
    email: row.email, role: row.role, avatarUrl: row.avatar_url, isActive: row.is_active,
    isHq: row.is_hq, createdAt: row.created_at,
  };
}

export const adminUsersRepository: Pick<RewindApiRepository,
  | "getAdminUsers"
  | "getAdminUser"
  | "getAdminUserOverview"
  | "updateAdminUser"
  | "setAdminUserActive"
  | "setAdminUserHq"
> = {

  async getAdminUsers(authUser, query, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const search = query?.trim() || null;
      const where = search === null ? "" : `WHERE POSITION(LOWER($1::text) IN LOWER(u.username)) > 0
        OR POSITION(LOWER($1::text) IN LOWER(u.email)) > 0
        OR POSITION(LOWER($1::text) IN LOWER(COALESCE(u.display_name,''))) > 0`;
      const args = search === null ? [] : [search];
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.users u ${where}`, args }),
        connection.queryObject<{
          id: string; username: string; display_name: string | null; email: string; role: string;
          avatar_url: string | null; is_active: boolean; is_hq: boolean; created_at: string | null;
        }>({
          text: `SELECT u.id::text AS id, u.username, u.display_name, u.email, u.role, u.avatar_url,
                        u.is_active, u.is_hq, u.created_at::text AS created_at
                 FROM rewind.users u ${where} ORDER BY u.id DESC LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
          args: [...args, size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toAdminUser), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getAdminUser(authUser, id) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        id: string; username: string; display_name: string | null; email: string; role: string;
        avatar_url: string | null; is_active: boolean; is_hq: boolean; created_at: string | null;
      }>({
        text: `SELECT id::text AS id, username, display_name, email, role, avatar_url, is_active, is_hq, created_at::text AS created_at
               FROM rewind.users WHERE id=$1`, args: [id],
      });
      await connection.queryObject("COMMIT");
      return result.rows[0] ? toAdminUser(result.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getAdminUserOverview(authUser, id) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const user = await connection.queryObject({ text: "SELECT id FROM rewind.users WHERE id=$1", args: [id] });
      if (!user.rows.length) { await connection.queryObject("COMMIT"); return null; }
      const [stats, history] = await Promise.all([
        connection.queryObject<{
          watched: string; reviews: string; ratings: string; watchlist: string; favorites: string;
          comments: string; likes_received: string; followers: string; custom_lists: string;
        }>({
          text: `SELECT
            (SELECT COUNT(*)::text FROM rewind.list_items li JOIN rewind.lists l ON l.id=li.list_id WHERE l.user_id=$1 AND l.list_type='WATCHED') AS watched,
            (SELECT COUNT(*)::text FROM rewind.reviews r WHERE r.user_id=$1 AND r.is_hidden=FALSE) AS reviews,
            (SELECT COUNT(*)::text FROM rewind.ratings r WHERE r.user_id=$1) AS ratings,
            (SELECT COUNT(*)::text FROM rewind.list_items li JOIN rewind.lists l ON l.id=li.list_id WHERE l.user_id=$1 AND l.list_type='WATCHLIST') AS watchlist,
            (SELECT COUNT(*)::text FROM rewind.list_items li JOIN rewind.lists l ON l.id=li.list_id WHERE l.user_id=$1 AND l.list_type='FAVORITES') AS favorites,
            (SELECT COUNT(*)::text FROM rewind.comments c WHERE c.user_id=$1) AS comments,
            (SELECT COUNT(*)::text FROM rewind.review_likes rl JOIN rewind.reviews r ON r.id=rl.review_id
               JOIN rewind.users liker ON liker.id=rl.user_id AND liker.is_active
             WHERE r.user_id=$1 AND r.is_hidden=FALSE) AS likes_received,
            (SELECT COUNT(*)::text FROM rewind.follows f JOIN rewind.users follower ON follower.id=f.follower_id AND follower.is_active
             WHERE f.following_id=$1) AS followers,
            (SELECT COUNT(*)::text FROM rewind.lists l WHERE l.user_id=$1 AND l.list_type='CUSTOM') AS custom_lists`,
          args: [id],
        }),
        connection.queryObject<{
          id: string; admin_id: string; action: string; target_type: string; target_id: string | null;
          metadata: string | null; created_at: string;
        }>({
          text: `SELECT id::text AS id, admin_id::text AS admin_id, action, target_type, target_id::text AS target_id,
                        metadata, created_at::text AS created_at
                 FROM rewind.admin_audit_logs WHERE target_type='USER' AND target_id=$1
                 ORDER BY created_at DESC, id DESC LIMIT 12`, args: [id],
        }),
      ]);
      await connection.queryObject("COMMIT");
      const row = stats.rows[0];
      return {
        stats: {
          watched: Number(row?.watched ?? 0), reviews: Number(row?.reviews ?? 0), ratings: Number(row?.ratings ?? 0),
          watchlist: Number(row?.watchlist ?? 0), favorites: Number(row?.favorites ?? 0), comments: Number(row?.comments ?? 0),
          likesReceived: Number(row?.likes_received ?? 0), followers: Number(row?.followers ?? 0),
          customLists: Number(row?.custom_lists ?? 0),
        },
        adminHistory: history.rows.map((item) => ({
          id: safeId(item.id, "Audit ID"), adminId: safeId(item.admin_id, "User ID"), action: item.action,
          targetType: item.target_type, targetId: item.target_id === null ? null : safeId(item.target_id, "Target ID"),
          metadata: item.metadata, createdAt: item.created_at,
        })),
      };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async updateAdminUser(authUser, id, update: AdminUserUpdateRequest) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      await connection.queryObject("SELECT id FROM rewind.users WHERE role='ADMIN' AND is_active ORDER BY id FOR UPDATE");
      const target = await connection.queryObject<{ id: string; role: string; is_active: boolean }>({
        text: "SELECT id::text AS id, role, is_active FROM rewind.users WHERE id=$1 FOR UPDATE", args: [id],
      });
      if (!target.rows[0]) { await connection.queryObject("COMMIT"); return null; }
      const current = target.rows[0];
      const removesAdminAccess = current.role === "ADMIN" && current.is_active
        && (update.isActive === false || update.role === "USER");
      if (removesAdminAccess && id === userId) throw new RewindApiError(400, "Administrators cannot deactivate or demote their own account");
      if (removesAdminAccess) {
        const admins = await connection.queryObject<{ total: string }>({
          text: "SELECT COUNT(*)::text AS total FROM rewind.users WHERE role='ADMIN' AND is_active", args: [],
        });
        if (Number(admins.rows[0]?.total ?? 0) <= 1) throw new RewindApiError(400, "At least one active administrator is required");
      }
      const fields: string[] = [];
      const args: unknown[] = [id];
      const add = (column: string, value: unknown) => { args.push(value); fields.push(`${column}=$${args.length}`); };
      if (update.username !== undefined) add("username", update.username.trim());
      if (update.displayName !== undefined) add("display_name", update.displayName.trim() || null);
      if (update.avatarUrl !== undefined) add("avatar_url", update.avatarUrl.trim() || null);
      if (update.role !== undefined) add("role", update.role);
      if (update.isActive !== undefined) add("is_active", update.isActive);
      let row: {
        id: string; username: string; display_name: string | null; email: string; role: string;
        avatar_url: string | null; is_active: boolean; is_hq: boolean; created_at: string | null;
      };
      if (fields.length) {
        const result = await connection.queryObject<typeof row>({
          text: `UPDATE rewind.users SET ${fields.join(", ")} WHERE id=$1
                 RETURNING id::text AS id, username, display_name, email, role, avatar_url, is_active, is_hq, created_at::text AS created_at`,
          args,
        });
        row = result.rows[0]!;
      } else {
        const result = await connection.queryObject<typeof row>({
          text: `SELECT id::text AS id, username, display_name, email, role, avatar_url, is_active, is_hq, created_at::text AS created_at
                 FROM rewind.users WHERE id=$1`, args: [id],
        });
        row = result.rows[0]!;
      }
      await recordAdminAudit(connection, userId, "USER_UPDATED", "USER", id, null);
      await connection.queryObject("COMMIT");
      return toAdminUser(row);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async setAdminUserActive(authUser, id, active) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      await connection.queryObject("SELECT id FROM rewind.users WHERE role='ADMIN' AND is_active ORDER BY id FOR UPDATE");
      const target = await connection.queryObject<{ role: string; is_active: boolean }>({
        text: "SELECT role, is_active FROM rewind.users WHERE id=$1 FOR UPDATE", args: [id],
      });
      if (!target.rows[0]) { await connection.queryObject("COMMIT"); return false; }
      if (!active && target.rows[0].role === "ADMIN" && target.rows[0].is_active) {
        if (id === userId) throw new RewindApiError(400, "Administrators cannot deactivate or demote their own account");
        const admins = await connection.queryObject<{ total: string }>({
          text: "SELECT COUNT(*)::text AS total FROM rewind.users WHERE role='ADMIN' AND is_active", args: [],
        });
        if (Number(admins.rows[0]?.total ?? 0) <= 1) throw new RewindApiError(400, "At least one active administrator is required");
      }
      await connection.queryObject({ text: "UPDATE rewind.users SET is_active=$2 WHERE id=$1", args: [id, active] });
      await recordAdminAudit(connection, userId, active ? "USER_ACTIVATED" : "USER_DEACTIVATED", "USER", id, null);
      await connection.queryObject("COMMIT");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async setAdminUserHq(authUser, id, hq) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        id: string; username: string; display_name: string | null; email: string; role: string;
        avatar_url: string | null; is_active: boolean; is_hq: boolean; created_at: string | null;
      }>({
        text: `UPDATE rewind.users SET is_hq=$2 WHERE id=$1
               RETURNING id::text AS id, username, display_name, email, role, avatar_url, is_active, is_hq, created_at::text AS created_at`,
        args: [id, hq],
      });
      if (!result.rows[0]) { await connection.queryObject("COMMIT"); return null; }
      await recordAdminAudit(connection, userId, hq ? "HQ_GRANTED" : "HQ_REVOKED", "USER", id, null);
      await connection.queryObject("COMMIT");
      return toAdminUser(result.rows[0]);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
};
