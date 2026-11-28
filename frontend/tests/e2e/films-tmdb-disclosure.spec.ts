import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

const catalog = {
  content: Array.from({ length: 36 }, (_, index) => ({
    id: 99001 + index,
    title: `Catalog fixture ${index + 1}`,
    releaseDate: "2025-01-01",
    rating: 7.2,
    photoUrl: null,
  })),
  number: 0,
  size: 36,
  totalPages: 2,
  totalElements: 50,
};

const tmdbPage = {
  content: [{ tmdbId: 101, title: "TMDB fixture", releaseDate: "2025-01-01", posterUrl: null, overview: "A fixture." }],
  page: 1,
  totalPages: 2,
  totalResults: 20,
};

test("TMDB discovery loads automatically and stays accessible, shareable, and within the Films layout", async ({ page }, testInfo) => {
  let discoveryRequests = 0;
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "tmdb-disclosure-fixture" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/genres", route => route.fulfill({ json: [{ id: 1, tmdbId: 18, name: "Drama" }] }));
  await page.route("**/api/movies/search**", route => route.fulfill({ json: catalog }));
  await page.route("**/api/tmdb/movies/discover**", route => {
    discoveryRequests += 1;
    return route.fulfill({ json: tmdbPage });
  });
  await page.route("**/api/tmdb/movies/search**", route => route.fulfill({ json: tmdbPage }));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/films");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");

  await expect(page.locator("#tmdb-discovery-toggle")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#tmdb-discovery-panel")).toBeVisible();
  await expect(page.getByRole("heading", { name: "TMDB fixture" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Log in" })).toHaveAttribute("href", /\/login/);
  await expect(page.getByRole("button", { name: "Add to REWIND" })).toHaveCount(0);
  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(accessibility.violations).toEqual([]);
  await expect.poll(() => discoveryRequests).toBe(1);
  await page.screenshot({ path: testInfo.outputPath("films-tmdb-disclosure-desktop.png") });

  const initialGeometry = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      filters: rect("#film-filter-controls"),
      poster: rect('main article a[href*="/films/"]'),
      pagination: rect('main nav[aria-label="Film pages"]'),
      footer: rect("footer"),
    };
  });
  expect(initialGeometry.filters?.y).toBe(294);
  expect(initialGeometry.poster?.y).toBe(607);
  expect(initialGeometry.pagination?.y).toBe(2502);
  expect(initialGeometry.footer?.y).toBeGreaterThan(2691);

  await page.locator("#tmdb-discovery-panel button[aria-label='Close TMDB discovery']").click();
  await expect(page.locator("#tmdb-discovery-panel")).toBeHidden();
  await expect(page.locator("#tmdb-discovery-toggle")).toBeFocused();
  await expect.poll(() => page.locator("footer").evaluate(element => element.getBoundingClientRect().y)).toBeLessThan(initialGeometry.footer!.y);
  await expect.poll(() => discoveryRequests).toBe(1);

  for (const parameter of ["tmdbPage=2", "tmdbGenreId=18", "tmdbYear=2024", "tmdbMinRating=7"]) {
    await page.goto(`/en/films?${parameter}`);
    await expect(page.locator("#tmdb-discovery-toggle")).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#tmdb-discovery-panel")).toBeVisible();
  }

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/films?tmdbYear=2024");
  await expect(page.locator("#tmdb-discovery-toggle")).toHaveAttribute("aria-expanded", "true");
  const requestsBeforeTitleSearch = discoveryRequests;
  await page.locator('button[aria-controls="film-filter-controls"]').click();
  await page.getByLabel("Search films").fill("alien");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=alien/);
  await expect(page.locator("#tmdb-discovery-toggle")).toHaveCount(0);
  await expect(page.locator("#tmdb-film-results-title")).toBeVisible();
  expect(discoveryRequests).toBe(requestsBeforeTitleSearch);

  await page.goBack();
  await expect(page).toHaveURL(/tmdbYear=2024/);
  await expect(page.locator("#tmdb-discovery-toggle")).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => discoveryRequests).toBe(requestsBeforeTitleSearch + 1);
  await page.goForward();
  await expect(page.locator("#tmdb-discovery-toggle")).toHaveCount(0);
  expect(discoveryRequests).toBe(requestsBeforeTitleSearch + 1);

  await page.goto("/en/films?q=alien");
  await expect(page.locator("#tmdb-discovery-toggle")).toHaveCount(0);
  await expect(page.locator("#tmdb-film-results-title")).toBeVisible();

  await page.goto("/en/films");
  await expect(page.locator("#tmdb-discovery-toggle")).toHaveAttribute("aria-expanded", "true");
  const requestsBeforePlainSearch = discoveryRequests;
  await page.locator('button[aria-controls="film-filter-controls"]').click();
  await page.getByLabel("Search films").fill("arrival");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=arrival/);
  await expect(page.locator("#tmdb-discovery-toggle")).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/\/en\/films\/?$/);
  await expect(page.locator("#tmdb-discovery-toggle")).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => discoveryRequests).toBe(requestsBeforePlainSearch + 1);

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/films?q=alien");
  await expect(page.locator("#tmdb-discovery-toggle")).toHaveCount(0);
  const requestsBeforeClearSearch = discoveryRequests;
  await page.locator('button[aria-controls="film-filter-controls"]').click();
  await page.locator("#film-search-query").fill("");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/films\/?$/);
  await expect(page.locator("#tmdb-discovery-toggle")).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => discoveryRequests).toBe(requestsBeforeClearSearch + 1);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/films?tmdbYear=2024");
  await expect(page.locator("#tmdb-discovery-toggle")).toHaveAttribute("aria-expanded", "true");
  await page.locator("#tmdb-discovery-panel button[aria-label='Close TMDB discovery']").click();
  await expect(page.locator("#tmdb-discovery-panel")).toBeHidden();
  await page.getByRole("button", { name: "Page 2" }).click();
  await expect(page).toHaveURL(/page=1/);
  await expect(page.locator("#tmdb-discovery-toggle")).toHaveAttribute("aria-expanded", "false");

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/films");
  const mobileToggle = page.locator("#tmdb-discovery-toggle");
  await expect(mobileToggle).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("films-tmdb-disclosure-mobile.png") });
  const mobileGeometry = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - innerWidth,
    toggle: (() => {
      const { x, y, width, height } = document.querySelector("#tmdb-discovery-toggle")!.getBoundingClientRect();
      return { x, y, width, height };
    })(),
  }));
  expect(mobileGeometry.overflow).toBe(0);
  expect(mobileGeometry.toggle.width).toBeGreaterThanOrEqual(44);
  expect(mobileGeometry.toggle.height).toBeGreaterThanOrEqual(44);
});

