import { expect, test } from "@playwright/test";

const emptyMoviePage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 12 };
const emptyGlobalResults = {
  films: emptyMoviePage,
  users: { content: [], totalElements: 0 },
  lists: { content: [], totalElements: 0 },
  tags: [],
  people: [],
  reviews: { content: [], totalElements: 0 },
  journal: { content: [], totalElements: 0 },
};
const catalogMovie = { id: 980_101, title: "A Film to Browse", photoUrl: null, releaseDate: "2024-01-01", rating: 7.5 };

async function mockFilmCatalog(page: import("@playwright/test").Page) {
  await page.route("**/api/genres", route => route.fulfill({ json: [{ id: 18, name: "Drama" }] }));
  await page.route("**/api/tmdb/movies/discover**", route => route.fulfill({ json: {
    content: [], totalElements: 0, totalPages: 0, number: 0, size: 8,
  } }));
  await page.route("**/api/movies/search**", route => {
    const requestUrl = new URL(route.request().url());
    const number = Number(requestUrl.searchParams.get("page") ?? 0);
    return route.fulfill({ json: {
      content: [catalogMovie], totalElements: 2, totalPages: 2, number,
      size: Number(requestUrl.searchParams.get("size") ?? 12),
    } });
  });
}

test("global search opens the full TMDB catalog from its result category picker", async ({ page }) => {
  await page.route("**/api/search/global?**", route => route.fulfill({ json: {
    ...emptyGlobalResults,
    films: { content: [{ id: 42, title: "Dune", releaseDate: "2021-10-22", rating: 8, photoUrl: null }], number: 0, totalElements: 1, totalPages: 1, size: 6 },
  } }));

  await page.goto("/en/search?q=dune&tab=films");
  const categories = page.getByRole("combobox", { name: "Show results for", exact: true });
  await expect(categories).toBeVisible();
  await categories.selectOption("tmdb");
  await expect(page).toHaveURL("/en/films?q=dune");
});

test("global search keeps loading and empty category content inside the selected keyboard panel", async ({ page }) => {
  let releaseResponse = () => {};
  const responseReady = new Promise<void>(resolve => { releaseResponse = resolve; });
  await page.route("**/api/search/global?**", async route => {
    await responseReady;
    await route.fulfill({ json: emptyGlobalResults });
  });

  try {
    await page.goto("/uk/search?q=empty-category&tab=lists");
    const selectedTab = page.getByRole("tab", { name: "Списки", exact: true });
    const panel = page.getByRole("tabpanel", { name: "Списки", exact: true });
    await expect(selectedTab).toHaveAttribute("aria-controls", "global-search-results");
    await expect(panel).toHaveAttribute("aria-busy", "true");
    await expect(panel.getByRole("status")).toHaveText("Пошук у Rewind...");

    releaseResponse();
    await expect(panel).toHaveAttribute("aria-busy", "false");
    await expect(panel.getByRole("heading", { name: "За вашим запитом нічого не знайдено" })).toBeVisible();
    await selectedTab.focus();
    await page.keyboard.press("Tab");
    await expect(panel).toBeFocused();
    const outline = await panel.evaluate(element => getComputedStyle(element).outlineStyle);
    expect(outline).toBe("solid");
  } finally {
    releaseResponse();
  }
});

test("global search error and retry remain in the category panel", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/search/global?**", route => {
    attempts += 1;
    return attempts === 1
      ? route.fulfill({ status: 503, json: {} })
      : route.fulfill({ json: emptyGlobalResults });
  });

  await page.goto("/en/search?q=unavailable-category&tab=journal");
  const panel = page.getByRole("tabpanel", { name: "Journal", exact: true });
  await expect(panel.getByRole("alert")).toContainText("Could not complete the search.");
  await panel.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(panel.getByRole("heading", { name: "There were no matches for your search term" })).toBeVisible();
  expect(attempts).toBe(2);
});

