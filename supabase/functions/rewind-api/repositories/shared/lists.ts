import type { AdminListResponse } from "../../contracts/admin.ts";
import type { MyListResponse } from "../../contracts/lists.ts";
import { RewindApiError } from "../../http/errors.ts";
import {
  pool,
  type PgConnection,
} from "../../runtime/database.ts";
import {
  safeId,
} from "./results.ts";

export async function ensureSystemLists(connection: Awaited<ReturnType<typeof pool.connect>>, userId: number) {
  // Serialize first-login requests for the same profile so each system list is
  // created once even when the browser fires multiple API calls concurrently.
  await connection.queryObject({ text: "SELECT pg_advisory_xact_lock($1::bigint)", args: [userId] });
  for (const [type, name, isPublic] of [["WATCHLIST", "Watchlist", true], ["WATCHED", "Watched", false], ["FAVORITES", "Favorites", false]] as const) {
    await connection.queryObject({
      text: `INSERT INTO rewind.lists (user_id, name, list_type, is_public)
             SELECT $1::BIGINT, $2::VARCHAR, $3::VARCHAR, $4::BOOLEAN
             WHERE NOT EXISTS (
               SELECT 1 FROM rewind.lists WHERE user_id = $1::BIGINT AND list_type = $3::VARCHAR
             )`,
      args: [userId, name, type, isPublic],
    });
  }
}

export function toAdminList(row: {
  id: string; user_id: string; username: string; name: string; description: string | null;
  list_type: AdminListResponse["listType"]; is_public: boolean; item_count: string;
  created_at: string; updated_at: string; featured_position: number | null;
  featured_category: AdminListResponse["featuredCategory"];
}): AdminListResponse {
  return {
    id: safeId(row.id, "List ID"), userId: safeId(row.user_id, "User ID"), username: row.username,
    name: row.name, description: row.description, listType: row.list_type, isPublic: row.is_public,
    itemCount: Number(row.item_count), createdAt: row.created_at, updatedAt: row.updated_at,
    featuredPosition: row.featured_position,
    featuredCategory: row.featured_category,
  };
}

export async function loadListTags(connection: PgConnection, listIds: number[]): Promise<Map<number, string[]>> {
  const result = new Map<number, string[]>();
  if (listIds.length === 0) return result;
  const tags = await connection.queryObject<{ list_id: string; name: string }>({
    text: `SELECT lt.list_id::text AS list_id, t.name FROM rewind.list_tags lt
           JOIN rewind.tags t ON t.id = lt.tag_id WHERE lt.list_id = ANY($1::bigint[])
           ORDER BY lt.list_id, t.name`,
    args: [listIds],
  });
  for (const row of tags.rows) {
    const id = safeId(row.list_id, "List ID");
    const list = result.get(id) ?? [];
    list.push(row.name);
    result.set(id, list);
  }
  return result;
}

export async function loadPublicListPreviewRows(connection: PgConnection, listIds: number[]): Promise<{
  list_id: string; movie_id: string; title: string; release_date: string | null;
  rating: string | null; photo_url: string | null;
}[]> {
  if (listIds.length === 0) return [];
  const result = await connection.queryObject<{
    list_id: string; movie_id: string; title: string; release_date: string | null;
    rating: string | null; photo_url: string | null;
  }>({
    text: `SELECT list_id::text AS list_id, movie_id::text AS movie_id, title, release_date, rating, photo_url
           FROM (SELECT li.list_id, li.id, li.position, m.id AS movie_id, m.title,
                        m.release_date::text AS release_date, m.rating::text AS rating, m.photo_url,
                        ROW_NUMBER() OVER (PARTITION BY li.list_id ORDER BY li.position ASC NULLS LAST, li.id ASC) AS rn
                  FROM rewind.list_items li JOIN rewind.movies m ON m.id = li.movie_id AND m.is_published = TRUE
                  WHERE li.list_id = ANY($1::bigint[])) ranked WHERE rn <= $2
           ORDER BY list_id, rn`,
    args: [listIds, 5],
  });
  return result.rows;
}

export async function replaceListTags(connection: PgConnection, listId: number, values: string[]): Promise<string[]> {
  const normalized = new Map<string, string>();
  const resolvedNames: string[] = [];
  for (const value of values) {
    const name = value.trim().replace(/\s+/g, " ");
    if (!name) continue;
    const slug = name.normalize("NFKD").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
    if (!slug || slug.length > 60) throw new RewindApiError(400, "Invalid tag");
    if (!normalized.has(slug)) normalized.set(slug, name);
  }
  await connection.queryObject({ text: "DELETE FROM rewind.list_tags WHERE list_id = $1", args: [listId] });
  for (const [slug, name] of normalized) {
    await connection.queryObject({
      text: "INSERT INTO rewind.tags (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING",
      args: [name, slug],
    });
    const tag = await connection.queryObject<{ id: string; name: string }>({
      text: "SELECT id::text AS id, name FROM rewind.tags WHERE slug = $1", args: [slug],
    });
    if (!tag.rows[0]) throw new Error("The list tag could not be resolved.");
    resolvedNames.push(tag.rows[0].name);
    await connection.queryObject({
      text: "INSERT INTO rewind.list_tags (list_id, tag_id) VALUES ($1, $2) ON CONFLICT (list_id, tag_id) DO NOTHING",
      args: [listId, safeId(tag.rows[0].id, "Tag ID")],
    });
  }
  return resolvedNames;
}

export async function fetchMyListRows(connection: PgConnection, userId: number, limit?: number, offset = 0): Promise<MyListResponse[]> {
  const paged = limit !== undefined;
  const rows = await connection.queryObject<{
    id: string; name: string; description: string | null; list_type: MyListResponse["listType"]; is_public: boolean; is_ranked: boolean; reply_preference: MyListResponse["replyPreference"];
  }>({
    text: `SELECT id::text AS id, name, description, list_type, is_public, is_ranked, reply_preference FROM rewind.lists
           WHERE user_id = $1 ORDER BY updated_at DESC, id DESC${paged ? " LIMIT $2 OFFSET $3" : ""}`,
    args: paged ? [userId, limit, offset] : [userId],
  });
  const ids = rows.rows.map((row) => safeId(row.id, "List ID"));
  const tags = await loadListTags(connection, ids);
  return rows.rows.map((row) => {
    const id = safeId(row.id, "List ID");
    return { id, name: row.name, description: row.description, listType: row.list_type,
      isPublic: row.is_public, isRanked: row.is_ranked, replyPreference: row.reply_preference, tags: tags.get(id) ?? [] };
  });
}
