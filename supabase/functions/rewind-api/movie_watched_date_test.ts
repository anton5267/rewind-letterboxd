import { createRewindApiHandler } from "./handler.ts";
import type { RewindApiRepository } from "./contracts/repository.ts";

const movieId = 35;
const repository: Partial<RewindApiRepository> = {
  async getMyWatchedDate(_user, id) { return id === movieId ? "2025-12-18" : null; },
  async setMyWatchedDate(_user, id, date) { if (id !== movieId || date !== "2025-12-19") throw new Error("Unexpected watched date write"); },
};
const handler = createRewindApiHandler({
  listGenres: async () => [], searchMovies: async () => ({ content: [], totalPages: 0, totalElements: 0, number: 0 }),
  getMovieDetails: async () => null, searchPeople: async () => ({ content: [], totalPages: 0, totalElements: 0, number: 0 }),
  getPersonFilmography: async () => null, ...repository,
}, [], { async verifyAccessToken(token) {
  if (token !== "member") return null;
  return { id: "member", email: "member@example.test", emailConfirmed: true, username: "member" };
} });

Deno.test("watched-date GET reads the member date and PUT saves a valid calendar date", async () => {
  const headers = { Authorization: "Bearer member", "Content-Type": "application/json" };
  const read = await handler(new Request(`https://project.supabase.co/api/movies/${movieId}/watched-date`, { headers }));
  const saved = await handler(new Request(`https://project.supabase.co/api/movies/${movieId}/watched-date`, { method: "PUT", headers, body: JSON.stringify({ watchedOn: "2025-12-19" }) }));
  if (read.status !== 200 || (await read.json()).watchedOn !== "2025-12-18" || saved.status !== 204) {
    throw new Error(`Unexpected watched-date responses: ${read.status}/${saved.status}`);
  }
});

Deno.test("watched-date route requires confirmed authentication and rejects invalid dates and methods", async () => {
  const url = `https://project.supabase.co/api/movies/${movieId}/watched-date`;
  const unauthenticated = await handler(new Request(url));
  const invalidCalendarDate = await handler(new Request(url, { method: "PUT", headers: { Authorization: "Bearer member", "Content-Type": "application/json" }, body: JSON.stringify({ watchedOn: "2025-02-30" }) }));
  const malformedDate = await handler(new Request(url, { method: "PUT", headers: { Authorization: "Bearer member", "Content-Type": "application/json" }, body: JSON.stringify({ watchedOn: "18.12.2025" }) }));
  const invalidId = await handler(new Request("https://project.supabase.co/api/movies/0/watched-date"));
  const invalidMethod = await handler(new Request(url, { method: "DELETE", headers: { Authorization: "Bearer member" } }));
  if (unauthenticated.status !== 401 || invalidCalendarDate.status !== 400 || malformedDate.status !== 400
    || invalidId.status !== 400 || invalidMethod.status !== 405 || invalidMethod.headers.get("Allow") !== "GET, PUT, OPTIONS") {
    throw new Error(`Watched-date validation/authentication failed: ${JSON.stringify([unauthenticated.status, invalidCalendarDate.status, malformedDate.status, invalidId.status, invalidMethod.status])}`);
  }
});