test("global search keeps retry focus after a repeated error and returns to the panel on recovery", async ({ page }) => {
  let attempts = 0;
  let releaseRetry = () => {};
  const retryResponseReady = new Promise<void>(resolve => { releaseRetry = resolve; });
  await page.route("**/api/search/global?**", async route => {
    attempts += 1;
    if (attempts === 2) await retryResponseReady;
    return attempts < 3
      ? route.fulfill({ status: 503, json: {} })
      : route.fulfill({ json: emptyGlobalResults });
  });

  try {
    await page.goto("/en/search?q=retry-focus&tab=journal");
    const panel = page.getByRole("tabpanel", { name: "Journal", exact: true });
    const retry = panel.getByRole("button", { name: "Retry", exact: true });
    await expect(retry).toBeVisible();
    await retry.click();
    await expect(panel).toHaveAttribute("aria-busy", "true");
    await expect(panel.getByRole("alert")).toHaveCount(0);
    releaseRetry();
    const retryAfterFailure = panel.getByRole("button", { name: "Retry", exact: true });
    await expect(retryAfterFailure).toBeFocused();
    await retryAfterFailure.press("Enter");
    await expect(panel).toBeFocused();
    await expect(panel.getByRole("heading", { name: "There were no matches for your search term" })).toBeVisible();
    expect(attempts).toBe(3);
  } finally {
    releaseRetry();
  }
});

test("global search Retry preserves a manual Tab move during delayed recovery", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/search/global?**", async route => {
    attempts += 1;
    if (attempts === 1) return route.fulfill({ status: 503, json: {} });
    await new Promise(resolve => setTimeout(resolve, 350));
    return route.fulfill({ json: emptyGlobalResults });
  });
  await page.goto("/uk/search?q=delayed-retry&tab=journal");
  const panel = page.getByRole("tabpanel", { name: "Журнал", exact: true });
  const retry = panel.getByRole("button", { name: "Спробувати ще" });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(() => attempts).toBe(2);
  await page.keyboard.press("Tab");
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) document.activeElement.dataset.manualTabTarget = "true";
  });
  const manualTarget = page.locator('[data-manual-tab-target="true"]');
  await expect(manualTarget).toBeFocused();
  await expect(panel.getByRole("heading", { name: "За вашим запитом нічого не знайдено" })).toBeVisible();
  await expect(manualTarget).toBeFocused();
  await expect(panel).not.toBeFocused();
});

