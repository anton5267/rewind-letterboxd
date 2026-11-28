import { expect, test } from "@playwright/test";

const moviePage = {
  content: [{ id: 970_101, title: "Motion Preview", photoUrl: null, releaseDate: "2026-01-01", rating: 8.2 }],
  totalElements: 1,
  totalPages: 1,
  number: 0,
  size: 6,
};

test("Home discovery cards respond to pointer and keyboard without motion when requested", async ({ page }) => {
  await page.route("**/api/movies/search?**", route => route.fulfill({ json: moviePage }));
  await page.route("**/api/stats/public-watched-films**", route => route.fulfill({ json: { count: 0 } }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/home");

  const card = page.locator("article[class*='movieCard']").filter({ has: page.getByRole("link", { name: "Motion Preview" }) }).first();
  const link = card.getByRole("link", { name: "Motion Preview" });
  await expect(card).toBeVisible();

  await card.hover();
  await expect.poll(() => card.evaluate(element => getComputedStyle(element).transform)).not.toBe("none");
  await expect.poll(() => card.evaluate(element => getComputedStyle(element).boxShadow)).not.toBe("none");

  await link.focus();
  await expect.poll(() => card.evaluate(element => getComputedStyle(element).transform)).not.toBe("none");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(card).toHaveCSS("transform", "none");
  await expect(card).toHaveCSS("box-shadow", "none");
  await expect(card).toHaveCSS("transition-duration", "0s");

  await page.setViewportSize({ width: 393, height: 852 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test("public featured list cards use the shared motion affordance", async ({ page }) => {
  await page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/users/popular-reviewers" || pathname === "/api/tags/popular") return route.fulfill({ json: [] });
    if (pathname === "/api/lists/public/featured") return route.fulfill({ json: {
      content: [{
        id: 970_201,
        name: "Featured motion list",
        description: "Fixture content for the card response.",
        ownerId: 970_202,
        ownerUsername: "motion-reviewer",
        tags: [],
        itemCount: 1,
        likeCount: 0,
        featuredCategory: "REWIND_COMMUNITY",
        previewMovies: [{ id: 970_203, title: "Featured preview", photoUrl: null, releaseDate: null, rating: null }],
      }],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 12,
    } });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 12 } });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/lists/discover?feed=featured");
  const card = page.locator("article").filter({ hasText: "Featured motion list" });
  await expect(card).toBeVisible();
  await card.hover();
  await expect.poll(() => card.evaluate(element => getComputedStyle(element).transform)).not.toBe("none");
  await expect.poll(() => card.evaluate(element => getComputedStyle(element).boxShadow)).not.toBe("none");
});

test("Global Search film results keep the shared motion and reduced-motion behavior", async ({ page }) => {
  await page.route("**/api/search/global?**", route => route.fulfill({ json: {
    films: { content: [{ id: 970_301, title: "Search Motion Preview", photoUrl: null, releaseDate: "2025-01-01", rating: 7.8 }], totalElements: 1, totalPages: 1, number: 0, size: 6 },
    users: { content: [], totalElements: 0 },
    lists: { content: [], totalElements: 0 },
    tags: [],
    people: [],
    reviews: { content: [], totalElements: 0 },
    journal: { content: [], totalElements: 0 },
  } }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/search?q=Motion&tab=films");

  const card = page.locator("article[class*='filmCard']").filter({ hasText: "Search Motion Preview" });
  const link = card.getByRole("link", { name: "Search Motion Preview poster" });
  await expect(card).toBeVisible();
  await card.hover();
  await expect.poll(() => card.evaluate(element => getComputedStyle(element).transform)).not.toBe("none");
  await expect.poll(() => card.evaluate(element => getComputedStyle(element).boxShadow)).not.toBe("none");

  await page.mouse.move(0, 0);
  await link.focus();
  await expect.poll(() => card.evaluate(element => getComputedStyle(element).transform)).not.toBe("none");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(card).toHaveCSS("transform", "none");
  await expect(card).toHaveCSS("box-shadow", "none");
  await page.setViewportSize({ width: 393, height: 852 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});
