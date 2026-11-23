import { replaceTmdbCrewCredits } from "./tmdb_crew_credits.ts";
import type { TmdbCrewCredit } from "../../tmdb.ts";
import type { PgConnection } from "../../runtime/database.ts";

Deno.test("TMDB crew replacement binds aligned credit arrays after deleting the old movie snapshot", async () => {
  const calls: { text: string; args: unknown[] }[] = [];
  const connection = {
    queryObject(query: string | { text: string; args?: unknown[] }) {
      calls.push({
        text: typeof query === "string" ? query : query.text,
        args: typeof query === "string" ? [] : query.args ?? [],
      });
      return Promise.resolve({ rows: [] });
    },
  } as unknown as PgConnection;
  const credits: TmdbCrewCredit[] = [
    { tmdbId: 12, name: "Writer One", photoUrl: "https://image.tmdb.org/t/p/w185/one.jpg", department: "Writing", job: "Screenplay" },
    { tmdbId: 34, name: "Producer Two", photoUrl: null, department: "Production", job: "Executive Producer" },
  ];

  await replaceTmdbCrewCredits(connection, 56, credits);

  const insert = calls[1];
  const expectedArgs = [
    56,
    [12, 34],
    ["Writer One", "Producer Two"],
    ["https://image.tmdb.org/t/p/w185/one.jpg", null],
    ["Writing", "Production"],
    ["Screenplay", "Executive Producer"],
  ];
  if (calls.length !== 2 || !calls[0].text.includes("DELETE FROM rewind.movie_crew_credits WHERE movie_id=$1")
    || JSON.stringify(calls[0].args) !== "[56]"
    || !insert.text.includes("unnest($2::bigint[], $3::text[], $4::text[], $5::text[], $6::text[])")
    || !insert.text.includes("ON CONFLICT (movie_id, tmdb_person_id, department, job) DO NOTHING")
    || JSON.stringify(insert.args) !== JSON.stringify(expectedArgs)) {
    throw new Error(`Crew replacement query or parameter alignment changed: ${JSON.stringify(calls)}`);
  }
});

Deno.test("TMDB crew replacement clears a movie snapshot without inserting empty arrays", async () => {
  const calls: { text: string; args: unknown[] }[] = [];
  const connection = {
    queryObject(query: string | { text: string; args?: unknown[] }) {
      calls.push({
        text: typeof query === "string" ? query : query.text,
        args: typeof query === "string" ? [] : query.args ?? [],
      });
      return Promise.resolve({ rows: [] });
    },
  } as unknown as PgConnection;

  await replaceTmdbCrewCredits(connection, 56, []);

  if (calls.length !== 1 || !calls[0].text.includes("DELETE FROM rewind.movie_crew_credits WHERE movie_id=$1")
    || JSON.stringify(calls[0].args) !== "[56]") {
    throw new Error(`Empty crew replacement must only delete the prior snapshot: ${JSON.stringify(calls)}`);
  }
});
