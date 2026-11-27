import type { AdminActivityOverviewResponse, AdminAuditLogResponse, AdminDashboardResponse, AdminSettingResponse } from "../contracts/admin.ts";
import type { RewindApiRepository } from "../contracts/repository.ts";
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

function toAdminAuditLog(row: {
  id: string; admin_id: string; action: string; target_type: string; target_id: string | null;
  metadata: string | null; created_at: string;
}): AdminAuditLogResponse {
  return {
    id: safeId(row.id, "Audit ID"), adminId: safeId(row.admin_id, "User ID"), action: row.action,
    targetType: row.target_type, targetId: row.target_id === null ? null : safeId(row.target_id, "Target ID"),
    metadata: row.metadata, createdAt: row.created_at,
  };
}

export const adminOperationsRepository: Pick<RewindApiRepository,
  | "getAdminDashboard"
  | "getAdminActivityOverview"
  | "getAdminAuditLogs"
  | "getAdminSettings"
  | "updateAdminSetting"
> = {

  async getAdminDashboard(authUser) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        users: string; active_users: string; hq_users: string; movies: string; reviews: string; hidden_reviews: string;
      }>({
        text: `SELECT (SELECT COUNT(*)::text FROM rewind.users) AS users,
                      (SELECT COUNT(*)::text FROM rewind.users WHERE is_active) AS active_users,
                      (SELECT COUNT(*)::text FROM rewind.users WHERE is_hq) AS hq_users,
                      (SELECT COUNT(*)::text FROM rewind.movies) AS movies,
                      (SELECT COUNT(*)::text FROM rewind.reviews) AS reviews,
                      (SELECT COUNT(*)::text FROM rewind.reviews WHERE is_hidden) AS hidden_reviews`,
      });
      await connection.queryObject("COMMIT");
      const row = result.rows[0]!;
      return {
        users: Number(row.users), activeUsers: Number(row.active_users), hqUsers: Number(row.hq_users),
        movies: Number(row.movies), reviews: Number(row.reviews), hiddenReviews: Number(row.hidden_reviews),
      } satisfies AdminDashboardResponse;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getAdminActivityOverview(authUser) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const [metrics, users] = await Promise.all([
        connection.queryObject<{
          average_watched: string; average_reviews: string; average_all_lists: string;
          average_custom_lists: string; average_watchlist: string;
        }>({
          text: `WITH per_user AS (
                   SELECT u.id,
                          COALESCE(w.watched, 0)::numeric AS watched,
                          COALESCE(r.reviews, 0)::numeric AS reviews,
                          COALESCE(all_lists.list_count, 0)::numeric AS all_lists,
                          COALESCE(custom_lists.list_count, 0)::numeric AS custom_lists,
                          COALESCE(watchlist.items, 0)::numeric AS watchlist
                   FROM rewind.users u
                   LEFT JOIN (
                     SELECT l.user_id, COUNT(li.id) AS watched
                     FROM rewind.lists l LEFT JOIN rewind.list_items li ON li.list_id=l.id
                     WHERE l.list_type='WATCHED' GROUP BY l.user_id
                   ) w ON w.user_id=u.id
                   LEFT JOIN (
                     SELECT user_id, COUNT(*) AS reviews FROM rewind.reviews GROUP BY user_id
                   ) r ON r.user_id=u.id
                   LEFT JOIN (
                     SELECT user_id, COUNT(*) AS list_count FROM rewind.lists GROUP BY user_id
                   ) all_lists ON all_lists.user_id=u.id
                   LEFT JOIN (
                     SELECT user_id, COUNT(*) AS list_count FROM rewind.lists WHERE list_type='CUSTOM' GROUP BY user_id
                   ) custom_lists ON custom_lists.user_id=u.id
                   LEFT JOIN (
                     SELECT l.user_id, COUNT(li.id) AS items
                     FROM rewind.lists l LEFT JOIN rewind.list_items li ON li.list_id=l.id
                     WHERE l.list_type='WATCHLIST' GROUP BY l.user_id
                   ) watchlist ON watchlist.user_id=u.id
                 )
                 SELECT ROUND(COALESCE(AVG(watched), 0), 1)::text AS average_watched,
                        ROUND(COALESCE(AVG(reviews), 0), 1)::text AS average_reviews,
                        ROUND(COALESCE(AVG(all_lists), 0), 1)::text AS average_all_lists,
                        ROUND(COALESCE(AVG(custom_lists), 0), 1)::text AS average_custom_lists,
                        ROUND(COALESCE(AVG(watchlist), 0), 1)::text AS average_watchlist
                 FROM per_user`,
        }),
        connection.queryObject<{
          id: string; username: string; display_name: string | null; email: string;
          follower_count: string; is_active: boolean;
        }>({
          text: `SELECT u.id::text AS id, u.username, u.display_name, u.email, u.is_active,
                        COALESCE(follower_counts.total, 0)::text AS follower_count
                 FROM rewind.users u
                 LEFT JOIN LATERAL (
                   SELECT COUNT(*) AS total FROM rewind.follows f
                   JOIN rewind.users follower ON follower.id=f.follower_id AND follower.is_active
                   WHERE f.following_id=u.id
                 ) follower_counts ON TRUE
                 ORDER BY u.created_at DESC NULLS LAST, u.id DESC LIMIT 4`,
        }),
      ]);
      await connection.queryObject("COMMIT");
      const aggregate = metrics.rows[0];
      return {
        users: users.rows.map(row => ({
          id: safeId(row.id, "User ID"), username: row.username, displayName: row.display_name,
          email: row.email, followerCount: Number(row.follower_count), isActive: row.is_active,
        })),
        metrics: {
          averageWatched: Number(aggregate?.average_watched ?? 0), averageReviews: Number(aggregate?.average_reviews ?? 0),
          averageAllLists: Number(aggregate?.average_all_lists ?? 0), averageCustomLists: Number(aggregate?.average_custom_lists ?? 0),
          averageSessionMinutes: null, averageWatchlist: Number(aggregate?.average_watchlist ?? 0),
        },
      } satisfies AdminActivityOverviewResponse;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getAdminAuditLogs(authUser, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: "SELECT COUNT(*)::text AS total FROM rewind.admin_audit_logs" }),
        connection.queryObject<{
          id: string; admin_id: string; action: string; target_type: string; target_id: string | null;
          metadata: string | null; created_at: string;
        }>({
          text: `SELECT id::text AS id, admin_id::text AS admin_id, action, target_type, target_id::text AS target_id,
                        metadata, created_at::text AS created_at FROM rewind.admin_audit_logs
                 ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2`, args: [size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toAdminAuditLog), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getAdminSettings(authUser) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        setting_key: string; setting_value: string; updated_by: string | null; updated_at: string;
      }>({
        text: `SELECT setting_key, setting_value, updated_by::text AS updated_by, updated_at::text AS updated_at
               FROM rewind.site_settings WHERE setting_key = ANY($1::text[]) ORDER BY setting_key`,
        args: [["default_locale", "journal_enabled", "maintenance_mode", "site_name"]],
      });
      await connection.queryObject("COMMIT");
      return result.rows.map((row): AdminSettingResponse => ({
        key: row.setting_key, value: row.setting_value,
        updatedBy: row.updated_by === null ? null : safeId(row.updated_by, "User ID"), updatedAt: row.updated_at,
      }));
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async updateAdminSetting(authUser, key, value) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const updated = await connection.queryObject<{
        setting_key: string; setting_value: string; updated_by: string | null; updated_at: string;
      }>({
        text: `UPDATE rewind.site_settings SET setting_value=$2, updated_by=$3, updated_at=CURRENT_TIMESTAMP
               WHERE setting_key=$1 RETURNING setting_key, setting_value, updated_by::text AS updated_by, updated_at::text AS updated_at`,
        args: [key, value, userId],
      });
      if (!updated.rows[0]) { await connection.queryObject("COMMIT"); return null; }
      await recordAdminAudit(connection, userId, "SITE_SETTING_UPDATED", "SITE_SETTING", null, key);
      await connection.queryObject("COMMIT");
      const row = updated.rows[0];
      return {
        key: row.setting_key, value: row.setting_value,
        updatedBy: row.updated_by === null ? null : safeId(row.updated_by, "User ID"), updatedAt: row.updated_at,
      };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
};
