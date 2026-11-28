import type { PgConnection } from "../../runtime/database.ts";
import type { TmdbPerson } from "../../tmdb.ts";

/** Import metadata only onto an exact TMDB identity; never merge by a same-name guess. */
export async function resolveTmdbPersonForImport(
  connection: PgConnection,
  table: "actors" | "directors" | "producers",
  person: TmdbPerson,
): Promise<number> {
  const imported = await connection.queryObject<{ id: string }>({
    text: `INSERT INTO rewind.${table}(name,tmdb_id,photo_url) VALUES($1,$2,$3)
           ON CONFLICT (tmdb_id) DO UPDATE SET name=EXCLUDED.name,photo_url=EXCLUDED.photo_url
           RETURNING id::text AS id`,
    args: [person.name, person.tmdbId, person.photoUrl],
  });
  return Number(imported.rows[0]!.id);
}
