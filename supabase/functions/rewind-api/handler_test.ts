import { createRewindApiHandler, RewindApiError, type AdminJournalArticleRequest, type RewindApiRepository, type RewindAuthVerifier } from "./handler.ts";

const pagesOrigin = "https://anton5267.github.io";

function handlerWith(repository: Partial<RewindApiRepository>) {
  return createRewindApiHandler({
    listGenres: async () => [],
    searchMovies: async (params) => ({ content: [], totalPages: 0, totalElements: 0, number: params.page }),
    getMovieDetails: async () => null,
    searchPeople: async (params) => ({ content: [], totalPages: 0, totalElements: 0, number: params.page }),
    getPersonFilmography: async () => null,
    ...repository,
  }, [pagesOrigin, "http://localhost:5173"]);
}

function authHandler(overrides: Partial<RewindApiRepository> = {}, valid = true, confirmed = true, authOverrides: Partial<RewindAuthVerifier> = {}) {
  return createRewindApiHandler({
    listGenres: async () => [],
    searchMovies: async (params) => ({ content: [], totalPages: 0, totalElements: 0, number: params.page }),
    getMovieDetails: async () => null,
    searchPeople: async (params) => ({ content: [], totalPages: 0, totalElements: 0, number: params.page }),
    getPersonFilmography: async () => null,
    getOrCreateCurrentUser: async () => ({ id: 42, username: "cinephile", role: "USER", avatarUrl: null }),
    getMyRating: async () => null,
    setMyRating: async () => undefined,
    deleteMyRating: async () => undefined,
    getMyMovieStatus: async () => ({ inWatchlist: false, watched: false, favorite: false, myRating: null }),
    setMyMovieFlag: async () => undefined,
    deleteMyMovieFlag: async () => undefined,
    ...overrides,
  }, [pagesOrigin], {
    async verifyAccessToken(token) {
      if (!valid || token !== "valid-token") return null;
      return { id: "supabase-uuid", email: "person@example.test", emailConfirmed: confirmed, username: "cinephile" };
    },
    ...authOverrides,
  });
}

Deno.test("GET /api/users/me verifies bearer token and returns REWIND profile shape", async () => {
  const handler = authHandler();
  const response = await handler(new Request("https://project.supabase.co/api/users/me", {
    headers: { Origin: pagesOrigin, Authorization: "Bearer valid-token" },
  }));
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (response.headers.get("Cache-Control") !== "no-store") throw new Error("Account responses must not be cached");
  const body = await response.json();
  if (JSON.stringify(body) !== JSON.stringify({ id: 42, username: "cinephile", role: "USER", avatarUrl: null })) {
    throw new Error(`Unexpected account response: ${JSON.stringify(body)}`);
  }
});

Deno.test("GET /api/users/me rejects missing and invalid tokens", async () => {
  for (const [handler, headers] of [
    [authHandler(), {}],
    [authHandler({}, false), { Authorization: "Bearer invalid-token" }],
  ] as const) {
    const response = await handler(new Request("https://project.supabase.co/api/users/me", { headers }));
    if (response.status !== 401) throw new Error(`Expected 401, got ${response.status}`);
  }
});

Deno.test("GET /api/users/me requires confirmed email before creating a profile", async () => {
  let provisioned = false;
  const handler = authHandler({
    async getOrCreateCurrentUser() { provisioned = true; return { id: 1, username: "x", role: "USER", avatarUrl: null }; },
  }, true, false);
  const response = await handler(new Request("https://project.supabase.co/api/users/me", {
    headers: { Authorization: "Bearer valid-token" },
  }));
  if (response.status !== 401 || provisioned) throw new Error("Unconfirmed email must not provision a REWIND profile");
});

Deno.test("GET /api/users/me rejects an inactive REWIND account", async () => {
  const handler = authHandler({
    async getOrCreateCurrentUser() { throw new RewindApiError(403, "Account is inactive"); },
  });
  const response = await handler(new Request("https://project.supabase.co/api/users/me", {
    headers: { Authorization: "Bearer valid-token" },
  }));
  if (response.status !== 403) throw new Error(`Expected inactive account to return 403, got ${response.status}`);
});

Deno.test("review reports require authentication, validate reasons, preserve own report status, and populate the admin queue", async () => {
  const calls: unknown[] = [];
  const handler = authHandler({
    async getMyReviewReport(_user, reviewId) {
      calls.push(["status", reviewId]);
      return { reported: true, report: { id: 9, reason: "SPAM", createdAt: "2026-11-10T12:00:00Z" } };
    },
    async reportReview(_user, reviewId, reason) {
      calls.push(["report", reviewId, reason]);
      return { id: 9, reason, createdAt: "2026-11-10T12:00:00Z" };
    },
    async getAdminReportedReviews(_user, page, size) {
      calls.push(["admin-reports", page, size]);
      return { content: [{ id: 4, movieId: 7, movieTitle: "Film", userId: 3, username: "member", content: "Review",
        rating: 4, isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2026-11-08T12:00:00Z",
        reportId: 9, reportReason: "SPAM", reportCreatedAt: "2026-11-10T12:00:00Z", likesCount: 2, commentsCount: 1 }],
        totalPages: 1, totalElements: 1, number: page };
    },
  });
  const headers = { Authorization: "Bearer valid-token", "Content-Type": "application/json" };
  const unauthorized = await authHandler({})(new Request("https://project.supabase.co/api/reviews/4/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "SPAM" }) }));
  const status = await handler(new Request("https://project.supabase.co/api/reviews/4/report", { headers }));
  const invalid = await handler(new Request("https://project.supabase.co/api/reviews/4/report", { method: "POST", headers, body: JSON.stringify({ reason: "OTHER" }) }));
  const submitted = await handler(new Request("https://project.supabase.co/api/reviews/4/report", { method: "POST", headers, body: JSON.stringify({ reason: "BULLYING" }) }));
  const queue = await handler(new Request("https://project.supabase.co/api/admin/reported-reviews?page=2&size=100", { headers }));
  const deniedQueue = await authHandler({ async getAdminReportedReviews() { throw new RewindApiError(403, "Administrator access required"); } })(
    new Request("https://project.supabase.co/api/admin/reported-reviews", { headers }));
  if (unauthorized.status !== 401 || status.status !== 200 || !(await status.json()).reported
    || invalid.status !== 400 || submitted.status !== 200 || (await submitted.json()).reason !== "BULLYING"
    || queue.status !== 200 || (await queue.json()).content[0].commentsCount !== 1
    || deniedQueue.status !== 403 || JSON.stringify(calls) !== JSON.stringify([
      ["status", 4], ["report", 4, "BULLYING"], ["admin-reports", 2, 50],
    ])) {
    throw new Error(`Review report contract changed: ${JSON.stringify({ calls, statuses: [status.status, invalid.status, submitted.status, queue.status, deniedQueue.status] })}`);
  }
});

Deno.test("DELETE /api/profile/me verifies the current password before deleting", async () => {
  let verifiedUserId = "";
  let verifiedPassword = "";
  let deleted = false;
  let identityCleanupCalls = 0;
  const handler = authHandler({
    async deleteMyAccount(user) { deleted = true; return user.id === "supabase-uuid"; },
  }, true, true, {
    async verifyCurrentPassword(user, password) { verifiedUserId = user.id; verifiedPassword = password; },
    async processPendingIdentityDeletion() { identityCleanupCalls++; },
  });
  const response = await handler(new Request("https://project.supabase.co/api/profile/me", {
    method: "DELETE",
    headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword: "current-password" }),
  }));
  if (response.status !== 204 || verifiedUserId !== "supabase-uuid" || verifiedPassword !== "current-password" || !deleted || identityCleanupCalls !== 1) {
    throw new Error(`Account deletion order or result changed: status=${response.status}; verified=${verifiedUserId}; deleted=${deleted}; cleanup=${identityCleanupCalls}`);
  }
});

Deno.test("DELETE /api/profile/me preserves the account when server deletion credentials are missing", async () => {
  let cleanupCalls = 0;
  const handler = authHandler({
    async deleteMyAccount() { throw new RewindApiError(503, "Account deletion is not configured"); },
  }, true, true, {
    async verifyCurrentPassword() {},
    async processPendingIdentityDeletion() { cleanupCalls++; },
  });
  const response = await handler(new Request("https://project.supabase.co/api/profile/me", {
    method: "DELETE",
    headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword: "current-password" }),
  }));
  if (response.status !== 503 || cleanupCalls !== 0) {
    throw new Error(`Unconfigured deletion must return 503 without invoking identity cleanup; status=${response.status}; cleanup=${cleanupCalls}`);
  }
});

Deno.test("rating endpoints require a confirmed Supabase user and keep private responses uncached", async () => {
  const handler = authHandler({}, false);
  const response = await handler(new Request("https://project.supabase.co/api/movies/7/rating/me", {
    headers: { Authorization: "Bearer invalid-token" },
  }));
  if (response.status !== 401) throw new Error(`Expected 401, got ${response.status}`);
  if (response.headers.get("Cache-Control") !== "no-store") throw new Error("Private rating responses must not be cached");
});

Deno.test("GET /api/movies/:id/rating/me returns 204 when the user has not rated", async () => {
  const handler = authHandler();
  const response = await handler(new Request("https://project.supabase.co/api/movies/7/rating/me", {
    headers: { Authorization: "Bearer valid-token" },
  }));
  if (response.status !== 204) throw new Error(`Expected 204, got ${response.status}`);
});

Deno.test("movie status requires a confirmed user and returns the Spring API contract", async () => {
  const handler = authHandler({
    async getMyMovieStatus() { return { inWatchlist: true, watched: false, favorite: true, myRating: 4 }; },
  });
  const response = await handler(new Request("https://project.supabase.co/api/movies/7/status/me", {
    headers: { Authorization: "Bearer valid-token" },
  }));
  const body = await response.json();
  if (response.status !== 200 || JSON.stringify(body) !== JSON.stringify({
    inWatchlist: true, watched: false, favorite: true, myRating: 4,
  })) throw new Error(`Unexpected movie status response: ${JSON.stringify(body)}`);
});

Deno.test("GET /api/profile/me verifies identity and returns the private profile contract uncached", async () => {
  const profile = {
    id: 42, username: "cinephile", displayName: "Cinephile", email: "person@example.test",
    role: "USER", avatarUrl: null, supabaseLinked: true,
    stats: { ratings: 1, reviews: 0, watched: 2, watchlist: 3, favorites: 0 },
    lists: [{ id: 5, name: "Watchlist", listType: "WATCHLIST", isPublic: false }],
    recentRatings: [], recentReviews: [],
  };
  let requestedUser = "";
  const handler = authHandler({ async getMyProfile(user) { requestedUser = user.id; return profile; } });
  const response = await handler(new Request("https://project.supabase.co/api/profile/me", {
    headers: { Authorization: "Bearer valid-token" },
  }));
  const body = await response.json();
  if (response.status !== 200 || requestedUser !== "supabase-uuid"
    || response.headers.get("Cache-Control") !== "no-store"
    || JSON.stringify(body) !== JSON.stringify(profile)) {
    throw new Error(`Unexpected private profile response: ${JSON.stringify(body)}`);
  }
});

Deno.test("PATCH /api/profile/me validates and persists only profile fields", async () => {
  let update: { displayName?: string; avatarUrl?: string } | null = null;
  const profile = {
    id: 42, username: "cinephile", displayName: "New name", email: "person@example.test",
    role: "USER", avatarUrl: "https://example.test/avatar.png", supabaseLinked: true,
    stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
    lists: [], recentRatings: [], recentReviews: [],
  };
  const handler = authHandler({
    async updateMyProfile(_user, value) { update = value; },
    async getMyProfile() { return profile; },
  });
  const invalid = await handler(new Request("https://project.supabase.co/api/profile/me", {
    method: "PATCH", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ displayName: "x", avatarUrl: "javascript:alert(1)" }),
  }));
  if (invalid.status !== 400 || update !== null) throw new Error("Invalid profile content reached the repository");

  const valid = await handler(new Request("https://project.supabase.co/api/profile/me", {
    method: "PATCH", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ displayName: "New name", avatarUrl: "https://example.test/avatar.png", role: "ADMIN" }),
  }));
  const body = await valid.json();
  if (valid.status !== 200 || JSON.stringify(update) !== JSON.stringify({
    displayName: "New name", avatarUrl: "https://example.test/avatar.png",
  }) || body.role !== "USER") {
    throw new Error(`Unexpected profile update response: ${JSON.stringify(body)}`);
  }
});

