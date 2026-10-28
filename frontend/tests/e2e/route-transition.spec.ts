import { expect, test, type Page } from "@playwright/test";

const movies = Array.from({ length: 12 }, (_, index) => ({
  id: 970001 + index, title: `Route transition film ${index + 1}`, releaseDate: "2001-01-01", photoUrl: null, rating: 4,
}));
const authorId = 970100;
const reviews = Array.from({ length: 8 }, (_, index) => ({
  id: 970200 + index, movieId: movies[0].id, movieTitle: movies[0].title,
  content: `Keyboard route review ${index + 1}. A complete review remains reachable from the profile.`, rating: 4,
}));
const emptyPage = { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0, first: true, last: true };
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

async function fixture(page: Page, gate?: ReturnType<typeof deferred>, movieError = false, sameTitle = false) {
  const unexpectedWrites: string[] = [];
  await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
    const request = route.request(), url = new URL(request.url()), pathname = url.pathname;
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "route-test-csrf" }, headers: { "Set-Cookie": "XSRF-TOKEN=route-test-csrf; Path=/; SameSite=Lax" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (request.method() !== "GET") { unexpectedWrites.push(`${request.method()} ${pathname}`); return route.abort(); }
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/genres") return route.fulfill({ json: [{ id: 1, name: "Drama" }] });
    if (pathname === "/api/journal/articles/archive") return route.fulfill({ json: [] });
    if (pathname === "/api/journal/articles") return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } });
    if (pathname === "/api/movies/search") return route.fulfill({ json: { content: movies, number: Number(url.searchParams.get("page") ?? 0), size: 12, totalElements: 36, totalPages: 3 } });
    const details = pathname.match(/^\/api\/movies\/(\d+)\/details$/);
    if (details) {
      if (gate && Number(details[1]) !== movies[0].id) await gate.promise;
      if (movieError) return route.fulfill({ status: 503, json: {} });
      const movie = movies.find(item => item.id === Number(details[1]))!;
      return route.fulfill({ json: { ...movie, ...(sameTitle ? { title: "The same film title" } : {}), shortPlot: "A real screen transition should start with this film's metadata. ".repeat(15), backdropUrl: null, durationMinutes: 120, ageRating: "12+", trailerUrl: null, genres: [{ id: 1, name: "Drama" }], actors: [], directors: [], producers: [], externalRatings: [], similarMovies: movies.slice(0, 8), myFlags: null } });
    }
    if (/^\/api\/movies\/\d+\/reviews$/.test(pathname)) return route.fulfill({ json: emptyPage });
    if (pathname === `/api/users/${authorId}/profile`) return route.fulfill({ json: { id: authorId, username: "route-reader", displayName: "Route reader", avatarUrl: null, hq: false, stats: { ratings: 1, reviews: reviews.length, watched: 1, watchlist: 0, favorites: 0 }, ratingDistribution: [{ rating: 4, count: 1 }], socialLinks: [], lists: [], recentReviews: reviews } });
    if (/^\/api\/reviews\/\d+$/.test(pathname)) {
      const review = reviews.find(item => item.id === Number(pathname.split("/").at(-1)))!;
      return route.fulfill({ json: { ...review, createdAt: "2026-10-20T10:00:00Z", author: { id: authorId, username: "route-reader", displayName: "Route reader", avatarUrl: null }, movie: { ...movies[0], backdropUrl: null, durationMinutes: 120, ageRating: "12+", trailerUrl: null }, likes: 0, likedBy: [] } });
    }
    return route.fulfill({ json: emptyPage });
  });
  return unexpectedWrites;
}

