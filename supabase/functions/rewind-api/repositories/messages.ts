import type { AdminConversationResponse } from "../contracts/admin.ts";
import type { RewindApiRepository } from "../contracts/repository.ts";
import type { ConversationResponse, MessageResponse } from "../contracts/social.ts";
import { RewindApiError } from "../http/errors.ts";
import {
  type PgConnection,
} from "../runtime/database.ts";
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

function toMessage(row: { id: string; conversation_id: string; sender_id: string; body: string; created_at: string; read_at: string | null }): MessageResponse {
  return { id: safeId(row.id, "Message ID"), conversationId: safeId(row.conversation_id, "Conversation ID"),
    senderId: safeId(row.sender_id, "User ID"), body: row.body, createdAt: row.created_at, readAt: row.read_at };
}

function toConversation(row: {
  id: string; updated_at: string; other_id: string; other_username: string; other_display_name: string | null; other_avatar_url: string | null;
  last_id: string | null; last_sender_id: string | null; last_body: string | null; last_created_at: string | null; last_read_at: string | null;
}): ConversationResponse {
  return {
    id: safeId(row.id, "Conversation ID"),
    otherUser: { id: safeId(row.other_id, "User ID"), username: row.other_username, displayName: row.other_display_name, avatarUrl: row.other_avatar_url },
    updatedAt: row.updated_at,
    lastMessage: row.last_id && row.last_sender_id && row.last_body && row.last_created_at ? {
      id: safeId(row.last_id, "Message ID"), senderId: safeId(row.last_sender_id, "User ID"), body: row.last_body,
      createdAt: row.last_created_at, readAt: row.last_read_at,
    } : null,
  };
}

function toAdminConversation(row: {
  id: string; user_one_id: string; user_two_id: string; message_count: string;
  created_at: string; updated_at: string; last_message_at: string | null;
}): AdminConversationResponse {
  return {
    id: safeId(row.id, "Conversation ID"), userOneId: safeId(row.user_one_id, "User ID"),
    userTwoId: safeId(row.user_two_id, "User ID"), messageCount: Number(row.message_count),
    createdAt: row.created_at, updatedAt: row.updated_at, lastMessageAt: row.last_message_at,
  };
}

async function findVisibleConversation(connection: PgConnection, userId: number, conversationId: number): Promise<boolean> {
  const result = await connection.queryObject({
    text: `SELECT 1 FROM rewind.conversations c JOIN rewind.users other
           ON other.id = CASE WHEN c.user_one_id = $2 THEN c.user_two_id ELSE c.user_one_id END AND other.is_active
           WHERE c.id = $1 AND $2 IN (c.user_one_id, c.user_two_id)`, args: [conversationId, userId],
  });
  if (!result.rows.length) return false;
  const blocked = await connection.queryObject({
    text: `SELECT 1 FROM rewind.user_blocks b JOIN rewind.conversations c ON c.id = $1
           WHERE (b.blocker_id = c.user_one_id AND b.blocked_id = c.user_two_id)
              OR (b.blocker_id = c.user_two_id AND b.blocked_id = c.user_one_id) LIMIT 1`, args: [conversationId],
  });
  if (blocked.rows.length) throw new RewindApiError(403, "User interaction is blocked");
  return true;
}

async function fetchConversation(connection: PgConnection, userId: number, conversationId: number): Promise<ConversationResponse | null> {
  const result = await connection.queryObject<{
    id: string; updated_at: string; other_id: string; other_username: string; other_display_name: string | null; other_avatar_url: string | null;
    last_id: string | null; last_sender_id: string | null; last_body: string | null; last_created_at: string | null; last_read_at: string | null;
  }>({
    text: `SELECT c.id::text AS id, c.updated_at::text AS updated_at, other.id::text AS other_id,
                  other.username AS other_username, other.display_name AS other_display_name, other.avatar_url AS other_avatar_url,
                  last.id::text AS last_id, last.sender_id::text AS last_sender_id, last.body AS last_body,
                  last.created_at::text AS last_created_at, last.read_at::text AS last_read_at
           FROM rewind.conversations c
           JOIN rewind.users other ON other.id = CASE WHEN c.user_one_id = $2 THEN c.user_two_id ELSE c.user_one_id END AND other.is_active
           LEFT JOIN LATERAL (SELECT m.id, m.sender_id, m.body, m.created_at, m.read_at
             FROM rewind.messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) last ON TRUE
           WHERE c.id = $1 AND $2 IN (c.user_one_id, c.user_two_id)`, args: [conversationId, userId],
  });
  return result.rows[0] ? toConversation(result.rows[0]) : null;
}