test("empty film search shows zero results without an impossible page counter", async ({ page }) => {
  const matchingMovie = { id: 980_001, title: "A Film to Browse", photoUrl: null, releaseDate: "2024-01-01", rating: 7.5 };
  await page.route("**/api/movies/search?**", route => {
    const query = new URL(route.request().url()).searchParams.get("q");
    return route.fulfill({ json: query
      ? emptyMoviePage
      : { content: [matchingMovie], totalElements: 1, totalPages: 1, number: 0, size: 12 } });
  });
  await page.goto("/uk/films?q=empty-result");
  await expect(page.getByText("Фільмів не знайдено.", { exact: true })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Знайдено фільмів: 0" })).toBeVisible();
  await expect(page.getByText("1 / 0", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Сторінки фільмів" })).toHaveCount(0);
  const clearSearch = page.getByRole("button", { name: "Очистити пошук", exact: true });
  await expect(clearSearch).toBeVisible();
  await clearSearch.click();
  await expect(page).toHaveURL("/uk/films");
  await expect(page.getByRole("heading", { level: 2, name: matchingMovie.title })).toBeVisible();
  await expect(page.getByRole("button", { name: "Очистити пошук", exact: true })).toHaveCount(0);
});

for (const width of [393, 1440]) {
  test(`film query submit respects the separate year field at ${width}px`, async ({ page }) => {
    await mockFilmCatalog(page);
    await page.setViewportSize({ width, height: 900 });
    const initialResponse = page.waitForResponse(response => new URL(response.url()).pathname === "/api/movies/search");
    await page.goto(width <= 560 ? "/uk/films" : "/uk/films?q=cross-form-year-check");
    expect((await initialResponse).ok()).toBe(true);
    if (width <= 560) await page.getByRole("button", { name: "Фільтри", exact: true }).click();

    const query = page.locator("#film-search-query");
    const year = page.locator("#film-search-year");
    if (width <= 560) await query.fill("cross-form-year-check");
    else await expect(query).toBeHidden();
    await year.fill("2200");
    await year.evaluate(element => {
      element.addEventListener("invalid", () => { element.setAttribute("data-invalid-reported", "true"); });
    });
    const querySubmit = page.locator("form").filter({ has: query }).getByRole("button", { name: "Пошук", exact: true });
    if (width <= 560) await querySubmit.click();
    else await year.press("Enter");
    await expect(year).toHaveAttribute("data-invalid-reported", "true");
    expect(new URL(page.url()).searchParams.has("year")).toBe(false);
    if (width > 560) expect(new URL(page.url()).searchParams.get("q")).toBe("cross-form-year-check");
    await expect(year).toBeFocused();

    const validRequest = page.waitForRequest(request => {
      const url = new URL(request.url());
      return url.pathname === "/api/movies/search" && url.searchParams.get("year") === "2000";
    });
    // On wide desktop the filter form applies valid changes immediately; on
    // phone the query form submits them. Start observing before changing year
    // so both paths are covered without racing the desktop request.
    await year.fill("2000");
    if (width <= 560) await querySubmit.click();
    const requestUrl = new URL((await validRequest).url());
    expect(requestUrl.searchParams.get("q")).toBe("cross-form-year-check");
    await expect(page).toHaveURL(/year=2000/);
  });
}

test("mobile film filters return focus to the trigger after Escape", async ({ page }) => {
  await page.route("**/api/genres", route => route.fulfill({ json: [{ id: 18, name: "Drama" }] }));
  await page.route("**/api/movies/search**", route => route.fulfill({ json: {
    content: [], number: 0, size: 12, totalElements: 0, totalPages: 0,
  } }));
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/uk/films");

  const trigger = page.locator('button[aria-controls="film-filter-controls"]');
  await expect(trigger).toHaveAccessibleName("Фільтри");
  await expect(page.locator("#film-search-genre")).toBeEnabled();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#film-search-query")).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("mobile films canvas keeps the Figma poster rail geometry", async ({ page }) => {
  await mockFilmCatalog(page);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/uk/films");

  await expect(page.getByRole("banner").getByRole("link", { name: "REWIND", exact: true })).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("button", { name: "Меню", exact: true })).toHaveCount(0);
  const posterLink = page.getByRole("region", { name: "Фільми" }).locator("article").first().getByRole("link").first();
  await expect(posterLink).toBeVisible();

  const poster = await posterLink.boundingBox();
  expect(Math.round(poster?.width ?? 0)).toBe(79);
  expect(Math.round(poster?.height ?? 0)).toBe(116);
  await expect(posterLink).toHaveCSS("border-radius", "10px");
  expect((await page.locator('button[aria-controls="film-filter-controls"]').boundingBox())!.width).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test("malformed film page URLs normalize before requesting catalog results", async ({ page }) => {
  await mockFilmCatalog(page);
  const requests: URL[] = [];
  page.on("request", request => {
    const url = new URL(request.url());
    if (url.pathname === "/api/movies/search") requests.push(url);
  });

  for (const malformedPage of ["1.5", "Infinity", "-1", "not-a-page", "9007199254740992", "2147483648"]) {
    const before = requests.length;
    const response = page.waitForResponse(item => new URL(item.url()).pathname === "/api/movies/search");
    await page.goto(`/uk/films?sort=title_asc&page=${encodeURIComponent(malformedPage)}`);
    expect((await response).ok(), `Normalized ${malformedPage} must receive a successful catalog response`).toBe(true);
    await expect(page).toHaveURL(/sort=title_asc&page=0$/);
    expect(requests.slice(before).length).toBeGreaterThan(0);
    expect(requests.slice(before).every(url => url.searchParams.get("page") === "0")).toBe(true);
    expect(requests.slice(before).every(url => url.searchParams.get("sort") === "title_asc")).toBe(true);
    await expect(page.getByRole("alert")).toHaveCount(0);
  }
});

test("valid film page URL and sort survive unchanged", async ({ page }) => {
  await mockFilmCatalog(page);
  const validPage = 1;
  const response = page.waitForResponse(item => new URL(item.url()).pathname === "/api/movies/search");
  await page.goto(`/uk/films?sort=title_asc&page=${validPage}`);
  const result = await response;
  expect(result.ok()).toBe(true);
  expect(new URL(result.url()).searchParams.get("page")).toBe(String(validPage));
  await expect(page).toHaveURL(new RegExp(`sort=title_asc&page=${validPage}$`));
  await expect(page.locator("#film-search-sort")).toHaveValue("title_asc");
});
