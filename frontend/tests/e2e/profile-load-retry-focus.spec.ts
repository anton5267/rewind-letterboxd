import { expect, test, type Page, type Route } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261103", "profile-load-retry-focus");
mkdirSync(evidenceDir, { recursive: true });

const user = { id: 95130, username: "profile-load-owner", role: "USER", displayName: "Profile Load Owner", avatarUrl: null };
const profile = {
  ...user,
  email: "profile-load-owner@example.invalid",
  stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
  ratingDistribution: [], socialLinks: [], lists: [], recentRatings: [], recentReviews: [],
};
const emptyPage = { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 };

async function installFixture(page: Page, delaySuccess = false) {
  let profileAttempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: user });
    if (pathname === "/api/profile/me") {
      profileAttempts++;
      if (profileAttempts < 3) return route.fulfill({ status: 503, json: {} });
      if (delaySuccess) await new Promise(resolve => setTimeout(resolve, 300));
      return route.fulfill({ json: profile });
    }
    if (pathname === "/api/profile/me/social-links") return route.fulfill({ json: [] });
    if (pathname === "/api/profile/me/favorites" || pathname.endsWith("/ratings") || pathname.endsWith("/reviews")) return route.fulfill({ json: emptyPage });
    if (pathname.endsWith("/activity")) return route.fulfill({ json: { content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 } });
    if (pathname.endsWith("/following") || pathname.endsWith("/followers")) return route.fulfill({ json: { content: [], number: 0, size: 8, totalElements: 0, totalPages: 0 } });
    if (pathname === "/api/lists/my") return route.fulfill({ json: [] });
    if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: [] });
  });
  return () => profileAttempts;
}

for (const { lang, width, label } of [
  { lang: "uk", width: 393, label: "profile phone UK" },
  { lang: "uk", width: 1440, label: "profile desktop UK" },
  { lang: "en", width: 393, label: "settings phone EN" },
  { lang: "en", width: 1440, label: "settings desktop EN" },
]) {
  const settings = label.includes("settings");
  test(`shared profile load Retry restores keyboard focus after repeated failure and success: ${label}`, async ({ page }) => {
    const getAttempts = await installFixture(page);
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await page.goto(`/${lang}/profile${settings ? "?settings=profile" : ""}`);

    const root = page.locator(settings ? "main[aria-labelledby='account-settings-title']" : "main[aria-labelledby='profile-page-title']");
    const retry = root.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(getAttempts).toBe(2);
    await expect(root.getByRole("button", { name: /retry|try again|спробувати/i })).toBeFocused();

    await root.getByRole("button", { name: /retry|try again|спробувати/i }).press("Enter");
    await expect.poll(getAttempts).toBe(3);
    const heading = settings
      ? page.locator(width < 768 ? "#account-settings-mobile-title" : "#account-settings-title")
      : page.locator("#profile-page-title");
    await expect(heading).toBeFocused();
    await expect(heading).toHaveCSS("outline-style", "solid");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);

    if (lang === "uk" && (width === 393 || width === 1440) && !settings) {
      await page.screenshot({ path: path.join(evidenceDir, `profile-load-retry-${width === 393 ? "mobile" : "desktop"}-uk.png`), fullPage: true });
    } else if (settings) {
      await page.screenshot({ path: path.join(evidenceDir, `profile-settings-load-retry-${width === 393 ? "mobile" : "desktop"}-en.png`), fullPage: true });
    }
  });
}

for (const { width, label } of [
  { width: 393, label: "phone" },
  { width: 1440, label: "desktop" },
]) {
  test(`profile load Retry preserves manual Tab movement during pending success on ${label}`, async ({ page }) => {
    const getAttempts = await installFixture(page, true);
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await page.goto("/uk/profile");
    const root = page.locator("main[aria-labelledby='profile-page-title']");
    const retry = root.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(getAttempts).toBe(2);
    const retryAgain = root.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retryAgain).toBeFocused();
    await retryAgain.press("Enter");
    await expect.poll(getAttempts).toBe(3);
    await expect(root).toHaveAttribute("aria-busy", "true");
    await page.keyboard.press("Tab");
    const manualFocus = await page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName);
    await expect(root).toHaveAttribute("aria-busy", "false");
    await expect(page.locator("#profile-page-title")).not.toBeFocused();
    await expect.poll(async () => page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName)).toBe(manualFocus);
  });
}
