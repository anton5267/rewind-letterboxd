import { createRewindApiHandler } from "./handler.ts";
import type { ProfileResponse } from "./contracts/profile.ts";
import type { RewindApiRepository } from "./contracts/repository.ts";
import { parseProfileUpdate } from "./http/parsers/profile.ts";
import { getProfileDetails, saveProfileDetails } from "./repositories/shared/profile_details.ts";

function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

Deno.test("optional profile names trim Unicode text, clear explicitly and preserve omitted fields", () => {
  equal(parseProfileUpdate({ givenName: "  Антон  ", familyName: " O’Neill-Smith " }), { givenName: "Антон", familyName: "O’Neill-Smith" });
  equal(parseProfileUpdate({ givenName: null, familyName: "   " }), { givenName: "", familyName: "" });
  equal(parseProfileUpdate({ avatarUrl: "", userId: 999, role: "ADMIN" }), { avatarUrl: "" });
  equal(parseProfileUpdate({ givenName: "А".repeat(80) })?.givenName?.length, 80);
  for (const value of [undefined, false, 42, [], {}, "A".repeat(81), "Name\0"]) {
    equal(parseProfileUpdate({ givenName: value }), null);
    equal(parseProfileUpdate({ familyName: value }), null);
  }
});

Deno.test("profile details skip legacy writes, bind only the server profile ID and default old accounts to null", async () => {
  const calls: unknown[] = [];
  const connection = {
    async queryObject(options: unknown) { calls.push(options); return { rows: [] }; },
  } as unknown as Parameters<typeof saveProfileDetails>[0];
  await saveProfileDetails(connection, 7, { avatarUrl: "" });
  equal(calls.length, 0);
  await saveProfileDetails(connection, 7, { givenName: "Антон" });
  equal((calls[0] as { args: unknown[] }).args, [7, true, "Антон", false, null]);
  equal(await getProfileDetails(connection, 7), { givenName: null, familyName: null });
});

Deno.test("authenticated profile API reads and saves personal names with confirmed UUID identity", async () => {
  const empty = { content: [], number: 0, totalElements: 0, totalPages: 0 };
  const profile: ProfileResponse = {
    id: 7, username: "reader", displayName: "Reader", email: "fixture@example.invalid", role: "USER", avatarUrl: null,
    givenName: null, familyName: null, supabaseLinked: true,
    stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 }, lists: [], recentRatings: [], recentReviews: [],
  };
  const updates: unknown[] = [];
  const repository: RewindApiRepository = {
    async listGenres() { return []; }, async searchMovies() { return empty; }, async getMovieDetails() { return null; },
    async searchPeople() { return empty; }, async getPersonFilmography() { return null; },
    async updateMyProfile(actor, update) {
      equal(actor.id, "auth-7"); updates.push(update);
      if (update.givenName !== undefined) profile.givenName = update.givenName || null;
      if (update.familyName !== undefined) profile.familyName = update.familyName || null;
    },
    async getMyProfile(actor) { equal(actor.id, "auth-7"); return profile; },
  };
  const api = createRewindApiHandler(repository, [], {
    async verifyAccessToken(token) { return { id: "auth-7", email: profile.email, username: "reader", emailConfirmed: token === "confirmed" }; },
  });
  const request = (body: unknown, token = "confirmed") => new Request("https://project.supabase.co/api/profile/me", {
    method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const saved = await api(request({ givenName: "  Антон ", familyName: "Листва", userId: 999 }));
  equal(saved.status, 200); equal((await saved.json()).givenName, "Антон");
  const cleared = await api(request({ familyName: null }));
  const data = await cleared.json(); equal(data.familyName, null); equal(data.givenName, "Антон");
  equal((await api(request({ givenName: false }))).status, 400);
  equal((await api(request({ givenName: "Name" }, "unconfirmed"))).status, 401);
  equal(updates, [{ givenName: "Антон", familyName: "Листва" }, { familyName: "" }]);
});