async function ready(page: Page, heading: string) {
  await expect(page.locator(heading)).toHaveCount(1);
  await expect(page.locator('#route-loading-title, main[aria-busy="true"], main [aria-busy="true"]')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}

async function startsAtContent(page: Page, selector: string) {
  const heading = page.locator(selector);
  await expect(heading).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  const bounds = await heading.boundingBox(), header = await page.getByRole("banner").boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
  expect(bounds!.y).toBeLessThan(page.viewportSize()!.height);
  expect(await heading.evaluate(element => getComputedStyle(element).outlineStyle)).toBe("solid");
}

for (const width of [320, 1440]) {
  test(`movie Link Enter at ${width}px waits for loaded content and preserves Back/filter/query state`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    const gate = deferred();
    const writes = await fixture(page, gate);
    const initialRoute = "/en/films?year=2001&page=1&sort=title_asc";
    try {
      await page.goto(initialRoute);
      await ready(page, "#films-page-title");
      await expect(page.locator("#films-page-title")).not.toBeFocused();
      await page.keyboard.press("Control+End");
      const film = page.getByRole("region", { name: "Films" }).locator("article > a").last();
      await film.scrollIntoViewIfNeeded();
      await film.focus();
      const before = await page.evaluate(() => scrollY);
      expect(before).toBeGreaterThan(100);
      await film.press("Enter");
      await expect(page).toHaveURL(new RegExp(`/en/films/${movies.at(-1)!.id}$`));
      await expect(page.locator('main[aria-busy="true"]')).toHaveCount(1);
      expect(await page.evaluate(() => document.activeElement?.id)).not.toMatch(/films-page-title|movie-state-title|route-loading-title/);
      gate.resolve();
      await ready(page, "#movie-title");
      await startsAtContent(page, "#movie-title");

      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`${initialRoute.replaceAll("?", "\\?")}$`));
      await ready(page, "#films-page-title");
      await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - before)).toBeLessThanOrEqual(2);
      await expect(page.locator("#film-search-year")).toHaveValue("2001");
      await expect(page.locator("#film-search-sort")).toHaveValue("title_asc");

      if (width === 320) await page.getByRole("button", { name: "Filters", exact: true }).click();
      await page.locator("#film-search-year").fill("2002");
      const apply = page.locator('#film-filter-controls button[type="submit"]');
      await apply.focus();
      await apply.press("Enter");
      await expect(page).toHaveURL(/year=2002/);
      await ready(page, "#films-page-title");
      await expect(apply).toBeFocused();
      await expect(page.locator("#films-page-title")).not.toBeFocused();
      expect(writes).toEqual([]);
    } finally { gate.resolve(); }
  });

  test(`expanded profile review link at ${width}px focuses the new screen`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    const writes = await fixture(page);
    await page.goto(`/en/users/${authorId}`);
    await ready(page, "#public-profile-title");
    await page.getByRole("button", { name: "View all : Recent reviews" }).click();
    const link = page.locator(`main a[href="/en/reviews/${reviews.at(-1)!.id}"]`).first();
    await link.scrollIntoViewIfNeeded();
    await link.focus();
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(100);
    await link.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/en/reviews/${reviews.at(-1)!.id}$`));
    await ready(page, "#review-title");
    await startsAtContent(page, "#review-title");
    expect(writes).toEqual([]);
  });
}

test("an unavailable film focuses its loaded error main instead of the hidden state heading", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  const writes = await fixture(page, undefined, true);
  await page.goto("/en/films");
  await ready(page, "#films-page-title");
  const link = page.getByRole("region", { name: "Films" }).locator("article > a").last();
  await link.focus();
  await link.press("Enter");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("main")).toBeFocused();
  await expect(page.locator("#movie-state-title")).not.toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Retry", exact: true })).toBeFocused();
  expect(writes).toEqual([]);
});

for (const delayed of [false, true]) {
  test(`reused film Details with the same heading resets after a ${delayed ? "delayed" : "fast"} response`, async ({ page }) => {
    await page.setViewportSize({ width: delayed ? 320 : 1440, height: 700 });
    const gate = delayed ? deferred() : undefined;
    const writes = await fixture(page, gate, false, true);
    try {
      await page.goto(`/en/films/${movies[0].id}`);
      await ready(page, "#movie-title");
      await expect(page.locator("#movie-title")).toHaveText("The same film title");
      const similar = page.locator(`main a[href="/en/films/${movies[1].id}"]`).first();
      await similar.scrollIntoViewIfNeeded();
      await similar.focus();
      expect(await page.evaluate(() => scrollY)).toBeGreaterThan(100);
      await similar.press("Enter");
      await expect(page).toHaveURL(new RegExp(`/en/films/${movies[1].id}$`));
      if (gate) {
        await expect(page.locator('main[aria-busy="true"]')).toHaveCount(1);
        gate.resolve();
      }
      await ready(page, "#movie-title");
      await expect(page.locator("main")).toHaveAttribute("data-rewind-route", `/en/films/${movies[1].id}`);
      await expect(page.locator("#movie-title")).toHaveText("The same film title");
      await startsAtContent(page, "#movie-title");
      expect(writes).toEqual([]);
    } finally { gate?.resolve(); }
  });
}

test("mobile menu Escape restores its trigger while screen navigation settles on the new heading", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  const writes = await fixture(page);
  await page.goto("/en/journal");
  await ready(page, "#journal-page-title");
  const menu = page.getByRole("banner").getByRole("button", { name: "Menu", exact: true });
  await menu.click();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await menu.press("Enter");
  const login = page.getByRole("navigation", { name: "More navigation", exact: true }).getByRole("link", { name: "Log in", exact: true });
  await login.focus();
  await login.press("Enter");
  await ready(page, "#login-page-title");
  await startsAtContent(page, "#login-page-title");
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect(page.locator("#login-page-title")).toBeFocused();
  expect(writes).toEqual([]);
});
