import { expect, test, type Page, type Route } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261103", "profile-social-links-retry-focus");
mkdirSync(evidenceDir, { recursive: true });

const user = { id: 95140, username: "social-links-owner", role: "USER", displayName: "Social Links Owner", avatarUrl: null };
const profile = {
  ...user,
  email: "social-links-owner@example.invalid",
  stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
  ratingDistribution: [], socialLinks: [], lists: [], recentRatings: [], recentReviews: [],
};
const emptyPage = { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 };

async function installFixture(page: Page, delaySuccess = false) {
  let socialAttempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: user });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/profile/me/social-links") {
      socialAttempts++;
      if (socialAttempts < 3) return route.fulfill({ status: 503, json: {} });
      if (delaySuccess) await new Promise(resolve => setTimeout(resolve, 300));
      return route.fulfill({ json: [] });
    }
    if (pathname === "/api/profile/me/favorites" || pathname.endsWith("/ratings") || pathname.endsWith("/reviews")) return route.fulfill({ json: emptyPage });
    if (pathname.endsWith("/activity")) return route.fulfill({ json: { content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 } });
    if (pathname.endsWith("/following") || pathname.endsWith("/followers")) return route.fulfill({ json: { content: [], number: 0, size: 8, totalElements: 0, totalPages: 0 } });
    if (pathname === "/api/lists/my") return route.fulfill({ json: [] });
    if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: [] });
  });
  return () => socialAttempts;
}

for (const { lang, width, settings, label } of [
  { lang: "uk", width: 393, settings: false, label: "own profile phone UK" },
  { lang: "uk", width: 1440, settings: false, label: "own profile desktop UK" },
  { lang: "en", width: 393, settings: true, label: "Connections phone EN" },
  { lang: "en", width: 1440, settings: true, label: "Connections desktop EN" },
]) {
  test(`Social Links Retry recovers focus on repeated failure and success: ${label}`, async ({ page }) => {
    const getAttempts = await installFixture(page);
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await page.goto(`/${lang}/profile${settings ? "?settings=connections" : "#social-links-settings"}`);
    const root = settings ? page.locator("main[aria-labelledby='account-settings-title']") : page.locator("section[aria-labelledby='social-links-settings']");
    const retry = root.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(getAttempts).toBe(2);
    await expect(root.getByRole("button", { name: /retry|try again|спробувати/i })).toBeFocused();

    await root.getByRole("button", { name: /retry|try again|спробувати/i }).press("Enter");
    await expect.poll(getAttempts).toBe(3);
    const heading = page.locator("#social-links-settings");
    await expect(heading).toBeFocused();
    await expect(heading).toHaveCSS("outline-style", "solid");
    await expect(page.locator("#social-link-website")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);

    await page.screenshot({ path: path.join(evidenceDir, `${settings ? "connections" : "profile-social-links"}-${width === 393 ? "mobile" : "desktop"}-${lang}.png`), fullPage: true });
  });
}

for (const { width, label } of [
  { width: 393, label: "phone" },
  { width: 1440, label: "desktop" },
]) {
  test(`Social Links Retry preserves manual Tab while success is pending on ${label}`, async ({ page }) => {
    const getAttempts = await installFixture(page, true);
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await page.goto("/uk/profile#social-links-settings");
    const section = page.locator("section[aria-labelledby='social-links-settings']");
    const retry = section.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(getAttempts).toBe(2);
    const retryAgain = section.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retryAgain).toBeFocused();
    await retryAgain.press("Enter");
    await expect.poll(getAttempts).toBe(3);
    await expect(page.locator("#social-link-website")).toBeVisible();
    await page.keyboard.press("Tab");
    const manualFocus = await page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName);
    await expect(page.locator("#social-links-settings")).not.toBeFocused();
    await expect.poll(async () => page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName)).toBe(manualFocus);
  });
}
