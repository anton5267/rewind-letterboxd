import type { PersonFilmographyResponse, PersonSearchResult } from "../../contracts/catalog.ts";
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

export async function readPublishedWriterSearch(
  connection: PgConnection,
  query: string | null,
  size: number,
  page: number,
): Promise<PersonSearchResult> {
  await connection.queryObject("SET ROLE rewind_edge_reader");
  const filter = `m.is_published = TRUE AND ${writingCredit}
                  AND ($1::text IS NULL OR LOWER(c.person_name) LIKE '%' || LOWER($1) || '%')`;
  const [countResult, writerResult] = await Promise.all([
    connection.queryObject<{ total: string }>({
      text: `SELECT COUNT(DISTINCT c.tmdb_person_id)::text AS total
             FROM rewind.movie_crew_credits c
             JOIN rewind.movies m ON m.id = c.movie_id
             WHERE ${filter}`,
      args: [query],
    }),
    connection.queryObject<{
      tmdb_person_id: string;
      name: string;
      photo_url: string | null;
      film_count: string;
    }>({
      text: `WITH writer_credits AS (
               SELECT c.tmdb_person_id, c.person_name, c.photo_url, c.movie_id
               FROM rewind.movie_crew_credits c
               JOIN rewind.movies m ON m.id = c.movie_id
               WHERE ${filter}
             ), writer_counts AS (
               SELECT tmdb_person_id, COUNT(DISTINCT movie_id)::text AS film_count
               FROM writer_credits
               GROUP BY tmdb_person_id
             ), writer_identity AS (
               SELECT DISTINCT ON (tmdb_person_id) tmdb_person_id, person_name, photo_url
               FROM writer_credits
               ORDER BY tmdb_person_id, person_name, photo_url NULLS LAST, movie_id
             )
             SELECT writer_identity.tmdb_person_id::text AS tmdb_person_id,
                    writer_identity.person_name AS name, writer_identity.photo_url,
                    writer_counts.film_count
             FROM writer_identity
             JOIN writer_counts USING (tmdb_person_id)
             ORDER BY LOWER(writer_identity.person_name), writer_identity.tmdb_person_id
             LIMIT $2 OFFSET $3`,
      args: [query, size, page * size],
    }),
  ]);
  const totalElements = Number(countResult.rows[0]?.total ?? "0");
  if (!Number.isSafeInteger(totalElements) || totalElements < 0) {
    throw new Error("Writer count is outside the safe JSON integer range");
  }
  const content = writerResult.rows.map((writer) => ({
    id: safeId(writer.tmdb_person_id, "TMDB person ID"),
    name: writer.name,
    photoUrl: writer.photo_url,
    type: "WRITER" as const,
    filmCount: safeId(writer.film_count, "Writer film count"),
  }));
  return { content, totalElements, totalPages: Math.ceil(totalElements / size), number: page };
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
