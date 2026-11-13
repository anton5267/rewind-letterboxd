import { createRewindApiHandler } from "./handler.ts";
import { createHostedEmailChangeRequester } from "./hosted_auth.ts";
import { RewindApiError } from "./http/errors.ts";
import type { RewindApiRepository } from "./contracts/repository.ts";

const user = { id: "fixture-uuid", email: "current@example.invalid", emailConfirmed: true, username: "member" };
const repository: RewindApiRepository = {
  async listGenres() { return []; },
  async searchMovies() { return { content: [], totalPages: 0, totalElements: 0, number: 0 }; },
  async getMovieDetails() { return null; },
  async searchPeople() { return { content: [], totalPages: 0, totalElements: 0, number: 0 }; },
  async getPersonFilmography() { return null; },
  async getOrCreateCurrentUser() { return { id: 7, username: "member", role: "USER", avatarUrl: null }; },
};

Deno.test("email change forwards the verified request token and refuses an actor switch before sending mail", async () => {
  const calls: unknown[][] = [];
  const handler = createRewindApiHandler(repository, [], {
    async verifyAccessToken(token) { return token === "request-token" ? user : null; },
    async requestEmailChange(...args) { calls.push(args); },
  });
  const request = (body: unknown, token = "request-token", method = "POST") => new Request("https://project.supabase.co/api/profile/me/email", {
    method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });
  const body = { email: " new@example.invalid ", language: "en", expectedUserId: 7, redirectTo: "https://untrusted.invalid" };
  if ((await handler(request(body))).status !== 202) throw new Error("Expected pending confirmation");
  if (JSON.stringify(calls) !== JSON.stringify([["request-token", "new@example.invalid", "en"]])) {
    throw new Error("Caller redirect or another session reached the provider");
  }
  if ((await handler(request({ ...body, expectedUserId: 8 }))).status !== 409) throw new Error("Account switch was accepted");
  if ((await handler(request(body, "invalid"))).status !== 401) throw new Error("Missing identity was accepted");
  if ((await handler(request(body, "request-token", "GET"))).status !== 405) throw new Error("Unexpected method was accepted");
  for (const patch of [{ email: "bad" }, { language: "https://untrusted.invalid" }, { expectedUserId: null }, { email: user.email }]) {
    if ((await handler(request({ ...body, ...patch }))).status !== 400) throw new Error("Invalid request reached the provider");
  }
  if (calls.length !== 1) throw new Error("Rejected requests sent email");
});

Deno.test("email change requires an active application profile before sending confirmation", async () => {
  let sent = false;
  const handler = createRewindApiHandler({ ...repository, async getOrCreateCurrentUser() { throw new RewindApiError(403, "Account is inactive"); } }, [], {
    async verifyAccessToken() { return user; },
    async requestEmailChange() { sent = true; },
  });
  const response = await handler(new Request("https://project.supabase.co/api/profile/me/email", {
    method: "POST", headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
    body: JSON.stringify({ email: "new@example.invalid", language: "uk", expectedUserId: 7 }),
  }));
  if (response.status !== 403 || sent) throw new Error("Inactive profile could request email changes");
});

Deno.test("provider email change uses a fixed bearer and server-owned localized callback", async () => {
  for (const language of ["uk", "en"] as const) {
    let called = false;
    const send = createHostedEmailChangeRequester("https://project.supabase.co", "publishable", "https://site.example/project/", async (input, init) => {
      called = true;
      const url = new URL(String(input));
      if (url.pathname !== "/auth/v1/user" || url.searchParams.get("redirect_to") !== `https://site.example/project/${language}/login/`
        || new Headers(init?.headers).get("Authorization") !== "Bearer fixed-token"
        || init?.method !== "PUT" || JSON.stringify(JSON.parse(String(init.body))) !== JSON.stringify({ email: "new@example.invalid" })) {
        throw new Error("Provider request was not bound to the original identity and configured site");
      }
      return Response.json({ id: user.id, email: user.email });
    });
    await send("fixed-token", "new@example.invalid", language);
    if (!called) throw new Error("Provider was not called");
  }
});

Deno.test("email requester fails closed on invalid callback and preserves provider rate limits", async () => {
  let called = false;
  const invalid = createHostedEmailChangeRequester("https://project.supabase.co", "publishable", "http://site.example/", () => {
    called = true;
    throw new Error("Invalid callback must not send a request");
  });
  try { await invalid("token", "new@example.invalid", "uk"); throw new Error("Expected invalid callback failure"); }
  catch (error) { if (!(error instanceof RewindApiError) || error.status !== 503 || called) throw error; }
  for (const status of [429, 500, 400]) {
    const send = createHostedEmailChangeRequester("https://project.supabase.co", "publishable", "https://site.example/", async () => new Response(null, { status }));
    try { await send("token", "new@example.invalid", "uk"); throw new Error("Expected provider failure"); }
    catch (error) {
      const expected = status === 500 ? 503 : status;
      if (!(error instanceof RewindApiError) || error.status !== expected) throw error;
    }
  }
});
