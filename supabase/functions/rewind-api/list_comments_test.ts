import { createRewindApiHandler } from "./handler.ts";
import type { RewindApiRepository } from "./contracts/repository.ts";
import { parseCreateMyList, parseUpdateMyList } from "./http/parsers/lists.ts";

const empty = { content: [], number: 0, totalPages: 0, totalElements: 0 };
const base: RewindApiRepository = {
  async listGenres() { return []; },
  async searchMovies() { return empty; },
  async getMovieDetails() { return null; },
  async searchPeople() { return empty; },
  async getPersonFilmography() { return null; },
};
function serve(extra: Partial<RewindApiRepository>) {
  return createRewindApiHandler({ ...base, ...extra }, [], {
    async verifyAccessToken(token) {
      return { id: "actor-7", email: "fixture@example.invalid", username: "fixture", emailConfirmed: token === "confirmed" };
    },
  });
}
function request(path: string, method = "GET", body?: unknown, token = "confirmed") {
  return new Request(`https://project.supabase.co/api${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

Deno.test("list reply overrides preserve omission, validate enums and allow explicit inheritance", () => {
  const original = { name: "List", movieIds: [5] };
  equal(Object.hasOwn(parseCreateMyList(original)!, "replyPreference"), false);
  equal(parseUpdateMyList({ name: "Changed", role: "ADMIN" }), { name: "Changed" });
  for (const replyPreference of [null, "ANYONE", "FOLLOWED", "SELF"]) {
    equal(parseCreateMyList({ ...original, replyPreference })?.replyPreference, replyPreference);
    equal(parseUpdateMyList({ replyPreference }), { replyPreference });
  }
  for (const replyPreference of ["", "anyone", "DEFAULT", false, 7, [], {}]) {
    equal(parseCreateMyList({ ...original, replyPreference }), null);
    equal(parseUpdateMyList({ replyPreference }), null);
  }
});

for (const kind of ["list", "review"] as const) {
  Deno.test(`${kind} comment routing keeps pagination, confirmed identity and generic CRUD`, async () => {
    const path = kind === "list" ? "/lists/public/8/comments" : "/reviews/8/comments";
    const item = { id: 20, reviewId: kind === "review" ? 8 : null, ...(kind === "list" ? { listId: 8 } : {}), userId: 7, username: "fixture", userAvatarUrl: null, text: "Reply", createdAt: "now", updatedAt: "now" };
    const calls: unknown[] = [];
    const load = (id: number, page: number, size: number) => { calls.push([id, page, size]); return Promise.resolve({ ...empty, content: [item] }); };
    const create: NonNullable<RewindApiRepository["createListComment"]> = (actor, id, text) => {
      calls.push([actor.id, id, text]); return Promise.resolve(item);
    };
    const api = serve({
      ...(kind === "list" ? { getListComments: load, createListComment: create } : { getReviewComments: load, createReviewComment: create }),
      async updateReviewComment(actor, id, text) { calls.push([actor.id, id, text]); return { ...item, text }; },
      async deleteReviewComment(actor, id) { calls.push([actor.id, id]); return "OK"; },
    });
    equal((await api(request(`${path}?page=-1&size=999`))).status, 200);
    equal(await (await api(request(path, "POST", { text: "Reply", userId: 999 }))).json(), item);
    equal((await (await api(request("/comments/20", "PATCH", { text: "Edited", listId: 999 }))).json()).text, "Edited");
    equal((await api(request("/comments/20", "DELETE"))).status, 204);
    equal(calls, [[8, 0, 50], ["actor-7", 8, "Reply"], ["actor-7", 20, "Edited"], ["actor-7", 20]]);
    const denied = await api(request(path, "PUT", {}));
    equal(denied.status, 405); equal(denied.headers.get("Allow"), "GET, POST, OPTIONS");
  });
}

Deno.test("list comment rejection distinguishes forbidden, missing, invalid and unconfirmed requests", async () => {
  let calls = 0;
  const api = serve({ async createListComment(_actor, id) { calls++; return id === 8 ? "FORBIDDEN" : null; } });
  equal((await api(request("/lists/public/8/comments", "POST", { text: "Reply" }))).status, 403);
  equal((await api(request("/lists/public/9/comments", "POST", { text: "Reply" }))).status, 404);
  equal((await api(request("/lists/public/8/comments", "POST", { text: " " }))).status, 400);
  equal((await api(request("/lists/public/8/comments", "POST", { text: "Reply" }, "unconfirmed"))).status, 401);
  equal((await api(request("/lists/public/0/comments"))).status, 400);
  equal(calls, 2);
});

Deno.test("existing list endpoints forward nullable overrides without changing their contracts", async () => {
  const updates: unknown[] = [];
  const api = serve({
    async createMyList(_actor, body) { updates.push(body.replyPreference); return { id: 8, ...body, listType: "CUSTOM", tags: [] }; },
    async updateMyList(_actor, _id, body) { updates.push(body); return { id: 8, name: "List", description: null, isPublic: true, listType: "CUSTOM", tags: [], replyPreference: body.replyPreference }; },
  });
  equal((await api(request("/lists", "POST", { name: "List", movieIds: [5], replyPreference: "SELF" }))).status, 200);
  equal((await api(request("/lists/8", "PATCH", { replyPreference: null }))).status, 200);
  equal((await api(request("/lists/8", "PATCH", { name: "Changed" }))).status, 200);
  equal(updates, ["SELF", { replyPreference: null }, { name: "Changed" }]);
});
