import { listItemOrder } from "./repositories/shared/list_order.ts";
import { moveOwnedFavorite } from "./repositories/shared/profile_favorite_order.ts";
import { createRewindApiHandler, type RewindApiRepository } from "./handler.ts";
import { RewindApiError } from "./http/errors.ts";
import type { FavoriteMoveRequest } from "./contracts/profile.ts";

function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
const move: FavoriteMoveRequest = { movieId: 101, targetMovieId: 103, placement: "after", expectedUserId: 7 };

function fixture(listExists = true) {
  let rows = [
    { id: "17", movie_id: "101", is_published: true },
    { id: "18", movie_id: "102", is_published: true },
    { id: "23", movie_id: "109", is_published: false },
    { id: "19", movie_id: "103", is_published: true },
    { id: "20", movie_id: "104", is_published: true },
  ];
  const calls: { text: string; args: unknown[] }[] = [];
  const connection = {
    async queryObject(query: { text: string; args: unknown[] }) {
      calls.push(query);
      if (query.text.startsWith("SELECT id::text")) return { rows: listExists ? [{ id: "4" }] : [] };
      if (query.text.startsWith("SELECT i.id::text")) return { rows };
      const ids = query.args[0] as number[];
      rows = ids.map(id => rows.find(row => Number(row.id) === id)!);
      return { rows: [] };
    },
  } as unknown as Parameters<typeof moveOwnedFavorite>[0];
  return { connection, calls };
}

Deno.test("favorite ordering preserves legacy latest-first fallback and custom-list order", () => {
  equal(listItemOrder("FAVORITES", "i"), "i.position ASC NULLS LAST, i.added_at DESC, i.id DESC");
  equal(listItemOrder("CUSTOM", "li"), "li.position ASC NULLS LAST, li.id ASC");
});

Deno.test("favorite move locks its mapped owner snapshot, preserves hidden/trailing items and is idempotent", async () => {
  const { connection, calls } = fixture();
  equal(await moveOwnedFavorite(connection, 7, move), true);
  equal(calls[0].args, [7]);
  equal(calls[0].text.endsWith("FOR UPDATE"), true);
  equal(calls[1].text.endsWith("FOR UPDATE OF i"), true);
  equal(calls[2].args, [[18, 23, 19, 17, 20], 4]);
  equal(await moveOwnedFavorite(connection, 7, move), true);
  equal(calls[5].args, [[18, 23, 19, 17, 20], 4]);
  equal(await moveOwnedFavorite(connection, 7, { ...move, placement: "before" }), true);
  equal(calls[8].args, [[18, 23, 17, 19, 20], 4]);
});

Deno.test("favorite move rejects viewer changes before SQL and unavailable or hidden endpoints before writes", async () => {
  const changed = fixture();
  let status = 0;
  try { await moveOwnedFavorite(changed.connection, 6, move); }
  catch (error) { status = (error as RewindApiError).status; }
  equal(status, 409);
  equal(changed.calls.length, 0);
  for (const targetMovieId of [109, 999]) {
    const state = fixture();
    equal(await moveOwnedFavorite(state.connection, 7, { ...move, targetMovieId }), false);
    equal(state.calls.length, 2);
  }
  const hiddenSource = fixture();
  equal(await moveOwnedFavorite(hiddenSource.connection, 7, { ...move, movieId: 109 }), false);
  const missing = fixture(false);
  equal(await moveOwnedFavorite(missing.connection, 7, move), false);
  equal(missing.calls.length, 1);
});

Deno.test("favorite move HTTP requires confirmed identity, positive numeric IDs and an explicit expected viewer", async () => {
  const empty = { content: [], totalPages: 0, totalElements: 0, number: 0 };
  const calls: unknown[] = [];
  const repository: RewindApiRepository = {
    async listGenres() { return []; }, async searchMovies() { return empty; },
    async getMovieDetails() { return null; }, async searchPeople() { return empty; },
    async getPersonFilmography() { return null; },
    async moveMyFavorite(actor, request) {
      calls.push([actor.id, request]);
      if (request.expectedUserId !== 7) throw new RewindApiError(409, "The current account changed");
      return request.movieId !== 999;
    },
  };
  const handler = createRewindApiHandler(repository, [], {
    async verifyAccessToken(token) { return { id: "auth-7", email: "fixture@example.invalid", username: "reader", emailConfirmed: token === "confirmed" }; },
  });
  const request = (body: unknown, token = "confirmed", method = "PUT") => new Request("https://project.supabase.co/api/profile/me/favorites/order", {
    method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(method === "PUT" ? { body: JSON.stringify(body) } : {}),
  });
  equal((await handler(request(move))).status, 204);
  equal((await handler(request(move, "unconfirmed"))).status, 401);
  equal((await handler(request(move, "confirmed", "GET"))).status, 405);
  for (const body of [null, [], {}, { ...move, expectedUserId: undefined }, { ...move, movieId: "101" }, { ...move, targetMovieId: 101 }, { ...move, placement: "sideways" }]) {
    equal((await handler(request(body))).status, 400);
  }
  equal((await handler(request({ ...move, expectedUserId: 6 }))).status, 409);
  equal((await handler(request({ ...move, movieId: 999 }))).status, 404);
  equal(calls.length, 3);
});
