import { expect, test, type Page, type Route } from "@playwright/test";

const profile = {
  id: 95161, username: "retry-target", displayName: "Retry Target", avatarUrl: null, hq: false,
  stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
  ratingDistribution: [], socialLinks: [], lists: [], recentReviews: [],
};
const emptyPage = { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 };
type Target = "profile" | "collection" | "following" | "followers";
const targetPaths: Record<Target, string> = {
  profile: "/api/users/95161/profile",
  collection: "/api/users/95161/collections/watched",
  following: "/api/users/95161/following",
  followers: "/api/users/95161/followers",
};

async function installFixture(page: Page, target: Target, delayedSuccess = false) {
  let attempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me" || pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === targetPaths[target]) {
      attempts++;
      if (attempts < 3) return route.fulfill({ status: 503, json: {} });
      if (delayedSuccess) await new Promise(resolve => setTimeout(resolve, 350));
    }
    if (pathname === "/api/users/95161/profile") return route.fulfill({ json: profile });
    if (pathname.includes("/collections/")) return route.fulfill({ json: emptyPage });
    if (pathname.endsWith("/following") || pathname.endsWith("/followers") || pathname.endsWith("/activity") || pathname.endsWith("/lists") || pathname.endsWith("/liked-reviews")) {
      return route.fulfill({ json: emptyPage });
    }
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: [] });
  });
  return () => attempts;
}

for (const { target, lang, width, route, section, destination } of [
  { target: "profile" as const, lang: "uk", width: 1440, route: "/uk/users/95161", section: 'main[aria-labelledby="public-profile-state-title"]', destination: "#public-profile-title" },
  { target: "collection" as const, lang: "en", width: 393, route: "/en/users/95161?view=collection&collection=watched", section: "#public-profile-collection-content", destination: "#public-profile-view-title" },
  { target: "following" as const, lang: "uk", width: 393, route: "/uk/users/95161?view=following", section: "#public-profile-following", destination: "#public-profile-view-title" },
  { target: "followers" as const, lang: "en", width: 1440, route: "/en/users/95161?view=followers", section: "#public-profile-followers", destination: "#public-profile-followers-title" },
]) {
  test(`public profile ${target} Retry focuses the next Retry after failure and content after recovery (${lang}/${width})`, async ({ page }) => {
    const getAttempts = await installFixture(page, target);
    await page.setViewportSize({ width, height: width < 500 ? 900 : 1000 });
    await page.goto(route);
    const container = page.locator(section);
    const retry = container.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(getAttempts).toBe(2);
    const retryAfterFailure = container.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retryAfterFailure).toBeFocused();
    await retryAfterFailure.press("Enter");
    await expect.poll(getAttempts).toBe(3);
    await expect(page.locator(destination)).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });
}

test("public profile 404 is final and does not request profile sections", async ({ page }) => {
  const profileRequests: string[] = [];
  const baseUrl = new URL(String(test.info().project.use.baseURL ?? "http://127.0.0.1:3000"));
  const appRoot = new URL(baseUrl.pathname.endsWith("/") ? baseUrl.pathname : `${baseUrl.pathname}/`, baseUrl.origin);
  await page.route("**/api/users/**", async route => {
    const { pathname } = new URL(route.request().url());
    const apiPath = pathname.slice(pathname.indexOf("/api/users/"));
    if (apiPath.startsWith("/api/users/95162/") || apiPath.startsWith("/api/users/95163/")) profileRequests.push(apiPath);
    if (apiPath === "/api/users/95162/profile") return route.fulfill({ status: 404, json: {} });
    if (apiPath === "/api/users/95163/profile") return route.fulfill({ status: 503, json: {} });
    return route.fulfill({ status: 404, json: {} });
  });

  await page.goto(new URL("uk/users/95162", appRoot).toString());
  const unavailable = page.getByRole("alert");
  await expect(unavailable).toContainText("Цей профіль не існує або недоступний.");
  await expect(unavailable.getByRole("button", { name: "Спробувати ще" })).toHaveCount(0);
  await expect.poll(() => profileRequests).toEqual(["/api/users/95162/profile"]);

  await page.goto(new URL("en/users/95163", appRoot).toString());
  const transientFailure = page.getByRole("alert");
  await expect(transientFailure).toContainText("Could not load this user profile.");
  await expect(transientFailure.getByRole("button", { name: "Retry" })).toBeVisible();
  await expect.poll(() => profileRequests).toEqual(["/api/users/95162/profile", "/api/users/95163/profile"]);
});

