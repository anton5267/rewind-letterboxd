import { createRewindApiHandler, RewindApiError, type RewindApiRepository } from "./handler.ts";
import type { MovieDetailsResponse } from "./contracts/catalog.ts";

function handlerWith(overrides: Partial<RewindApiRepository> = {}) {
  return createRewindApiHandler({
    listGenres: async () => [],
    searchMovies: async () => ({ content: [], totalPages: 0, totalElements: 0, number: 0 }),
    getMovieDetails: async () => null,
    searchPeople: async () => ({ content: [], totalPages: 0, totalElements: 0, number: 0 }),
    getPersonFilmography: async () => null,
    ...overrides,
  }, ["https://anton5267.github.io"], {
    async verifyAccessToken(token) {
      if (!["admin", "member", "unconfirmed"].includes(token)) return null;
      return { id: token, email: `${token}@example.test`, emailConfirmed: token !== "unconfirmed", username: token };
    },
  });
}

const details: MovieDetailsResponse = {
  id: 51, title: "Unpublished film", imdbId: null, tmdbId: null, originalLanguage: "uk",
  shortPlot: null, photoUrl: null, backdropUrl: null, releaseDate: null, durationMinutes: null,
  ageRating: null, rating: null, trailerUrl: null, genres: [], actors: [], directors: [],
  producers: [], externalRatings: [], similarMovies: [], myFlags: null,
};

Deno.test("protected movie details requires confirmed Auth and propagates the repository Admin guard", async () => {
  const calls: string[] = [];
  const handler = handlerWith({
    async getAdminMovieDetails(user) {
      calls.push(user.id);
      if (user.id !== "admin") throw new RewindApiError(403, "Administrator access required");
      return details;
    },
  });
  for (const [token, expected] of [["", 401], ["invalid", 401], ["unconfirmed", 401], ["member", 403], ["admin", 200]] as const) {
    const response = await handler(new Request("https://project.supabase.co/api/admin/movies/51", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }));
    if (response.status !== expected || response.headers.get("Cache-Control") !== "no-store") {
      throw new Error(`Unexpected protected detail result for ${token}: ${response.status}`);
    }
    if (expected === 200 && JSON.stringify(await response.json()) !== JSON.stringify(details)) {
      throw new Error("Protected detail response changed the existing movie shape");
    }
  }
  if (JSON.stringify(calls) !== JSON.stringify(["member", "admin"])) throw new Error("Unverified caller reached the repository");
  const publicResponse = await handler(new Request("https://project.supabase.co/api/movies/51/details?includeUnpublished=true", {
    headers: { Authorization: "Bearer admin" },
  }));
  if (publicResponse.status !== 404) throw new Error("Public details must retain its publication boundary");
});

Deno.test("protected movie details validates route IDs and preserves not-found and method responses", async () => {
  let reads = 0;
  const handler = handlerWith({ getAdminMovieDetails: async () => { reads++; return null; } });
  const headers = { Authorization: "Bearer admin" };
  for (const id of ["0", "9007199254740992"]) {
    const response = await handler(new Request(`https://project.supabase.co/api/admin/movies/${id}`, { headers }));
    if (response.status !== 400) throw new Error("Invalid movie ID reached protected read");
  }
  const missing = await handler(new Request("https://project.supabase.co/api/admin/movies/404", { headers }));
  const unavailable = await handlerWith()(new Request("https://project.supabase.co/api/admin/movies/51", { headers }));
  const method = await handler(new Request("https://project.supabase.co/api/admin/movies/51", { method: "PATCH", headers }));
  if (missing.status !== 404 || unavailable.status !== 404 || method.status !== 405
    || method.headers.get("Allow") !== "GET, PUT, DELETE, OPTIONS" || reads !== 1) {
    throw new Error("Protected detail routing changed missing/invalid/method behavior");
  }
});
