import { replaceAdminMovieCredits } from "./admin_movie_credits.ts";
import { replaceAdminMovieGenres } from "./admin_movie_genres.ts";
import { buildAdminMovieAuditMetadata, buildAdminMovieUpdateQuery } from "./admin_movie_update.ts";
import { RewindApiError } from "./handler.ts";

interface QueryClient {
  queryObject<T>(query: string | { text: string; args?: unknown[] }): Promise<{ rows: T[] }>;
}

Deno.test("admin movie update builder keeps omitted fields and clears explicit nulls", () => {
  const query = buildAdminMovieUpdateQuery(51, {
    originalLanguage: "en",
    shortPlot: null,
    published: false,
  });
  if (!query || !query.text.includes("original_language=$2") || !query.text.includes("short_plot=$3")
    || !query.text.includes("is_published=$4") || query.args.length !== 4
    || query.args[1] !== "en" || query.args[2] !== null || query.args[3] !== false) {
    throw new Error(`Unexpected update query: ${JSON.stringify(query)}`);
  }
  if (buildAdminMovieUpdateQuery(51, {}) !== null) {
    throw new Error("An empty partial update should not generate an UPDATE statement");
  }
});

Deno.test("admin movie audit metadata records changed field names without field values", () => {
  const body = {
    title: "Public movie title",
    originalLanguage: "en",
    shortPlot: "Private long plot text that must not enter the audit log",
    genreIds: [2, 4],
    actorCredits: [{ actorId: 7, characterName: "Private character detail", castOrder: 0 }],
  };
  const metadata = buildAdminMovieAuditMetadata(body);
  if (metadata !== "fields=title,originalLanguage,shortPlot,genreIds,actorCredits"
    || metadata.includes("Public movie title") || metadata.includes("Private")) {
    throw new Error(`Unexpected or sensitive movie audit metadata: ${metadata}`);
  }
  if (buildAdminMovieAuditMetadata({}) !== null) {
    throw new Error("Empty updates must not create movie audit metadata");
  }
});

Deno.test("genre replacement validates every ID before deleting existing links", async () => {
  const queries: string[] = [];
  const missingGenreClient: QueryClient = {
    async queryObject<T>(query: string | { text: string; args?: unknown[] }) {
      const text = typeof query === "string" ? query : query.text;
      queries.push(text);
      return { rows: [] as T[] };
    },
  };
  let rejected = false;
  try {
    await replaceAdminMovieGenres(missingGenreClient, 51, [4]);
  } catch (error) {
    rejected = error instanceof RewindApiError && error.status === 400;
  }
  if (!rejected || queries.length !== 1 || queries.some((query) => query.startsWith("DELETE"))) {
    throw new Error("Invalid genre IDs must fail before existing relations are changed");
  }

  queries.length = 0;
  const validGenreClient: QueryClient = {
    async queryObject<T>(query: string | { text: string; args?: unknown[] }) {
      const text = typeof query === "string" ? query : query.text;
      queries.push(text);
      return { rows: (text.startsWith("SELECT") ? [{ id: "2" }, { id: "4" }] : []) as T[] };
    },
  };
  await replaceAdminMovieGenres(validGenreClient, 51, [2, 4]);
  if (queries.length !== 3 || !queries[1].startsWith("DELETE") || !queries[2].startsWith("INSERT")) {
    throw new Error(`Unexpected genre replacement sequence: ${JSON.stringify(queries)}`);
  }
});

Deno.test("credits validate all referenced records before replacing links", async () => {
  const queries: string[] = [];
  const client: QueryClient = {
    async queryObject<T>(query: string | { text: string; args?: unknown[] }) {
      const text = typeof query === "string" ? query : query.text;
      queries.push(text);
      return { rows: (text.startsWith("SELECT") ? [{ id: "7" }] : []) as T[] };
    },
  };
  await replaceAdminMovieCredits(client, 51, {
    actorCredits: [{ actorId: 7, characterName: "Lead", castOrder: 0 }],
    directorIds: [7],
    producerIds: [],
  });
  const firstDelete = queries.findIndex((query) => query.startsWith("DELETE"));
  if (queries.length !== 7 || firstDelete !== 2 || !queries[3].startsWith("INSERT")
    || !queries[4].startsWith("DELETE") || !queries[5].startsWith("INSERT") || !queries[6].startsWith("DELETE")) {
    throw new Error(`Unexpected credit replacement sequence: ${JSON.stringify(queries)}`);
  }
});
