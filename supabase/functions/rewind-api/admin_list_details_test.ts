import { createRewindApiHandler, RewindApiError, type RewindApiRepository } from "./handler.ts";

const details = {
  id: 23,
  userId: 71,
  username: "film-oracle",
  email: "oracle@example.test",
  ownerIsActive: true,
  name: "Nolan films",
  description: "A list description",
  listType: "CUSTOM" as const,
  isPublic: true,
  itemCount: 1,
  createdAt: "2025-12-02T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
  featuredPosition: null,
  featuredCategory: null,
  likeCount: 12,
  reportCount: 3,
  report: { id: 91, reason: "SPAM" as const, createdAt: "2026-11-20T10:00:00.000Z" },
  films: [{ id: 8, title: "Oppenheimer", releaseDate: "2023-07-21", rating: 4.5, photoUrl: "/poster.jpg" }],
  history: [{ id: 3, adminId: 42, action: "LIST_UPDATED", targetType: "LIST", targetId: 23, metadata: "name changed", createdAt: "2026-11-21T10:00:00.000Z" }],
};

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

Deno.test("Admin list detail returns source fields and requires confirmed auth", async () => {
  const calls: unknown[][] = [];
  const repository: Partial<RewindApiRepository> = {
    async getAdminListDetails(user, id, reportId) {
      calls.push([user.id, id, reportId]);
      if (user.id !== "admin") throw new RewindApiError(403, "Administrator access required");
      return details;
    },
  };
  const handler = handlerWith(repository);
  const url = "https://project.supabase.co/api/admin/lists/23?reportId=91";
  for (const [token, status] of [["", 401], ["unconfirmed", 401], ["member", 403], ["admin", 200]] as const) {
    const response = await handler(new Request(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} }));
    if (response.status !== status || response.headers.get("Cache-Control") !== "no-store") {
      throw new Error(`Unexpected list-detail response for ${token}: ${response.status}`);
    }
    if (status === 200 && JSON.stringify(await response.json()) !== JSON.stringify(details)) {
      throw new Error("Admin list detail omitted source data or report metadata");
    }
  }
  if (JSON.stringify(calls) !== JSON.stringify([["member", 23, 91], ["admin", 23, 91]])) {
    throw new Error(`Unconfirmed callers reached the repository: ${JSON.stringify(calls)}`);
  }
});

Deno.test("Admin list detail validates IDs, report ID, methods, and missing data", async () => {
  let reads = 0;
  const handler = handlerWith({ getAdminListDetails: async (_user, _id, reportId) => { reads++; return reportId === 404 ? null : details; } });
  const headers = { Authorization: "Bearer admin" };
  for (const id of ["0", "9007199254740992"]) {
    const response = await handler(new Request(`https://project.supabase.co/api/admin/lists/${id}`, { headers }));
    if (response.status !== 400) throw new Error(`Invalid list ID ${id} was accepted`);
  }
  const valid = await handler(new Request("https://project.supabase.co/api/admin/lists/23?reportId=91", { headers }));
  const badReportId = await handler(new Request("https://project.supabase.co/api/admin/lists/23?reportId=bad", { headers }));
  const missing = await handler(new Request("https://project.supabase.co/api/admin/lists/23?reportId=404", { headers }));
  const unavailable = await handlerWith()(new Request("https://project.supabase.co/api/admin/lists/23", { headers }));
  const method = await handler(new Request("https://project.supabase.co/api/admin/lists/23", { method: "POST", headers }));
  if (valid.status !== 200 || badReportId.status !== 400 || missing.status !== 404 || unavailable.status !== 404
    || method.status !== 405 || method.headers.get("Allow") !== "GET, PATCH, DELETE, OPTIONS" || reads !== 2) {
    throw new Error(`Invalid list-detail behavior: ${JSON.stringify({ valid: valid.status, badReportId: badReportId.status, missing: missing.status, unavailable: unavailable.status, method: method.status, reads })}`);
  }
});

Deno.test("Admin list text update validates fields and returns the saved detail", async () => {
  const calls: unknown[][] = [];
  const handler = handlerWith({
    async updateAdminListDetails(user, id, update) {
      calls.push([user.id, id, update]);
      return { ...details, ...update };
    },
  });
  const headers = { Authorization: "Bearer admin", "Content-Type": "application/json" };
  const valid = await handler(new Request("https://project.supabase.co/api/admin/lists/23", {
    method: "PATCH", headers, body: JSON.stringify({ name: "New title", description: null }),
  }));
  const validBody = await valid.json();
  const badName = await handler(new Request("https://project.supabase.co/api/admin/lists/23", {
    method: "PATCH", headers, body: JSON.stringify({ name: " " }),
  }));
  const unknownField = await handler(new Request("https://project.supabase.co/api/admin/lists/23", {
    method: "PATCH", headers, body: JSON.stringify({ isPublic: false }),
  }));
  if (valid.status !== 200 || validBody.name !== "New title" || validBody.description !== null
    || badName.status !== 400 || unknownField.status !== 400
    || JSON.stringify(calls) !== JSON.stringify([["admin", 23, { name: "New title", description: null }]])) {
    throw new Error("Admin list text update contract failed");
  }
});

Deno.test("Admin list film addition validates movie IDs and reports repository conflicts", async () => {
  const calls: unknown[][] = [];
  const handler = handlerWith({
    async addAdminListMovie(user, listId, movieId) {
      calls.push([user.id, listId, movieId]);
      if (movieId === 9) return "DUPLICATE";
      if (movieId === 10) return "UNPUBLISHED";
      if (movieId === 11) return "SYSTEM_LIST";
      if (movieId === 12) return "NOT_FOUND";
      return details;
    },
  });
  const headers = { Authorization: "Bearer admin", "Content-Type": "application/json" };
  const success = await handler(new Request("https://project.supabase.co/api/admin/lists/23/items", {
    method: "POST", headers, body: JSON.stringify({ movieId: 8 }),
  }));
  const duplicate = await handler(new Request("https://project.supabase.co/api/admin/lists/23/items", {
    method: "POST", headers, body: JSON.stringify({ movieId: 9 }),
  }));
  const unpublished = await handler(new Request("https://project.supabase.co/api/admin/lists/23/items", {
    method: "POST", headers, body: JSON.stringify({ movieId: 10 }),
  }));
  const systemList = await handler(new Request("https://project.supabase.co/api/admin/lists/23/items", {
    method: "POST", headers, body: JSON.stringify({ movieId: 11 }),
  }));
  const missing = await handler(new Request("https://project.supabase.co/api/admin/lists/23/items", {
    method: "POST", headers, body: JSON.stringify({ movieId: 12 }),
  }));
  const invalid = await handler(new Request("https://project.supabase.co/api/admin/lists/23/items", {
    method: "POST", headers, body: JSON.stringify({ movieId: 8, position: 1 }),
  }));
  if (success.status !== 200 || duplicate.status !== 409 || unpublished.status !== 409
    || systemList.status !== 400 || missing.status !== 404 || invalid.status !== 400
    || JSON.stringify(calls) !== JSON.stringify([["admin", 23, 8], ["admin", 23, 9], ["admin", 23, 10], ["admin", 23, 11], ["admin", 23, 12]])) {
    throw new Error(`Unexpected add-list-film contract: ${JSON.stringify({ success: success.status, duplicate: duplicate.status, unpublished: unpublished.status, systemList: systemList.status, missing: missing.status, invalid: invalid.status, calls })}`);
  }
});
