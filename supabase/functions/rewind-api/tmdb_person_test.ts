import { createTmdbPersonBiographyProvider } from "./tmdb_person.ts";
import { createRewindApiHandler, type RewindApiRepository } from "./handler.ts";

function same(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

Deno.test("biography provider skips missing keys and invalid identifiers", async () => {
  const fetcher: typeof fetch = () => {
    throw new Error("Unexpected provider request");
  };
  same(
    await createTmdbPersonBiographyProvider(undefined, fetcher)(880, "uk"),
    null,
  );
  const provider = createTmdbPersonBiographyProvider("fixture-key", fetcher);
  for (const id of [0, -1, Number.MAX_SAFE_INTEGER + 1]) {
    same(await provider(id, "en"), null);
  }
});

Deno.test("biography provider caches localized text and expires successful entries", async () => {
  let calls = 0;
  let clock = 0;
  const fetcher: typeof fetch = async (input, init) => {
    calls += 1;
    const url = new URL(String(input));
    same(url.pathname, "/3/person/880");
    same(url.searchParams.get("language"), "uk-UA");
    if (!init?.signal) throw new Error("Missing request timeout signal");
    return Response.json({ id: 880, biography: "  Localized biography  " });
  };
  const provider = createTmdbPersonBiographyProvider(
    "fixture-key",
    fetcher,
    () => clock,
  );
  same(await provider(880, "uk"), {
    text: "Localized biography",
    language: "uk",
  });
  same(await provider(880, "uk"), {
    text: "Localized biography",
    language: "uk",
  });
  same(calls, 1);
  clock = 6 * 60 * 60 * 1000 + 1;
  await provider(880, "uk");
  same(calls, 2);
});

Deno.test("biography provider falls back to English and labels the returned language", async () => {
  const languages: string[] = [];
  const fetcher: typeof fetch = async (input) => {
    const language = new URL(String(input)).searchParams.get("language")!;
    languages.push(language);
    return Response.json({
      id: 880,
      biography: language === "uk-UA" ? "" : "English biography",
    });
  };
  const provider = createTmdbPersonBiographyProvider("fixture-key", fetcher);
  same(await provider(880, "uk"), {
    text: "English biography",
    language: "en",
  });
  same(await provider(880, "uk"), {
    text: "English biography",
    language: "en",
  });
  same(languages, ["uk-UA", "en-US"]);
});

Deno.test("biography provider rejects mismatched identities and retries transient failures after cooldown", async () => {
  let clock = 0;
  let calls = 0;
  const fetcher: typeof fetch = async () => {
    calls += 1;
    return Response.json({
      id: calls === 1 ? 881 : 880,
      biography: "Verified biography",
    });
  };
  const provider = createTmdbPersonBiographyProvider(
    "fixture-key",
    fetcher,
    () => clock,
  );
  same(await provider(880, "en"), null);
  same(await provider(880, "en"), null);
  same(calls, 1);
  clock = 30001;
  same(await provider(880, "en"), {
    text: "Verified biography",
    language: "en",
  });
  same(calls, 2);
});

Deno.test("biography provider coalesces concurrent requests and bounds cache entries", async () => {
  let calls = 0;
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const fetcher: typeof fetch = async (input) => {
    calls += 1;
    await gate;
    return Response.json({
      id: Number(new URL(String(input)).pathname.split("/").at(-1)),
      biography: "Biography",
    });
  };
  const provider = createTmdbPersonBiographyProvider("fixture-key", fetcher);
  const first = provider(1, "en");
  const second = provider(1, "en");
  release();
  await Promise.all([first, second]);
  same(calls, 1);
  for (let id = 2; id <= 129; id += 1) await provider(id, "en");
  await provider(1, "en");
  same(calls, 130);
});

function repository(tmdbId: number | null = 880): RewindApiRepository {
  return {
    listGenres: async () => [],
    searchMovies: async (params) => ({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: params.page,
    }),
    getMovieDetails: async () => null,
    searchPeople: async (params) => ({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: params.page,
    }),
    getPersonFilmography: async (type, id) => ({
      id,
      type,
      name: "Person",
      photoUrl: null,
      tmdbId,
      films: [],
    }),
  };
}

Deno.test("person route enriches the selected language and rejects unsupported biography languages", async () => {
  const calls: unknown[] = [];
  const handler = createRewindApiHandler(
    repository(),
    [],
    undefined,
    undefined,
    async (id, language) => {
      calls.push([id, language]);
      return { text: "A biography", language };
    },
  );
  for (const type of ["actors", "directors", "producers"]) {
    const response = await handler(
      new Request(`https://project.supabase.co/api/${type}/35?language=uk`),
    );
    const body = await response.json();
    same(response.status, 200);
    same(body.biography, "A biography");
    same(body.biographyLanguage, "uk");
    same(body.id, 35);
  }
  same(calls, [[880, "uk"], [880, "uk"], [880, "uk"]]);
  const invalid = await handler(
    new Request("https://project.supabase.co/api/actors/35?language=de"),
  );
  same(invalid.status, 400);
  same(calls.length, 3);
});

Deno.test("person route retains catalogue data when the provider is unavailable or the mapping is absent", async () => {
  const handler = createRewindApiHandler(
    repository(),
    [],
    undefined,
    undefined,
    () => Promise.reject(new Error("Unavailable")),
  );
  const response = await handler(
    new Request("https://project.supabase.co/api/actors/35"),
  );
  const body = await response.json();
  same(response.status, 200);
  same(body.name, "Person");
  same(body.biography, null);
  const unmapped = createRewindApiHandler(
    repository(null),
    [],
    undefined,
    undefined,
    () => {
      throw new Error("Unexpected lookup");
    },
  );
  same(
    (await unmapped(new Request("https://project.supabase.co/api/actors/35")))
      .status,
    200,
  );
});