Deno.test("PUT /api/profile/me/password reauthenticates and preserves the Spring response contract", async () => {
  let changed: [string, string, string] | null = null;
  const handler = createRewindApiHandler({
    listGenres: async () => [],
    searchMovies: async (params) => ({ content: [], totalPages: 0, totalElements: 0, number: params.page }),
    getMovieDetails: async () => null,
    searchPeople: async (params) => ({ content: [], totalPages: 0, totalElements: 0, number: params.page }),
    getPersonFilmography: async () => null,
  }, [pagesOrigin], {
    async verifyAccessToken(token) {
      return token === "valid-token"
        ? { id: "supabase-uuid", email: "person@example.test", emailConfirmed: true, username: "cinephile" }
        : null;
    },
    async changePassword(user, currentPassword, newPassword) {
      changed = [user.id, currentPassword, newPassword];
    },
  });

  const invalid = await handler(new Request("https://project.supabase.co/api/profile/me/password", {
    method: "PUT", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword: "old", newPassword: "short" }),
  }));
  if (invalid.status !== 400 || changed !== null) throw new Error("Invalid password reached Supabase Auth");

  const response = await handler(new Request("https://project.supabase.co/api/profile/me/password", {
    method: "PUT", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword: "old-password", newPassword: "new-password" }),
  }));
  const body = await response.json();
  if (response.status !== 200 || JSON.stringify(changed) !== JSON.stringify(["supabase-uuid", "old-password", "new-password"])
    || body !== "Password changed" || response.headers.get("Cache-Control") !== "no-store") {
    throw new Error(`Unexpected password update result: ${JSON.stringify({ status: response.status, body, changed })}`);
  }
});

Deno.test("PUT /api/profile/me/password rejects unauthenticated requests and maps provider errors", async () => {
  const unauthorized = authHandler();
  const response = await unauthorized(new Request("https://project.supabase.co/api/profile/me/password", {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword: "old-password", newPassword: "new-password" }),
  }));
  if (response.status !== 401) throw new Error(`Expected 401, got ${response.status}`);

  const providerError = createRewindApiHandler({
    listGenres: async () => [], searchMovies: async (params) => ({ content: [], totalPages: 0, totalElements: 0, number: params.page }),
    getMovieDetails: async () => null, searchPeople: async (params) => ({ content: [], totalPages: 0, totalElements: 0, number: params.page }),
    getPersonFilmography: async () => null,
  }, [pagesOrigin], {
    async verifyAccessToken() { return { id: "supabase-uuid", email: "person@example.test", emailConfirmed: true, username: "cinephile" }; },
    async changePassword() { throw new RewindApiError(429, "Too many authentication attempts"); },
  });
  const throttled = await providerError(new Request("https://project.supabase.co/api/profile/me/password", {
    method: "PUT", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword: "old-password", newPassword: "new-password" }),
  }));
  if (throttled.status !== 429) throw new Error(`Expected 429, got ${throttled.status}`);
});

Deno.test("profile collections preserve paging and cap page size", async () => {
  let args: [string, number, number] | null = null;
  const handler = authHandler({
    async getMyProfileCollection(_user, collection, page, size) {
      if (collection !== "ratings") throw new Error("Unexpected collection name");
      args = [collection, page, size];
      return { content: [{ movieId: 17, rating: 5 }], totalPages: 1, totalElements: 1, number: page };
    },
  });
  const response = await handler(new Request("https://project.supabase.co/api/profile/me/ratings?page=2&size=100", {
    headers: { Authorization: "Bearer valid-token" },
  }));
  const body = await response.json();
  if (response.status !== 200 || JSON.stringify(args) !== JSON.stringify(["ratings", 2, 50])
    || body.number !== 2 || body.content[0].movieId !== 17) {
    throw new Error(`Unexpected profile collection response: ${JSON.stringify(body)}`);
  }
});

Deno.test("profile endpoints reject unauthenticated requests and invalid pages", async () => {
  const handler = authHandler({ async getMyProfileCollection() {
    return { content: [], totalPages: 0, totalElements: 0, number: 0 };
  } });
  const unauthenticated = await handler(new Request("https://project.supabase.co/api/profile/me"));
  const invalidPage = await handler(new Request("https://project.supabase.co/api/profile/me/reviews?page=-1", {
    headers: { Authorization: "Bearer valid-token" },
  }));
  if (unauthenticated.status !== 401 || invalidPage.status !== 400) {
    throw new Error(`Unexpected statuses ${unauthenticated.status}/${invalidPage.status}`);
  }
});

Deno.test("public review feeds preserve API page shape, filter name, and clamp size", async () => {
  const feeds: string[] = [];
  const handler = handlerWith({
    async getPublicReviewFeed(feed, page, size) {
      feeds.push(`${feed}:${page}:${size}`);
      return {
        content: [{
          id: 9, movieId: 12, movieTitle: "Example Film", userId: 4, username: "reviewer",
          content: "A thoughtful review", rating: 5, createdAt: "2026-11-09T12:00:00Z",
          moviePhotoUrl: null, userAvatarUrl: null,
        }],
        totalPages: 3, totalElements: 41, number: page,
      };
    },
  });
  const recent = await handler(new Request("https://project.supabase.co/api/reviews/recent?page=2&size=100"));
  const popular = await handler(new Request("https://project.supabase.co/api/reviews/popular?page=-2&size=0"));
  const body = await recent.json();
  if (recent.status !== 200 || popular.status !== 200
    || feeds.join(",") !== "recent:2:20,popular:0:1"
    || body.totalElements !== 41 || body.number !== 2 || body.content[0].movieId !== 12
    || body.content[0].userAvatarUrl !== null) {
    throw new Error(`Unexpected review feed contract or query: ${JSON.stringify({ feeds, body })}`);
  }
});

Deno.test("public review feeds reject other methods and unknown routes stay closed", async () => {
  const handler = handlerWith({
    async getPublicReviewFeed(_feed, page, _size) {
      return { content: [], totalPages: 0, totalElements: 0, number: page };
    },
  });
  const wrongMethod = await handler(new Request("https://project.supabase.co/api/reviews/recent", { method: "POST" }));
  const unknown = await handler(new Request("https://project.supabase.co/api/reviews/unknown"));
  if (wrongMethod.status !== 405 || unknown.status !== 404) {
    throw new Error(`Unexpected review route statuses ${wrongMethod.status}/${unknown.status}`);
  }
});

Deno.test("public list feeds preserve paging and tag filters across Spring routes", async () => {
  const calls: string[] = [];
  const page = { content: [], totalPages: 2, totalElements: 25, number: 0 };
  const handler = handlerWith({
    async getPublicLists(feed, tag, currentPage, size) {
      calls.push(`${feed}:${tag ?? "-"}:${currentPage}:${size}`);
      return { ...page, number: currentPage };
    },
  });
  const all = await handler(new Request("https://project.supabase.co/api/lists/public?tag=SCI-FI&size=100"));
  const popular = await handler(new Request("https://project.supabase.co/api/lists/public/popular?page=2&size=0"));
  const recent = await handler(new Request("https://project.supabase.co/api/lists/public/recently-liked"));
  const team = await handler(new Request("https://project.supabase.co/api/lists/public/team"));
  const body = await all.json();
  if ([all, popular, recent, team].some((response) => response.status !== 200)
    || calls.join(",") !== "all:sci-fi:0:50,popular:-:2:1,recently-liked:-:0:20,team:-:0:20"
    || body.totalElements !== 25 || all.headers.get("Cache-Control") !== "public, max-age=300, stale-while-revalidate=600") {
    throw new Error(`Unexpected public list page contract: ${JSON.stringify({ calls, body })}`);
  }
});

Deno.test("public list detail hides unknown lists and has a separate authenticated like status", async () => {
  const detail = {
    id: 8, name: "Space films", description: null, ownerId: 3, ownerUsername: "filmfan",
    ownerAvatarUrl: null, tags: ["Sci-Fi"], likeCount: 2,
    movies: [{ id: 20, title: "Arrival", releaseDate: "2016-11-11", rating: 7.9, photoUrl: null }],
  };
  const handler = authHandler({
    async getPublicList(id) { return id === 8 ? detail : null; },
    async getPublicListLikeStatus(_user, id) { return id === 8 ? { liked: true, likes: 2 } : null; },
  });
  const visible = await handler(new Request("https://project.supabase.co/api/lists/public/8"));
  const missing = await handler(new Request("https://project.supabase.co/api/lists/public/9"));
  const unauthenticated = await handler(new Request("https://project.supabase.co/api/lists/public/8/like-status"));
  const status = await handler(new Request("https://project.supabase.co/api/lists/public/8/like-status", {
    headers: { Authorization: "Bearer valid-token" },
  }));
  const detailBody = await visible.json();
  const statusBody = await status.json();
  if (visible.status !== 200 || missing.status !== 404 || unauthenticated.status !== 401
    || status.status !== 200 || JSON.stringify(detailBody) !== JSON.stringify(detail)
    || JSON.stringify(statusBody) !== JSON.stringify({ liked: true, likes: 2 })
    || visible.headers.get("Cache-Control") !== "public, max-age=300, stale-while-revalidate=600"
    || status.headers.get("Cache-Control") !== "no-store") {
    throw new Error(`Unexpected public list detail/like-status response: ${JSON.stringify({ detailBody, statusBody })}`);
  }
});

Deno.test("list likes require confirmed auth and return no content", async () => {
  const actions: string[] = [];
  const handler = authHandler({
    async likePublicList(_user, id) { actions.push(`like:${id}`); return id === 8; },
    async unlikePublicList(_user, id) { actions.push(`unlike:${id}`); return id === 8; },
  });
  const unauthenticated = await handler(new Request("https://project.supabase.co/api/lists/8/likes", { method: "POST" }));
  const liked = await handler(new Request("https://project.supabase.co/api/lists/8/likes", {
    method: "POST", headers: { Authorization: "Bearer valid-token" },
  }));
  const unliked = await handler(new Request("https://project.supabase.co/api/lists/8/likes", {
    method: "DELETE", headers: { Authorization: "Bearer valid-token" },
  }));
  const missing = await handler(new Request("https://project.supabase.co/api/lists/9/likes", {
    method: "POST", headers: { Authorization: "Bearer valid-token" },
  }));
  if (unauthenticated.status !== 401 || liked.status !== 204 || unliked.status !== 204
    || missing.status !== 404 || actions.join(",") !== "like:8,unlike:8,like:9") {
    throw new Error(`Unexpected list like responses ${unauthenticated.status}/${liked.status}/${unliked.status}/${missing.status}`);
  }
});

Deno.test("public list endpoints reject unsupported methods and invalid IDs/pages", async () => {
  const handler = handlerWith({
    async getPublicLists(_feed, _tag, page, size) { return { content: [], totalPages: 0, totalElements: 0, number: page }; },
    async getPublicList() { return null; },
  });
  const wrongMethod = await handler(new Request("https://project.supabase.co/api/lists/public", { method: "POST" }));
  const badPage = await handler(new Request("https://project.supabase.co/api/lists/public?page=nope"));
  const badId = await handler(new Request("https://project.supabase.co/api/lists/public/0"));
  if (wrongMethod.status !== 405 || badPage.status !== 400 || badId.status !== 400) {
    throw new Error(`Unexpected public list validation statuses ${wrongMethod.status}/${badPage.status}/${badId.status}`);
  }
});

Deno.test("popular tags keep their array contract, public cache, and size limit", async () => {
  let requestedSize = 0;
  const handler = handlerWith({
    async getPopularTags(size) { requestedSize = size; return [{ id: 2, name: "Sci-Fi", slug: "sci-fi" }]; },
  });
  const response = await handler(new Request("https://project.supabase.co/api/tags/popular?size=99"));
  const body = await response.json();
  if (response.status !== 200 || requestedSize !== 30 || body[0]?.slug !== "sci-fi"
    || response.headers.get("Cache-Control") !== "public, max-age=300, stale-while-revalidate=600") {
    throw new Error(`Unexpected popular tags response: ${JSON.stringify({ requestedSize, body })}`);
  }
});

