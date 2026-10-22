import { expect, test } from "@playwright/test";

const movies = Array.from({ length: 12 }, (_, index) => ({
  id: 981500 + index,
  title: `Figma poster ${index + 1}`,
  releaseDate: "2024-01-01",
  photoUrl: null,
  rating: null,
}));

test("public profile desktop follows the measured Figma shell geometry", async ({ page }) => {
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/users/981234/profile") {
      await route.fulfill({ json: {
        id: 981234,
        username: "jeremy-b",
        displayName: "Jeremy B.",
        avatarUrl: null,
        hq: false,
        stats: { ratings: 24, reviews: 8, watched: 834, watchlist: 32, favorites: 4 },
        ratingDistribution: [],
        socialLinks: [],
        lists: [],
        recentReviews: [],
      } });
      return;
    }
    if (pathname === "/api/users/981234/collections/watched") {
      await route.fulfill({ json: { content: movies, totalPages: 1, totalElements: movies.length, number: 0, size: 12 } });
      return;
    }
    if (pathname === "/api/users/me") {
      await route.fulfill({ status: 401, json: {} });
      return;
    }
    await route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 10 } });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/users/981234");
  await expect(page.getByRole("heading", { name: "Jeremy B.", level: 1 })).toBeVisible();
  await expect(page.locator("#public-profile-collections")).toBeVisible();

  const hero = page.locator("main > div > section").first();
  const heroBox = await hero.boundingBox();
  expect(heroBox?.x).toBe(0);
  expect(heroBox?.width).toBe(1440);
  expect(heroBox?.height).toBe(1020);

  const avatarBox = await page.locator('[class*="avatarFallback"]').boundingBox();
  expect(avatarBox?.width).toBe(265);
  expect(avatarBox?.height).toBe(265);

  const railBox = await page.locator('nav[class*="profileRail"]').boundingBox();
  expect(railBox?.width).toBe(1200);
  expect(railBox?.height).toBe(79);

  const cards = page.locator('#public-profile-collections [class*="collectionPosterLink"]');
  await expect(cards).toHaveCount(12);
  const cardBox = await cards.first().boundingBox();
  expect(cardBox?.width).toBe(174);
  expect(cardBox?.height).toBe(260);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});
