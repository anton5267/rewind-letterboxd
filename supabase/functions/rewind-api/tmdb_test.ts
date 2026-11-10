import { discoverTmdbMovies, fetchTmdbMovie, mapTmdbMovie, searchTmdbMovies, TmdbError } from "./tmdb.ts";
function assertEquals(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
async function assertTmdbError(run: () => Promise<unknown>, message: string) {
  try { await run(); } catch (error) {
    if (error instanceof TmdbError && error.message.includes(message)) return;
    throw error;
  }
  throw new Error(`Expected TMDB error containing ${message}`);
}

Deno.test("TMDB mapper keeps image, credit, trailer, rating, and similar contracts", () => {
  const movie = mapTmdbMovie({
    id: 20, title: "Film", release_date: "2024-01-02", runtime: 123, overview: "Plot",
    poster_path: "/poster.jpg", backdrop_path: "/backdrop.jpg", vote_average: 8.2, vote_count: 240,
    external_ids: { imdb_id: "tt20" }, genres: [{ id: 7, name: "Drama" }],
    credits: {
      cast: [{ id: 1, name: "Actor", profile_path: "/actor.jpg", character: "Lead", order: 0 }],
      crew: [{ id: 2, name: "Director", job: "Director" }, { id: 3, name: "Producer", job: "Executive Producer" }],
    },
    videos: { results: [
      { site: "YouTube", type: "Trailer", key: "teaser", official: false },
      { site: "YouTube", type: "Trailer", key: "official trailer", official: true },
    ] },
    similar: { results: [{ id: 21 }, { id: 20 }, { id: 21 }] },
  });
  assertEquals(movie.tmdbId, 20);
  assertEquals(movie.posterUrl, "https://image.tmdb.org/t/p/w500/poster.jpg");
  assertEquals(movie.backdropUrl, "https://image.tmdb.org/t/p/original/backdrop.jpg");
  assertEquals(movie.cast[0]?.characterName, "Lead");
  assertEquals(movie.directors.map((x) => x.tmdbId), [2]);
  assertEquals(movie.producers.map((x) => x.tmdbId), [3]);
  assertEquals(movie.trailerUrl, "https://www.youtube.com/watch?v=official%20trailer");
  assertEquals(movie.similarTmdbIds, [21]);
});

Deno.test("TMDB movie fetch requires a server key and maps provider errors", async () => {
  await assertTmdbError(() => fetchTmdbMovie(1, undefined, fetch), "disabled");
  await assertTmdbError(() => fetchTmdbMovie(1, "secret", async () => new Response("", { status: 404 })), "not found");
  const movie = await fetchTmdbMovie(5, "fixture", async (input) => {
    const url = new URL(String(input));
    assertEquals(url.searchParams.get("api_key"), "fixture");
    assertEquals(url.searchParams.get("append_to_response"), "credits,videos,similar,external_ids");
    return Response.json({ id: 5, title: "Fetched" });
  });
  assertEquals(movie.title, "Fetched");
});

Deno.test("TMDB discovery preserves supported filters and caps unique IDs", async () => {
  const discovery = await discoverTmdbMovies({ page: 2, year: 2020, genreId: 18, minRating: 7.5, limit: 2 }, "fixture", async (input) => {
    const url = new URL(String(input));
    assertEquals(url.searchParams.get("page"), "2");
    assertEquals(url.searchParams.get("primary_release_year"), "2020");
    assertEquals(url.searchParams.get("with_genres"), "18");
    assertEquals(url.searchParams.get("vote_average.gte"), "7.5");
    return Response.json({ page: 2, total_pages: 8, total_results: 4, results: [{ id: 3 }, { id: 3 }, { id: 4 }, { id: 5 }] });
  });
  assertEquals(discovery, { page: 2, totalPages: 8, totalResults: 4, tmdbIds: [3, 4] });
});

Deno.test("TMDB title search returns bounded explicit candidates and applies year", async () => {
  const candidates = await searchTmdbMovies("Alien", 1979, "fixture", async (input) => {
    const url = new URL(String(input));
    assertEquals(url.pathname, "/3/search/movie");
    assertEquals(url.searchParams.get("query"), "Alien");
    assertEquals(url.searchParams.get("primary_release_year"), "1979");
    assertEquals(url.searchParams.get("include_adult"), "false");
    assertEquals(url.searchParams.get("api_key"), "fixture");
    return Response.json({ results: [
      { id: 1, title: "Alien", release_date: "1979-05-25", overview: "Sci-fi", poster_path: "/alien.jpg" },
      { id: 2, title: "Alien 3", release_date: "1992-05-22" },
      ...Array.from({ length: 10 }, (_, index) => ({ id: index + 3, title: `Candidate ${index}` })),
      { title: "Invalid result" },
    ] });
  });
  assertEquals(candidates.length, 8);
  assertEquals(candidates[0], { tmdbId: 1, title: "Alien", releaseDate: "1979-05-25", overview: "Sci-fi", posterUrl: "https://image.tmdb.org/t/p/w185/alien.jpg" });
});

Deno.test("TMDB title search rejects short queries and requires the server key", async () => {
  await assertTmdbError(() => searchTmdbMovies("x", null, "fixture"), "Invalid movie search");
  await assertTmdbError(() => searchTmdbMovies("Alien", null, undefined), "disabled");
});
