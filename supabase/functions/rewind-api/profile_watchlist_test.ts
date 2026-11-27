import { createRewindApiHandler } from "./handler.ts";
import type { RewindApiRepository } from "./contracts/repository.ts";

function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

Deno.test("watchlist privacy is authenticated, validates its boolean and saves the owner setting", async () => {
  const changes: unknown[] = [];
  const repository = {
    async setMyWatchlistVisibility(actor: { id: string }, isPublic: boolean) {
      equal(actor.id, "auth-7");
      changes.push(isPublic);
      return isPublic;
    },
  } as unknown as RewindApiRepository;
  const api = createRewindApiHandler(repository, [], {
    async verifyAccessToken(token) {
      return { id: "auth-7", email: "reader@example.invalid", username: "reader", emailConfirmed: token === "confirmed" };
    },
  });
  const request = (isPublic: unknown, token = "confirmed") => new Request("https://project.supabase.co/api/profile/me/watchlist/visibility", {
    method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ isPublic }),
  });

  const privateResult = await api(request(false));
  equal(privateResult.status, 200);
  equal(await privateResult.json(), { isPublic: false });
  equal((await api(request("false"))).status, 400);
  equal((await api(request(true, "unconfirmed"))).status, 401);
  equal(changes, [false]);
});

Deno.test("only the owner can clear their watchlist and other system collections remain read-only", async () => {
  const calls: string[] = [];
  const repository = {
    async clearMyWatchlist(actor: { id: string }) { calls.push(actor.id); return 24; },
  } as unknown as RewindApiRepository;
  const api = createRewindApiHandler(repository, [], {
    async verifyAccessToken(token) {
      return { id: "auth-7", email: "reader@example.invalid", username: "reader", emailConfirmed: token === "confirmed" };
    },
  });
  const request = (path: string, token = "confirmed") => new Request(`https://project.supabase.co${path}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${token}` },
  });

  const cleared = await api(request("/api/profile/me/watchlist"));
  equal(cleared.status, 200);
  equal(await cleared.json(), { removed: 24 });
  equal((await api(request("/api/profile/me/watchlist", "unconfirmed"))).status, 401);
  equal((await api(request("/api/profile/me/favorites"))).status, 405);
  equal(calls, ["auth-7"]);
});
