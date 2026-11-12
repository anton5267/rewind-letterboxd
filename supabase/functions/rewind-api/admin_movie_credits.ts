import { RewindApiError } from "./handler.ts";

interface CreditsQueryClient {
  queryObject<T>(query: string | { text: string; args?: unknown[] }): Promise<{ rows: T[] }>;
}

export interface AdminMovieCreditWrite {
  actorCredits?: { actorId: number; characterName: string | null; castOrder: number | null }[];
  directorIds?: number[];
  producerIds?: number[];
}

async function validateIds(connection: CreditsQueryClient, table: string, ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const result = await connection.queryObject<{ id: string }>({
    text: `SELECT id::text AS id FROM rewind.${table} WHERE id = ANY($1::bigint[])`,
    args: [ids],
  });
  if (result.rows.length !== ids.length) throw new RewindApiError(400, `One or more ${table} were not found`);
}

export async function replaceAdminMovieCredits(
  connection: CreditsQueryClient,
  movieId: number,
  credits: AdminMovieCreditWrite,
): Promise<void> {
  const actorCredits = credits.actorCredits;
  const directorIds = credits.directorIds;
  const producerIds = credits.producerIds;

  if (actorCredits !== undefined) await validateIds(connection, "actors", actorCredits.map((credit) => credit.actorId));
  if (directorIds !== undefined) await validateIds(connection, "directors", directorIds);
  if (producerIds !== undefined) await validateIds(connection, "producers", producerIds);

  if (actorCredits !== undefined) {
    await connection.queryObject({ text: "DELETE FROM rewind.movie_actors WHERE movie_id=$1", args: [movieId] });
    if (actorCredits.length > 0) {
      await connection.queryObject({
        text: `INSERT INTO rewind.movie_actors (movie_id, actor_id, character_name, cast_order)
               SELECT $1, selected.actor_id, selected.character_name, selected.cast_order
               FROM unnest($2::bigint[], $3::text[], $4::integer[])
                 AS selected(actor_id, character_name, cast_order)`,
        args: [movieId, actorCredits.map((credit) => credit.actorId), actorCredits.map((credit) => credit.characterName),
          actorCredits.map((credit) => credit.castOrder)],
      });
    }
  }

  if (directorIds !== undefined) {
    await connection.queryObject({ text: "DELETE FROM rewind.movie_directors WHERE movie_id=$1", args: [movieId] });
    if (directorIds.length > 0) {
      await connection.queryObject({
        text: "INSERT INTO rewind.movie_directors (movie_id, director_id) SELECT $1, selected.person_id FROM unnest($2::bigint[]) AS selected(person_id)",
        args: [movieId, directorIds],
      });
    }
  }

  if (producerIds !== undefined) {
    await connection.queryObject({ text: "DELETE FROM rewind.movie_producers WHERE movie_id=$1", args: [movieId] });
    if (producerIds.length > 0) {
      await connection.queryObject({
        text: "INSERT INTO rewind.movie_producers (movie_id, producer_id) SELECT $1, selected.person_id FROM unnest($2::bigint[]) AS selected(person_id)",
        args: [movieId, producerIds],
      });
    }
  }
}
