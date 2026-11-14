import { parseCreateReview, parseReviewUpdate } from "./http/parsers/reviews.ts";
import type { ReviewMutationRequest } from "./contracts/reviews.ts";
import { createRewindApiHandler } from "./handler.ts";
import type { RewindApiRepository } from "./contracts/repository.ts";
import type { ProfileResponse, ProfileUpdateRequest, ReplyPreference } from "./contracts/profile.ts";
import { parseProfileUpdate } from "./http/parsers/profile.ts";

const baseRepository: RewindApiRepository = {
  async listGenres() { return []; },
  async searchMovies() { return { content: [], totalPages: 0, totalElements: 0, number: 0 }; },
  async getMovieDetails() { return null; },
  async searchPeople() { return { content: [], totalPages: 0, totalElements: 0, number: 0 }; },
  async getPersonFilmography() { return null; },
};

function handler(repository: Partial<RewindApiRepository>) {
  return createRewindApiHandler({ ...baseRepository, ...repository }, [], {
    async verifyAccessToken(token) {
      return token === "confirmed" ? {
        id: "test-auth-user", email: "reply-test@example.invalid", username: "reply-test", emailConfirmed: true,
      } : null;
    },
  });
}

function authenticatedRequest(path: string, body: unknown, method = "PATCH") {
  return new Request(`https://project.supabase.co/api${path}`, {
    method,
    headers: { Authorization: "Bearer confirmed", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

Deno.test("reply preference parser preserves omission and accepts only explicit supported strings", () => {
  const omitted = parseProfileUpdate({ displayName: "Reader", role: "ADMIN" });
  if (JSON.stringify(omitted) !== JSON.stringify({ displayName: "Reader" })) {
    throw new Error("Omitted reply preference must stay omitted and privilege fields must remain ignored");
  }
  for (const preference of ["ANYONE", "FOLLOWED", "SELF"] as const) {
    if (parseProfileUpdate({ replyPreference: preference })?.replyPreference !== preference) {
      throw new Error(`Supported reply preference rejected: ${preference}`);
    }
  }
  for (const preference of [null, undefined, "", "anyone", " ANYONE ", true, 1, [], {}]) {
    if (parseProfileUpdate({ replyPreference: preference }) !== null) {
      throw new Error("Invalid reply preference reached the profile repository");
    }
  }
});

Deno.test("own-profile routes return the persisted reply preference and reject explicit null before mutation", async () => {
  let preference: ReplyPreference = "ANYONE";
  const updates: ProfileUpdateRequest[] = [];
  const profile = (): ProfileResponse => ({
    id: 7, username: "reply-test", displayName: "Reader", email: "reply-test@example.invalid",
    role: "USER", avatarUrl: null, supabaseLinked: true, replyPreference: preference,
    stats: { watched: 0, watchlist: 0, favorites: 0, reviews: 0, ratings: 0 },
    lists: [], recentRatings: [], recentReviews: [],
  });
  const api = handler({
    async updateMyProfile(user, update) {
      if (user.id !== "test-auth-user") throw new Error("Profile mutation lost authenticated identity");
      updates.push(update);
      if (update.replyPreference !== undefined) preference = update.replyPreference;
    },
    async getMyProfile() { return profile(); },
  });
  const saved = await api(authenticatedRequest("/profile/me", { replyPreference: "SELF", userId: 99 }));
  const omitted = await api(authenticatedRequest("/profile/me", { displayName: "Reader" }));
  const invalid = await api(authenticatedRequest("/profile/me", { replyPreference: null }));
  const read = await api(new Request("https://project.supabase.co/api/profile/me", {
    headers: { Authorization: "Bearer confirmed" },
  }));
  if (saved.status !== 200 || (await saved.json()).replyPreference !== "SELF"
    || omitted.status !== 200 || (await omitted.json()).replyPreference !== "SELF"
    || invalid.status !== 400 || read.status !== 200 || (await read.json()).replyPreference !== "SELF"
    || JSON.stringify(updates) !== JSON.stringify([{ replyPreference: "SELF" }, { displayName: "Reader" }])) {
    throw new Error("Profile reply preference save/omission/readback contract changed");
  }
});

Deno.test("comment creation exposes reply denial as 403 while preserving auth, missing targets and successful responses", async () => {
  let calls = 0;
  const comment = {
    id: 12, reviewId: 8, userId: 7, username: "reply-test", userAvatarUrl: null,
    text: "A reply", createdAt: "2026-11-14T00:00:00Z", updatedAt: "2026-11-14T00:00:00Z",
  };
  const api = handler({
    async createReviewComment(user, reviewId, text) {
      calls++;
      if (user.id !== "test-auth-user" || text !== "A reply") throw new Error("Comment creation lost its actor or text");
      if (reviewId === 8) return "FORBIDDEN";
      return reviewId === 9 ? null : comment;
    },
  });
  const unauthenticated = await api(new Request("https://project.supabase.co/api/reviews/8/comments", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "A reply" }),
  }));
  const denied = await api(authenticatedRequest("/reviews/8/comments", { text: "A reply", userId: 99 }, "POST"));
  const missing = await api(authenticatedRequest("/reviews/9/comments", { text: "A reply" }, "POST"));
  const created = await api(authenticatedRequest("/reviews/10/comments", { text: "A reply" }, "POST"));
  if (unauthenticated.status !== 401 || denied.status !== 403 || missing.status !== 404
    || created.status !== 200 || (await created.json()).id !== comment.id || calls !== 3) {
    throw new Error("Comment reply denial changed an existing authorization or response contract");
  }
});

Deno.test("review reply overrides distinguish inherited null, omission and explicit preferences", () => {
  const content = { content: "A review", rating: 4 };
  if (JSON.stringify(parseCreateReview(content)) !== JSON.stringify(content)
    || JSON.stringify(parseReviewUpdate({ content: "Edited" })) !== JSON.stringify({ content: "Edited" })) {
    throw new Error("Legacy requests must keep the preference omitted");
  }
  for (const replyPreference of [null, "ANYONE", "FOLLOWED", "SELF"]) {
    if (parseCreateReview({ ...content, replyPreference })?.replyPreference !== replyPreference
      || parseReviewUpdate({ replyPreference })?.replyPreference !== replyPreference) {
      throw new Error("A supported explicit override was lost");
    }
  }
  for (const replyPreference of [undefined, "", "DEFAULT", "anyone", false, 1, [], {}]) {
    if (parseCreateReview({ ...content, replyPreference }) !== null
      || parseReviewUpdate({ replyPreference }) !== null) {
      throw new Error("An invalid explicit override was accepted");
    }
  }
});

Deno.test("review routes forward overrides and inherited resets through existing authenticated endpoints", async () => {
  const creates: unknown[] = [];
  const updates: ReviewMutationRequest[] = [];
  const review = {
    id: 8, userId: 7, username: "reviewer", userAvatarUrl: null,
    content: "A review", rating: 4, createdAt: "2026-11-14T00:00:00Z",
  };
  const serve = handler({
    async createReview(_auth, _movieId, _content, _rating, replyPreference) {
      creates.push(replyPreference);
      return { ...review, replyPreference };
    },
    async updateMyReview(_auth, _id, update) {
      updates.push(update);
      return { ...review, replyPreference: update.replyPreference ?? null };
    },
  });
  const created = await serve(authenticatedRequest("/movies/5/reviews", { content: "A review", rating: 4, replyPreference: "SELF" }, "POST"));
  const reset = await serve(authenticatedRequest("/reviews/8", { replyPreference: null, userId: 999, role: "ADMIN" }));
  const omitted = await serve(authenticatedRequest("/reviews/8", { content: "Edited" }));
  const invalid = await serve(authenticatedRequest("/reviews/8", { replyPreference: "DEFAULT" }));
  const anonymous = await serve(new Request("https://project.supabase.co/api/reviews/8", {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: '{"replyPreference":"ANYONE"}',
  }));
  if (created.status !== 200 || (await created.json()).replyPreference !== "SELF"
    || reset.status !== 200 || (await reset.json()).replyPreference !== null
    || omitted.status !== 200 || invalid.status !== 400 || anonymous.status !== 401
    || JSON.stringify(creates) !== '["SELF"]'
    || JSON.stringify(updates) !== JSON.stringify([{ replyPreference: null }, { content: "Edited" }])) {
    throw new Error("Review overrides changed endpoint validation, authentication or request shape");
  }
});