export const messagesRepository: Pick<RewindApiRepository,
  | "getAdminConversations"
  | "deleteAdminConversation"
  | "getConversations"
  | "getUnreadMessageCount"
  | "startConversation"
  | "getConversationMessages"
  | "sendConversationMessage"
  | "markConversationRead"
> = {

  async getAdminConversations(authUser, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: "SELECT COUNT(*)::text AS total FROM rewind.conversations", args: [] }),
        connection.queryObject<{
          id: string; user_one_id: string; user_two_id: string; message_count: string;
          created_at: string; updated_at: string; last_message_at: string | null;
        }>({
          text: `SELECT c.id::text AS id, c.user_one_id::text AS user_one_id, c.user_two_id::text AS user_two_id,
                       COUNT(m.id)::text AS message_count, c.created_at::text AS created_at,
                       c.updated_at::text AS updated_at, MAX(m.created_at)::text AS last_message_at
                FROM rewind.conversations c LEFT JOIN rewind.messages m ON m.conversation_id=c.id
                GROUP BY c.id ORDER BY c.updated_at DESC, c.id DESC LIMIT $1 OFFSET $2`,
          args: [size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toAdminConversation), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async deleteAdminConversation(authUser, id) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const deleted = await connection.queryObject<{ id: string }>({ text: "DELETE FROM rewind.conversations WHERE id=$1 RETURNING id", args: [id] });
      if (deleted.rows.length) await recordAdminAudit(connection, userId, "CONVERSATION_DELETED", "CONVERSATION", id, null);
      await connection.queryObject("COMMIT");
      return deleted.rows.length > 0;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getConversations(authUser, page, size) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({
          text: `SELECT COUNT(*)::text AS total FROM rewind.conversations c
                 JOIN rewind.users other ON other.id = CASE WHEN c.user_one_id = $1 THEN c.user_two_id ELSE c.user_one_id END AND other.is_active
                 WHERE $1 IN (c.user_one_id, c.user_two_id)
                   AND NOT EXISTS (SELECT 1 FROM rewind.user_blocks b
                     WHERE (b.blocker_id = c.user_one_id AND b.blocked_id = c.user_two_id)
                        OR (b.blocker_id = c.user_two_id AND b.blocked_id = c.user_one_id))`, args: [userId],
        }),
        connection.queryObject<{
          id: string; updated_at: string; other_id: string; other_username: string; other_display_name: string | null; other_avatar_url: string | null;
          last_id: string | null; last_sender_id: string | null; last_body: string | null; last_created_at: string | null; last_read_at: string | null;
        }>({
          text: `SELECT c.id::text AS id, c.updated_at::text AS updated_at, other.id::text AS other_id,
                        other.username AS other_username, other.display_name AS other_display_name, other.avatar_url AS other_avatar_url,
                        last.id::text AS last_id, last.sender_id::text AS last_sender_id, last.body AS last_body,
                        last.created_at::text AS last_created_at, last.read_at::text AS last_read_at
                 FROM rewind.conversations c
                 JOIN rewind.users other ON other.id = CASE WHEN c.user_one_id = $1 THEN c.user_two_id ELSE c.user_one_id END AND other.is_active
                 LEFT JOIN LATERAL (SELECT m.id, m.sender_id, m.body, m.created_at, m.read_at FROM rewind.messages m
                   WHERE m.conversation_id = c.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) last ON TRUE
                 WHERE $1 IN (c.user_one_id, c.user_two_id)
                   AND NOT EXISTS (SELECT 1 FROM rewind.user_blocks b
                     WHERE (b.blocker_id = c.user_one_id AND b.blocked_id = c.user_two_id)
                        OR (b.blocker_id = c.user_two_id AND b.blocked_id = c.user_one_id))
                 ORDER BY c.updated_at DESC, c.id DESC LIMIT $2 OFFSET $3`,
          args: [userId, size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toConversation), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getUnreadMessageCount(authUser) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{ total: string }>({
        text: `SELECT COUNT(*)::text AS total FROM rewind.messages m JOIN rewind.conversations c ON c.id = m.conversation_id
               WHERE $1 IN (c.user_one_id, c.user_two_id) AND m.sender_id <> $1 AND m.read_at IS NULL
                 AND NOT EXISTS (SELECT 1 FROM rewind.user_blocks b
                   WHERE (b.blocker_id = c.user_one_id AND b.blocked_id = c.user_two_id)
                      OR (b.blocker_id = c.user_two_id AND b.blocked_id = c.user_one_id))`, args: [userId],
      });
      await connection.queryObject("COMMIT");
      return Number(result.rows[0]?.total ?? "0");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async startConversation(authUser, targetId) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const target = await connection.queryObject({ text: "SELECT 1 FROM rewind.users WHERE id = $1 AND is_active", args: [targetId] });
      if (!target.rows.length) { await connection.queryObject("COMMIT"); return null; }
      if (userId === targetId) throw new RewindApiError(400, "You cannot message yourself");
      const blocked = await connection.queryObject({
        text: `SELECT 1 FROM rewind.user_blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1) LIMIT 1`, args: [userId, targetId],
      });
      if (blocked.rows.length) throw new RewindApiError(403, "User interaction is blocked");
      const one = Math.min(userId, targetId);
      const two = Math.max(userId, targetId);
      await connection.queryObject({
        text: "INSERT INTO rewind.conversations (user_one_id, user_two_id) VALUES ($1, $2) ON CONFLICT (user_one_id, user_two_id) DO NOTHING",
        args: [one, two],
      });
      const result = await connection.queryObject<{ id: string }>({
        text: "SELECT id::text AS id FROM rewind.conversations WHERE user_one_id = $1 AND user_two_id = $2", args: [one, two],
      });
      if (!result.rows[0]) throw new Error("Conversation could not be created.");
      const response = await fetchConversation(connection, userId, safeId(result.rows[0].id, "Conversation ID"));
      await connection.queryObject("COMMIT");
      return response;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getConversationMessages(authUser, conversationId, page, size) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      if (!await findVisibleConversation(connection, userId, conversationId)) { await connection.queryObject("COMMIT"); return null; }
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: "SELECT COUNT(*)::text AS total FROM rewind.messages WHERE conversation_id = $1", args: [conversationId] }),
        connection.queryObject<{ id: string; conversation_id: string; sender_id: string; body: string; created_at: string; read_at: string | null }>({
          text: `SELECT id::text AS id, conversation_id::text AS conversation_id, sender_id::text AS sender_id,
                        body, created_at::text AS created_at, read_at::text AS read_at
                 FROM rewind.messages WHERE conversation_id = $1
                 ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3`, args: [conversationId, size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toMessage), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async sendConversationMessage(authUser, conversationId, body) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      if (!body.trim() || body.trim().length > 2000) throw new RewindApiError(400, "Message body cannot be blank or exceed 2000 characters");
      if (!await findVisibleConversation(connection, userId, conversationId)) { await connection.queryObject("COMMIT"); return null; }
      const inserted = await connection.queryObject<{ id: string; conversation_id: string; sender_id: string; body: string; created_at: string; read_at: string | null }>({
        text: `INSERT INTO rewind.messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)
               RETURNING id::text AS id, conversation_id::text AS conversation_id, sender_id::text AS sender_id,
                 body, created_at::text AS created_at, read_at::text AS read_at`, args: [conversationId, userId, body.trim()],
      });
      await connection.queryObject({ text: "UPDATE rewind.conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", args: [conversationId] });
      await connection.queryObject("COMMIT");
      return inserted.rows[0] ? toMessage(inserted.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async markConversationRead(authUser, conversationId) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      if (!await findVisibleConversation(connection, userId, conversationId)) { await connection.queryObject("COMMIT"); return false; }
      await connection.queryObject({
        text: `UPDATE rewind.messages SET read_at = CURRENT_TIMESTAMP
               WHERE conversation_id = $1 AND sender_id <> $2 AND read_at IS NULL`, args: [conversationId, userId],
      });
      await connection.queryObject("COMMIT");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
};