Deno.test("private list collection endpoints require confirmed auth and preserve Spring paging", async () => {
  const calls: string[] = [];
  const list = { id: 5, name: "Watchlist", description: null, listType: "WATCHLIST" as const, isPublic: false, tags: [] };
  const handler = authHandler({
    async getMyLists() { return [list]; },
    async getMyListsPage(_user, page, size) {
      calls.push(`${page}:${size}`);
      return { content: [list], totalPages: 1, totalElements: 1, number: page };
    },
  });
  const unauthenticated = await handler(new Request("https://project.supabase.co/api/lists/my"));
  const all = await handler(new Request("https://project.supabase.co/api/lists/my", {
    headers: { Authorization: "Bearer valid-token" },
  }));
  const page = await handler(new Request("https://project.supabase.co/api/lists/my/page?page=-2&size=0", {
    headers: { Authorization: "Bearer valid-token" },
  }));
  const allBody = await all.json();
  const pageBody = await page.json();
  if (unauthenticated.status !== 401 || all.status !== 200 || page.status !== 200
    || JSON.stringify(allBody) !== JSON.stringify([list]) || calls.join(",") !== "0:1"
    || pageBody.number !== 0 || pageBody.totalElements !== 1) {
    throw new Error(`Unexpected private list page responses ${unauthenticated.status}/${all.status}/${page.status}`);
  }
});

Deno.test("custom list creation validates input and ignores privilege fields", async () => {
  let saved: unknown = null;
  const list = { id: 12, name: "Sci-fi", description: "", listType: "CUSTOM" as const, isPublic: true, tags: ["Sci-Fi"] };
  const handler = authHandler({ async createMyList(_user, body) { saved = body; return list; } });
  const empty = await handler(new Request("https://project.supabase.co/api/lists", {
    method: "POST", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Empty", movieIds: [] }),
  }));
  const unconfirmed = await authHandler({
    async createMyList() { throw new Error("Unconfirmed users must not create lists"); },
  }, true, false)(new Request("https://project.supabase.co/api/lists", {
    method: "POST", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Sci-fi", movieIds: [1] }),
  }));
  const created = await handler(new Request("https://project.supabase.co/api/lists", {
    method: "POST", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Sci-fi", description: "", isPublic: true, tags: ["Sci-Fi"], movieIds: [1, 2], userId: 999, listType: "WATCHED" }),
  }));
  const body = await created.json();
  if (empty.status !== 400 || unconfirmed.status !== 401 || created.status !== 200 || JSON.stringify(saved) !== JSON.stringify({
    name: "Sci-fi", description: "", isPublic: true, tags: ["Sci-Fi"], movieIds: [1, 2],
  }) || body.listType !== "CUSTOM" || body.id !== 12) {
    throw new Error(`Unexpected custom-list creation result: ${JSON.stringify({ saved, body })}`);
  }
});

Deno.test("custom list update/delete preserve owner and system-list guards", async () => {
  const actions: string[] = [];
  const handler = authHandler({
    async updateMyList(_user, id, body) { actions.push(`update:${id}:${body.name ?? "-"}`); return id === 7
      ? { id, name: body.name ?? "My list", description: null, listType: "CUSTOM", isPublic: true, tags: [] }
      : null; },
    async deleteMyList(_user, id) { actions.push(`delete:${id}`); return id === 7; },
  });
  const updated = await handler(new Request("https://project.supabase.co/api/lists/7", {
    method: "PATCH", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Renamed", role: "ADMIN", listType: "WATCHED" }),
  }));
  const missing = await handler(new Request("https://project.supabase.co/api/lists/8", {
    method: "PATCH", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" }, body: "{}",
  }));
  const deleted = await handler(new Request("https://project.supabase.co/api/lists/7", {
    method: "DELETE", headers: { Authorization: "Bearer valid-token" },
  }));
  if (updated.status !== 200 || missing.status !== 404 || deleted.status !== 204
    || actions.join(",") !== "update:7:Renamed,update:8:-,delete:7") {
    throw new Error(`Unexpected custom-list update/delete statuses ${updated.status}/${missing.status}/${deleted.status}`);
  }
});

Deno.test("list item add/remove/reorder routes validate IDs and preserve nonempty custom lists", async () => {
  const actions: string[] = [];
  const handler = authHandler({
    async getMyListItems(_user, id) { return id === 4 ? [{ id: 17, position: 1, movie: {
      id: 22, title: "Arrival", releaseDate: null, rating: null, photoUrl: null,
    } }] : null; },
    async addMovieToMyList(_user, listId, movieId, position) { actions.push(`add:${listId}:${movieId}:${position}`); return "OK"; },
    async removeMovieFromMyList(_user, listId, movieId) { actions.push(`remove:${listId}:${movieId}`); return "LAST_MOVIE"; },
    async reorderMyListItems(_user, listId, ids) { actions.push(`reorder:${listId}:${ids.join("-")}`); return "OK"; },
  });
  const items = await handler(new Request("https://project.supabase.co/api/lists/4/items", {
    headers: { Authorization: "Bearer valid-token" },
  }));
  const added = await handler(new Request("https://project.supabase.co/api/lists/4/movies", {
    method: "POST", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ movieId: 22 }),
  }));
  const removed = await handler(new Request("https://project.supabase.co/api/lists/4/movies/22", {
    method: "DELETE", headers: { Authorization: "Bearer valid-token" },
  }));
  const reordered = await handler(new Request("https://project.supabase.co/api/lists/4/items/reorder", {
    method: "PUT", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ orderedItemIds: [17] }),
  }));
  const emptyOrder = await handler(new Request("https://project.supabase.co/api/lists/4/items/reorder", {
    method: "PUT", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ orderedItemIds: [] }),
  }));
  if (items.status !== 200 || added.status !== 200 || removed.status !== 400 || reordered.status !== 200
    || emptyOrder.status !== 400 || actions.join(",") !== "add:4:22:null,remove:4:22,reorder:4:17") {
    throw new Error(`Unexpected list item routes: ${items.status}/${added.status}/${removed.status}/${reordered.status}/${emptyOrder.status}`);
  }
});

Deno.test("movie flag endpoints persist only allowlisted user actions", async () => {
  const actions: string[] = [];
  const handler = authHandler({
    async setMyMovieFlag(_user, movieId, flag) { actions.push(`add:${movieId}:${flag}`); },
    async deleteMyMovieFlag(_user, movieId, flag) { actions.push(`remove:${movieId}:${flag}`); },
  });
  const added = await handler(new Request("https://project.supabase.co/api/movies/18/favorite", {
    method: "POST", headers: { Authorization: "Bearer valid-token" },
  }));
  const removed = await handler(new Request("https://project.supabase.co/api/movies/18/favorite", {
    method: "DELETE", headers: { Authorization: "Bearer valid-token" },
  }));
  if (added.status !== 200 || removed.status !== 204 || actions.join(",") !== "add:18:favorite,remove:18:favorite") {
    throw new Error(`Unexpected movie flag action results: ${actions.join(",")}`);
  }
});

Deno.test("movie details include private flags for a verified user and are not cached", async () => {
  const handler = authHandler({
    async getMovieDetails(id) {
      return {
        id, imdbId: null, tmdbId: null, title: "Example", durationMinutes: null,
        releaseDate: null, ageRating: null, rating: null, shortPlot: null, photoUrl: null,
        backdropUrl: null, trailerUrl: null, genres: [], directors: [], producers: [], actors: [],
        externalRatings: [], similarMovies: [], myFlags: null,
      };
    },
    async getMyMovieStatus() { return { inWatchlist: true, watched: true, favorite: false, myRating: null }; },
  });
  const response = await handler(new Request("https://project.supabase.co/api/movies/18/details", {
    headers: { Authorization: "Bearer valid-token" },
  }));
  const body = await response.json();
  if (response.status !== 200 || response.headers.get("Cache-Control") !== "no-store"
    || body.myFlags?.watchlist !== true || body.myFlags?.watched !== true || body.myFlags?.favorites !== false) {
    throw new Error(`Unexpected authenticated details response: ${JSON.stringify(body)}`);
  }
});

Deno.test("PUT /api/movies/:id/rating accepts only integer values from 1 to 5", async () => {
  let saved: number | null = null;
  const handler = authHandler({ async setMyRating(_user, _movieId, rating) { saved = rating; } });
  const invalid = await handler(new Request("https://project.supabase.co/api/movies/7/rating", {
    method: "PUT",
    headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ rating: 5.5 }),
  }));
  if (invalid.status !== 400 || saved !== null) throw new Error("Invalid rating was not rejected");
  const valid = await handler(new Request("https://project.supabase.co/api/movies/7/rating", {
    method: "PUT",
    headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ rating: 5 }),
  }));
  if (valid.status !== 200 || saved !== 5) throw new Error("Valid rating did not reach the repository");
});

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
  if (response.headers.get("Cache-Control") !== "public, max-age=300, stale-while-revalidate=600") {
    throw new Error("Successful public catalogue responses should use the short shared cache policy");
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
  if (response.headers.get("Access-Control-Allow-Methods") !== "GET, POST, PUT, PATCH, DELETE, OPTIONS") {
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
  const unknown = await handler(new Request("http://localhost:8000/api/admin/unknown"));
  const wrongMethod = await handler(new Request("http://localhost:8000/api/genres", {
    method: "POST",
  }));

  if (unknown.status !== 404) throw new Error(`Expected 404, got ${unknown.status}`);
  if (wrongMethod.status !== 405) throw new Error(`Expected 405, got ${wrongMethod.status}`);
  if (unknown.headers.get("Cache-Control") !== "no-store" || wrongMethod.headers.get("Cache-Control") !== "no-store") {
    throw new Error("Error responses must not be cached");
  }
});

Deno.test("catalogue backend failures stay uncached", async () => {
  const handler = handlerWith({ async listGenres() { throw new Error("database unavailable"); } });
  const response = await handler(new Request("https://project.supabase.co/api/genres", {
    headers: { Origin: pagesOrigin },
  }));
  if (response.status !== 500 || response.headers.get("Cache-Control") !== "no-store") {
    throw new Error("A failed catalogue query must return an uncached 500 response");
  }
});

