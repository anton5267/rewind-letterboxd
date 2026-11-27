import { expect, test, type Page } from "@playwright/test";

const tags = ["top", "cinema", "top2025", "drama", "list", "comedy", "christmas", "watchlist", "marvel"].map((name, index) => ({ id: 992000 + index, name, slug: name }));

function listsFor(feed: string) {
  return Array.from({ length: 3 }, (_, index) => ({
    id: 992100 + ["featured", "popular", "recently-liked", "team"].indexOf(feed) * 10 + index,
    name: `${feed} list ${index + 1}`,
    description: "A film collection with a short source description for the catalogue preview.",
    ownerId: 992200 + index,
    ownerUsername: `curator-${index}`,
    ownerAvatarUrl: null,
    itemCount: 12 + index,
    likeCount: 25 + index,
    tags: [],
    previewMovies: Array.from({ length: 5 }, (_, movieIndex) => ({ id: 992300 + index * 10 + movieIndex, title: `Film ${movieIndex + 1}`, photoUrl: null, releaseDate: null, rating: null })),
  }));
}

async function mockListsLanding(page: Page) {
  await page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/tags/popular") return route.fulfill({ json: tags });
    const feeds: Record<string, string> = {
      "/api/lists/public/featured": "featured",
      "/api/lists/public/popular": "popular",
      "/api/lists/public/recently-liked": "recently-liked",
      "/api/lists/public/team": "team",
    };
    const feed = feeds[url.pathname];
    if (feed) {
      const content = listsFor(feed);
      return route.fulfill({ json: { content, totalPages: 1, totalElements: content.length, number: 0, size: 6 } });
    }
    return route.fulfill({ status: 404, json: {} });
  });
}

test("READY desktop Lists landing aligns its hero, feed rows and tags", async ({ page }) => {
  await mockListsLanding(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/lists/discover");
  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");

  const intro = main.locator('section[class*="landingHero"] [class*="landingIntro"]');
  const introBox = await intro.boundingBox();
  expect(introBox?.y).toBeCloseTo(273, 0);
  const cta = main.locator('section[class*="landingHero"] a[class*="heroAction"]');
  expect((await cta.boundingBox())?.y).toBeCloseTo(388, 0);

  const section = (key: string) => main.locator(`section[aria-labelledby="landing-${key}-heading"]`);
  expect((await section("featured").locator('[class*="sectionHeading"]').boundingBox())?.y).toBeCloseTo(531, 0);
  expect((await section("featured").locator("article").first().boundingBox())?.y).toBeCloseTo(637, 0);
  expect((await section("popular").locator('[class*="sectionHeading"]').boundingBox())?.y).toBeCloseTo(1056, 0);
  expect((await section("popular").locator("article").first().boundingBox())?.y).toBeCloseTo(1156, 0);
  expect((await section("recentlyLiked").locator('[class*="sectionHeading"]').boundingBox())?.y).toBeCloseTo(1569, 0);
  const likedCard = await section("recentlyLiked").locator("article").first().boundingBox();
  expect(likedCard?.x).toBeCloseTo(121, 0);
  expect(likedCard?.y).toBeCloseTo(1669, 0);
  expect(likedCard?.width).toBeCloseTo(1200, 0);
  expect(likedCard?.height).toBeCloseTo(339, 0);
  expect((await section("crew").locator('[class*="sectionHeading"]').boundingBox())?.y).toBeCloseTo(2846, 0);
  expect((await main.locator('section[class*="tagsSection"] [class*="sectionHeading"]').boundingBox())?.y).toBeCloseTo(3242, 0);
  expect((await main.locator('section[class*="tagsSection"] [class*="tagRail"]').boundingBox())?.y).toBeCloseTo(3342, 0);
  expect((await page.locator("footer").boundingBox())?.y).toBeCloseTo(3551, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
});

test("READY phone Lists landing aligns its poster rails, liked cards and fixed navigation", async ({ page }) => {
  await mockListsLanding(page);
  await page.setViewportSize({ width: 393, height: 1809 });
  await page.goto("/en/lists/discover");
  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");

  const section = (key: string) => main.locator(`section[aria-labelledby="landing-${key}-heading"]`);
  expect((await section("featured").locator('[class*="sectionHeading"]').boundingBox())?.y).toBeCloseTo(284, 0);
  const featuredPoster = await section("featured").locator('article a[class*="posterLink"]').first().boundingBox();
  expect(featuredPoster?.x).toBeCloseTo(16, 0);
  expect(featuredPoster?.y).toBeCloseTo(335, 0);
  expect(featuredPoster?.width).toBeCloseTo(150, 0);
  expect(featuredPoster?.height).toBeCloseTo(87, 0);
  expect((await section("popular").locator('[class*="sectionHeading"]').boundingBox())?.y).toBeCloseTo(499, 0);
  expect((await section("popular").locator('article a[class*="posterLink"]').first().boundingBox())?.y).toBeCloseTo(550, 0);
  expect((await section("recentlyLiked").locator('[class*="sectionHeading"]').boundingBox())?.y).toBeCloseTo(714, 0);
  const likedCard = await section("recentlyLiked").locator("article").first().boundingBox();
  expect(likedCard?.x).toBeCloseTo(16, 0);
  expect(likedCard?.y).toBeCloseTo(762, 0);
  expect(likedCard?.width).toBeCloseTo(361, 0);
  expect(likedCard?.height).toBeCloseTo(189, 0);
  expect((await section("crew").locator('[class*="sectionHeading"]').boundingBox())?.y).toBeCloseTo(1388, 0);
  expect((await main.locator('section[class*="tagsSection"] [class*="sectionHeading"]').boundingBox())?.y).toBeCloseTo(1603, 0);
  expect((await main.locator('section[class*="tagsSection"] [class*="tagRail"]').boundingBox())?.y).toBeCloseTo(1651, 0);
  const nav = await page.getByRole("navigation", { name: "Main navigation" }).boundingBox();
  expect(nav?.y).toBeCloseTo(1717, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
});