test("public profile Following Retry leaves a manually moved focus in place", async ({ page }) => {
  const getAttempts = await installFixture(page, "following", true);
  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/en/users/95161?view=following");
  const section = page.locator("#public-profile-following");
  const retry = section.getByRole("button", { name: /retry|try again|спробувати/i });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(getAttempts).toBe(2);
  await section.getByRole("button", { name: /retry|try again|спробувати/i }).press("Enter");
  await expect.poll(getAttempts).toBe(3);
  await expect(section.getByRole("status")).toBeVisible();
  await page.keyboard.press("Tab");
  const active = await page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName);
  await expect(section.getByRole("status")).toBeHidden();
  await expect.poll(async () => page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName)).toBe(active);
});

test("public profile ignores a delayed target response after SPA back navigation", async ({ page }) => {
  const targetA = { ...profile, id: 95171, username: "late-target-a", displayName: "Delayed Target A", bio: "Late identity A must stay cancelled." };
  const targetB = { ...profile, id: 95172, username: "current-target-b", displayName: "Current Target B", bio: "Current identity B stays visible." };
  let releaseTargetA!: () => void;
  const targetAGate = new Promise<void>(resolve => { releaseTargetA = resolve; });
  let targetBLoads = 0;

  await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me" || pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === `/api/users/${targetA.id}/profile`) {
      await targetAGate;
      return route.fulfill({ json: targetA });
    }
    if (pathname === `/api/users/${targetB.id}/profile`) {
      targetBLoads++;
      return route.fulfill({ json: targetB });
    }
    if (pathname === `/api/users/${targetB.id}/following`) return route.fulfill({ json: {
      ...emptyPage,
      content: [{ id: targetA.id, username: targetA.username, displayName: targetA.displayName, avatarUrl: null }],
      totalElements: 1,
      totalPages: 1,
    } });
    if (pathname.includes("/collections/") || /\/(following|followers|activity|lists|liked-reviews)$/.test(pathname)) return route.fulfill({ json: emptyPage });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: [] });
  });

  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/en/users/${targetB.id}?view=following`);
    const identity = page.locator("#public-profile-title");
    await expect(identity).toHaveText(targetB.displayName);
    const targetLink = page.locator(`#public-profile-following a[href="/en/users/${targetA.id}"]`);
    await expect(targetLink).toBeVisible();
    const targetARequest = page.waitForRequest(request => new URL(request.url()).pathname === `/api/users/${targetA.id}/profile`);
    await targetLink.click();
    const pendingRequest = await targetARequest;
    await expect(page).toHaveURL(`/en/users/${targetA.id}`);

    await page.goBack();
    await expect(page).toHaveURL(`/en/users/${targetB.id}?view=following`);
    await expect.poll(() => targetBLoads).toBe(2);
    await expect(identity).toHaveText(targetB.displayName);
    await expect(targetLink).toBeVisible();
    releaseTargetA();
    const response = await pendingRequest.response();
    if (response) await response.finished();
    // Give the delivered payload a rendering opportunity before checking the restored target.
    await page.evaluate(() => new Promise<void>(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))));

    await expect(page).toHaveURL(`/en/users/${targetB.id}?view=following`);
    await expect(identity).toHaveText(targetB.displayName);
    await expect(page.getByText(targetB.bio, { exact: true })).toBeVisible();
    await expect(page.getByText(targetA.bio, { exact: true })).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(targetLink).toBeVisible();
  } finally {
    releaseTargetA();
  }
});
