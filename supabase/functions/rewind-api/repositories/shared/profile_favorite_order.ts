import type { PgConnection } from "../../runtime/database.ts";
import type { FavoriteMoveRequest } from "../../contracts/profile.ts";
import { RewindApiError } from "../../http/errors.ts";
import { safeId } from "./results.ts";
import { listItemOrder } from "./list_order.ts";

export async function moveOwnedFavorite(connection: PgConnection, userId: number, move: FavoriteMoveRequest): Promise<boolean> {
  if (move.expectedUserId !== userId) throw new RewindApiError(409, "The current account changed");
  const list = await connection.queryObject<{ id: string }>({
    text: "SELECT id::text AS id FROM rewind.lists WHERE user_id = $1 AND list_type = 'FAVORITES' FOR UPDATE",
    args: [userId],
  });
  if (!list.rows[0]) return false;
  const listId = safeId(list.rows[0].id, "List ID");
  const rows = await connection.queryObject<{ id: string; movie_id: string; is_published: boolean }>({
    text: `SELECT i.id::text AS id, i.movie_id::text AS movie_id, m.is_published
           FROM rewind.list_items i JOIN rewind.movies m ON m.id = i.movie_id
           WHERE i.list_id = $1 ORDER BY ${listItemOrder("FAVORITES", "i")} FOR UPDATE OF i`,
    args: [listId],
  });
  const source = rows.rows.find(row => row.is_published && safeId(row.movie_id, "Movie ID") === move.movieId);
  const target = rows.rows.find(row => row.is_published && safeId(row.movie_id, "Movie ID") === move.targetMovieId);
  if (!source || !target) return false;
  const ordered = rows.rows.filter(row => row !== source);
  const destination = ordered.indexOf(target) + (move.placement === "after" ? 1 : 0);
  ordered.splice(destination, 0, source);
  await connection.queryObject({
    text: `UPDATE rewind.list_items i SET position = ordered.position::integer
           FROM unnest($1::bigint[]) WITH ORDINALITY AS ordered(id, position)
           WHERE i.list_id = $2 AND i.id = ordered.id`,
    args: [ordered.map(row => safeId(row.id, "List item ID")), listId],
  });
  return true;
}
