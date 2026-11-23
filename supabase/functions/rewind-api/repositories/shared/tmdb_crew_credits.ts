import type { PgConnection } from "../../runtime/database.ts";
import type { TmdbCrewCredit } from "../../tmdb.ts";

export interface StoredCrewCredit {
  department: string;
  job: string;
}

/** Replace the imported TMDB crew snapshot for one movie inside the caller's transaction. */
export async function replaceTmdbCrewCredits(
  connection: PgConnection,
  movieId: number,
  credits: readonly TmdbCrewCredit[],
): Promise<void> {
  await connection.queryObject({
    text: "DELETE FROM rewind.movie_crew_credits WHERE movie_id=$1",
    args: [movieId],
  });
  if (credits.length === 0) return;

  await connection.queryObject({
    text: `INSERT INTO rewind.movie_crew_credits
             (movie_id, tmdb_person_id, person_name, photo_url, department, job)
           SELECT $1, credit.tmdb_person_id, credit.person_name, credit.photo_url,
                  credit.department, credit.job
           FROM unnest($2::bigint[], $3::text[], $4::text[], $5::text[], $6::text[])
             AS credit(tmdb_person_id, person_name, photo_url, department, job)
           ON CONFLICT (movie_id, tmdb_person_id, department, job) DO NOTHING`,
    args: [
      movieId,
      credits.map((credit) => credit.tmdbId),
      credits.map((credit) => credit.name),
      credits.map((credit) => credit.photoUrl),
      credits.map((credit) => credit.department),
      credits.map((credit) => credit.job),
    ],
  });
}
