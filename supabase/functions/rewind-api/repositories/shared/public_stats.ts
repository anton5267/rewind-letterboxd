import { parseSafeCount } from "../../http/parsers/query.ts";
import type { PgConnection } from "../../runtime/database.ts";

/** Count watched entries that are already visible through public profile collections. */
export async function countPublicWatchedFilmEntries(connection: PgConnection): Promise<number> {
  const result = await connection.queryObject<{ count: string }>({
    text: `SELECT COUNT(*)::text AS count
      FROM rewind.list_items i
      JOIN rewind.lists l ON l.id = i.list_id AND l.list_type = 'WATCHED'
      JOIN rewind.users u ON u.id = l.user_id AND u.is_active = TRUE
      JOIN rewind.movies m ON m.id = i.movie_id AND m.is_published = TRUE`,
  });
  return parseSafeCount(result.rows[0]?.count ?? "0");
}
