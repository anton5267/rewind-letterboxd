import type { PersonFilmographyResponse } from "../../contracts/catalog.ts";
import type { PgConnection } from "../../runtime/database.ts";
import { findRelatedPersonRoles } from "./person_roles.ts";
import { safeId } from "./results.ts";
import { writingCreditPredicate } from "./writing_credit.ts";

const writingCredit = writingCreditPredicate("c");
const sortColumns: Record<string, string> = {
  newest: "m.release_date DESC NULLS LAST",
  oldest: "m.release_date ASC NULLS LAST",
  rating: "m.rating DESC NULLS LAST",
  title: "LOWER(m.title) ASC",
};

interface WriterCreditRow {
  movie_id: string;
  title: string;
  release_date: string | null;
  rating: string | null;
  photo_url: string | null;
  department: string;
  job: string;
}

interface WriterIdentity {
  name: string;
  photo_url: string | null;
}

export async function readWriterFilmography(
  connection: PgConnection,
  tmdbPersonId: number,
  genreId: number | null,
  sort: string,
): Promise<PersonFilmographyResponse | null> {
  await connection.queryObject("SET ROLE rewind_edge_reader");
  const personResult = await connection.queryObject<WriterIdentity>({
    text: `SELECT c.person_name AS name, c.photo_url
           FROM rewind.movie_crew_credits c
           JOIN rewind.movies m ON m.id = c.movie_id AND m.is_published = TRUE
           WHERE c.tmdb_person_id = $1 AND ${writingCredit}
           ORDER BY c.person_name, c.photo_url NULLS LAST
           LIMIT 1`,
    args: [tmdbPersonId],
  });
  const person = personResult.rows[0];
  if (!person) return null;

  const careerResult = await connection.queryObject<{ job: string }>({
    text: `SELECT DISTINCT c.job
           FROM rewind.movie_crew_credits c
           JOIN rewind.movies m ON m.id = c.movie_id AND m.is_published = TRUE
           WHERE c.tmdb_person_id = $1`,
    args: [tmdbPersonId],
  });

  const genreFilter = genreId === null
    ? ""
    : "AND EXISTS (SELECT 1 FROM rewind.movie_genres mg WHERE mg.movie_id = m.id AND mg.genre_id = $2)";
  const args = genreId === null ? [tmdbPersonId] : [tmdbPersonId, genreId];
  const result = await connection.queryObject<WriterCreditRow>({
    text: `SELECT m.id::text AS movie_id, m.title, m.release_date::text AS release_date,
                  m.rating::text AS rating, m.photo_url, c.department, c.job
           FROM rewind.movie_crew_credits c
           JOIN rewind.movies m ON m.id = c.movie_id AND m.is_published = TRUE
           WHERE c.tmdb_person_id = $1 AND ${writingCredit} ${genreFilter}
           ORDER BY ${sortColumns[sort] ?? sortColumns.newest}, m.id ASC, c.department, c.job`,
    args,
  });

  const films = new Map<number, PersonFilmographyResponse["films"][number]>();
  for (const row of result.rows) {
    const id = safeId(row.movie_id, "Movie ID");
    const film = films.get(id);
    if (film) {
      film.crewCredits?.push({ department: row.department, job: row.job });
      continue;
    }
    films.set(id, {
      id,
      title: row.title,
      releaseDate: row.release_date,
      rating: row.rating === null ? null : Number(row.rating),
      photoUrl: row.photo_url,
      characterName: null,
      crewCredits: [{ department: row.department, job: row.job }],
    });
  }

  return {
    id: tmdbPersonId,
    name: person.name,
    photoUrl: person.photo_url,
    type: "WRITER",
    relatedPeople: await findRelatedPersonRoles(connection, "WRITER", String(tmdbPersonId)),
    tmdbId: tmdbPersonId,
    careerJobs: careerResult.rows.map((credit) => credit.job)
      .sort((left, right) => left.localeCompare(right)),
    films: [...films.values()],
  };
}
