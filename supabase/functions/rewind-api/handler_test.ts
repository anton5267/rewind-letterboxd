import { createRewindApiHandler, type RewindApiRepository } from "./handler.ts";

const pagesOrigin = "https://anton5267.github.io";

function handlerWith(repository: Partial<RewindApiRepository>) {
  return createRewindApiHandler({
    listGenres: async () => [],
    searchMovies: async (params) => ({ content: [], totalPages: 0, totalElements: 0, number: params.page }),
    getMovieDetails: async () => null,
    getPersonFilmography: async () => null,
    ...repository,
  }, [pagesOrigin, "http://localhost:5173"]);
}

Deno.test("GET /api/genres returns the existing array contract and accepts the Pages origin", async () => {
  const handler = handlerWith({
    async listGenres() {
      return [
        { id: 17, name: "Drama" },
        { id: 4, name: "Comedy" },
      ];
    },
  });

  const response = await handler(new Request("https://project.supabase.co/api/genres", {
    headers: { Origin: pagesOrigin },
  }));

  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (response.headers.get("Access-Control-Allow-Origin") !== pagesOrigin) {
    throw new Error("The GitHub Pages origin was not allowed");
  }
  const body = await response.json();
  if (JSON.stringify(body) !== JSON.stringify([
    { id: 17, name: "Drama" },
    { id: 4, name: "Comedy" },
  ])) {
    throw new Error(`Unexpected genre response: ${JSON.stringify(body)}`);
  }
});

Deno.test("OPTIONS preflight allows only the headers used by the frontend", async () => {
  const handler = handlerWith({ async listGenres() { return []; } });
  const response = await handler(new Request("https://project.supabase.co/api/genres", {
    method: "OPTIONS",
    headers: { Origin: pagesOrigin },
  }));

  if (response.status !== 204) throw new Error(`Expected 204, got ${response.status}`);
  if (response.headers.get("Access-Control-Allow-Methods") !== "GET, OPTIONS") {
    throw new Error("Unexpected CORS methods");
  }
  if (response.headers.get("Access-Control-Allow-Credentials")) {
    throw new Error("The public route must not enable cross-origin cookies");
  }
});

Deno.test("a foreign browser origin is rejected", async () => {
  const handler = handlerWith({ async listGenres() { return []; } });
  const response = await handler(new Request("https://project.supabase.co/api/genres", {
    headers: { Origin: "https://example.invalid" },
  }));

  if (response.status !== 403) throw new Error(`Expected 403, got ${response.status}`);
});

Deno.test("the public function prefix and direct local path both route", async () => {
  let calls = 0;
  const handler = handlerWith({
    async listGenres() {
      calls += 1;
      return [];
    },
  });

  const functionUrl = await handler(new Request(
    "https://project.supabase.co/functions/v1/rewind-api/api/genres",
  ));
  const directUrl = await handler(new Request("http://localhost:8000/api/genres"));

  if (functionUrl.status !== 200 || directUrl.status !== 200 || calls !== 2) {
    throw new Error("Both API path forms must reach the existing endpoint");
  }
});

Deno.test("unknown routes stay closed and unsupported methods return 405", async () => {
  const handler = handlerWith({ async listGenres() { return []; } });
  const unknown = await handler(new Request("http://localhost:8000/api/admin/users"));
  const wrongMethod = await handler(new Request("http://localhost:8000/api/genres", {
    method: "POST",
  }));

  if (unknown.status !== 404) throw new Error(`Expected 404, got ${unknown.status}`);
  if (wrongMethod.status !== 405) throw new Error(`Expected 405, got ${wrongMethod.status}`);
});

Deno.test("movie search keeps the paginated API response and clamps page size", async () => {
  const handler = handlerWith({
    async searchMovies(params) {
      return {
        content: [{ id: 12, title: params.q ?? "Example", releaseDate: "2024-01-01", rating: 4.5, photoUrl: null }],
        totalPages: 1,
        totalElements: 1,
        number: params.page,
      };
    },
  });
  const response = await handler(new Request("https://project.supabase.co/functions/v1/rewind-api/api/movies/search?q=Example&page=2&size=500"));
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  const body = await response.json();
  if (body.content[0].title !== "Example" || body.number !== 2 || body.totalElements !== 1) {
    throw new Error(`Unexpected page response: ${JSON.stringify(body)}`);
  }
});

Deno.test("movie search rejects malformed numeric filters", async () => {
  const handler = handlerWith({});
  const response = await handler(new Request("https://project.supabase.co/api/movies/search?genreId=abc"));
  if (response.status !== 400) throw new Error(`Expected 400, got ${response.status}`);
});

Deno.test("movie detail returns the public fields and null user flags", async () => {
  const handler = handlerWith({
    async getMovieDetails(id) {
      return {
        id, imdbId: null, tmdbId: null, title: "Comedy Film", durationMinutes: null,
        releaseDate: "2024-01-10", ageRating: null, rating: 4.5, shortPlot: null,
        photoUrl: "https://example.invalid/poster.jpg", backdropUrl: null, trailerUrl: null,
        genres: [{ id: 4, name: "Comedy" }], directors: [], producers: [], actors: [],
        externalRatings: [], similarMovies: [], myFlags: null,
      };
    },
  });
  const response = await handler(new Request("https://project.supabase.co/functions/v1/rewind-api/api/movies/101/details"));
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  const body = await response.json();
  if (body.id !== 101 || body.title !== "Comedy Film" || body.myFlags !== null || body.genres[0].name !== "Comedy") {
    throw new Error(`Unexpected movie detail response: ${JSON.stringify(body)}`);
  }
});

Deno.test("actor and director filmography routes return catalog-only data", async () => {
  const handler = handlerWith({
    async getPersonFilmography(type, id, genreId, sort) {
      if (id !== 383 || genreId !== 17 || sort !== "title") throw new Error("Unexpected filters");
      return {
        id,
        name: "Example Person",
        photoUrl: null,
        type,
        films: [{ id: 33, title: "Send Help", releaseDate: "2026-01-30", rating: 4.8, photoUrl: null, characterName: type === "ACTOR" ? "Character" : null }],
      };
    },
  });
  for (const [path, type] of [["actors", "ACTOR"], ["directors", "DIRECTOR"]] as const) {
    const response = await handler(new Request(`https://project.supabase.co/functions/v1/rewind-api/api/${path}/383?genreId=17&sort=title`));
    const body = await response.json();
    if (response.status !== 200 || body.type !== type || body.films[0].id !== 33) {
      throw new Error(`Unexpected ${path} response: ${JSON.stringify(body)}`);
    }
  }
});

Deno.test("person filmography rejects invalid IDs/filters and does not expose producers", async () => {
  const handler = handlerWith({});
  for (const [url, expected] of [
    ["http://localhost:8000/api/actors/nope", 400],
    ["http://localhost:8000/api/directors/1?genreId=bad", 400],
    ["http://localhost:8000/api/producers/1", 404],
  ] as const) {
    const response = await handler(new Request(url));
    if (response.status !== expected) throw new Error(`Expected ${expected} for ${url}, got ${response.status}`);
  }
});