test("clearing a movie title search restores the default TMDB feed", async ({ page }) => {
  let discoveryRequests = 0;
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "tmdb-clear-search-fixture" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/genres", route => route.fulfill({ json: [{ id: 1, tmdbId: 18, name: "Drama" }] }));
  await page.route("**/api/movies/search**", route => route.fulfill({ json: catalog }));
  await page.route("**/api/tmdb/movies/discover**", route => {
    discoveryRequests += 1;
    return route.fulfill({ json: tmdbPage });
  });
  await page.route("**/api/tmdb/movies/search**", route => route.fulfill({ json: tmdbPage }));

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/films?q=alien");
  await expect(page.locator("#tmdb-discovery-toggle")).toHaveCount(0);
  await page.locator('button[aria-controls="film-filter-controls"]').click();
  await page.locator("#film-search-query").fill("");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(page).toHaveURL(/\/en\/films\/?$/);
  await expect(page.locator("#tmdb-discovery-toggle")).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => discoveryRequests).toBe(1);
});

test("closing TMDB stays closed when REWIND catalogue pagination changes", async ({ page }) => {
  let discoveryRequests = 0;
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "tmdb-local-pagination-fixture" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/genres", route => route.fulfill({ json: [{ id: 1, tmdbId: 18, name: "Drama" }] }));
  await page.route("**/api/movies/search**", route => route.fulfill({ json: catalog }));
  await page.route("**/api/tmdb/movies/discover**", route => {
    discoveryRequests += 1;
    return route.fulfill({ json: tmdbPage });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/films?tmdbYear=2024");
  await expect(page.locator("#tmdb-discovery-toggle")).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => discoveryRequests).toBe(1);
  await page.locator("#tmdb-discovery-panel button[aria-label='Close TMDB discovery']").click();
  await page.getByRole("button", { name: "Page 2" }).click();

  await expect(page).toHaveURL(/tmdbYear=2024.*page=1|page=1.*tmdbYear=2024/);
  await expect(page.locator("#tmdb-discovery-toggle")).toHaveAttribute("aria-expanded", "false");
  await expect.poll(() => discoveryRequests).toBe(1);
  await expect(page.locator("#tmdb-discovery-panel h2")).not.toBeFocused();
});

test("an authenticated TMDB selection adds the film to the Watchlist and opens its REWIND page", async ({ page }) => {
  let importPayload: unknown;
  await installHostedAuthFixture(page.context());
  await page.route("**/api/users/me", route => route.fulfill({ json: { id: 990100, username: "tmdb-reader", role: "USER" } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "tmdb-watchlist-fixture" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/genres", route => route.fulfill({ json: [{ id: 1, tmdbId: 18, name: "Drama" }] }));
  await page.route("**/api/movies/search**", route => route.fulfill({ json: catalog }));
  await page.route("**/api/tmdb/movies/discover**", route => route.fulfill({ json: tmdbPage }));
  await page.route("**/api/tmdb/movies/import", async route => {
    importPayload = route.request().postDataJSON();
    await route.fulfill({ json: { movieId: 990101, title: "TMDB fixture" } });
  });

  await signInHostedFixture(page, "en");
  await expect(page.getByRole("button", { name: "Add to my Watchlist" })).toBeVisible();
  await page.getByRole("button", { name: "Add to my Watchlist" }).click();

  await expect(page).toHaveURL(/\/en\/films\/990101\/?$/);
  expect(importPayload).toEqual({ tmdbId: 101, addToWatchlist: true });
});
