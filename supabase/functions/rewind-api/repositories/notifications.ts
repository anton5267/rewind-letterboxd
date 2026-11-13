import type { AdminCreateNotificationRequest, AdminNotificationResponse } from "../contracts/admin.ts";
import type { RewindApiRepository } from "../contracts/repository.ts";
import type { NotificationPreferencesResponse, NotificationResponse } from "../contracts/social.ts";
import { RewindApiError } from "../http/errors.ts";
import {
  beginAdminTransaction,
  beginUserTransaction,
} from "../runtime/transactions.ts";
import {
  recordAdminAudit,
} from "./shared/admin_audit.ts";
import {
  pageResult,
  safeId,
} from "./shared/results.ts";

function toNotification(row: {
  id: string; notification_type: NotificationResponse["type"]; created_at: string; read_at: string | null;
  actor_id: string | null; actor_username: string | null; actor_display_name: string | null; actor_avatar_url: string | null;
  related_user_id: string | null; review_id: string | null;
}): NotificationResponse {
  return {
    id: safeId(row.id, "Notification ID"), type: row.notification_type, createdAt: row.created_at, readAt: row.read_at,
    actor: row.actor_id && row.actor_username ? {
      id: safeId(row.actor_id, "User ID"), username: row.actor_username, displayName: row.actor_display_name,
      avatarUrl: row.actor_avatar_url,
    } : null,
    relatedUserId: row.related_user_id ? safeId(row.related_user_id, "User ID") : null,
    reviewId: row.review_id ? safeId(row.review_id, "Review ID") : null,
  };
}

function toAdminNotification(row: {
  id: string; recipient_id: string; actor_id: string | null; type: AdminNotificationResponse["type"];
  review_id: string | null; created_at: string; read_at: string | null;
}): AdminNotificationResponse {
  return {
    id: safeId(row.id, "Notification ID"), recipientId: safeId(row.recipient_id, "User ID"),
    actorId: row.actor_id === null ? null : safeId(row.actor_id, "User ID"), type: row.type,
    reviewId: row.review_id === null ? null : safeId(row.review_id, "Review ID"), createdAt: row.created_at, readAt: row.read_at,
  };
}

export const notificationsRepository: Pick<RewindApiRepository,
  | "getAdminNotifications"
  | "createAdminNotification"
  | "setAdminNotificationRead"
  | "markAdminNotificationsRead"
  | "deleteAdminNotification"
  | "deleteAdminNotifications"
  | "getNotifications"
  | "getUnreadNotificationCount"
  | "markNotificationRead"
  | "markAllNotificationsRead"
  | "getNotificationPreferences"
  | "updateNotificationPreferences"
