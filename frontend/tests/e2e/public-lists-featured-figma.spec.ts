import { expect, test } from "@playwright/test";

const lists = Array.from({ length: 3 }, (_, index) => ({
  id: 983100 + index,
  name: `Featured list ${index + 1}`,
  description: "A compact featured collection.",
  ownerId: 983200 + index,
  ownerUsername: `curator-${index}`,
  itemCount: 4,
  likeCount: 3,
  tags: [],
  previewMovies: Array.from({ length: 4 }, (_, movieIndex) => ({ id: 983300 + index * 10 + movieIndex, title: `Featured film ${movieIndex + 1}`, photoUrl: null, releaseDate: null, rating: null })),
}));

test("featured lists follows the raw desktop Figma card rhythm", async ({ page }) => {
  await page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/users/popular-reviewers") return route.fulfill({ json: [] });
    if (url.pathname === "/api/tags/popular") return route.fulfill({ json: [] });
    if (url.pathname === "/api/lists/public/team") return route.fulfill({ json: { content: lists, totalPages: 1, totalElements: lists.length, number: 0, size: 12 } });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 0 } });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/lists/discover?feed=team");
  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  const hero = main.locator('section[class*="feedHero"]');
  await expect(hero).toHaveCSS("min-height", "572px");
  const cards = main.locator('section[aria-labelledby="lists-grid-heading"] article');
  await expect(cards).toHaveCount(3);
  const cardBoxes = await cards.evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, width: rect.width, height: rect.height };
  }));
  expect(cardBoxes.every(card => Math.abs(card.width - 326) < 1 && Math.abs(card.height - 249) < 1)).toBe(true);
  expect(cardBoxes[1].x - cardBoxes[0].x).toBeCloseTo(438, 0);
  expect(cardBoxes[2].x - cardBoxes[1].x).toBeCloseTo(438, 0);
  const poster = await cards.first().locator('a[class*="posterLink"]').boundingBox();
  expect(poster?.width).toBe(326);
  expect(poster?.height).toBe(180);
});

test("featured lists keeps the phone feed inside the viewport", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/users/popular-reviewers**", route => route.fulfill({ json: [] }));
  await page.route("**/api/tags/popular", route => route.fulfill({ json: [] }));
  await page.route("**/api/lists/public/team**", route => route.fulfill({ json: { content: lists, totalPages: 1, totalElements: lists.length, number: 0, size: 12 } }));
  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/uk/lists/discover?feed=team");
  await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
  const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, elements: [...document.querySelectorAll("body *")].filter(element => element.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(element => ({ tag: element.tagName, className: String(element.className), right: element.getBoundingClientRect().right, width: element.getBoundingClientRect().width })) }));
  expect(overflow.width, JSON.stringify(overflow.elements)).toBeLessThanOrEqual(393);
});
