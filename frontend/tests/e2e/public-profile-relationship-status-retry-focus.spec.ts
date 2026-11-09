import { expect, test, type Page, type Route } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261103", "public-profile-relationship-status-retry-focus");
mkdirSync(evidenceDir, { recursive: true });

const viewer = { id: 95160, username: "relationship-viewer", role: "USER", displayName: "Relationship Viewer", avatarUrl: null };
const targetProfile = {
  id: 95161,
  username: "relationship-target",
  displayName: "Relationship Target",
  avatarUrl: null,
  hq: false,
  stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
  ratingDistribution: [],
  socialLinks: [],
  lists: [],
  recentReviews: [],
};
const emptyPage = { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 };

async function installFixture(page: Page, target: "follow" | "block", delayedSuccess = false) {
  let statusAttempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: viewer });
    if (pathname === "/api/users/95161/profile") return route.fulfill({ json: targetProfile });
    if (pathname === "/api/users/95161/follow-status") {
      if (target === "follow") {
        statusAttempts++;
        if (statusAttempts < 3) return route.fulfill({ status: 503, json: {} });
        if (delayedSuccess) await new Promise(resolve => setTimeout(resolve, 300));
      }
      return route.fulfill({ json: { following: false } });
    }
    if (pathname === "/api/users/95161/block-status") {
      if (target === "block") {
        statusAttempts++;
        if (statusAttempts < 3) return route.fulfill({ status: 503, json: {} });
        if (delayedSuccess) await new Promise(resolve => setTimeout(resolve, 300));
      }
      return route.fulfill({ json: { blocked: false } });
    }
    if (pathname.endsWith("/followers") || pathname.endsWith("/following")) return route.fulfill({ json: emptyPage });
    if (pathname.endsWith("/activity") || pathname.endsWith("/lists") || pathname.endsWith("/liked-reviews")) return route.fulfill({ json: emptyPage });
    if (pathname.includes("/collections/")) return route.fulfill({ json: { ...emptyPage, totalPages: 0 } });
    if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: [] });
  });
  return () => statusAttempts;
}

for (const { target, lang, width, label } of [
  { target: "follow" as const, lang: "uk", width: 393, label: "Follow phone UK" },
  { target: "follow" as const, lang: "en", width: 1440, label: "Follow desktop EN" },
  { target: "block" as const, lang: "en", width: 393, label: "Block phone EN" },
  { target: "block" as const, lang: "uk", width: 1440, label: "Block desktop UK" },
]) {
  test(`public profile relationship status Retry restores focus after repeated failure and success: ${label}`, async ({ page }) => {
    const getAttempts = await installFixture(page, target);
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await page.goto(`/${lang}/users/95161`);

    const root = page.locator("main[aria-labelledby='public-profile-title']");
    const retryMessage = target === "follow" ? /follow status|стеження|підпис/i : /block status|блокування|заблок/i;
    const retry = root.getByRole("alert").filter({ hasText: retryMessage }).getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(getAttempts).toBe(2);
    const retryAgain = root.getByRole("alert").filter({ hasText: retryMessage }).getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retryAgain).toBeFocused();

    await retryAgain.press("Enter");
    await expect.poll(getAttempts).toBe(3);
    const action = root.locator(`[data-relationship-action="${target}"]`);
    await expect(action).toBeVisible();
    await expect(action).toBeFocused();
    await expect(action).toHaveCSS("outline-style", "solid");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({ path: path.join(evidenceDir, `${target}-${width === 393 ? "mobile" : "desktop"}-${lang}.png`), fullPage: true });
  });
}

for (const target of ["follow", "block"] as const) {
  test(`public profile ${target} status preserves manual Tab during delayed success`, async ({ page }) => {
    const getAttempts = await installFixture(page, target, true);
    await page.setViewportSize({ width: 393, height: 844 });
    await page.goto("/uk/users/95161");
    const root = page.locator("main[aria-labelledby='public-profile-title']");
    const retryMessage = target === "follow" ? /follow status|стеження|підпис/i : /block status|блокування|заблок/i;
    const retry = root.getByRole("alert").filter({ hasText: retryMessage }).getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(getAttempts).toBe(2);
    const retryAgain = root.getByRole("alert").filter({ hasText: retryMessage }).getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retryAgain).toBeFocused();
    await retryAgain.press("Enter");
    await expect.poll(getAttempts).toBe(3);
    await page.keyboard.press("Tab");
    const manualFocus = await page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.getAttribute("data-relationship-action") || document.activeElement?.tagName);
    const action = root.locator(`[data-relationship-action="${target}"]`);
    await expect(action).toBeVisible();
    await expect(action).not.toBeFocused();
    await expect.poll(async () => page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.getAttribute("data-relationship-action") || document.activeElement?.tagName)).toBe(manualFocus);
  });
}
