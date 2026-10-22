import { expect, test, type Page } from "@playwright/test";

const lists = Array.from({ length: 4 }, (_, index) => ({
  id: 984100 + index,
  name: `Popular list ${index + 1}`,
  description: "A popular film collection.",
  ownerId: 984200 + index,
  ownerUsername: `member-${index}`,
  itemCount: 250 - index,
  likeCount: 296000 - index * 1000,
  tags: [],
  previewMovies: Array.from({ length: 5 }, (_, movieIndex) => ({ id: 984300 + index * 10 + movieIndex, title: `Film ${movieIndex + 1}`, photoUrl: null, releaseDate: null, rating: null })),
}));

function mockPublicLists(page: Page) {
  return page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/users/popular-reviewers") return route.fulfill({ json: [] });
    if (url.pathname === "/api/tags/popular") return route.fulfill({ json: [] });
    if (url.pathname === "/api/lists/public/popular") return route.fulfill({ json: { content: lists, totalPages: 1, totalElements: lists.length, number: 0, size: 12 } });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 0 } });
  });
}

test("popular lists follows the raw desktop row geometry", async ({ page }) => {
  await mockPublicLists(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/lists/discover?feed=popular");
  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  const hero = main.locator('section[class*="feedHero"]');
  await expect(hero).toHaveCSS("min-height", "628px");
  const cards = main.locator('section[aria-labelledby="lists-grid-heading"] article');
  await expect(cards).toHaveCount(4);
  const first = await cards.first().boundingBox();
  expect(first?.x).toBeCloseTo(120, 0);
  expect(first?.width).toBeCloseTo(1200, 0);
  expect(first?.height).toBeCloseTo(339, 0);
  expect(first?.y).toBeCloseTo(813, 0);
});

test("popular lists keeps the measured phone poster rail inside the viewport", async ({ page }) => {
  await mockPublicLists(page);
  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/uk/lists/discover?feed=popular");
  await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
  const card = page.locator('section[aria-labelledby="lists-grid-heading"] article').first();
  await expect(card).toHaveCSS("width", "361px");
  const poster = await card.locator('a[class*="featuredPosterLink"]').boundingBox();
  expect(poster?.width).toBeCloseTo(323, 0);
  expect(poster?.height).toBeCloseTo(116, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
});
