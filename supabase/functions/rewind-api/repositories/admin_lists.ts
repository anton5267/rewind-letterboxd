import type { AdminListResponse, AdminListTextUpdateRequest } from "../contracts/admin.ts";
import type { RewindApiRepository } from "../contracts/repository.ts";
import {
  beginAdminTransaction,
} from "../runtime/transactions.ts";
import {
  recordAdminAudit,
} from "./shared/admin_audit.ts";
import {
  toAdminList,
} from "./shared/lists.ts";
import { addAdminListMovie as appendAdminListMovie, loadAdminListDetails } from "./shared/admin_list_details.ts";
import {
  pageResult,
} from "./shared/results.ts";

export const adminListsRepository: Pick<RewindApiRepository,
  | "getAdminLists"
  | "getAdminListDetails"
  | "updateAdminListDetails"
  | "addAdminListMovie"
  | "setAdminListVisibility"
  | "setAdminListFeatured"
  | "moveAdminListFeatured"
  | "deleteAdminList"
> = {

  async getAdminListDetails(authUser, id, reportId) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const details = await loadAdminListDetails(connection, id, reportId);
      await connection.queryObject("COMMIT");
      return details;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async updateAdminListDetails(authUser, id, update: AdminListTextUpdateRequest) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const existing = await connection.queryObject<{ list_type: string; name: string; description: string | null }>({
        text: "SELECT list_type, name, description FROM rewind.lists WHERE id=$1 FOR UPDATE", args: [id],
      });
      const row = existing.rows[0];
      if (!row || row.list_type !== "CUSTOM") { await connection.queryObject("COMMIT"); return null; }

      const changed: string[] = [];
      const assignments: string[] = [];
      const args: unknown[] = [];
      if (update.name !== undefined && update.name !== row.name) {
        changed.push("name");
        args.push(update.name);
        assignments.push(`name=$${args.length}`);
      }
      if (Object.hasOwn(update, "description") && update.description !== row.description) {
        changed.push("description");
        args.push(update.description);
        assignments.push(`description=$${args.length}`);
      }
      if (changed.length) {
        assignments.push("updated_at=CURRENT_TIMESTAMP");
        args.push(id);
        await connection.queryObject({ text: `UPDATE rewind.lists SET ${assignments.join(", ")} WHERE id=$${args.length}`, args });
        await recordAdminAudit(connection, userId, "LIST_UPDATED", "LIST", id, JSON.stringify({ changed }));
      }
      const details = await loadAdminListDetails(connection, id);
      await connection.queryObject("COMMIT");
      return details;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async addAdminListMovie(authUser, listId, movieId) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await appendAdminListMovie(connection, userId, listId, movieId);
      await connection.queryObject("COMMIT");
      return result;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getAdminLists(authUser, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: "SELECT COUNT(*)::text AS total FROM rewind.lists" }),
        connection.queryObject<{
          id: string; user_id: string; username: string; name: string; description: string | null;
          list_type: AdminListResponse["listType"]; is_public: boolean; item_count: string;
          created_at: string; updated_at: string; featured_position: number | null; featured_category: AdminListResponse["featuredCategory"];
        }>({
          text: `SELECT l.id::text AS id, l.user_id::text AS user_id, u.username, l.name, l.description,
                        l.list_type, l.is_public, COUNT(li.id)::text AS item_count,
                        l.created_at::text AS created_at, l.updated_at::text AS updated_at, l.featured_position, l.featured_category
                 FROM rewind.lists l JOIN rewind.users u ON u.id=l.user_id
                 LEFT JOIN rewind.list_items li ON li.list_id=l.id
                 GROUP BY l.id, u.username ORDER BY l.updated_at DESC, l.id DESC LIMIT $1 OFFSET $2`,
          args: [size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toAdminList), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async setAdminListVisibility(authUser, id, visible) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      await connection.queryObject("SELECT pg_advisory_xact_lock(1480, 1)");
      const updated = await connection.queryObject({
        text: "UPDATE rewind.lists SET is_public=$2, featured_position=CASE WHEN $2 THEN featured_position ELSE NULL END, featured_category=CASE WHEN $2 THEN featured_category ELSE NULL END, updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND list_type='CUSTOM' RETURNING id",
        args: [id, visible],
      });
      if (!updated.rows.length) { await connection.queryObject("COMMIT"); return null; }
      const row = await connection.queryObject<{
        id: string; user_id: string; username: string; name: string; description: string | null;
        list_type: AdminListResponse["listType"]; is_public: boolean; item_count: string;
        created_at: string; updated_at: string; featured_position: number | null; featured_category: AdminListResponse["featuredCategory"];
      }>({
        text: `SELECT l.id::text AS id, l.user_id::text AS user_id, u.username, l.name, l.description,
                      l.list_type, l.is_public, COUNT(li.id)::text AS item_count,
                      l.created_at::text AS created_at, l.updated_at::text AS updated_at, l.featured_position, l.featured_category
               FROM rewind.lists l JOIN rewind.users u ON u.id=l.user_id
               LEFT JOIN rewind.list_items li ON li.list_id=l.id WHERE l.id=$1
               GROUP BY l.id, u.username`, args: [id],
      });
      await recordAdminAudit(connection, userId, visible ? "LIST_PUBLISHED" : "LIST_HIDDEN", "LIST", id, null);
      await connection.queryObject("COMMIT");
      return row.rows[0] ? toAdminList(row.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async setAdminListFeatured(authUser, id, featured, requestedCategory) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      await connection.queryObject("SELECT pg_advisory_xact_lock(1480, 1)");
      const current = await connection.queryObject<{ id: string; featured_position: number | null; featured_category: AdminListResponse["featuredCategory"]; list_type: string; is_public: boolean; is_active: boolean }>({
        text: `SELECT l.id::text AS id, l.featured_position, l.featured_category, l.list_type, l.is_public, u.is_active
               FROM rewind.lists l JOIN rewind.users u ON u.id=l.user_id WHERE l.id=$1 FOR UPDATE OF l`, args: [id],
      });
      const row = current.rows[0];
      if (!row) { await connection.queryObject("COMMIT"); return null; }
      if (featured && (row.list_type !== "CUSTOM" || !row.is_public || !row.is_active)) {
        await connection.queryObject("COMMIT");
        return "NOT_ELIGIBLE" as const;
      }
      if ((row.featured_position !== null) === featured) {
        if (featured && requestedCategory && row.featured_category !== requestedCategory) {
          await connection.queryObject({ text: "UPDATE rewind.lists SET featured_category=$2 WHERE id=$1", args: [id, requestedCategory] });
          await recordAdminAudit(connection, userId, "LIST_FEATURED_CATEGORY_UPDATED", "LIST", id, `${row.featured_category}->${requestedCategory}`);
        }
      } else if (featured) {
        const next = await connection.queryObject<{ next_position: number }>({
          text: "SELECT COALESCE(MAX(featured_position) + 1, 0)::integer AS next_position FROM rewind.lists",
        });
        const category = requestedCategory ?? "REWIND_COMMUNITY";
        await connection.queryObject({ text: "UPDATE rewind.lists SET featured_position=$2, featured_category=$3 WHERE id=$1", args: [id, next.rows[0].next_position, category] });
        await recordAdminAudit(connection, userId, "LIST_FEATURED", "LIST", id, `position=${next.rows[0].next_position};category=${category}`);
      } else {
        await connection.queryObject({ text: "UPDATE rewind.lists SET featured_position=NULL, featured_category=NULL WHERE id=$1", args: [id] });
        await recordAdminAudit(connection, userId, "LIST_UNFEATURED", "LIST", id, null);
      }
      const updated = await connection.queryObject<{
        id: string; user_id: string; username: string; name: string; description: string | null;
        list_type: AdminListResponse["listType"]; is_public: boolean; item_count: string;
        created_at: string; updated_at: string; featured_position: number | null; featured_category: AdminListResponse["featuredCategory"];
      }>({
        text: `SELECT l.id::text AS id, l.user_id::text AS user_id, u.username, l.name, l.description,
                      l.list_type, l.is_public, COUNT(li.id)::text AS item_count,
                      l.created_at::text AS created_at, l.updated_at::text AS updated_at, l.featured_position, l.featured_category
               FROM rewind.lists l JOIN rewind.users u ON u.id=l.user_id LEFT JOIN rewind.list_items li ON li.list_id=l.id
               WHERE l.id=$1 GROUP BY l.id, u.username`, args: [id],
      });
      await connection.queryObject("COMMIT");
      return updated.rows[0] ? toAdminList(updated.rows[0]) : null;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async moveAdminListFeatured(authUser, id, direction) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      // Serialize all curation order changes with feature/unfeature operations.
      await connection.queryObject("SELECT pg_advisory_xact_lock(1480, 1)");
      const current = await connection.queryObject<{ id: string; list_type: string; is_public: boolean; is_active: boolean; featured_position: number | null; featured_category: AdminListResponse["featuredCategory"] }>({
        text: `SELECT l.id::text AS id, l.list_type, l.is_public, u.is_active, l.featured_position, l.featured_category
               FROM rewind.lists l JOIN rewind.users u ON u.id=l.user_id WHERE l.id=$1 FOR UPDATE OF l`, args: [id],
      });
      const row = current.rows[0];
      if (!row) { await connection.queryObject("COMMIT"); return "NOT_FOUND" as const; }
      if (row.list_type !== "CUSTOM" || !row.is_public || !row.is_active || row.featured_position === null) {
        await connection.queryObject("COMMIT");
        return "NOT_ELIGIBLE" as const;
      }
      const featured = await connection.queryObject<{ id: string; featured_position: number; featured_category: AdminListResponse["featuredCategory"] }>({
        text: `SELECT l.id::text AS id, l.featured_position, l.featured_category
         FROM rewind.lists l JOIN rewind.users u ON u.id=l.user_id
         WHERE l.featured_position IS NOT NULL AND l.list_type='CUSTOM' AND l.is_public=true AND u.is_active=true
           AND l.featured_category=$1
         ORDER BY l.featured_position ASC FOR UPDATE OF l`,
        args: [row.featured_category],
      });
      const index = featured.rows.findIndex(item => Number(item.id) === id);
      const neighborIndex = index + (direction === "up" ? -1 : 1);
      const neighbor = featured.rows[neighborIndex];
      if (index < 0) {
        await connection.queryObject("COMMIT");
        return "NOT_ELIGIBLE" as const;
      }
      if (!neighbor) {
        await connection.queryObject("COMMIT");
        return "BOUNDARY" as const;
      }
      const oldPosition = row.featured_position;
      const newPosition = neighbor.featured_position;
      await connection.queryObject({ text: "UPDATE rewind.lists SET featured_position=NULL, featured_category=NULL WHERE id=$1", args: [id] });
      await connection.queryObject({ text: "UPDATE rewind.lists SET featured_position=$2 WHERE id=$1", args: [Number(neighbor.id), oldPosition] });
      await connection.queryObject({ text: "UPDATE rewind.lists SET featured_position=$2, featured_category=$3 WHERE id=$1", args: [id, newPosition, row.featured_category] });
      await recordAdminAudit(connection, userId, "LIST_FEATURED_REORDERED", "LIST", id, `position=${oldPosition}->${newPosition};neighbor=${neighbor.id}`);
      await connection.queryObject("COMMIT");
      return "OK" as const;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async deleteAdminList(authUser, id) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      await connection.queryObject("SELECT pg_advisory_xact_lock(1480, 1)");
      const existing = await connection.queryObject<{ list_type: string }>({
        text: "SELECT list_type FROM rewind.lists WHERE id=$1 FOR UPDATE", args: [id],
      });
      if (!existing.rows[0]) { await connection.queryObject("COMMIT"); return "NOT_FOUND" as const; }
      if (existing.rows[0].list_type !== "CUSTOM") { await connection.queryObject("COMMIT"); return "SYSTEM_LIST" as const; }
      await connection.queryObject({ text: "DELETE FROM rewind.lists WHERE id=$1", args: [id] });
      await recordAdminAudit(connection, userId, "LIST_DELETED", "LIST", id, null);
      await connection.queryObject("COMMIT");
      return "OK" as const;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
};
