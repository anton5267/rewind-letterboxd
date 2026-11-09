import { expect, test, type Page, type Route } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261103", "public-profile-overview-retry-focus");
mkdirSync(evidenceDir, { recursive: true });
const profile = {
  id: 95161, username: "retry-target", displayName: "Retry Target", avatarUrl: null, hq: false,
  stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 }, ratingDistribution: [], socialLinks: [], lists: [], recentReviews: [],
};
const emptyPage = { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 };
type Section = "favorites" | "activity" | "following-preview" | "public-lists" | "liked-reviews";
const endpointFor: Record<Section, string> = {
  favorites: "/api/users/95161/collections/favorites",
  activity: "/api/users/95161/activity",
  "following-preview": "/api/users/95161/following",
  "public-lists": "/api/users/95161/lists",
  "liked-reviews": "/api/users/95161/liked-reviews",
};

async function installFixture(page: Page, section: Section, delayedSuccess = false) {
  let attempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/95161/profile") return route.fulfill({ json: profile });
    if (url.pathname.includes("/collections/")) {
      if (url.pathname === endpointFor[section]) {
        attempts++;
        if (attempts < 3) return route.fulfill({ status: 503, json: {} });
        if (delayedSuccess) await new Promise(resolve => setTimeout(resolve, 300));
      }
      return route.fulfill({ json: { ...emptyPage, totalPages: 0 } });
    }
    if (Object.values(endpointFor).includes(url.pathname)) {
      if (url.pathname === endpointFor[section]) {
        attempts++;
        if (attempts < 3) return route.fulfill({ status: 503, json: {} });
        if (delayedSuccess) await new Promise(resolve => setTimeout(resolve, 300));
      }
      return route.fulfill({ json: emptyPage });
    }
    if (url.pathname.endsWith("/followers")) return route.fulfill({ json: emptyPage });
    if (url.pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: [] });
  });
  return () => attempts;
}

for (const { section, lang, width } of [
  { section: "favorites" as const, lang: "uk", width: 393 },
  { section: "activity" as const, lang: "en", width: 1440 },
  { section: "following-preview" as const, lang: "en", width: 393 },
  { section: "public-lists" as const, lang: "uk", width: 1440 },
  { section: "liked-reviews" as const, lang: "uk", width: 393 },
]) {
  test(`public profile ${section} Retry restores focus on repeated error and recovery (${lang}/${width})`, async ({ page }) => {
    const getAttempts = await installFixture(page, section);
    await page.setViewportSize({ width, height: width < 500 ? 900 : 1000 });
    await page.goto(`/${lang}/users/95161`);
    const container = page.locator(`[data-retry-focus-section="${section}"]`);
    const retry = container.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(getAttempts).toBe(2);
    const retryAgain = container.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retryAgain).toBeFocused();
    await retryAgain.press("Enter");
    await expect.poll(getAttempts).toBe(3);
    const heading = container.locator("h2");
    await expect(heading).toBeFocused();
    await expect(heading).toHaveCSS("outline-style", "solid");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    if (section === "favorites") await page.screenshot({ path: path.join(evidenceDir, `favorites-phone-${lang}.png`), fullPage: true });
    if (section === "activity") await page.screenshot({ path: path.join(evidenceDir, `activity-desktop-${lang}.png`), fullPage: true });
  });
}

test("public profile activity Retry preserves manual Tab during delayed success", async ({ page }) => {
  const getAttempts = await installFixture(page, "activity", true);
  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/users/95161");
  const section = page.locator('[data-retry-focus-section="activity"]');
  const retry = section.getByRole("button", { name: /retry|try again|спробувати/i });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(getAttempts).toBe(2);
  const retryAgain = section.getByRole("button", { name: /retry|try again|спробувати/i });
  await expect(retryAgain).toBeFocused();
  await retryAgain.press("Enter");
  await expect.poll(getAttempts).toBe(3);
  await expect(section.getByRole("status")).toBeVisible();
  await page.keyboard.press("Tab");
  const active = await page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName);
  await expect(section.getByRole("status")).toBeHidden();
  await expect(section.locator("h2")).not.toBeFocused();
  await expect.poll(async () => page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName)).toBe(active);
});
