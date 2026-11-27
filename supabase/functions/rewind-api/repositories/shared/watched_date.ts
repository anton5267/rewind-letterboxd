import type { PgConnection } from "../../runtime/database.ts";
import { RewindApiError } from "../../http/errors.ts";

export async function getMyWatchedOn(connection: PgConnection, userId: number, movieId: number): Promise<string | null> {
  const result = await connection.queryObject<{ watched_on: string | null }>({
    text: `SELECT li.watched_on::text AS watched_on
           FROM rewind.lists l LEFT JOIN rewind.list_items li ON li.list_id=l.id AND li.movie_id=$2
           WHERE l.user_id=$1 AND l.list_type='WATCHED' LIMIT 1`,
    args: [userId, movieId],
  });
  return result.rows[0]?.watched_on ?? null;
}

export async function setMyWatchedOn(connection: PgConnection, userId: number, movieId: number, watchedOn: string): Promise<void> {
  const movie = await connection.queryObject({ text: "SELECT 1 FROM rewind.movies WHERE id=$1 AND is_published=TRUE", args: [movieId] });
  if (!movie.rows.length) throw new RewindApiError(400, "Movie not found");
  const list = await connection.queryObject<{ id: string }>({
    text: "SELECT id::text AS id FROM rewind.lists WHERE user_id=$1 AND list_type='WATCHED' FOR UPDATE", args: [userId],
  });
  if (!list.rows[0]) throw new Error("Watched system list is unavailable.");
  const listId = Number(list.rows[0].id);
  const existing = await connection.queryObject({
    text: "SELECT 1 FROM rewind.list_items WHERE list_id=$1 AND movie_id=$2 FOR UPDATE", args: [listId, movieId],
  });
  if (existing.rows.length) {
    await connection.queryObject({ text: "UPDATE rewind.list_items SET watched_on=$3 WHERE list_id=$1 AND movie_id=$2", args: [listId, movieId, watchedOn] });
    return;
  }
  await connection.queryObject({ text: "INSERT INTO rewind.list_items (list_id, movie_id, watched_on) VALUES ($1, $2, $3)", args: [listId, movieId, watchedOn] });
  await connection.queryObject({ text: "INSERT INTO rewind.user_activities (user_id, activity_type, movie_id) VALUES ($1, 'WATCHED', $2)", args: [userId, movieId] });
}
