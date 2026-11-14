import type { ProfileUpdateRequest } from "../../contracts/profile.ts";
import { RewindApiError } from "../../http/errors.ts";
import type { PgConnection } from "../../runtime/database.ts";
import { safeId } from "./results.ts";

export async function getProfilePinnedListId(
  connection: PgConnection,
  userId: number,
): Promise<number | null> {
  const result = await connection.queryObject<{ list_id: string }>({
    text: `SELECT p.list_id::text AS list_id FROM rewind.profile_pinned_lists p
           JOIN rewind.lists l ON l.id = p.list_id AND l.user_id = p.user_id
           JOIN rewind.users u ON u.id = p.user_id AND u.is_active
           WHERE p.user_id = $1 AND l.is_public AND l.list_type = 'CUSTOM'`,
    args: [userId],
  });
  return result.rows[0] ? safeId(result.rows[0].list_id, "List ID") : null;
}

export async function saveProfilePinnedList(
  connection: PgConnection,
  userId: number,
  update: ProfileUpdateRequest,
): Promise<void> {
  if (update.pinnedListId === undefined) return;
  if (update.pinnedListId === null) {
    await connection.queryObject({
      text: "DELETE FROM rewind.profile_pinned_lists WHERE user_id = $1",
      args: [userId],
    });
    return;
  }
  // Serialize with privacy changes, moderation and deletion of the selected list.
  const target = await connection.queryObject({
    text: `SELECT id FROM rewind.lists WHERE id = $1 AND user_id = $2
           AND list_type = 'CUSTOM' AND is_public FOR UPDATE`,
    args: [update.pinnedListId, userId],
  });
  if (!target.rows.length) {
    throw new RewindApiError(400, "Choose one of your public custom lists");
  }
  await connection.queryObject({
    text:
      `INSERT INTO rewind.profile_pinned_lists (user_id, list_id) VALUES ($1, $2)
           ON CONFLICT (user_id) DO UPDATE SET list_id = EXCLUDED.list_id`,
    args: [userId, update.pinnedListId],
  });
}