> = {

  async getAdminNotifications(authUser, filters, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const predicates: string[] = [];
      const args: unknown[] = [];
      if (filters.type !== null) { args.push(filters.type); predicates.push(`n.notification_type=$${args.length}`); }
      if (filters.read !== null) predicates.push(`n.read_at IS ${filters.read ? "NOT " : ""}NULL`);
      if (filters.recipientId !== null) { args.push(filters.recipientId); predicates.push(`n.recipient_id=$${args.length}`); }
      const where = predicates.length ? ` WHERE ${predicates.join(" AND ")}` : "";
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.notifications n${where}`, args }),
        connection.queryObject<{
          id: string; recipient_id: string; actor_id: string | null; type: AdminNotificationResponse["type"];
          review_id: string | null; created_at: string; read_at: string | null;
        }>({
          text: `SELECT n.id::text AS id, n.recipient_id::text AS recipient_id, n.actor_id::text AS actor_id,
                       n.notification_type AS type, n.review_id::text AS review_id,
                       n.created_at::text AS created_at, n.read_at::text AS read_at
                FROM rewind.notifications n${where} ORDER BY n.created_at DESC, n.id DESC
                LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
          args: [...args, size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toAdminNotification), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async createAdminNotification(authUser, body: AdminCreateNotificationRequest) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const userIds = [body.recipientId, body.actorId, body.relatedUserId].filter((value): value is number => value !== null && value !== undefined);
      const userResult = await connection.queryObject<{ id: string }>({
        text: "SELECT id::text AS id FROM rewind.users WHERE id=ANY($1::bigint[])", args: [userIds],
      });
      if (new Set(userResult.rows.map((row) => safeId(row.id, "User ID"))).size !== new Set(userIds).size) {
        throw new RewindApiError(400, "Notification user not found");
      }
      if (body.type === "REVIEW_LIKED") {
        const review = await connection.queryObject<{ user_id: string }>({
          text: "SELECT user_id::text AS user_id FROM rewind.reviews WHERE id=$1", args: [body.reviewId],
        });
        if (!review.rows[0] || safeId(review.rows[0].user_id, "User ID") !== body.recipientId) {
          throw new RewindApiError(400, "Review-like recipient must own the review");
        }
      }
      const result = await connection.queryObject<{
        id: string; recipient_id: string; actor_id: string | null; type: AdminNotificationResponse["type"];
        review_id: string | null; created_at: string; read_at: string | null;
      }>({
        text: `INSERT INTO rewind.notifications (recipient_id, actor_id, related_user_id, review_id, notification_type)
               VALUES ($1,$2,$3,$4,$5)
               RETURNING id::text AS id, recipient_id::text AS recipient_id, actor_id::text AS actor_id,
                 notification_type AS type, review_id::text AS review_id, created_at::text AS created_at, read_at::text AS read_at`,
        args: [body.recipientId, body.actorId, body.relatedUserId ?? null, body.reviewId ?? null, body.type],
      });
      const notification = result.rows[0];
      if (!notification) throw new Error("Admin notification was not created.");
      const response = toAdminNotification(notification);
      await recordAdminAudit(connection, userId, "NOTIFICATION_CREATED", "NOTIFICATION", response.id, null);
      await connection.queryObject("COMMIT");
      return response;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async setAdminNotificationRead(authUser, id, read) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        id: string; recipient_id: string; actor_id: string | null; type: AdminNotificationResponse["type"];
        review_id: string | null; created_at: string; read_at: string | null;
      }>({
        text: `UPDATE rewind.notifications SET read_at=CASE WHEN $2 THEN COALESCE(read_at,CURRENT_TIMESTAMP) ELSE NULL END
               WHERE id=$1 RETURNING id::text AS id, recipient_id::text AS recipient_id, actor_id::text AS actor_id,
                 notification_type AS type, review_id::text AS review_id, created_at::text AS created_at, read_at::text AS read_at`,
        args: [id, read],
      });
      if (!result.rows[0]) { await connection.queryObject("COMMIT"); return null; }
      const notification = toAdminNotification(result.rows[0]);
      await recordAdminAudit(connection, userId, read ? "NOTIFICATION_MARKED_READ" : "NOTIFICATION_MARKED_UNREAD", "NOTIFICATION", id, null);
      await connection.queryObject("COMMIT");
      return notification;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async markAdminNotificationsRead(authUser, type, recipientId) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{ id: string }>({
        text: `UPDATE rewind.notifications SET read_at=CURRENT_TIMESTAMP WHERE read_at IS NULL
                 AND ($1::text IS NULL OR notification_type=$1) AND ($2::bigint IS NULL OR recipient_id=$2) RETURNING id::text AS id`,
        args: [type, recipientId],
      });
      const updated = result.rows.length;
      await recordAdminAudit(connection, userId, "NOTIFICATIONS_MARKED_READ", "NOTIFICATION", null,
        `count=${updated};type=${type};recipientId=${recipientId}`);
      await connection.queryObject("COMMIT");
      return updated;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async deleteAdminNotification(authUser, id) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{ id: string }>({ text: "DELETE FROM rewind.notifications WHERE id=$1 RETURNING id::text AS id", args: [id] });
      if (!result.rows.length) { await connection.queryObject("COMMIT"); return false; }
      await recordAdminAudit(connection, userId, "NOTIFICATION_DELETED", "NOTIFICATION", id, null);
      await connection.queryObject("COMMIT");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async deleteAdminNotifications(authUser, filters) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{ id: string }>({
        text: `DELETE FROM rewind.notifications WHERE ($1::text IS NULL OR notification_type=$1)
                 AND ($2::boolean IS NULL OR ($2 AND read_at IS NOT NULL) OR (NOT $2 AND read_at IS NULL))
                 AND ($3::bigint IS NULL OR recipient_id=$3) RETURNING id::text AS id`,
        args: [filters.type, filters.read, filters.recipientId],
      });
      const deleted = result.rows.length;
      await recordAdminAudit(connection, userId, "NOTIFICATIONS_BULK_DELETED", "NOTIFICATION", null,
        `count=${deleted};type=${filters.type};read=${filters.read};recipientId=${filters.recipientId}`);
      await connection.queryObject("COMMIT");
      return deleted;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getNotifications(authUser, page, size) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({
          text: "SELECT COUNT(*)::text AS total FROM rewind.notifications WHERE recipient_id = $1", args: [userId],
        }),
        connection.queryObject<{
          id: string; notification_type: NotificationResponse["type"]; created_at: string; read_at: string | null;
          actor_id: string | null; actor_username: string | null; actor_display_name: string | null; actor_avatar_url: string | null;
          related_user_id: string | null; review_id: string | null;
        }>({
          text: `SELECT n.id::text AS id, n.notification_type, n.created_at::text AS created_at, n.read_at::text AS read_at,
                        actor.id::text AS actor_id, actor.username AS actor_username, actor.display_name AS actor_display_name,
                        actor.avatar_url AS actor_avatar_url, n.related_user_id::text AS related_user_id, n.review_id::text AS review_id
                 FROM rewind.notifications n LEFT JOIN rewind.users actor ON actor.id = n.actor_id AND actor.is_active
                 WHERE n.recipient_id = $1 ORDER BY n.created_at DESC, n.id DESC LIMIT $2 OFFSET $3`, args: [userId, size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toNotification), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getUnreadNotificationCount(authUser) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{ total: string }>({
        text: "SELECT COUNT(*)::text AS total FROM rewind.notifications WHERE recipient_id = $1 AND read_at IS NULL", args: [userId],
      });
      await connection.queryObject("COMMIT");
      return Number(result.rows[0]?.total ?? "0");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async markNotificationRead(authUser, notificationId) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject({
        text: `UPDATE rewind.notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
               WHERE id = $1 AND recipient_id = $2 RETURNING id`, args: [notificationId, userId],
      });
      await connection.queryObject("COMMIT");
      return result.rows.length > 0;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async markAllNotificationsRead(authUser) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      await connection.queryObject({
        text: "UPDATE rewind.notifications SET read_at = CURRENT_TIMESTAMP WHERE recipient_id = $1 AND read_at IS NULL", args: [userId],
      });
      await connection.queryObject("COMMIT");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getNotificationPreferences(authUser): Promise<NotificationPreferencesResponse> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      await connection.queryObject({
        text: "INSERT INTO rewind.notification_preferences (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", args: [userId],
      });
      const result = await connection.queryObject<{ follows_enabled: boolean; review_likes_enabled: boolean }>({
        text: "SELECT follows_enabled, review_likes_enabled FROM rewind.notification_preferences WHERE user_id = $1", args: [userId],
      });
      await connection.queryObject("COMMIT");
      return { followsEnabled: result.rows[0]?.follows_enabled ?? true, reviewLikesEnabled: result.rows[0]?.review_likes_enabled ?? true };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async updateNotificationPreferences(authUser, preferences) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      await connection.queryObject({
        text: `INSERT INTO rewind.notification_preferences (user_id, follows_enabled, review_likes_enabled) VALUES ($1, $2, $3)
               ON CONFLICT (user_id) DO UPDATE SET follows_enabled = EXCLUDED.follows_enabled,
                 review_likes_enabled = EXCLUDED.review_likes_enabled`,
        args: [userId, preferences.followsEnabled, preferences.reviewLikesEnabled],
      });
      await connection.queryObject("COMMIT");
      return preferences;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
};
