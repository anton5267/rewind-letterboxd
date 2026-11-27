import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261124", "profile");
mkdirSync(evidenceDir, { recursive: true });
const emptyPage = { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0, first: true, last: true };
const profile = {
  id: 981000, username: "jeremy-empty", displayName: "Jeremy B.", avatarUrl: null, hq: false,
  location: "Germany", bio: "I watch movies and overthink them. Probably more than I should.",
  stats: { ratings: 0, reviews: 0, watched: 834, watchlist: 0, favorites: 0 },
  ratingDistribution: [], socialLinks: [], lists: [], recentReviews: [],
};

for (const lang of ["uk", "en"] as const) {
  test(`public profile empty overview stays complete and fits the mobile frame (${lang})`, async ({ page }) => {
    await page.route(url => url.pathname.startsWith("/api/"), async route => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
      if (pathname === "/api/users/981000/profile") return route.fulfill({ json: profile });
      if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
      return route.fulfill({ json: emptyPage });
    });
    await page.setViewportSize({ width: 393, height: 1099 });
    await page.goto(`/${lang}/users/981000`);
    await expect(page.getByRole("heading", { level: 1, name: "Jeremy B." })).toBeVisible();
    const labels = lang === "uk"
      ? ["Улюблені фільми", "Остання активність", "Останні огляди", "Підписки", "Списки"]
      : ["Favorite films", "Recent activity", "Recent reviews", "Following", "Lists"];
    for (const label of labels) {
      await expect(page.getByRole("heading", { name: label })).toBeVisible();
    }
    const geometry = await page.evaluate(() => {
      const hero = document.querySelector<HTMLElement>("section[class*=hero]");
      const favorites = document.querySelector<HTMLElement>("#public-profile-overview h2");
      return {
        heroBottom: hero ? hero.getBoundingClientRect().bottom + window.scrollY : null,
        favoritesHeadingTop: favorites ? favorites.getBoundingClientRect().top + window.scrollY : null,
      };
    });
    expect(geometry.heroBottom).not.toBeNull();
    expect(Math.abs(geometry.heroBottom! - 547)).toBeLessThanOrEqual(2);
    expect(geometry.favoritesHeadingTop).not.toBeNull();
    expect(Math.abs(geometry.favoritesHeadingTop! - 590)).toBeLessThan(20);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
    await page.screenshot({ path: path.join(evidenceDir, `rewind-public-empty-overview-${lang}-mobile-393.png`), fullPage: true });
  });
}