Deno.test("movie search keeps the paginated API response and clamps page size", async () => {
  const handler = handlerWith({
    async searchMovies(params) {
      if (params.q !== "Example" || params.size !== 50) throw new Error("Unexpected search filters");
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

Deno.test("global search preserves all result groups, language and size cap", async () => {
  let received: [string, string, number] | null = null;
  const expected = {
    films: { content: [], totalPages: 0, totalElements: 0, number: 0 },
    users: { content: [], totalPages: 0, totalElements: 0, number: 0 },
    lists: { content: [], totalPages: 0, totalElements: 0, number: 0 },
    tags: [], people: [],
    reviews: { content: [], totalPages: 0, totalElements: 0, number: 0 },
    journal: { content: [], totalPages: 0, totalElements: 0, number: 0 },
  };
  const handler = handlerWith({
    async searchGlobal(query, language, size) { received = [query, language, size]; return expected; },
  });
  const response = await handler(new Request("https://project.supabase.co/api/search/global?q=%20Arrival%20&language=en&size=99"));
  const body = await response.json();
  if (response.status !== 200 || JSON.stringify(received) !== JSON.stringify(["Arrival", "en", 12])
    || JSON.stringify(body) !== JSON.stringify(expected)
    || response.headers.get("Cache-Control") !== "public, max-age=60, stale-while-revalidate=120") {
    throw new Error(`Unexpected global search result: ${JSON.stringify({ status: response.status, received, body })}`);
  }
});

Deno.test("global search rejects missing/oversized queries and unsupported methods", async () => {
  const handler = handlerWith({ async searchGlobal() {
    return { films: { content: [], totalPages: 0, totalElements: 0, number: 0 }, users: { content: [], totalPages: 0, totalElements: 0, number: 0 },
      lists: { content: [], totalPages: 0, totalElements: 0, number: 0 }, tags: [], people: [],
      reviews: { content: [], totalPages: 0, totalElements: 0, number: 0 }, journal: { content: [], totalPages: 0, totalElements: 0, number: 0 } };
  } });
  const missing = await handler(new Request("https://project.supabase.co/api/search/global"));
  const oversized = await handler(new Request(`https://project.supabase.co/api/search/global?q=${"x".repeat(201)}`));
  const wrongMethod = await handler(new Request("https://project.supabase.co/api/search/global?q=test", { method: "POST" }));
  if (missing.status !== 400 || oversized.status !== 400 || wrongMethod.status !== 405) {
    throw new Error(`Unexpected global search validation: ${missing.status}/${oversized.status}/${wrongMethod.status}`);
  }
});

Deno.test("movie search rejects malformed numeric filters", async () => {
  const handler = handlerWith({});
  for (const url of [
    "https://project.supabase.co/api/movies/search?genreId=abc",
    "https://project.supabase.co/api/movies/search?year=1800",
    "https://project.supabase.co/api/movies/search?year=2200",
    "https://project.supabase.co/api/movies/search?minRating=6",
    "https://project.supabase.co/api/movies/search?minRating=-1",
  ]) {
    const response = await handler(new Request(url));
    if (response.status !== 400) throw new Error(`Expected 400 for ${url}, got ${response.status}`);
  }
});

Deno.test("movie search bounds query length and page offsets before database access", async () => {
  let calls = 0;
  const handler = handlerWith({
    async searchMovies() {
      calls += 1;
      return { content: [], totalPages: 0, totalElements: 0, number: 0 };
    },
  });
  for (const url of [
    `https://project.supabase.co/api/movies/search?q=${"x".repeat(101)}`,
    "https://project.supabase.co/api/movies/search?page=101",
    "https://project.supabase.co/api/movies/search?page=-1",
    "https://project.supabase.co/api/movies/search?page=not-a-number",
  ]) {
    const response = await handler(new Request(url));
    if (response.status !== 400) throw new Error(`Expected 400 for ${url}, got ${response.status}`);
  }
  if (calls !== 0) throw new Error("Invalid searches must not reach the repository");
});

Deno.test("movie detail returns the public fields and null user flags", async () => {
  const handler = handlerWith({
    async getMovieDetails(id) {
      return {
        id, imdbId: null, tmdbId: null, title: "Comedy Film", durationMinutes: null,
        releaseDate: "2024-01-10", ageRating: null, rating: 4.5, shortPlot: null,
        photoUrl: "https://example.invalid/poster.jpg", backdropUrl: null, trailerUrl: null,
        genres: [{ id: 4, name: "Comedy" }], directors: [], producers: [{ id: 8, name: "Producer One", photoUrl: null }], actors: [],
        externalRatings: [], similarMovies: [], myFlags: null,
      };
    },
  });
  const response = await handler(new Request("https://project.supabase.co/functions/v1/rewind-api/api/movies/101/details"));
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  const body = await response.json();
  if (body.id !== 101 || body.title !== "Comedy Film" || body.myFlags !== null || body.genres[0].name !== "Comedy"
    || body.producers[0]?.id !== 8 || body.producers[0]?.name !== "Producer One") {
    throw new Error(`Unexpected movie detail response: ${JSON.stringify(body)}`);
  }
});

Deno.test("actor, director, and producer filmography routes return catalog-only data", async () => {
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
  for (const [path, type] of [["actors", "ACTOR"], ["directors", "DIRECTOR"], ["producers", "PRODUCER"]] as const) {
    const response = await handler(new Request(`https://project.supabase.co/functions/v1/rewind-api/api/${path}/383?genreId=17&sort=title`));
    const body = await response.json();
    if (response.status !== 200 || body.type !== type || body.films[0].id !== 33) {
      throw new Error(`Unexpected ${path} response: ${JSON.stringify(body)}`);
    }
  }
});

Deno.test("people search supports actor and producer filters and returns paged results", async () => {
  const handler = handlerWith({
    async searchPeople(params) {
      if (params.q !== "Rachel McAdams" || (params.type !== "ACTOR" && params.type !== "PRODUCER") || params.page !== 1 || params.size !== 7) {
        throw new Error("Unexpected people search filters");
      }
      return {
        content: [{ id: 286, name: "Rachel McAdams", photoUrl: null, type: params.type, filmCount: 1 }],
        totalPages: 2,
        totalElements: 8,
        number: params.page,
      };
    },
  });
  for (const [queryType, responseType] of [["actor", "ACTOR"], ["producer", "PRODUCER"]] as const) {
    const response = await handler(new Request(`https://project.supabase.co/functions/v1/rewind-api/api/people/search?type=${queryType}&q=Rachel%20McAdams&page=1&size=7`));
    const body = await response.json();
    if (response.status !== 200 || body.content[0].name !== "Rachel McAdams" || body.content[0].type !== responseType || body.number !== 1
      || body.totalElements !== 8 || response.headers.get("Cache-Control") !== "public, max-age=300, stale-while-revalidate=600") {
      throw new Error(`Unexpected ${queryType} search response: ${JSON.stringify(body)}`);
    }
  }
});

Deno.test("person filmography rejects unknown types and invalid IDs/filters", async () => {
  const handler = handlerWith({});
  for (const [url, expected] of [
    ["http://localhost:8000/api/actors/nope", 400],
    ["http://localhost:8000/api/directors/1?genreId=bad", 400],
    ["http://localhost:8000/api/people/search?type=crew", 400],
    ["http://localhost:8000/api/people/search?page=101", 400],
    [`http://localhost:8000/api/people/search?q=${"x".repeat(101)}`, 400],
    ["http://localhost:8000/api/producers/nope", 400],
  ] as const) {
    const response = await handler(new Request(url));
    if (response.status !== expected) throw new Error(`Expected ${expected} for ${url}, got ${response.status}`);
  }
});

Deno.test("movie review reads preserve Spring paging and my-review no-content contract", async () => {
  let requested: [number, number, number] | null = null;
  const review = { id: 8, userId: 42, username: "cinephile", userAvatarUrl: null, content: "Great", rating: 5, createdAt: "2026-11-09T12:00:00Z" };
  const handler = authHandler({
    async getMovieReviews(movieId, page, size) {
      requested = [movieId, page, size];
      return { content: [review], totalPages: 1, totalElements: 1, number: page };
    },
    async getMyMovieReview() { return null; },
  });
  const page = await handler(new Request("https://project.supabase.co/api/movies/7/reviews?page=2&size=500"));
  const body = await page.json();
  if (page.status !== 200 || JSON.stringify(requested) !== JSON.stringify([7, 2, 50])
    || body.content[0].userAvatarUrl !== null || body.number !== 2) throw new Error("Movie review page contract changed");
  const mine = await handler(new Request("https://project.supabase.co/api/movies/7/reviews/me", {
    headers: { Authorization: "Bearer valid-token" },
  }));
  if (mine.status !== 204) throw new Error(`Expected 204 for a missing personal review, got ${mine.status}`);
});

Deno.test("review creation validates content/rating and ignores client identity fields", async () => {
  let received: [number, string, number] | null = null;
  const review = { id: 8, userId: 42, username: "cinephile", userAvatarUrl: null, content: "Great", rating: 5, createdAt: "2026-11-09T12:00:00Z" };
  const handler = authHandler({
    async createReview(_user, movieId, content, rating) { received = [movieId, content, rating]; return review; },
  });
  for (const body of [{ content: "  \n", rating: 5 }, { content: "ok", rating: 6 }, { content: "ok", rating: 3.5 }]) {
    const response = await handler(new Request("https://project.supabase.co/api/movies/7/reviews", {
      method: "POST", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" }, body: JSON.stringify(body),
    }));
    if (response.status !== 400) throw new Error(`Expected invalid review rejection, got ${response.status}`);
  }
  const response = await handler(new Request("https://project.supabase.co/api/movies/7/reviews", {
    method: "POST", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Great", rating: 5, userId: 1, role: "ADMIN", movieId: 99 }),
  }));
  if (response.status !== 200 || JSON.stringify(received) !== JSON.stringify([7, "Great", 5])) {
    throw new Error("Review creation accepted client-controlled identity or lost request fields");
  }
});

Deno.test("review update/delete require confirmed identity and preserve ownership result", async () => {
  let updateCalled = false;
  let deleteCalled = false;
  const review = { id: 8, userId: 42, username: "cinephile", userAvatarUrl: null, content: "edited", rating: null, createdAt: "2026-11-09T12:00:00Z" };
  const handler = authHandler({
    async updateMyReview(_user, id, update) {
      updateCalled = id === 8 && update.content === "edited" && update.rating === 4;
      return review;
    },
    async deleteMyReview(_user, id) { deleteCalled = id === 8; return true; },
  });
  const denied = await authHandler({}, true, false)(new Request("https://project.supabase.co/api/reviews/8", {
    method: "PATCH", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" }, body: JSON.stringify({ content: "edited" }),
  }));
  if (denied.status !== 401 || updateCalled) throw new Error("Unconfirmed account reached review mutation");
  const invalid = await handler(new Request("https://project.supabase.co/api/reviews/8", {
    method: "PATCH", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" }, body: JSON.stringify({ content: "  " }),
  }));
  if (invalid.status !== 400 || updateCalled) throw new Error("Whitespace-only review update reached the repository");
  const valid = await handler(new Request("https://project.supabase.co/api/reviews/8", {
    method: "PATCH", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" }, body: JSON.stringify({ content: "edited", rating: 4, userId: 99 }),
  }));
  const deleted = await handler(new Request("https://project.supabase.co/api/reviews/8", {
    method: "DELETE", headers: { Authorization: "Bearer valid-token" },
  }));
  if (valid.status !== 200 || !updateCalled || deleted.status !== 204 || !deleteCalled) throw new Error("Review ownership flow failed");
});

Deno.test("review details and comments keep visible-page contract and comment text validation", async () => {
  let commentText: string | null = null;
  const details = {
    id: 8, content: "Great", rating: 5, createdAt: "2026-11-09T12:00:00Z",
    author: { id: 42, username: "cinephile", displayName: "Cinephile", avatarUrl: null },
    movie: { id: 7, title: "Film", releaseDate: null, durationMinutes: null, ageRating: null, photoUrl: null, backdropUrl: null, trailerUrl: null },
    likes: 0, likedBy: [],
  };
  const comment = { id: 9, reviewId: 8, userId: 42, username: "cinephile", userAvatarUrl: null, text: "hello", createdAt: "2026-11-09T12:00:00Z", updatedAt: "2026-11-09T12:00:00Z" };
  const handler = authHandler({
    async getReviewDetails() { return details; },
    async getReviewComments(_reviewId, page, size) { return { content: [comment], totalPages: 1, totalElements: 1, number: page + size - 20 }; },
    async createReviewComment(_user, _reviewId, text) { commentText = text; return comment; },
  });
  const detail = await handler(new Request("https://project.supabase.co/api/reviews/8"));
  const page = await handler(new Request("https://project.supabase.co/api/reviews/8/comments?page=1&size=19"));
  const invalid = await handler(new Request("https://project.supabase.co/api/reviews/8/comments", {
    method: "POST", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" }, body: JSON.stringify({ text: "  " }),
  }));
  const created = await handler(new Request("https://project.supabase.co/api/reviews/8/comments", {
    method: "POST", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" }, body: JSON.stringify({ text: "hello", userId: 1 }),
  }));
  if (detail.status !== 200 || (await detail.json()).movie.id !== 7 || page.status !== 200
    || (await page.json()).content[0].text !== "hello" || invalid.status !== 400
    || created.status !== 200 || commentText !== "hello") throw new Error("Review detail/comment contract changed");
});

Deno.test("comment update/delete preserve owner and admin authorization decisions", async () => {
  let updated = false;
  const comment = { id: 9, reviewId: 8, userId: 42, username: "cinephile", userAvatarUrl: null, text: "edited", createdAt: "2026-11-09T12:00:00Z", updatedAt: "2026-11-09T12:01:00Z" };
  const handler = authHandler({
    async updateReviewComment(_user, id, text) { updated = id === 9 && text === "edited"; return comment; },
    async deleteReviewComment(_user, id) { return id === 9 ? "FORBIDDEN" : "NOT_FOUND"; },
  });
  const patchResponse = await handler(new Request("https://project.supabase.co/api/comments/9", {
    method: "PATCH", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" }, body: JSON.stringify({ text: "edited" }),
  }));
  const denied = await handler(new Request("https://project.supabase.co/api/comments/9", {
    method: "DELETE", headers: { Authorization: "Bearer valid-token" },
  }));
  if (patchResponse.status !== 200 || !updated || denied.status !== 403) throw new Error("Comment permission contract changed");
});

Deno.test("review likes expose public counts and require confirmed auth for mutations/status", async () => {
  let liked = false;
  const handler = authHandler({
    async getReviewLikes() { return 6; },
    async getReviewLikeStatus() { return { liked: true, likes: 6 }; },
    async likeReview() { liked = true; return true; },
    async unlikeReview() { return false; },
  });
  const count = await handler(new Request("https://project.supabase.co/api/reviews/8/likes"));
  const status = await handler(new Request("https://project.supabase.co/api/reviews/8/like-status", {
    headers: { Authorization: "Bearer valid-token" },
  }));
  const like = await handler(new Request("https://project.supabase.co/api/reviews/8/likes", {
    method: "POST", headers: { Authorization: "Bearer valid-token" },
  }));
  const unlike = await handler(new Request("https://project.supabase.co/api/reviews/8/likes", {
    method: "DELETE", headers: { Authorization: "Bearer valid-token" },
  }));
  const denied = await authHandler({}, true, false)(new Request("https://project.supabase.co/api/reviews/8/likes", { method: "POST" }));
  if (count.status !== 200 || await count.json() !== 6 || status.status !== 200 || !(await status.json()).liked
    || like.status !== 204 || !liked || unlike.status !== 404 || denied.status !== 401) {
    throw new Error("Review like response or authorization contract changed");
  }
});

Deno.test("public social profile routes preserve Spring response shapes and page limits", async () => {
  const requested: unknown[] = [];
  const profile = {
    id: 7, username: "filmfan", displayName: "Film Fan", avatarUrl: null, hq: false,
    stats: { ratings: 2, reviews: 1, watched: 1, watchlist: 0, favorites: 0 },
    ratingDistribution: [{ rating: 5, count: 2 }], socialLinks: [], lists: [], recentReviews: [],
  };
  const handler = handlerWith({
    async getPublicProfile(id) { requested.push(["profile", id]); return profile; },
    async getPublicProfileCollection(id, collection, page, size) {
      requested.push(["collection", id, collection, page, size]);
      return { content: [], totalPages: 0, totalElements: 0, number: page };
    },
    async getFollowers(id, page, size) {
      requested.push(["followers", id, page, size]);
      return { content: [], totalPages: 0, totalElements: 0, number: page };
    },
  });
  const publicProfile = await handler(new Request("https://project.supabase.co/api/users/7/profile"));
  const collection = await handler(new Request("https://project.supabase.co/api/users/7/collections/watched?page=2&size=999"));
  const followers = await handler(new Request("https://project.supabase.co/api/users/7/followers?page=-2&size=8"));
  if (publicProfile.status !== 200 || (await publicProfile.json()).stats.reviews !== 1
    || collection.status !== 200 || followers.status !== 200
    || JSON.stringify(requested) !== JSON.stringify([["profile", 7], ["collection", 7, "watched", 2, 50], ["followers", 7, 0, 8]])) {
    throw new Error(`Public profile route or pagination contract changed: ${JSON.stringify(requested)}`);
  }
});

Deno.test("follow and activity routes require confirmed identity and preserve idempotent statuses", async () => {
  const calls: unknown[] = [];
  const handler = authHandler({
    async getFollowStatus(_user, id) { calls.push(["status", id]); return { following: true, followers: 3, followingCount: 4 }; },
    async setFollow(_user, id, following) { calls.push(["follow", id, following]); return true; },
    async getFollowingActivity(_user, page, size) { calls.push(["feed", page, size]); return { content: [], totalPages: 0, totalElements: 0, number: page }; },
  });
  const denied = await authHandler({ async setFollow() { throw new Error("must not run"); } }, true, false)(new Request("https://project.supabase.co/api/users/7/follow", { method: "POST" }));
  const status = await handler(new Request("https://project.supabase.co/api/users/7/follow-status", { headers: { Authorization: "Bearer valid-token" } }));
  const followed = await handler(new Request("https://project.supabase.co/api/users/7/follow", { method: "POST", headers: { Authorization: "Bearer valid-token" } }));
  const unfollowed = await handler(new Request("https://project.supabase.co/api/users/7/follow", { method: "DELETE", headers: { Authorization: "Bearer valid-token" } }));
  const feed = await handler(new Request("https://project.supabase.co/api/activity/following?page=3&size=70", { headers: { Authorization: "Bearer valid-token" } }));
  if (denied.status !== 401 || status.status !== 200 || !(await status.json()).following
    || followed.status !== 204 || unfollowed.status !== 204 || feed.status !== 200
    || JSON.stringify(calls) !== JSON.stringify([["status", 7], ["follow", 7, true], ["follow", 7, false], ["feed", 3, 50]])) {
    throw new Error(`Follow authorization or response contract changed: ${JSON.stringify(calls)}`);
  }
});

Deno.test("block routes preserve symmetric status, confirmation and forbidden-follow behavior", async () => {
  const calls: unknown[] = [];
  const handler = authHandler({
    async getBlockStatus(_user, id) { calls.push(["status", id]); return { blocked: false }; },
    async setBlock(_user, id, blocked) { calls.push(["block", id, blocked]); return true; },
    async setFollow() { throw new RewindApiError(403, "User interaction is blocked"); },
  });
  const denied = await authHandler({})(new Request("https://project.supabase.co/api/users/7/block-status"));
  const status = await handler(new Request("https://project.supabase.co/api/users/7/block-status", { headers: { Authorization: "Bearer valid-token" } }));
  const blocked = await handler(new Request("https://project.supabase.co/api/users/7/block", { method: "POST", headers: { Authorization: "Bearer valid-token" } }));
  const unblocked = await handler(new Request("https://project.supabase.co/api/users/7/block", { method: "DELETE", headers: { Authorization: "Bearer valid-token" } }));
  const follow = await handler(new Request("https://project.supabase.co/api/users/7/follow", { method: "POST", headers: { Authorization: "Bearer valid-token" } }));
  if (denied.status !== 401 || status.status !== 200 || (await status.json()).blocked
    || blocked.status !== 200 || !(await blocked.json()).blocked
    || unblocked.status !== 200 || (await unblocked.json()).blocked
    || follow.status !== 403
    || JSON.stringify(calls) !== JSON.stringify([["status", 7], ["block", 7, true], ["block", 7, false]])) {
    throw new Error(`Block status or interaction guard changed: ${JSON.stringify(calls)}`);
  }
});

Deno.test("profile social links require confirmation and validate allowlisted URLs/platforms", async () => {
  let saved: unknown = null;
  const handler = authHandler({
    async getMySocialLinks() { return [{ platform: "website", url: "https://example.test" }]; },
    async updateMySocialLinks(_user, links) { saved = links; return links; },
  });
  const get = await handler(new Request("https://project.supabase.co/api/profile/me/social-links", { headers: { Authorization: "Bearer valid-token" } }));
  const invalid = await handler(new Request("https://project.supabase.co/api/profile/me/social-links", {
    method: "PUT", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify([{ platform: "instagram", url: "javascript:alert(1)" }]),
  }));
  const duplicate = await handler(new Request("https://project.supabase.co/api/profile/me/social-links", {
    method: "PUT", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify([{ platform: "website", url: "https://a.test" }, { platform: " WEBSITE ", url: "https://b.test" }]),
  }));
  const update = await handler(new Request("https://project.supabase.co/api/profile/me/social-links", {
    method: "PUT", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify([{ platform: " Website ", url: "https://example.test/profile" }]),
  }));
  const expected = [{ platform: "website", url: "https://example.test/profile" }];
  if (get.status !== 200 || (await get.json())[0].platform !== "website" || invalid.status !== 400 || duplicate.status !== 400
    || update.status !== 200 || JSON.stringify(saved) !== JSON.stringify(expected) || JSON.stringify(await update.json()) !== JSON.stringify(expected)) {
    throw new Error("Profile social link validation or response contract changed");
  }
});

Deno.test("notification reads, preferences, and mark-read actions preserve recipient ownership", async () => {
  const calls: unknown[] = [];
  const item = { id: 5, type: "FOLLOW" as const, createdAt: "2026-11-09T12:00:00Z", readAt: null,
    actor: { id: 7, username: "filmfan", displayName: null, avatarUrl: null }, relatedUserId: 7, reviewId: null };
  const handler = authHandler({
    async getNotifications(_user, page, size) { calls.push(["page", page, size]); return { content: [item], totalPages: 1, totalElements: 1, number: page }; },
    async getUnreadNotificationCount() { return 1; },
    async markNotificationRead(_user, id) { calls.push(["read", id]); return id === 5; },
    async markAllNotificationsRead() { calls.push(["all"]); },
    async getNotificationPreferences() { return { followsEnabled: true, reviewLikesEnabled: true }; },
    async updateNotificationPreferences(_user, preferences) { calls.push(["preferences", preferences.followsEnabled, preferences.reviewLikesEnabled]); return preferences; },
  });
  const page = await handler(new Request("https://project.supabase.co/api/notifications?page=2&size=80", { headers: { Authorization: "Bearer valid-token" } }));
  const unread = await handler(new Request("https://project.supabase.co/api/notifications/unread-count", { headers: { Authorization: "Bearer valid-token" } }));
  const read = await handler(new Request("https://project.supabase.co/api/notifications/5/read", { method: "POST", headers: { Authorization: "Bearer valid-token" } }));
  const foreignRead = await handler(new Request("https://project.supabase.co/api/notifications/9/read", { method: "POST", headers: { Authorization: "Bearer valid-token" } }));
  const prefs = await handler(new Request("https://project.supabase.co/api/notifications/preferences", { headers: { Authorization: "Bearer valid-token" } }));
  const invalidPrefs = await handler(new Request("https://project.supabase.co/api/notifications/preferences", {
    method: "PUT", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" }, body: JSON.stringify({ followsEnabled: "false" }),
  }));
  const updatedPrefs = await handler(new Request("https://project.supabase.co/api/notifications/preferences", {
    method: "PUT", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" }, body: JSON.stringify({ followsEnabled: false, reviewLikesEnabled: true }),
  }));
  const all = await handler(new Request("https://project.supabase.co/api/notifications/read-all", { method: "POST", headers: { Authorization: "Bearer valid-token" } }));
  if (page.status !== 200 || (await page.json()).content[0].type !== "FOLLOW" || unread.status !== 200 || (await unread.json()).count !== 1
    || read.status !== 204 || foreignRead.status !== 404 || prefs.status !== 200 || invalidPrefs.status !== 400
    || updatedPrefs.status !== 200 || !(await updatedPrefs.json()).reviewLikesEnabled || all.status !== 204
    || JSON.stringify(calls) !== JSON.stringify([["page", 2, 50], ["read", 5], ["read", 9], ["preferences", false, true], ["all"]])) {
    throw new Error(`Notification contract or recipient guard changed: ${JSON.stringify(calls)}`);
  }
});

Deno.test("conversation routes validate identity/body and preserve unread/read and block results", async () => {
  const calls: unknown[] = [];
  const conversation = { id: 12, otherUser: { id: 7, username: "filmfan", displayName: null, avatarUrl: null }, updatedAt: "2026-11-09T12:00:00Z", lastMessage: null };
  const message = { id: 13, conversationId: 12, senderId: 42, body: "hello", createdAt: "2026-11-09T12:01:00Z", readAt: null };
  const handler = authHandler({
    async getConversations(_user, page, size) { calls.push(["list", page, size]); return { content: [conversation], totalPages: 1, totalElements: 1, number: page }; },
    async getUnreadMessageCount() { return 1; },
    async startConversation(_user, id) { calls.push(["start", id]); return id === 7 ? conversation : null; },
    async getConversationMessages(_user, id, page, size) { calls.push(["messages", id, page, size]); return { content: [message], totalPages: 1, totalElements: 1, number: page }; },
    async sendConversationMessage(_user, id, body) { calls.push(["send", id, body]); return id === 12 ? { ...message, body } : null; },
    async markConversationRead(_user, id) { calls.push(["read", id]); return id === 12; },
  });
  const list = await handler(new Request("https://project.supabase.co/api/conversations?page=0&size=100", { headers: { Authorization: "Bearer valid-token" } }));
  const count = await handler(new Request("https://project.supabase.co/api/conversations/unread-count", { headers: { Authorization: "Bearer valid-token" } }));
  const started = await handler(new Request("https://project.supabase.co/api/conversations", {
    method: "POST", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" }, body: JSON.stringify({ userId: 7, id: 999 }),
  }));
  const invalid = await handler(new Request("https://project.supabase.co/api/conversations/12/messages", {
    method: "POST", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" }, body: JSON.stringify({ body: "  " }),
  }));
  const page = await handler(new Request("https://project.supabase.co/api/conversations/12/messages?page=0&size=80", { headers: { Authorization: "Bearer valid-token" } }));
  const sent = await handler(new Request("https://project.supabase.co/api/conversations/12/messages", {
    method: "POST", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" }, body: JSON.stringify({ body: "  hello  ", senderId: 7 }),
  }));
  const read = await handler(new Request("https://project.supabase.co/api/conversations/12/read", { method: "POST", headers: { Authorization: "Bearer valid-token" } }));
  const missing = await handler(new Request("https://project.supabase.co/api/conversations/99/read", { method: "POST", headers: { Authorization: "Bearer valid-token" } }));
  if (list.status !== 200 || (await list.json()).content[0].id !== 12 || count.status !== 200 || (await count.json()).count !== 1
    || started.status !== 200 || invalid.status !== 400 || page.status !== 200 || (await page.json()).content[0].body !== "hello"
    || sent.status !== 200 || (await sent.json()).body !== "hello" || read.status !== 204 || missing.status !== 404
    || JSON.stringify(calls) !== JSON.stringify([["list", 0, 50], ["start", 7], ["messages", 12, 0, 50], ["send", 12, "hello"], ["read", 12], ["read", 99]])) {
    throw new Error(`Conversation API contract changed: ${JSON.stringify(calls)}`);
  }
});

Deno.test("journal routes preserve language fallback, archive filters, paging, and public access", async () => {
  const calls: unknown[] = [];
  const article = { id: 21, slug: "uk-only", language: "uk", category: "Essays", title: "Українська стаття",
    excerpt: null, content: "Текст", coverUrl: null, audioUrl: null, publishedAt: "2025-03-12T10:00:00Z" };
  const handler = handlerWith({
    async getJournal(language, category, year, month, page, size) {
      calls.push(["list", language, category, year, month, page, size]);
      return { content: [article], totalPages: 1, totalElements: 1, number: page };
    },
    async getJournalArchive(language) { calls.push(["archive", language]); return [{ year: 2025, month: 3, articleCount: 1 }]; },
    async getJournalArticle(language, slug) { calls.push(["article", language, slug]); return slug === "uk-only" ? article : null; },
  });
  const page = await handler(new Request("https://project.supabase.co/api/journal/articles?language=en&category=%20Essays%20&year=2025&month=3&page=2&size=999"));
  const archive = await handler(new Request("https://project.supabase.co/api/journal/articles/archive?language=fr"));
  const detail = await handler(new Request("https://project.supabase.co/api/journal/articles/uk-only?language=en"));
  const missing = await handler(new Request("https://project.supabase.co/api/journal/articles/missing?language=en"));
  const badArchive = await handler(new Request("https://project.supabase.co/api/journal/articles?year=2025"));
  const method = await handler(new Request("https://project.supabase.co/api/journal/articles", { method: "POST" }));
  if (page.status !== 200 || (await page.json()).content[0].language !== "uk" || archive.status !== 200
    || (await archive.json())[0].articleCount !== 1 || detail.status !== 200 || missing.status !== 404
    || badArchive.status !== 400 || method.status !== 405
    || JSON.stringify(calls) !== JSON.stringify([["list", "en", "Essays", 2025, 3, 2, 50], ["archive", "uk"], ["article", "en", "uk-only"], ["article", "en", "missing"]])) {
    throw new Error(`Journal routes changed fallback or pagination contract: ${JSON.stringify(calls)}`);
  }
});

Deno.test("newsletter subscription requires confirmed identity and accepts only a boolean preference", async () => {
  const calls: unknown[] = [];
  const handler = authHandler({
    async getNewsletterSubscription() { calls.push(["get"]); return { subscribed: false }; },
    async updateNewsletterSubscription(_user, subscribed) { calls.push(["set", subscribed]); return { subscribed }; },
  });
  const denied = await handler(new Request("https://project.supabase.co/api/newsletter/subscription"));
  const read = await handler(new Request("https://project.supabase.co/api/newsletter/subscription", { headers: { Authorization: "Bearer valid-token" } }));
  const invalid = await handler(new Request("https://project.supabase.co/api/newsletter/subscription", {
    method: "PUT", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" }, body: JSON.stringify({ subscribed: "yes" }),
  }));
  const update = await handler(new Request("https://project.supabase.co/api/newsletter/subscription", {
    method: "PUT", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" }, body: JSON.stringify({ subscribed: true, userId: 1 }),
  }));
  if (denied.status !== 401 || read.status !== 200 || (await read.json()).subscribed !== false || invalid.status !== 400
    || update.status !== 200 || (await update.json()).subscribed !== true
    || JSON.stringify(calls) !== JSON.stringify([["get"], ["set", true]])) {
    throw new Error(`Newsletter ownership/input contract changed: ${JSON.stringify(calls)}`);
  }
});

Deno.test("admin journal routes validate fields, preserve admin-only methods, and ignore privilege fields", async () => {
  const calls: unknown[] = [];
  const saved = { id: 25, slug: "managed", language: "en", category: "Film", title: "Managed", excerpt: null,
    content: "Body", coverUrl: null, audioUrl: null, publishedAt: null };
  const handler = authHandler({
    async getAdminJournalArticles(_user, page, size) {
      calls.push(["list", page, size]);
      return { content: [saved], totalPages: 1, totalElements: 1, number: page };
    },
    async createAdminJournalArticle(_user, body) { calls.push(["create", body]); return saved; },
    async updateAdminJournalArticle(_user, id, body) { calls.push(["update", id, body]); return id === 25 ? saved : null; },
  });
  const denied = await authHandler({})(new Request("https://project.supabase.co/api/admin/journal/articles"));
  const list = await handler(new Request("https://project.supabase.co/api/admin/journal/articles?page=1&size=200", { headers: { Authorization: "Bearer valid-token" } }));
  const invalid = await handler(new Request("https://project.supabase.co/api/admin/journal/articles", {
    method: "POST", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ slug: "x", language: "fr", category: "Film", title: "Title", content: "Body", audioUrl: "javascript:alert(1)" }),
  }));
  const create = await handler(new Request("https://project.supabase.co/api/admin/journal/articles", {
    method: "POST", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ slug: " managed ", language: "en", category: " Film ", title: " Managed ", content: "Body", published: true, authorId: 999, role: "ADMIN" }),
  }));
  const missing = await handler(new Request("https://project.supabase.co/api/admin/journal/articles/999", {
    method: "PUT", headers: { Authorization: "Bearer valid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ slug: "managed", language: "en", category: "Film", title: "Managed", content: "Body" }),
  }));
  const createdBody = (calls.find((call) => Array.isArray(call) && call[0] === "create") as [string, Record<string, unknown>] | undefined)?.[1];
  if (denied.status !== 401 || list.status !== 200 || (await list.json()).number !== 1 || invalid.status !== 400
    || create.status !== 200 || (await create.json()).id !== 25 || createdBody?.slug !== "managed"
    || Object.hasOwn(createdBody ?? {}, "authorId") || Object.hasOwn(createdBody ?? {}, "role") || missing.status !== 404
    || JSON.stringify(calls.map((call) => Array.isArray(call) && call[0] === "create" ? [call[0], (call[1] as AdminJournalArticleRequest).published] : call))
      !== JSON.stringify([["list", 1, 100], ["create", true], ["update", 999, { slug: "managed", language: "en", category: "Film", title: "Managed", excerpt: null, content: "Body", coverUrl: null, audioUrl: null, published: false }]])) {
    throw new Error(`Admin journal route validation/response contract changed: ${JSON.stringify(calls)}`);
  }
});

Deno.test("admin newsletter routes queue published articles and return delivery status", async () => {
  const calls: unknown[] = [];
  const handler = authHandler({
    async queueAdminNewsletter(_user, articleId) { calls.push(["queue", articleId]); return { articleId, recipients: 2 }; },
    async getAdminNewsletterStatus(_user, articleId) {
      calls.push(["status", articleId]);
      return articleId === 7 ? { articleId, pending: 2, sending: 0, sent: 1, failed: 0, cancelled: 0 } : null;
    },
  });
  const headers = { Authorization: "Bearer valid-token" };
  const unauthenticated = await authHandler({})(new Request("https://project.supabase.co/api/admin/journal/articles/7/newsletter", { method: "POST" }));
  const queued = await handler(new Request("https://project.supabase.co/api/admin/journal/articles/7/newsletter", { method: "POST", headers }));
  const status = await handler(new Request("https://project.supabase.co/api/admin/journal/articles/7/newsletter", { headers }));
  const missing = await handler(new Request("https://project.supabase.co/api/admin/journal/articles/99/newsletter", { headers }));
  const invalidMethod = await handler(new Request("https://project.supabase.co/api/admin/journal/articles/7/newsletter", { method: "PUT", headers }));
  if (unauthenticated.status !== 401 || queued.status !== 200 || (await queued.json()).recipients !== 2
    || status.status !== 200 || (await status.json()).pending !== 2 || missing.status !== 404 || invalidMethod.status !== 405
    || JSON.stringify(calls) !== JSON.stringify([["queue", 7], ["status", 7], ["status", 99]])) {
    throw new Error(`Admin newsletter contract changed: ${JSON.stringify({ calls, statuses: [unauthenticated.status, queued.status, status.status, missing.status, invalidMethod.status] })}`);
  }
});

Deno.test("admin moderation routes preserve filters, status codes, audit payloads, and bulk validation", async () => {
  const calls: unknown[] = [];
  const review = { id: 21, movieId: 7, movieTitle: "Film", userId: 3, username: "member", content: "Review",
    rating: 4, isHidden: true, moderatedReason: "Rule", moderatedAt: "2026-11-09T12:00:00Z", createdAt: "2026-11-08T12:00:00Z" };
  const comment = { id: 31, reviewId: 21, userId: 4, username: "commenter", content: "Comment", isHidden: false,
    moderatedReason: null, moderatedAt: null, createdAt: "2026-11-08T13:00:00Z" };
  const queueItem = { type: "REVIEW" as const, id: 22, parentId: null, movieId: 7, subject: "Film", userId: 5,
    username: "queue-user", content: "Needs review", createdAt: "2026-11-07T10:00:00Z" };
  const handler = authHandler({
    async getAdminReviews(_user, filters, page, size) {
      calls.push(["reviews", filters, page, size]);
      return { content: [review], totalPages: 1, totalElements: 1, number: page };
    },
    async setAdminReviewHidden(_user, id, hidden, reason) { calls.push(["review-hidden", id, hidden, reason]); return { ...review, id, isHidden: hidden, moderatedReason: reason }; },
    async deleteAdminReview(_user, id) { calls.push(["review-delete", id]); return id === 21; },
    async getAdminComments(_user, hidden, page, size) { calls.push(["comments", hidden, page, size]); return { content: [comment], totalPages: 1, totalElements: 1, number: page }; },
    async setAdminCommentHidden(_user, id, hidden, reason) { calls.push(["comment-hidden", id, hidden, reason]); return { ...comment, id, isHidden: hidden, moderatedReason: reason }; },
    async deleteAdminComment(_user, id) { calls.push(["comment-delete", id]); return id === 31; },
    async getAdminModerationQueue(_user, type, query, page, size) { calls.push(["queue", type, query, page, size]); return { content: [queueItem], totalPages: 1, totalElements: 1, number: page }; },
    async hideAdminModerationItem(_user, type, id, reason) { calls.push(["queue-hide", type, id, reason]); },
    async bulkHideAdminModeration(_user, items, reason) { calls.push(["bulk", items, reason]); return items.length; },
  });
  const headers = { Authorization: "Bearer valid-token", "Content-Type": "application/json" };
  const denied = await authHandler({})(new Request("https://project.supabase.co/api/admin/reviews"));
  const reviewList = await handler(new Request("https://project.supabase.co/api/admin/reviews?movieId=7&userId=3&hidden=true&page=-2&size=100", { headers }));
  const invalidList = await handler(new Request("https://project.supabase.co/api/admin/reviews?hidden=perhaps", { headers }));
  const reviewHide = await handler(new Request("https://project.supabase.co/api/admin/reviews/21/hide", { method: "POST", headers, body: JSON.stringify({ reason: " Rule ", role: "ADMIN" }) }));
  const reviewUnhide = await handler(new Request("https://project.supabase.co/api/admin/reviews/21/unhide", { method: "POST", headers: { Authorization: "Bearer valid-token" } }));
  const reviewDelete = await handler(new Request("https://project.supabase.co/api/admin/reviews/21", { method: "DELETE", headers }));
  const missingComment = await handler(new Request("https://project.supabase.co/api/admin/comments/99", { method: "DELETE", headers }));
  const queue = await handler(new Request("https://project.supabase.co/api/admin/moderation/queue?type=comment&query=%20name%20&page=1&size=75", { headers }));
  const invalidType = await handler(new Request("https://project.supabase.co/api/admin/moderation/queue?type=movie", { headers }));
  const queueHide = await handler(new Request("https://project.supabase.co/api/admin/moderation/COMMENT/31/hide", { method: "POST", headers, body: JSON.stringify({ reason: "Spam" }) }));
  const bulk = await handler(new Request("https://project.supabase.co/api/admin/moderation/bulk-hide", { method: "POST", headers, body: JSON.stringify({ items: [{ type: "REVIEW", id: 22 }, { type: "COMMENT", id: 32 }], reason: "Repeated abuse" }) }));
  const invalidBulk = await handler(new Request("https://project.supabase.co/api/admin/moderation/bulk-hide", { method: "POST", headers, body: JSON.stringify({ items: [], reason: " " }) }));
  const forbidden = authHandler({ async getAdminReviews() { throw new RewindApiError(403, "Administrator access required"); } });
  const forbiddenList = await forbidden(new Request("https://project.supabase.co/api/admin/reviews", { headers }));
  const reviewListBody = await reviewList.json();
  const queueBody = await queue.json();
  if (denied.status !== 401 || reviewList.status !== 200 || reviewListBody.content[0].movieTitle !== "Film"
    || invalidList.status !== 400 || reviewHide.status !== 200 || (await reviewHide.json()).moderatedReason !== " Rule "
    || reviewUnhide.status !== 200 || (await reviewUnhide.json()).moderatedReason !== null
    || reviewDelete.status !== 204 || missingComment.status !== 404
    || queue.status !== 200 || queueBody.content[0].type !== "REVIEW" || invalidType.status !== 400
    || queueHide.status !== 200 || (await queueHide.text()) !== "" || bulk.status !== 200 || (await bulk.json()).hidden !== 2
    || invalidBulk.status !== 400 || forbiddenList.status !== 403
    || JSON.stringify(calls) !== JSON.stringify([
      ["reviews", { movieId: 7, userId: 3, hidden: true }, 0, 50], ["review-hidden", 21, true, " Rule "],
      ["review-hidden", 21, false, null], ["review-delete", 21], ["comment-delete", 99],
      ["queue", "COMMENT", " name ", 1, 50], ["queue-hide", "COMMENT", 31, "Spam"],
      ["bulk", [{ type: "REVIEW", id: 22 }, { type: "COMMENT", id: 32 }], "Repeated abuse"],
    ])) {
    throw new Error(`Admin moderation contract changed: ${JSON.stringify({ calls, statuses: [denied.status, reviewList.status, invalidList.status, reviewHide.status, reviewUnhide.status, reviewDelete.status, missingComment.status, queue.status, invalidType.status, queueHide.status, bulk.status, invalidBulk.status, forbiddenList.status] })}`);
  }
});

Deno.test("admin user routes preserve paging, fields, validation, active/HQ actions, and overview contracts", async () => {
  const calls: unknown[] = [];
  const user = { id: 8, username: "cinephile", displayName: "Film Fan", email: "person@example.test", role: "USER",
    avatarUrl: null, isActive: true, isHq: false, createdAt: "2026-11-01T10:00:00Z" };
  const handler = authHandler({
    async getAdminUsers(_auth, query, page, size) { calls.push(["list", query, page, size]); return { content: [user], totalPages: 1, totalElements: 1, number: page }; },
    async getAdminUser(_auth, id) { calls.push(["get", id]); return id === 8 ? user : null; },
    async getAdminUserOverview(_auth, id) {
      calls.push(["overview", id]);
      return id === 8 ? { stats: { watched: 3, reviews: 2, ratings: 4, watchlist: 5, favorites: 6, comments: 7, likesReceived: 8, customLists: 1 }, adminHistory: [] } : null;
    },
    async updateAdminUser(_auth, id, update) { calls.push(["update", id, update]); return id === 8 ? { ...user, ...update } : null; },
    async setAdminUserActive(_auth, id, active) { calls.push(["active", id, active]); return id === 8; },
    async setAdminUserHq(_auth, id, hq) { calls.push(["hq", id, hq]); return id === 8 ? { ...user, isHq: hq } : null; },
  });
  const headers = { Authorization: "Bearer valid-token", "Content-Type": "application/json" };
  const unauthenticated = await authHandler({})(new Request("https://project.supabase.co/api/admin/users"));
  const list = await handler(new Request("https://project.supabase.co/api/admin/users?q=%20FILM%20&page=-2&size=80", { headers }));
  const get = await handler(new Request("https://project.supabase.co/api/admin/users/8", { headers }));
  const missing = await handler(new Request("https://project.supabase.co/api/admin/users/99/overview", { headers }));
  const overview = await handler(new Request("https://project.supabase.co/api/admin/users/8/overview", { headers }));
  const updated = await handler(new Request("https://project.supabase.co/api/admin/users/8", { method: "PATCH", headers,
    body: JSON.stringify({ username: "  cinephile2  ", displayName: "Updated", avatarUrl: "https://example.test/avatar.png", role: " admin ", isActive: false, email: "attacker@example.test", id: 99 }) }));
  const invalidUpdate = await handler(new Request("https://project.supabase.co/api/admin/users/8", { method: "PATCH", headers, body: JSON.stringify({ role: "OWNER" }) }));
  const invalidName = await handler(new Request("https://project.supabase.co/api/admin/users/8", { method: "PATCH", headers, body: JSON.stringify({ username: " " }) }));
  const deactivated = await handler(new Request("https://project.supabase.co/api/admin/users/8/deactivate", { method: "POST", headers }));
  const activated = await handler(new Request("https://project.supabase.co/api/admin/users/8/activate", { method: "POST", headers }));
  const invalidHq = await handler(new Request("https://project.supabase.co/api/admin/users/8/hq", { method: "PUT", headers, body: JSON.stringify({ hq: "true" }) }));
  const hq = await handler(new Request("https://project.supabase.co/api/admin/users/8/hq", { method: "PUT", headers, body: JSON.stringify({ hq: true }) }));
  const forbidden = await authHandler({ async getAdminUsers() { throw new RewindApiError(403, "Administrator access required"); } })(
    new Request("https://project.supabase.co/api/admin/users", { headers }),
  );
  if (unauthenticated.status !== 401 || list.status !== 200 || (await list.json()).number !== 0
    || get.status !== 200 || (await get.json()).email !== user.email || missing.status !== 404
    || overview.status !== 200 || (await overview.json()).stats.likesReceived !== 8
    || updated.status !== 200 || (await updated.json()).role !== "ADMIN" || invalidUpdate.status !== 400 || invalidName.status !== 400
    || deactivated.status !== 200 || activated.status !== 200 || invalidHq.status !== 400 || hq.status !== 200
    || forbidden.status !== 403
    || JSON.stringify(calls) !== JSON.stringify([
      ["list", "FILM", 0, 50], ["get", 8], ["overview", 99], ["overview", 8],
      ["update", 8, { username: "  cinephile2  ", displayName: "Updated", avatarUrl: "https://example.test/avatar.png", role: "ADMIN", isActive: false }],
      ["active", 8, false], ["active", 8, true], ["hq", 8, true],
    ])) {
    throw new Error(`Admin user contract changed: ${JSON.stringify({ calls, statuses: [unauthenticated.status, list.status, get.status, missing.status, overview.status, updated.status, invalidUpdate.status, invalidName.status, deactivated.status, activated.status, invalidHq.status, hq.status, forbidden.status] })}`);
  }
});

Deno.test("admin list routes preserve paging, visibility updates, deletion guards, and authorization", async () => {
  const calls: unknown[] = [];
  const list = { id: 19, userId: 4, username: "member", name: "Favorites", description: "Films",
    listType: "CUSTOM" as const, isPublic: true, itemCount: 3, createdAt: "2026-11-01T10:00:00Z", updatedAt: "2026-11-09T10:00:00Z" };
  const handler = authHandler({
    async getAdminLists(_auth, page, size) { calls.push(["list", page, size]); return { content: [list], totalPages: 1, totalElements: 1, number: page }; },
    async setAdminListVisibility(_auth, id, visible) { calls.push(["visibility", id, visible]); return id === 19 ? { ...list, isPublic: visible } : null; },
    async deleteAdminList(_auth, id) { calls.push(["delete", id]); return id === 19 ? "OK" : id === 20 ? "SYSTEM_LIST" : "NOT_FOUND"; },
  });
  const headers = { Authorization: "Bearer valid-token" };
  const unauthenticated = await authHandler({})(new Request("https://project.supabase.co/api/admin/lists"));
  const page = await handler(new Request("https://project.supabase.co/api/admin/lists?page=-1&size=500", { headers }));
  const invalidPage = await handler(new Request("https://project.supabase.co/api/admin/lists?page=bad", { headers }));
  const hide = await handler(new Request("https://project.supabase.co/api/admin/lists/19/visibility?visible=false", { method: "PUT", headers }));
  const invalidVisibility = await handler(new Request("https://project.supabase.co/api/admin/lists/19/visibility?visible=yes", { method: "PUT", headers }));
  const missing = await handler(new Request("https://project.supabase.co/api/admin/lists/99/visibility?visible=true", { method: "PUT", headers }));
  const deleted = await handler(new Request("https://project.supabase.co/api/admin/lists/19", { method: "DELETE", headers }));
  const systemDelete = await handler(new Request("https://project.supabase.co/api/admin/lists/20", { method: "DELETE", headers }));
  if (unauthenticated.status !== 401 || page.status !== 200 || (await page.json()).content[0].itemCount !== 3
    || invalidPage.status !== 400 || hide.status !== 200 || (await hide.json()).isPublic !== false
    || invalidVisibility.status !== 400 || missing.status !== 404 || deleted.status !== 204
    || systemDelete.status !== 400 || JSON.stringify(calls) !== JSON.stringify([["list", 0, 100], ["visibility", 19, false], ["visibility", 99, true], ["delete", 19], ["delete", 20]])) {
    throw new Error(`Admin list contract changed: ${JSON.stringify({ calls, statuses: [unauthenticated.status, page.status, invalidPage.status, hide.status, invalidVisibility.status, missing.status, deleted.status, systemDelete.status] })}`);
  }
});

Deno.test("admin dashboard, audit, and site settings preserve authorization and validation", async () => {
  const calls: unknown[] = [];
  const setting = { key: "default_locale", value: "en", updatedBy: 8, updatedAt: "2026-11-09T12:00:00Z" };
  const handler = authHandler({
    async getAdminDashboard() { calls.push(["dashboard"]); return { users: 9, activeUsers: 8, hqUsers: 2, movies: 50, reviews: 4, hiddenReviews: 1 }; },
    async getAdminAuditLogs(_auth, page, size) { calls.push(["audit", page, size]); return { content: [{ id: 2, adminId: 8, action: "SITE_SETTING_UPDATED", targetType: "SITE_SETTING", targetId: null, metadata: "default_locale", createdAt: setting.updatedAt }], totalPages: 1, totalElements: 1, number: page }; },
    async getAdminSettings() { calls.push(["settings"]); return [setting]; },
    async updateAdminSetting(_auth, key, value) { calls.push(["update", key, value]); return key === setting.key ? { ...setting, value } : null; },
  });
  const headers = { Authorization: "Bearer valid-token", "Content-Type": "application/json" };
  const dashboard = await handler(new Request("https://project.supabase.co/api/admin/dashboard", { headers }));
  const audit = await handler(new Request("https://project.supabase.co/api/admin/audit-logs?page=0&size=500", { headers }));
  const settings = await handler(new Request("https://project.supabase.co/api/admin/settings", { headers }));
  const update = await handler(new Request("https://project.supabase.co/api/admin/settings/default_locale", { method: "PUT", headers, body: JSON.stringify({ value: " UK " }) }));
  const invalidValue = await handler(new Request("https://project.supabase.co/api/admin/settings/maintenance_mode", { method: "PUT", headers, body: JSON.stringify({ value: "sometimes" }) }));
  const invalidKey = await handler(new Request("https://project.supabase.co/api/admin/settings/role", { method: "PUT", headers, body: JSON.stringify({ value: "ADMIN" }) }));
  const unauthenticated = await authHandler({})(new Request("https://project.supabase.co/api/admin/dashboard"));
  if (dashboard.status !== 200 || (await dashboard.json()).hiddenReviews !== 1 || audit.status !== 200 || (await audit.json()).content[0].metadata !== "default_locale"
    || settings.status !== 200 || (await settings.json())[0].value !== "en" || update.status !== 200 || (await update.json()).value !== "UK"
    || invalidValue.status !== 400 || invalidKey.status !== 400 || unauthenticated.status !== 401
    || JSON.stringify(calls) !== JSON.stringify([["dashboard"], ["audit", 0, 100], ["settings"], ["update", "default_locale", "UK"]])) {
    throw new Error(`Admin dashboard/settings contract changed: ${JSON.stringify({ calls, statuses: [dashboard.status, audit.status, settings.status, update.status, invalidValue.status, invalidKey.status, unauthenticated.status] })}`);
  }
});

Deno.test("admin movie catalog routes preserve paging, validation, edits, deletes, and authorization", async () => {
  const calls: unknown[] = [];
  const movie = { id: 10, tmdbId: null, title: "Test Film", releaseDate: "2024-02-29", rating: 8.2, photoUrl: null };
  const handler = authHandler({
    async getAdminTmdbQuality() { calls.push(["quality"]); return { totalMovies: 50, tmdbLinkedMovies: 40, completeTmdbMovies: 20, missingPoster: 3, missingBackdrop: 4, missingPlot: 5, missingRuntime: 6, missingTrailer: 7, missingTmdbRating: 8, linkedCoveragePercent: 80, metadataCompletenessPercent: 50 }; },
    async getAdminMovies(_user, query, page, size) { calls.push(["list", query, page, size]); return { content: [movie], totalPages: 1, totalElements: 1, number: page }; },
    async createAdminMovie(_user, body) { calls.push(["create", body]); return { ...movie, title: body.title! }; },
    async updateAdminMovie(_user, id, body) { calls.push(["update", id, body]); return id === 10 ? { ...movie, ...body } : null; },
    async deleteAdminMovie(_user, id) { calls.push(["delete", id]); return id === 10; },
  });
  const headers = { Authorization: "Bearer valid-token", "Content-Type": "application/json" };
  const quality = await handler(new Request("https://project.supabase.co/api/admin/movies/tmdb-quality", { headers }));
  const list = await handler(new Request("https://project.supabase.co/api/admin/movies?q=%20film%20&page=-1&size=300", { headers }));
  const invalidQuery = await handler(new Request(`https://project.supabase.co/api/admin/movies?q=${"x".repeat(121)}`, { headers }));
  const invalidMovie = await handler(new Request("https://project.supabase.co/api/admin/movies", { method: "POST", headers, body: JSON.stringify({ title: "  " }) }));
  const created = await handler(new Request("https://project.supabase.co/api/admin/movies", { method: "POST", headers,
    body: JSON.stringify({ title: "New Film", rating: 9, trailerUrl: "https://example.test/trailer", tmdbId: 999, role: "ADMIN" }) }));
  const invalidDate = await handler(new Request("https://project.supabase.co/api/admin/movies/10", { method: "PUT", headers, body: JSON.stringify({ releaseDate: "2024-02-30" }) }));
  const invalidTrailer = await handler(new Request("https://project.supabase.co/api/admin/movies/10", { method: "PUT", headers, body: JSON.stringify({ trailerUrl: "javascript:alert(1)" }) }));
  const updated = await handler(new Request("https://project.supabase.co/api/admin/movies/10", { method: "PUT", headers, body: JSON.stringify({ title: "Updated Film", tmdbId: 123, role: "ADMIN" }) }));
  const missing = await handler(new Request("https://project.supabase.co/api/admin/movies/99", { method: "DELETE", headers }));
  const deleted = await handler(new Request("https://project.supabase.co/api/admin/movies/10", { method: "DELETE", headers }));
  const unauthenticated = await authHandler({})(new Request("https://project.supabase.co/api/admin/movies"));
  if (quality.status !== 200 || (await quality.json()).metadataCompletenessPercent !== 50
    || list.status !== 200 || (await list.json()).content[0].id !== 10 || invalidQuery.status !== 400 || invalidMovie.status !== 400
    || created.status !== 200 || (await created.json()).tmdbId !== null || invalidDate.status !== 400 || invalidTrailer.status !== 400
    || updated.status !== 200 || (await updated.json()).title !== "Updated Film" || missing.status !== 404 || deleted.status !== 204 || unauthenticated.status !== 401
    || JSON.stringify(calls) !== JSON.stringify([
      ["quality"], ["list", "film", 0, 100], ["create", { title: "New Film", trailerUrl: "https://example.test/trailer", rating: 9 }],
      ["update", 10, { title: "Updated Film" }], ["delete", 99], ["delete", 10],
    ])) {
    throw new Error(`Admin movie contract changed: ${JSON.stringify({ calls, statuses: [quality.status, list.status, invalidQuery.status, invalidMovie.status, created.status, invalidDate.status, invalidTrailer.status, updated.status, missing.status, deleted.status, unauthenticated.status] })}`);
  }
});

Deno.test("admin communications routes preserve notification filters, read state, deletes, and conversation paging", async () => {
  const calls: unknown[] = [];
  const notification = { id: 42, recipientId: 17, actorId: 8, type: "FOLLOW" as const, reviewId: null,
    createdAt: "2026-11-09T12:00:00Z", readAt: null };
  const handler = authHandler({
    async getAdminNotifications(_user, filters, page, size) {
      calls.push(["notifications", filters, page, size]);
      return { content: [notification], totalPages: 1, totalElements: 1, number: page };
    },
    async createAdminNotification(_user, body) { calls.push(["notification-create", body]); return notification; },
    async setAdminNotificationRead(_user, id, read) { calls.push(["notification-read", id, read]); return id === 42 ? { ...notification, readAt: read ? "2026-11-09T12:01:00Z" : null } : null; },
    async markAdminNotificationsRead(_user, type, recipientId) { calls.push(["notification-read-all", type, recipientId]); return 3; },
    async deleteAdminNotification(_user, id) { calls.push(["notification-delete", id]); return id === 42; },
    async deleteAdminNotifications(_user, filters) { calls.push(["notification-delete-all", filters]); return 2; },
    async getAdminConversations(_user, page, size) { calls.push(["conversations", page, size]); return { content: [], totalPages: 0, totalElements: 0, number: page }; },
    async deleteAdminConversation(_user, id) { calls.push(["conversation-delete", id]); return id === 7; },
  });
  const headers = { Authorization: "Bearer valid-token", "Content-Type": "application/json" };
  const unauthenticated = await authHandler({})(new Request("https://project.supabase.co/api/admin/notifications"));
  const list = await handler(new Request("https://project.supabase.co/api/admin/notifications?type=FOLLOW&read=false&recipientId=17&page=0&size=500", { headers }));
  const invalidFilter = await handler(new Request("https://project.supabase.co/api/admin/notifications?type=follow", { headers }));
  const invalidCreate = await handler(new Request("https://project.supabase.co/api/admin/notifications", { method: "POST", headers, body: JSON.stringify({ recipientId: 8, actorId: 8, type: "FOLLOW", relatedUserId: 8 }) }));
  const created = await handler(new Request("https://project.supabase.co/api/admin/notifications", { method: "POST", headers, body: JSON.stringify({ recipientId: 17, actorId: 8, type: "FOLLOW", relatedUserId: 8, role: "ADMIN" }) }));
  const markedRead = await handler(new Request("https://project.supabase.co/api/admin/notifications/42/read", { method: "PATCH", headers }));
  const missing = await handler(new Request("https://project.supabase.co/api/admin/notifications/99/unread", { method: "PATCH", headers }));
  const readAll = await handler(new Request("https://project.supabase.co/api/admin/notifications/read-all?type=REVIEW_LIKED&recipientId=17", { method: "PATCH", headers }));
  const deleted = await handler(new Request("https://project.supabase.co/api/admin/notifications?type=FOLLOW&read=true&recipientId=17", { method: "DELETE", headers }));
  const deleteOne = await handler(new Request("https://project.supabase.co/api/admin/notifications/42", { method: "DELETE", headers }));
  const conversationList = await handler(new Request("https://project.supabase.co/api/admin/conversations?page=-1&size=500", { headers }));
  const conversationDelete = await handler(new Request("https://project.supabase.co/api/admin/conversations/7", { method: "DELETE", headers }));
  const missingConversation = await handler(new Request("https://project.supabase.co/api/admin/conversations/99", { method: "DELETE", headers }));
  if (unauthenticated.status !== 401 || list.status !== 200 || (await list.json()).content[0].id !== 42
    || invalidFilter.status !== 400 || invalidCreate.status !== 400 || created.status !== 200
    || markedRead.status !== 200 || missing.status !== 404 || readAll.status !== 200 || (await readAll.json()).updated !== 3
    || deleted.status !== 200 || (await deleted.json()).deleted !== 2 || deleteOne.status !== 200 || (await deleteOne.text()) !== ""
    || conversationList.status !== 200 || conversationDelete.status !== 200 || missingConversation.status !== 404
    || JSON.stringify(calls) !== JSON.stringify([
      ["notifications", { type: "FOLLOW", read: false, recipientId: 17 }, 0, 100],
      ["notification-create", { recipientId: 17, actorId: 8, type: "FOLLOW", relatedUserId: 8, reviewId: null }],
      ["notification-read", 42, true], ["notification-read", 99, false], ["notification-read-all", "REVIEW_LIKED", 17],
      ["notification-delete-all", { type: "FOLLOW", read: true, recipientId: 17 }], ["notification-delete", 42],
      ["conversations", 0, 100], ["conversation-delete", 7], ["conversation-delete", 99],
    ])) {
    throw new Error(`Admin communications contract changed: ${JSON.stringify({ calls, statuses: [unauthenticated.status, list.status, invalidFilter.status, invalidCreate.status, created.status, markedRead.status, missing.status, readAll.status, deleted.status, deleteOne.status, conversationList.status, conversationDelete.status, missingConversation.status] })}`);
  }
});

Deno.test("admin TMDB routes validate imports and preserve sync and discovery response contracts", async () => {
  const calls: unknown[] = [];
  const response = { movieId: 12, tmdbId: 120, title: "Synced", genresUpdated: 2, actorsUpdated: 3,
    directorsUpdated: 1, producersUpdated: 1, similarMoviesLinked: 4, trailerUpdated: true };
  const handler = authHandler({
    async searchAdminMovieTmdbCandidates(_user, movieId) { calls.push(["candidates", movieId]); return [{ tmdbId: 120, title: "Test Film", releaseDate: "2024-01-01", overview: null, posterUrl: null }]; },
    async syncAdminTmdbMovie(_user, input) { calls.push(["sync", input]); return response; },
    async syncAdminTmdbBatch(_user, inputs, syncSimilar) { calls.push(["batch", inputs, syncSimilar]); return { requested: inputs.length, succeeded: inputs.length, failed: 0, items: [] }; },
    async importAdminTmdb(_user, ids, syncSimilar) { calls.push(["import", ids, syncSimilar]); return { requested: ids.length, succeeded: ids.length, failed: 0, items: [] }; },
    async discoverAndImportAdminTmdb(_user, input) { calls.push(["discover", input]); return { page: input.page, totalPages: 3, totalResults: 2, discovered: 1, imports: { requested: 1, succeeded: 1, failed: 0, items: [] } }; },
  });
  const headers = { Authorization: "Bearer valid-token", "Content-Type": "application/json" };
  const unauth = await authHandler({})(new Request("https://project.supabase.co/api/admin/movies/12/tmdb-sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tmdbId: 120 }) }));
  const unauthCandidates = await authHandler({})(new Request("https://project.supabase.co/api/admin/movies/12/tmdb-candidates"));
  const candidates = await handler(new Request("https://project.supabase.co/api/admin/movies/12/tmdb-candidates", { headers }));
  const invalidCandidates = await handler(new Request("https://project.supabase.co/api/admin/movies/0/tmdb-candidates", { headers }));
  const invalid = await handler(new Request("https://project.supabase.co/api/admin/movies/tmdb-import", { method: "POST", headers, body: JSON.stringify({ tmdbIds: [1, 1] }) }));
  const sync = await handler(new Request("https://project.supabase.co/api/admin/movies/12/tmdb-sync", { method: "POST", headers, body: JSON.stringify({ tmdbId: 120 }) }));
  const batch = await handler(new Request("https://project.supabase.co/api/admin/movies/tmdb-sync/batch", { method: "POST", headers, body: JSON.stringify({ movies: [{ movieId: 12, tmdbId: 120 }], syncSimilar: false }) }));
  const imported = await handler(new Request("https://project.supabase.co/api/admin/movies/tmdb-import", { method: "POST", headers, body: JSON.stringify({ tmdbIds: [120] }) }));
  const discovered = await handler(new Request("https://project.supabase.co/api/admin/movies/tmdb-import/discover", { method: "POST", headers, body: JSON.stringify({ page: 2, year: 2020, genreId: 18, minRating: 7, limit: 5 }) }));
  if (unauth.status !== 401 || unauthCandidates.status !== 401 || candidates.status !== 200 || (await candidates.json())[0]?.tmdbId !== 120 || invalidCandidates.status !== 400 || invalid.status !== 400 || sync.status !== 200 || JSON.stringify(await sync.json()) !== JSON.stringify(response)
    || batch.status !== 200 || imported.status !== 200 || discovered.status !== 200
    || JSON.stringify(calls) !== JSON.stringify([
      ["candidates", 12], ["sync", { movieId: 12, tmdbId: 120, syncSimilar: true }], ["batch", [{ movieId: 12, tmdbId: 120, syncSimilar: false }], false],
      ["import", [120], true], ["discover", { page: 2, year: 2020, genreId: 18, minRating: 7, limit: 5, syncSimilar: true }],
    ])) throw new Error(`TMDB route contract failed: ${JSON.stringify({ statuses: [unauth.status, unauthCandidates.status, candidates.status, invalidCandidates.status, invalid.status, sync.status, batch.status, imported.status, discovered.status], calls })}`);
});
