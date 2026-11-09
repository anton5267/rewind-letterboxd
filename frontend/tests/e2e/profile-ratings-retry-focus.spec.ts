import { expect, test, type Page, type Route } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261103", "profile-ratings-retry-focus");
mkdirSync(evidenceDir, { recursive: true });

const user = { id: 95120, username: "ratings-owner", role: "USER", displayName: "Ratings Owner", avatarUrl: null };
const profile = {
  ...user,
  email: "ratings-owner@example.invalid",
  stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
  lists: [], recentRatings: [], recentReviews: [],
};
const pageOfRatings = { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 };

async function installFixture(page: Page, delaySuccess = false) {
  let ratingsAttempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: user });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/profile/me/social-links") return route.fulfill({ json: [] });
    if (pathname === "/api/profile/me/ratings") {
      ratingsAttempts++;
      if (ratingsAttempts < 3) return route.fulfill({ status: 503, json: {} });
      if (delaySuccess) await new Promise(resolve => setTimeout(resolve, 250));
      return route.fulfill({ json: pageOfRatings });
    }
    if (pathname.endsWith("/activity")) return route.fulfill({ json: { content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 } });
    if (pathname.endsWith("/following") || pathname.endsWith("/followers")) return route.fulfill({ json: { content: [], number: 0, size: 8, totalElements: 0, totalPages: 0 } });
    if (pathname.includes("/favorites")) return route.fulfill({ json: pageOfRatings });
    if (pathname.endsWith("/reviews")) return route.fulfill({ json: pageOfRatings });
    if (pathname === "/api/lists/my") return route.fulfill({ json: [] });
    if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: [] });
  });
  return () => ratingsAttempts;
}

for (const { lang, width, label } of [
  { lang: "uk", width: 393, label: "phone UK" },
  { lang: "uk", width: 1440, label: "desktop UK" },
  { lang: "en", width: 393, label: "phone EN" },
  { lang: "en", width: 1440, label: "desktop EN" },
]) {
  test(`ratings retry restores focus through repeated error and success on ${label}`, async ({ page }) => {
    const getAttempts = await installFixture(page);
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await page.goto(`/${lang}/profile?view=ratings`);

    const section = page.locator("#profile-ratings");
    const retry = section.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(getAttempts).toBe(2);
    await expect(section.getByRole("button", { name: /retry|try again|спробувати/i })).toBeFocused();

    await section.getByRole("button", { name: /retry|try again|спробувати/i }).press("Enter");
    await expect.poll(getAttempts).toBe(3);
    const heading = section.getByRole("heading", { name: /ratings|оцінки/i });
    await expect(heading).toBeFocused();
    await expect(heading).toHaveCSS("outline-style", "solid");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);

    if (lang === "uk" && (width === 393 || width === 1440)) {
      await page.screenshot({ path: path.join(evidenceDir, `profile-ratings-retry-${width === 393 ? "mobile" : "desktop"}-uk.png`), fullPage: true });
    }
  });
}

test("ratings retry preserves a manual Tab move while the API response is pending", async ({ page }) => {
  const getAttempts = await installFixture(page, true);
  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/uk/profile?view=ratings");
  const section = page.locator("#profile-ratings");
  const retry = section.getByRole("button", { name: /retry|try again|спробувати/i });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(getAttempts).toBe(2);
  const retryAgain = section.getByRole("button", { name: /retry|try again|спробувати/i });
  await expect(retryAgain).toBeFocused();
  await retryAgain.press("Enter");
  await expect.poll(getAttempts).toBe(3);
  await expect(section).toHaveAttribute("aria-busy", "true");
  await page.keyboard.press("Tab");
  const manualFocus = await page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName);
  await expect(section).toHaveAttribute("aria-busy", "false");
  await expect(section.getByRole("heading", { name: "Оцінки" })).not.toBeFocused();
  await expect.poll(async () => page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName)).toBe(manualFocus);
});
