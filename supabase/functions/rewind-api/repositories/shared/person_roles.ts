import type { PersonFilmographyResponse } from "../../contracts/catalog.ts";
import type { PgConnection } from "../../runtime/database.ts";
import { safeId } from "./results.ts";

type PersonRole = PersonFilmographyResponse["type"];

/** Link catalogue roles only through an existing positive TMDB person ID. */
export async function findRelatedPersonRoles(
  connection: PgConnection,
  type: PersonRole,
  tmdbId: string | null,
): Promise<NonNullable<PersonFilmographyResponse["relatedPeople"]>> {
  if (tmdbId === null) return [];
  const result = await connection.queryObject<{ id: string; type: PersonRole }>(
    {
      text: `SELECT a.id::text AS id, 'ACTOR'::text AS type
      FROM rewind.actors a
      WHERE a.tmdb_id = $1 AND a.tmdb_id > 0 AND $2 <> 'ACTOR'
        AND EXISTS (SELECT 1 FROM rewind.movie_actors ma
          JOIN rewind.movies m ON m.id = ma.movie_id AND m.is_published
          WHERE ma.actor_id = a.id)
      UNION ALL
      SELECT d.id::text, 'DIRECTOR'::text
      FROM rewind.directors d
      WHERE d.tmdb_id = $1 AND d.tmdb_id > 0 AND $2 <> 'DIRECTOR'
        AND EXISTS (SELECT 1 FROM rewind.movie_directors md
          JOIN rewind.movies m ON m.id = md.movie_id AND m.is_published
          WHERE md.director_id = d.id)
      UNION ALL
      SELECT p.id::text, 'PRODUCER'::text
      FROM rewind.producers p
      WHERE p.tmdb_id = $1 AND p.tmdb_id > 0 AND $2 <> 'PRODUCER'
        AND EXISTS (SELECT 1 FROM rewind.movie_producers mp
          JOIN rewind.movies m ON m.id = mp.movie_id AND m.is_published
          WHERE mp.producer_id = p.id)
      ORDER BY type, id`,
      args: [tmdbId, type],
    },
  );
  return result.rows.map((person) => ({
    id: safeId(person.id, "Person ID"),
    type: person.type,
  }));
}
