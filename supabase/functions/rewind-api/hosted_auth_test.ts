import {
  createHostedAccessTokenVerifier,
  createHostedIdentityDeleter,
  createHostedPasswordChanger,
  createHostedPasswordVerifier,
  readPublishableKey,
  readSecretKey,
} from "./hosted_auth.ts";
import { RewindApiError } from "./handler.ts";

const user = { id: "8c7f2866-7ee8-4edb-8f3d-f74ac2ea662a", email: "member@example.test", emailConfirmed: true, username: "member" };

Deno.test("access token verifier uses provider email and version and ignores metadata identity claims", async () => {
  const updatedAt = "2026-11-14T00:00:00.123456Z";
  const verify = createHostedAccessTokenVerifier("https://project.supabase.co", "publishable", async (input, init) => {
    const headers = new Headers(init?.headers);
    if (String(input) !== "https://project.supabase.co/auth/v1/user"
      || headers.get("Authorization") !== "Bearer opaque-token" || headers.get("apikey") !== "publishable") {
      throw new Error("Identity must come from the authenticated provider endpoint");
    }
    return Response.json({ id: user.id, email: user.email, email_confirmed_at: updatedAt, updated_at: updatedAt,
      user_metadata: { username: " member! ", email: "attacker@example.test", role: "ADMIN", updated_at: "2099-01-01T00:00:00Z" } });
  });
  const result = await verify("opaque-token");
  if (result?.email !== user.email || result.updatedAt !== updatedAt || result.username !== "member"
    || !result.emailConfirmed || "role" in result) throw new Error("Provider identity fields were not preserved");
});

Deno.test("access token verifier preserves legacy responses without a valid provider version", async () => {
  for (const updated_at of [undefined, "invalid", 123]) {
    const verify = createHostedAccessTokenVerifier("https://project.supabase.co", "publishable", async () =>
      Response.json({ id: user.id, email: user.email, updated_at }));
    const result = await verify("opaque-token");
    if (!result || result.emailConfirmed || result.updatedAt !== undefined) throw new Error("Invalid provider version was accepted");
  }
});

Deno.test("access token verifier rejects unavailable or malformed identities", async () => {
  const absent = createHostedAccessTokenVerifier(undefined, undefined, () => { throw new Error("Must not fetch without configuration"); });
  if (await absent("opaque-token") !== null) throw new Error("Missing configuration must fail closed");
  for (const response of [new Response(null, { status: 401 }), Response.json({ id: user.id })]) {
    const verify = createHostedAccessTokenVerifier("https://project.supabase.co", "publishable", async () => response);
    if (await verify("opaque-token") !== null) throw new Error("Invalid identity was accepted");
  }
});

Deno.test("password changer verifies current credentials for the same Supabase identity before updating", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const change = createHostedPasswordChanger("https://project.supabase.co", "publishable-key", async (input, init) => {
    calls.push({ url: String(input), init });
    if (calls.length === 1) {
      return Response.json({ access_token: "fresh-access-token", user: { id: user.id } });
    }
    return new Response(null, { status: 204 });
  });
  await change(user, "current-password", "new-password");

  const verifyBody = JSON.parse(String(calls[0].init?.body));
  const updateBody = JSON.parse(String(calls[1].init?.body));
  const updateHeaders = new Headers(calls[1].init?.headers);
  if (calls.length !== 2 || !calls[0].url.endsWith("/auth/v1/token?grant_type=password")
    || verifyBody.email !== user.email || verifyBody.password !== "current-password"
    || calls[1].url !== "https://project.supabase.co/auth/v1/user" || calls[1].init?.method !== "PUT"
    || updateHeaders.get("apikey") !== "publishable-key"
    || updateHeaders.get("Authorization") !== "Bearer fresh-access-token"
    || updateBody.password !== "new-password") {
    throw new Error("Password update did not use a fresh token verified for the authenticated Supabase user");
  }
});

Deno.test("password changer refuses credentials for a different Supabase identity", async () => {
  let updated = false;
  const change = createHostedPasswordChanger("https://project.supabase.co", "publishable-key", async () => {
    if (updated) throw new Error("Password update must not run");
    updated = true;
    return Response.json({ access_token: "other-user-token", user: { id: "another-user" } });
  });
  try {
    await change(user, "current-password", "new-password");
    throw new Error("Expected identity mismatch to be rejected");
  } catch (error) {
    if (!(error instanceof RewindApiError) || error.status !== 400) throw error;
  }
});

Deno.test("publishable key reader accepts modern key maps and legacy anonymous keys", () => {
  if (readPublishableKey((name) => name === "SUPABASE_PUBLISHABLE_KEYS" ? '{"default":"sb_publishable_test"}' : undefined)
    !== "sb_publishable_test") throw new Error("Modern publishable key map was not read");
  if (readPublishableKey((name) => name === "SUPABASE_ANON_KEY" ? "legacy-anon" : undefined) !== "legacy-anon") {
    throw new Error("Legacy anonymous key fallback was not read");
  }
  if (readPublishableKey((name) => name === "SUPABASE_PUBLISHABLE_KEYS" ? "not-json" : undefined) !== undefined) {
    throw new Error("Malformed key map must fail closed");
  }
});

Deno.test("server secret reader prefers modern secret map and safely supports legacy service role key", () => {
  if (readSecretKey((name) => name === "SUPABASE_SECRET_KEYS" ? '{"default":"sb_secret_test"}' : undefined) !== "sb_secret_test") {
    throw new Error("Modern server secret key was not read");
  }
  if (readSecretKey((name) => name === "SUPABASE_SERVICE_ROLE_KEY" ? "legacy-service-role" : undefined) !== "legacy-service-role") {
    throw new Error("Legacy service role key fallback was not read");
  }
});

Deno.test("hosted password verifier reauthenticates and rejects a different UUID", async () => {
  const verify = createHostedPasswordVerifier("https://project.supabase.co", "publishable-key", async (_input, init) => {
    const body = JSON.parse(String(init?.body));
    if (body.email !== user.email || body.password !== "current-password") throw new Error("Unexpected reauthentication payload");
    return Response.json({ access_token: "fresh-token", user: { id: "another-user" } });
  });
  try {
    await verify(user, "current-password");
    throw new Error("Expected the mismatched UUID to be rejected");
  } catch (error) {
    if (!(error instanceof RewindApiError) || error.status !== 400) throw error;
  }
});

Deno.test("hosted identity deleter uses a server-only key and treats already-deleted identities as success", async () => {
  const requests: { url: string; init?: RequestInit }[] = [];
  const deleteIdentity = createHostedIdentityDeleter("https://project.supabase.co", "server-only-secret", async (input, init) => {
    requests.push({ url: String(input), init });
    return new Response(null, { status: 404 });
  });
  await deleteIdentity(user.id);
  const request = requests[0];
  if (!request) throw new Error("Identity deletion did not call Supabase Auth");
  const headers = new Headers(request?.init?.headers);
  if (request?.url !== `https://project.supabase.co/auth/v1/admin/users/${user.id}`
    || request?.init?.method !== "DELETE" || headers.get("apikey") !== "server-only-secret"
    || headers.get("Authorization") !== "Bearer server-only-secret") {
    throw new Error("Identity deletion did not use the server-side Supabase secret correctly");
  }
});
