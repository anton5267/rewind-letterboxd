import { expect, test, type Page, type Route } from "@playwright/test";

const emptyPage = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 6 };
const featuredList = {
  id: 989101,
  name: "A useful film collection",
  description: "A small curated collection.",
  ownerId: 989102,
  ownerUsername: "rewind-curator",
  tags: [],
  likeCount: 2,
  itemCount: 2,
  previewMovies: [
    { id: 989103, title: "Arrival", releaseDate: "2016-11-11", rating: 7.9, photoUrl: null },
    { id: 989104, title: "Moon", releaseDate: "2009-06-12", rating: 7.8, photoUrl: null },
  ],
};

async function mockLanding(page: Page, options: { featured?: boolean; failFeaturedOnce?: boolean; tags?: boolean } = {}) {
  let featuredRequests = 0;
  await page.route(url => url.pathname.startsWith("/api/"), async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/tags/popular") return route.fulfill({ json: options.tags ? [{ id: 989110, name: "Science fiction", slug: "science-fiction" }] : [] });
    if (pathname === "/api/lists/public/team") {
      featuredRequests += 1;
      if (options.failFeaturedOnce && featuredRequests === 1) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({ json: options.featured ? { ...emptyPage, content: [featuredList], totalPages: 1, totalElements: 1 } : emptyPage });
    }
    if (["/api/lists/public/popular", "/api/lists/public/recently-liked", "/api/lists/public"].includes(pathname)) {
      return route.fulfill({ json: emptyPage });
    }
    return route.fulfill({ json: [] });
  });
  return { getFeaturedRequests: () => featuredRequests };
}

test("empty list feeds collapse to one useful landing state", async ({ page }) => {
  await mockLanding(page);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/uk/lists/discover");

  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  await expect(main.locator('section[class*="landingSections"] > section[class*="landingSection"]')).toHaveCount(0);
  await expect(main.locator('section[class*="tagsSection"]')).toHaveCount(0);
  await expect(main.getByText("Публічних списків поки немає.", { exact: true })).toBeVisible();
  await expect(main.getByRole("link", { name: "Створіть власний список", exact: true })).toHaveCount(1);
  await expect(main.getByRole("link", { name: "Створіть власний список", exact: true })).toHaveAttribute("href", "/uk/lists");
  await expect(main.getByRole("link", { name: "Переглянути всі", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
});

test("landing keeps only feeds with lists and keeps available tags", async ({ page }) => {
  await mockLanding(page, { featured: true, tags: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/lists/discover");

  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  await expect(main.locator('section[class*="landingSections"] > section[class*="landingSection"]')).toHaveCount(1);
  await expect(main.getByRole("heading", { name: "Featured lists" })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Popular lists" })).toHaveCount(0);
  await expect(main.getByRole("heading", { name: "Recently liked lists" })).toHaveCount(0);
  await expect(main.getByRole("heading", { name: "Recent lists" })).toHaveCount(0);
  await expect(main.getByRole("heading", { name: "Popular tags" })).toBeVisible();
  await expect(main.getByText("No public lists yet.", { exact: true })).toHaveCount(0);
});

test("failed list feed remains retryable while empty feeds stay hidden", async ({ page }) => {
  const fixture = await mockLanding(page, { featured: true, failFeaturedOnce: true });
  await page.goto("/en/lists/discover");

  const main = page.getByRole("main");
  const featured = main.locator('section[class*="landingSections"] > section[class*="landingSection"]').filter({ has: page.getByRole("heading", { name: "Featured lists" }) });
  await expect(main).toHaveAttribute("aria-busy", "false");
  await expect(featured.getByRole("alert")).toBeVisible();
  await expect(main.locator('section[class*="landingSections"] > section[class*="landingSection"]')).toHaveCount(1);
  await expect(main.getByText("No public lists yet.", { exact: true })).toHaveCount(0);

  await featured.getByRole("button", { name: "Retry" }).click();
  await expect(main).toHaveAttribute("aria-busy", "false");
  await expect(featured.getByText("A useful film collection")).toBeVisible();
  expect(fixture.getFeaturedRequests()).toBe(2);
});
