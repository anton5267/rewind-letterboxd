import { createRewindApiHandler } from "./handler.ts";
import { countPublicWatchedFilmEntries } from "./repositories/shared/public_stats.ts";
import type { PgConnection } from "./runtime/database.ts";

function api(overrides: { getPublicWatchedFilmCount?: () => Promise<number> } = {}) {
  return createRewindApiHandler({
    listGenres: async () => [],
    searchMovies: async (params) => ({ content: [], totalPages: 0, totalElements: 0, number: params.page }),
    getMovieDetails: async () => null,
    searchPeople: async (params) => ({ content: [], totalPages: 0, totalElements: 0, number: params.page }),
    getPersonFilmography: async () => null,
    ...overrides,
  }, []);
}

Deno.test("GET /api/stats/watched-films returns only the aggregate count", async () => {
  const response = await api({ getPublicWatchedFilmCount: async () => 3_108_812_335 })(
    new Request("https://project.supabase.co/api/stats/watched-films"),
  );
  const body = await response.json();
  if (response.status !== 200 || JSON.stringify(body) !== JSON.stringify({ count: 3_108_812_335 })) {
    throw new Error(`Unexpected public watched count response: ${response.status} ${JSON.stringify(body)}`);
  }
  if (response.headers.get("Cache-Control") !== "public, max-age=60, stale-while-revalidate=300") {
    throw new Error("Public watched count cache policy was not applied");
  }
});

Deno.test("GET /api/stats/watched-films returns zero and closes when no repository method exists", async () => {
  const zero = await api({ getPublicWatchedFilmCount: async () => 0 })(
    new Request("https://project.supabase.co/api/stats/watched-films"),
  );
  if (zero.status !== 200 || (await zero.json()).count !== 0) throw new Error("Zero watched count was not preserved");
  const unavailable = await api()(new Request("https://project.supabase.co/api/stats/watched-films"));
  if (unavailable.status !== 503) throw new Error(`Unavailable repository returned ${unavailable.status}, expected 503`);
});

Deno.test("watched-film aggregate query uses only public-profile-visible records", async () => {
  let sql = "";
  const connection = {
    async queryObject<T>(query: { text: string }) {
      sql = query.text;
      return { rows: [{ count: "17" }] as T[] };
    },
  } as unknown as PgConnection;
  const count = await countPublicWatchedFilmEntries(connection);
  for (const fragment of ["rewind.list_items", "rewind.lists", "l.list_type = 'WATCHED'", "rewind.users", "u.is_active", "rewind.movies", "m.is_published = TRUE"]) {
    if (!sql.includes(fragment)) throw new Error(`Aggregate query omitted visibility rule: ${fragment}`);
  }
  if (count !== 17) throw new Error(`Aggregate returned ${count}, expected 17`);
});

Deno.test("watched-film aggregate query preserves zero and rejects unsafe counts", async () => {
  for (const raw of ["0", "9007199254740992"]) {
    const connection = {
      async queryObject<T>() { return { rows: [{ count: raw }] as T[] }; },
    } as unknown as PgConnection;
    let rejected = false;
    try {
      const count = await countPublicWatchedFilmEntries(connection);
      if (raw === "0" && count !== 0) throw new Error("Zero count changed");
    } catch { rejected = raw !== "0"; }
    if (rejected !== (raw !== "0")) throw new Error(`Unexpected handling of aggregate count ${raw}`);
  }
});
