import { createRewindApiHandler, type RewindApiRepository } from "./handler.ts";
import { readWriterFilmography } from "./repositories/shared/writer_filmography.ts";
import type { PgConnection } from "./runtime/database.ts";

const pagesOrigin = "https://anton5267.github.io";

function handlerWith(repository: Partial<RewindApiRepository> = {}) {
  return createRewindApiHandler({
    listGenres: () => Promise.resolve([]),
    searchMovies: (params) => Promise.resolve({ content: [], totalPages: 0, totalElements: 0, number: params.page }),
    getMovieDetails: () => Promise.resolve(null),
    searchPeople: (params) => Promise.resolve({ content: [], totalPages: 0, totalElements: 0, number: params.page }),
    getPersonFilmography: () => Promise.resolve(null),
    ...repository,
  }, [pagesOrigin]);
}

Deno.test("writer filmography route validates filters and returns the public catalogue contract", async () => {
  const calls: unknown[][] = [];
  const handler = handlerWith({
    getWriterFilmography(tmdbPersonId, genreId, sort) {
      calls.push([tmdbPersonId, genreId, sort]);
      return Promise.resolve({
        id: tmdbPersonId,
        name: "Kim Byung-woo",
        photoUrl: null,
        type: "WRITER",
        tmdbId: tmdbPersonId,
        careerJobs: ["Writer"],
        films: [{
          id: 36, title: "The Great Flood", releaseDate: "2025-12-07", rating: 4.5,
          photoUrl: null, characterName: null, crewCredits: [{ department: "Writing", job: "Screenplay" }],
        }],
      });
    },
  });
  const response = await handler(new Request(
    "https://project.supabase.co/functions/v1/rewind-api/api/writers/1293082?genreId=18&sort=title&language=uk",
  ));
  const body = await response.json();
  if (response.status !== 200 || response.headers.get("Cache-Control") !== "public, max-age=300, stale-while-revalidate=600"
    || JSON.stringify(calls) !== JSON.stringify([[1293082, 18, "title"]])
    || body.type !== "WRITER" || body.careerJobs[0] !== "Writer"
    || body.films[0]?.crewCredits[0]?.job !== "Screenplay" || body.biographyLanguage !== null) {
    throw new Error(`Writer filmography response changed: ${JSON.stringify({ status: response.status, body, calls })}`);
  }

  for (const [path, query, expected] of [
    ["/api/writers/0", "", 400],
    ["/api/writers/9007199254740992", "", 400],
    ["/api/writers/1293082", "?genreId=-1", 400],
    ["/api/writers/1293082", "?language=fr", 400],
  ] as const) {
    const invalid = await handler(new Request(`https://project.supabase.co${path}${query}`));
    if (invalid.status !== expected) throw new Error(`Expected ${expected} for ${path}${query}, got ${invalid.status}`);
  }
  const method = await handler(new Request("https://project.supabase.co/api/writers/1293082", { method: "POST" }));
  if (method.status !== 405 || method.headers.get("Allow") !== "GET, OPTIONS") throw new Error("Writer route must remain GET-only");

  const unconfigured = await handlerWith()(
    new Request("https://project.supabase.co/api/writers/1293082"),
  );
  if (unconfigured.status !== 404) throw new Error("Writer route must fail closed without a repository method");
});

Deno.test("writer filmography groups crew jobs, applies published and genre filters, and maps nullable values", async () => {
  const queries: { text: string; args: unknown[] }[] = [];
  const connection = {
    queryObject<T>(query: string | { text: string; args?: unknown[] }): Promise<{ rows: T[] }> {
      const text = typeof query === "string" ? query : query.text;
      const args = typeof query === "string" ? [] : query.args ?? [];
      queries.push({ text, args });
      if (text.includes("SELECT c.person_name AS name")) {
        return Promise.resolve({ rows: [{ name: "Kim Byung-woo", photo_url: null }] as T[] });
      }
      if (text.includes("SELECT DISTINCT c.job")) {
        return Promise.resolve({ rows: [
          { job: "Story" }, { job: "Executive Producer" }, { job: "Book" }, { job: "Screenplay" },
        ] as T[] });
      }
      if (text.includes("SELECT m.id::text AS movie_id")) {
        return Promise.resolve({ rows: [
          { movie_id: "3601", title: "The Great Flood", release_date: "2025-12-07", rating: null,
            photo_url: null, department: "Writing", job: "Screenplay" },
          { movie_id: "3601", title: "The Great Flood", release_date: "2025-12-07", rating: null,
            photo_url: null, department: "Writing", job: "Story" },
        ] as T[] });
      }
      if (text.includes("SELECT a.id::text AS id")) return Promise.resolve({ rows: [{ id: "22", type: "ACTOR" }] as T[] });
      return Promise.resolve({ rows: [] as T[] });
    },
  } as unknown as PgConnection;
  const person = await readWriterFilmography(connection, 1293082, 18, "title");
  const identityQuery = queries.find(query => query.text.includes("SELECT c.person_name AS name"));
  const careerQuery = queries.find(query => query.text.includes("SELECT DISTINCT c.job"));
  const filmQuery = queries.find(query => query.text.includes("SELECT m.id::text AS movie_id"));
  const excludedJobs = [
    "NOT LIKE '%storyboard%'",
    "NOT LIKE '%script supervisor%'",
    "NOT LIKE '%script coordinator%'",
  ];
  if (person?.type !== "WRITER" || person.name !== "Kim Byung-woo" || person.photoUrl !== null
    || person.careerJobs?.join(",") !== "Book,Executive Producer,Screenplay,Story"
    || person.relatedPeople?.[0]?.id !== 22 || person.films.length !== 1
    || person.films[0].id !== 3601 || person.films[0].rating !== null
    || person.films[0].photoUrl !== null || person.films[0].characterName !== null
    || person.films[0].crewCredits?.map(credit => credit.job).join(",") !== "Screenplay,Story"
    || identityQuery?.args.join(",") !== "1293082" || !identityQuery.text.includes("m.is_published = TRUE")
    || !identityQuery.text.includes("LOWER(BTRIM(c.department)) = 'writing'")
    || excludedJobs.some(clause => !identityQuery.text.includes(clause))
    || careerQuery?.args.join(",") !== "1293082" || !careerQuery.text.includes("m.is_published = TRUE")
    || careerQuery.text.includes("movie_genres")
    || careerQuery.text.includes("LOWER(BTRIM(c.job))")
    || careerQuery.text.includes("LOWER(BTRIM(c.department))")
    || filmQuery?.args.join(",") !== "1293082,18" || !filmQuery.text.includes("m.is_published = TRUE")
    || !filmQuery.text.includes("AND EXISTS (SELECT 1 FROM rewind.movie_genres")
    || excludedJobs.some(clause => !filmQuery.text.includes(clause))
    || !filmQuery.text.includes("ORDER BY LOWER(m.title) ASC")) {
    throw new Error(`Writer filmography query or mapping changed: ${JSON.stringify({ person, queries })}`);
  }
});
