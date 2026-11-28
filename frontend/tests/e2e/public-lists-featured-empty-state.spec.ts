import { expect, test } from "@playwright/test";

const emptyPage = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 12 };

async function installCommonResponses(page: import("@playwright/test").Page, featuredResponse: unknown) {
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "featured-empty-state" } }));
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/users/popular-reviewers**", route => route.fulfill({ json: [] }));
  await page.route("**/api/tags/popular**", route => route.fulfill({ json: [] }));
  await page.route("**/api/lists/public/featured**", route => route.fulfill({ json: featuredResponse }));
}

test("featured lists shows one localized empty state when no featured lists exist", async ({ page }) => {
  await installCommonResponses(page, emptyPage);
  const main = page.getByRole("main");
  for (const [locale, expectedCopy] of [
    ["uk", "Поки що немає відібраних списків."],
    ["en", "No featured lists have been published yet."],
  ]) {
    await page.goto(`/${locale}/lists/discover?feed=featured`);
    await expect(main).toHaveAttribute("aria-busy", "false");
    await expect(main.getByText(expectedCopy, { exact: true })).toBeVisible();
    await expect(main.locator('section[class*="featuredCategorySection"]')).toHaveCount(0);
    await expect(main.getByText(locale === "uk" ? "Публічних списків поки немає." : "No public lists yet.", { exact: true })).toHaveCount(0);
  }
});

test("featured lists omits empty categories when real category data exists", async ({ page }) => {
  const featuredList = {
    id: 1,
    name: "Films to revisit",
    description: "A public film list.",
    ownerId: 2,
    ownerUsername: "FilmFan",
    ownerAvatarUrl: null,
    itemCount: 0,
    likeCount: 0,
    featuredCategory: "REWIND_COMMUNITY",
    tags: [],
    previewMovies: [],
  };
  await installCommonResponses(page, { ...emptyPage, content: [featuredList], totalPages: 1, totalElements: 1 });
  await page.goto("/en/lists/discover?feed=featured");

  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  const categories = main.locator('section[class*="featuredCategorySection"]');
  await expect(categories).toHaveCount(1);
  await expect(categories.locator('[class*="sectionHeading"] h2')).toHaveText("Rewind community");
  await expect(categories.locator("article h2 a")).toHaveText("Films to revisit");
  await expect(main.getByText("No featured lists have been published yet.", { exact: true })).toHaveCount(0);
});

test("featured empty status waits for the current view response after landing navigation", async ({ page }) => {
  await page.addInitScript(() => {
    const observedWindow = window as Window & { __featuredEmptyStatusWasShown?: boolean };
    observedWindow.__featuredEmptyStatusWasShown = false;
    new MutationObserver(records => {
      for (const node of records.flatMap(record => [...record.addedNodes])) {
        if (node.textContent?.includes("No featured lists have been published yet.")) {
          observedWindow.__featuredEmptyStatusWasShown = true;
        }
      }
    }).observe(document, { childList: true, subtree: true });
  });

  const featuredList = {
    id: 11,
    name: "Films to revisit",
    description: "A public film list.",
    ownerId: 12,
    ownerUsername: "FilmFan",
    itemCount: 0,
    likeCount: 0,
    featuredCategory: "REWIND_COMMUNITY",
    tags: [],
    previewMovies: [],
  };
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "featured-navigation" } }));
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/users/popular-reviewers**", route => route.fulfill({ json: [] }));
  await page.route("**/api/tags/popular", route => route.fulfill({ json: [] }));
  await page.route(url => url.pathname.startsWith("/api/lists/public/"), async route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/lists/public/featured") {
      if (url.searchParams.get("size") !== "6") await new Promise(resolve => setTimeout(resolve, 600));
      const content = [featuredList];
      return route.fulfill({ json: { content, totalPages: 1, totalElements: 1, number: 0, size: 12 } });
    }
    return route.fulfill({ json: emptyPage });
  });

  await page.goto("/en/lists/discover");
  const main = page.getByRole("main");
  const featuredLanding = main.locator('section[class*="landingSection"]').filter({ has: page.getByRole("heading", { name: "Featured lists" }) });
  await expect(featuredLanding.getByRole("link", { name: "Films to revisit" }).first()).toBeVisible();
  await featuredLanding.getByRole("link", { name: "View all" }).click();

  const featuredPage = main.locator('[class*="featuredCategorySections"]');
  await expect(featuredPage).toHaveAttribute("aria-busy", "true");
  await expect(main.getByText("No featured lists have been published yet.", { exact: true })).toHaveCount(0);
  await expect(featuredPage.locator('[class*="skeleton"]').first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as Window & { __featuredEmptyStatusWasShown?: boolean }).__featuredEmptyStatusWasShown)).toBe(false);
  await expect(featuredPage.locator("article h2 a")).toHaveText("Films to revisit", { timeout: 10000 });
});

test("featured error and retry states do not announce an empty feed", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "featured-retry" } }));
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/users/popular-reviewers**", route => route.fulfill({ json: [] }));
  await page.route("**/api/tags/popular", route => route.fulfill({ json: [] }));
  await page.route(url => url.pathname.includes("/api/lists/public/featured"), route => {
    requests += 1;
    if (requests === 1) return route.fulfill({ status: 503, json: {} });
    return route.fulfill({ json: emptyPage });
  });

  await page.goto("/en/lists/discover?feed=featured");
  const main = page.getByRole("main");
  const featuredPage = main.locator('[class*="featuredCategorySections"]');
  await expect(main).toHaveAttribute("aria-busy", "false");
  await expect(main.getByRole("alert")).toBeVisible();
  await expect(main.locator('section[class*="featuredCategorySection"]')).toHaveCount(3);
  await expect(main.getByText("No featured lists have been published yet.", { exact: true })).toHaveCount(0);

  await main.getByRole("button", { name: "Retry" }).click();
  await expect.poll(() => requests).toBeGreaterThan(1);
  await expect(main).toHaveAttribute("aria-busy", "false");
  await expect(main.getByText("No featured lists have been published yet.", { exact: true })).toBeVisible();
  await expect(main.locator('section[class*="featuredCategorySection"]')).toHaveCount(0);
  expect(requests).toBeGreaterThanOrEqual(2);
});
