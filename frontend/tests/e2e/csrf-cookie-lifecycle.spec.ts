import { expect, test, type Page } from "@playwright/test";

const actor = { id: 960001, username: "csrf-reader", role: "USER" };
const members = [
  { id: 960010, username: "csrf-ada", displayName: "CSRF Ada", avatarUrl: null },
  { id: 960011, username: "csrf-bo", displayName: "CSRF Bo", avatarUrl: null },
];

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

const pageOf = (content: unknown[]) => ({ content, number: 0, size: 12, totalElements: content.length, totalPages: content.length ? 1 : 0, first: true, last: true });

function csrfCookie(header = "") {
  const value = header.split(";").map(part => part.trim()).find(part => part.startsWith("XSRF-TOKEN="))?.slice("XSRF-TOKEN=".length);
  return value ? decodeURIComponent(value) : null;
}

/** The browser receives and clears real HTTP cookies; every root API request is controlled. */
async function cookieLifecycleFixture(page: Page, freshGate?: ReturnType<typeof deferred>) {
  const state = {
    authenticated: false,
    csrfGets: 0,
    guestRefreshes: 0,
    issuedToken: "",
    loginPair: null as { cookie: string | null; header: string | null } | null,
    followPairs: [] as { targetId: number; cookie: string | null; header: string | null; accepted: boolean }[],
    following: new Set<number>(),
    unexpectedWrites: [] as string[],
  };
  await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (path === "/api/auth/csrf" && request.method() === "GET") {
      state.csrfGets += 1;
      const token = `http-csrf-generation-${state.csrfGets}`;
      if (state.csrfGets === 2 && freshGate) await freshGate.promise;
      state.issuedToken = token;
      return route.fulfill({ json: { token }, headers: { "Set-Cookie": `XSRF-TOKEN=${token}; Path=/; SameSite=Lax` } });
    }
    if (path === "/api/users/me") return route.fulfill(state.authenticated ? { json: actor } : { status: 401, json: {} });
    if (path === "/api/auth/refresh") {
      state.guestRefreshes += 1;
      return route.fulfill({ status: 401, json: {} });
    }
    if (path === "/api/auth/login" && request.method() === "POST") {
      const headers = await request.allHeaders();
      state.loginPair = { cookie: csrfCookie(headers.cookie), header: headers["x-xsrf-token"] ?? null };
      if (state.loginPair.cookie !== state.issuedToken || state.loginPair.header !== state.issuedToken) return route.fulfill({ status: 403, json: {} });
      state.authenticated = true;
      return route.fulfill({ status: 204, headers: { "Set-Cookie": "XSRF-TOKEN=; Path=/; Max-Age=0; SameSite=Lax" } });
    }
    const relationship = path.match(/^\/api\/users\/(\d+)\/(follow-status|block-status|follow)$/);
    if (relationship) {
      const targetId = Number(relationship[1]);
      if (relationship[2] === "follow-status") return route.fulfill({ json: { following: state.following.has(targetId), followers: 0, followingCount: 0 } });
      if (relationship[2] === "block-status") return route.fulfill({ json: { blocked: false } });
      if (request.method() === "POST") {
        const headers = await request.allHeaders();
        const pair = { targetId, cookie: csrfCookie(headers.cookie), header: headers["x-xsrf-token"] ?? null, accepted: false };
        pair.accepted = Boolean(pair.cookie && pair.cookie === state.issuedToken && pair.header === pair.cookie);
        state.followPairs.push(pair);
        if (!pair.accepted) return route.fulfill({ status: 403, json: { message: "CSRF cookie/header mismatch" } });
        state.following.add(targetId);
        return route.fulfill({ status: 204 });
      }
    }
    if (request.method() !== "GET") {
      state.unexpectedWrites.push(`${request.method()} ${path}`);
      return route.abort();
    }
    if (path.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (path === "/api/users/popular-reviewers" || path === "/api/genres") return route.fulfill({ json: [] });
    if (path === "/api/users/hq") return route.fulfill({ json: pageOf([]) });
    if (path === "/api/users/directory") return route.fulfill({ json: pageOf(members) });
    return route.fulfill({ json: pageOf([]) });
  });
  return state;
}

async function loginAndReachFollowRows(page: Page, state: Awaited<ReturnType<typeof cookieLifecycleFixture>>) {
  await page.goto("/en/login");
  await expect.poll(() => state.guestRefreshes).toBe(1);
  await page.locator("#login-email").fill("csrf-reader@example.invalid");
  await page.locator("#login-password").fill("Controlled-password-123!");
  await page.locator('main button[type="submit"]').click();
  await expect(page).toHaveURL(/\/en\/films$/);
  expect(state.csrfGets).toBe(1);
  expect(state.loginPair).toEqual({ cookie: "http-csrf-generation-1", header: "http-csrf-generation-1" });
  // Inspect only: the cookie boundary is produced by the login response's Set-Cookie.
  expect((await page.context().cookies()).some(cookie => cookie.name === "XSRF-TOKEN")).toBe(false);
  await page.locator("header").getByRole("link", { name: "Community", exact: true }).click();
  for (const member of members) await expect(page.getByRole("button", { name: `Follow: ${member.displayName}`, exact: true })).toBeEnabled();
}

test("login clearing the CSRF cookie requires a fresh GET before a Community follow", async ({ page }) => {
  const state = await cookieLifecycleFixture(page);
  await loginAndReachFollowRows(page, state);
  await page.getByRole("button", { name: "Follow: CSRF Ada", exact: true }).click();
  await expect(page.getByRole("button", { name: "Unfollow: CSRF Ada", exact: true })).toBeEnabled();
  expect(state.csrfGets, "A cached pre-login token must not replace fetching the cleared cookie").toBe(2);
  expect(state.followPairs).toEqual([{ targetId: members[0].id, cookie: "http-csrf-generation-2", header: "http-csrf-generation-2", accepted: true }]);
  expect(state.unexpectedWrites).toEqual([]);
});

test("two Community follow rows share one pending fresh CSRF GET and send matching new cookies", async ({ page }) => {
  const gate = deferred();
  const state = await cookieLifecycleFixture(page, gate);
  try {
    await loginAndReachFollowRows(page, state);
    await page.getByRole("button", { name: "Follow: CSRF Ada", exact: true }).click();
    await expect.poll(() => state.csrfGets).toBe(2);
    await page.getByRole("button", { name: "Follow: CSRF Bo", exact: true }).click();
    await expect(page.getByRole("button", { name: "Loading...: CSRF Ada", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Loading...: CSRF Bo", exact: true })).toBeDisabled();
    expect(state.csrfGets, "Both pending mutations must share the one fresh-cookie request").toBe(2);
    expect(state.followPairs).toEqual([]);
    gate.resolve();
    for (const member of members) await expect(page.getByRole("button", { name: `Unfollow: ${member.displayName}`, exact: true })).toBeEnabled();
    expect(state.csrfGets).toBe(2);
    expect(state.followPairs.map(pair => pair.targetId).sort()).toEqual(members.map(member => member.id).sort());
    for (const pair of state.followPairs) expect(pair).toMatchObject({ cookie: "http-csrf-generation-2", header: "http-csrf-generation-2", accepted: true });
    expect(state.unexpectedWrites).toEqual([]);
  } finally { gate.resolve(); }
});
