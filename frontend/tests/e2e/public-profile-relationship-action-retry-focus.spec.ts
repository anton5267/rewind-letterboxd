import { expect, test, type Page, type Route } from "@playwright/test";

const viewer = { id: 95160, username: "relationship-viewer", role: "USER", displayName: "Relationship Viewer", avatarUrl: null };
const targetProfile = {
  id: 95161, username: "relationship-target", displayName: "Relationship Target", avatarUrl: null, hq: false,
  stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
  ratingDistribution: [], socialLinks: [], lists: [], recentReviews: [],
};
const emptyPage = { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 };

async function installFixture(page: Page, target: "follow" | "block", failures: number, delayedRecovery = false) {
  let attempts = 0;
  let following = false;
  let blocked = false;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: viewer });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "relationship-action-retry" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/users/95161/profile") return route.fulfill({ json: targetProfile });
    if (pathname === "/api/users/95161/follow-status") return route.fulfill({ json: { following } });
    if (pathname === "/api/users/95161/block-status") return route.fulfill({ json: { blocked } });
    if (pathname === `/api/users/95161/${target}` && route.request().method() === "POST") {
      attempts++;
      if (attempts <= failures) return route.fulfill({ status: 503, json: {} });
      if (delayedRecovery) await new Promise(resolve => setTimeout(resolve, 350));
      if (target === "follow") {
        following = true;
        return route.fulfill({ status: 204, body: "" });
      }
      blocked = true;
      return route.fulfill({ json: { blocked } });
    }
    if (pathname.endsWith("/followers") || pathname.endsWith("/following") || pathname.endsWith("/activity") || pathname.endsWith("/lists") || pathname.endsWith("/liked-reviews")) return route.fulfill({ json: emptyPage });
    if (pathname.includes("/collections/")) return route.fulfill({ json: emptyPage });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: [] });
  });
  return () => attempts;
}

for (const { target, lang, width } of [
  { target: "follow" as const, lang: "uk", width: 393 },
  { target: "block" as const, lang: "en", width: 1440 },
]) {
  test(`public profile ${target} action Retry focuses another failure and recovers (${lang}/${width})`, async ({ page }) => {
    const attempts = await installFixture(page, target, 2);
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await page.goto(`/${lang}/users/95161`);
    const root = page.locator("main[aria-labelledby='public-profile-title']");
    const action = root.locator(`[data-relationship-action="${target}"]`);
    await expect(action).toBeEnabled();
    await action.focus();
    await action.press("Enter");
    const message = target === "follow" ? /змінити підписку/i : /change the block status/i;
    const retry = root.getByRole("alert").filter({ hasText: message }).getByRole("button", { name: /retry|спробувати/i });
    await expect(retry).toBeFocused();
    await retry.press("Enter");
    await expect.poll(attempts).toBe(2);
    await expect(retry).toBeFocused();
    await retry.press("Enter");
    await expect.poll(attempts).toBe(3);
    await expect(action).toBeFocused();
    await expect(action).toHaveCSS("outline-style", "solid");
    await expect(action).toHaveText(target === "follow" ? "Відписатися" : "Unblock");
  });
}

test("public profile follow action Retry respects a manual Tab during delayed recovery", async ({ page }) => {
  const attempts = await installFixture(page, "follow", 1, true);
  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/en/users/95161");
  const root = page.locator("main[aria-labelledby='public-profile-title']");
  const action = root.locator('[data-relationship-action="follow"]');
  await expect(action).toBeEnabled();
  await action.focus();
  await action.press("Enter");
  const retry = root.getByRole("alert").filter({ hasText: "Could not change the follow status." }).getByRole("button", { name: "Retry" });
  await expect(retry).toBeFocused();
  await retry.press("Enter");
  await expect.poll(attempts).toBe(2);
  await page.keyboard.press("Tab");
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) document.activeElement.dataset.manualTabTarget = "true";
  });
  const manualTarget = page.locator('[data-manual-tab-target="true"]');
  await expect(manualTarget).toBeFocused();
  await expect(action).toHaveText("Unfollow");
  await expect(manualTarget).toBeFocused();
  await expect(action).not.toBeFocused();
});
