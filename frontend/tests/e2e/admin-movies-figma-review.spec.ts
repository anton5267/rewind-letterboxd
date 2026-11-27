import { expect, test } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const movieNames = ["Marty Supreme", "Zootopia 2", "Avatar: Fire and Ash", "Dune: Part One", "Top Gun", "Home Alone"];
const posterFiles = ["source-poster-02.png", "source-poster-03.png", "source-poster-04.png", "source-poster-05.png", "source-poster-07.png", "source-poster-06.png"];
const movies = movieNames.map((title, index) => ({
  id: 92001 + index, tmdbId: null, title, releaseDate: ["2025-12-25", "2025-11-26", "2025-12-19", "2021-10-22", "1986-05-16", "1990-11-16"][index],
  rating: [4, 3, 3, 4, 3, 4][index], photoUrl: `https://fixture.local/admin-movies/${posterFiles[index]}`, published: true,
  durationMinutes: [169, 108, 197, 155, 110, 103][index], ageRating: ["R", "PG", "PG-13", "PG-13", "PG", "PG"][index], reviewCount: [662, 466, 1600, 6200, 900, 780][index],
}));

test("Admin films Figma catalog and editor render with API-backed fixture", async ({ page }) => {
  await page.route("https://fixture.local/admin-movies/*.png", async route => {
    const file = new URL(route.request().url()).pathname.split("/").at(-1)!;
    const image = await readFile(resolve(process.cwd(), "tests/e2e/fixtures/admin-movies-figma", file));
    await route.fulfill({ status: 200, contentType: "image/png", body: image });
  });
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 44010, username: "lola-james", role: "ADMIN", displayName: "Lola James",
    email: "lola@example.invalid", avatarUrl: null, isActive: true, isHq: false,
  } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "admin-movies-figma-review" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/genres", route => route.fulfill({ json: [{ id: 1, name: "Drama" }] }));
  await page.route("**/api/admin/movies**", async route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/admin/movies/tmdb-quality") return route.fulfill({ json: {
      totalMovies: 36, tmdbLinkedMovies: 36, completeTmdbMovies: 30, missingPoster: 0, missingBackdrop: 3,
      missingPlot: 2, missingRuntime: 1, missingTrailer: 8, missingTmdbRating: 0, missingOriginalLanguage: 0,
      linkedCoveragePercent: 100, metadataCompletenessPercent: 83.3,
    } });
    if (url.pathname === "/api/admin/movies/92001") return route.fulfill({ json: {
      id: 92001, title: "Marty Supreme", imdbId: null, originalLanguage: "en", shortPlot: "A table-tennis player pursues a championship.",
      photoUrl: movies[0].photoUrl, backdropUrl: null, releaseDate: "2025-12-25", durationMinutes: 169, ageRating: "R", rating: 4,
      trailerUrl: null, genres: [{ id: 1, name: "Drama" }], actors: [], directors: [], producers: [], externalRatings: [], similarMovies: [], myFlags: null,
    } });
    const size = Number(url.searchParams.get("size") || 6);
    return route.fulfill({ json: { content: movies.slice(0, size), number: 0, size, totalPages: 6, totalElements: 36 } });
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en/admin?view=movies");
  const hero = await page.locator("main > header").boundingBox();
  expect(hero?.height).toBe(1020);
  const database = page.getByRole("region", { name: "Film database" });
  await expect(database.getByRole("heading", { name: "Film database" })).toBeVisible();
  await expect(database.getByRole("textbox", { name: "Search films in the catalog" })).toBeVisible();
  for (const name of movieNames) await expect(database.getByRole("heading", { name, level: 3 })).toBeVisible();
  const catalogPosters = database.locator("ul li img");
  await expect(catalogPosters).toHaveCount(movieNames.length);
  for (let index = 0; index < movieNames.length; index++) {
    await catalogPosters.nth(index).scrollIntoViewIfNeeded();
    await expect(catalogPosters.nth(index)).toHaveJSProperty("complete", true);
    await expect.poll(() => catalogPosters.nth(index).evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    await expect(catalogPosters.nth(index)).toHaveAttribute("src", new RegExp(posterFiles[index].replaceAll(".", "\\.")));
  }
  const searchBox = await database.locator("form[role='search']").evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y + window.scrollY, width: rect.width, height: rect.height };
  });
  expect(searchBox).toEqual({ x: 510, y: 1218, width: 402, height: 41 });
  const firstCard = database.locator("li[class*='movieRow']").first();
  const firstCardBox = await firstCard.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y + window.scrollY, width: rect.width, height: rect.height };
  });
  expect(firstCardBox?.x).toBe(120);
  expect(firstCardBox?.y).toBe(1344);
  expect(firstCardBox?.width).toBe(516);
  expect(firstCardBox?.height).toBe(438);
  const firstPoster = await firstCard.locator("img").evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y + window.scrollY, width: rect.width, height: rect.height };
  });
  expect(firstPoster).toMatchObject({ x: 143, y: 1366, width: 174, height: 260 });
  await expect(firstCard.getByRole("button", { name: "Edit Film", exact: true })).toBeVisible();
  await expect(firstCard).toContainText("662");
  const pagination = database.locator("nav[class*='pagination']");
  await expect(pagination.getByRole("button", { name: "Page 1" })).toBeVisible();
  await expect(pagination.getByRole("button", { name: "Page 2" })).toBeVisible();
  const paginationBox = await pagination.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y + window.scrollY, width: rect.width };
  });
  expect(paginationBox).toMatchObject({ x: 612, y: 2887, width: 194 });

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261125/admin-movies");
  await mkdir(captureDirectory, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(captureDirectory, "admin-films-en-desktop-1440.png"), fullPage: true });
  await database.getByRole("button", { name: "Edit Film", exact: true }).first().click();
  await expect(database.getByRole("heading", { name: "Edit film" })).toBeVisible();
  await expect(database.getByLabel("Film title")).toHaveValue("Marty Supreme");
  await expect(database.getByRole("combobox", { name: "Status" })).toHaveValue("true");
  await expect(database.getByText("Average user rating", { exact: true })).toBeVisible();
  await expect(database.getByText("Number of reviews", { exact: true })).toBeVisible();
  await expect(database.getByText("662", { exact: true })).toBeVisible();
  const editorPoster = database.locator("form img").first();
  await expect(editorPoster).toHaveJSProperty("complete", true);
  await expect.poll(() => editorPoster.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  const editorGeometry = await database.locator("details > div").first().evaluate(element => {
    const rect = (node: Element) => {
      const box = node.getBoundingClientRect();
      return { x: Math.round(box.x), y: Math.round(box.y + window.scrollY), width: Math.round(box.width), height: Math.round(box.height) };
    };
    const form = element.querySelector("form")!;
    const field = (selector: string) => {
      const node = form.querySelector(selector);
      if (!node) throw new Error(`Missing geometry target: ${selector}`);
      return rect(node);
    };
    return {
      panel: rect(element), footer: rect(document.querySelector("footer")!), poster: rect(form.querySelector(":scope > div")!),
      title: field('[class*="movieNameField"]'), titleValue: field('[class*="movieNameField"] input'),
      duration: field('[class*="durationField"]'), durationValue: field('[class*="durationField"] input'),
      status: field('[class*="statusField"]'), statusValue: field('[class*="statusField"] select'),
      language: field('[class*="languageField"]'), languageValue: field('[class*="languageField"] input'),
      posterChange: field('[class*="posterChange"]'), releaseDate: field('[class*="releaseDateField"] input'),
      genres: field('[class*="compactValue"]'), genreLabel: field('[class*="compactLegend"]'),
      plotLabel: field('[class*="plotField"]'), plot: field('[class*="plotField"] textarea'),
      credits: field('[class*="editorCreditsSummary"]'), director: field('[class*="editorCreditsSummary"] > div:first-child [class*="creditValue"]'),
      actors: field('[class*="editorCreditsSummary"] > div:nth-child(2) [class*="creditValue"]'),
      metrics: field('[class*="editorMetadata"]'), rating: field('[class*="editorMetadata"] > div:first-child dd'),
      reviewCount: field('[class*="editorMetadata"] > div:nth-child(2) dd'), deleteAction: field('[class*="deleteAction"]'),
    };
  });
  const expectGeometry = (actual: typeof editorGeometry.panel, expected: Partial<typeof editorGeometry.panel>, tolerance = 4) => {
    for (const [key, value] of Object.entries(expected) as [keyof typeof actual, number][]) {
      expect(Math.abs(actual[key] - value), `${key}: expected ${value}, received ${actual[key]}`).toBeLessThanOrEqual(tolerance);
    }
  };
  expectGeometry(editorGeometry.panel, { x: 120, y: 1218, width: 1200, height: 1485 }, 0);
  expect(editorGeometry.footer.y).toBeGreaterThanOrEqual(editorGeometry.panel.y + editorGeometry.panel.height);
  expectGeometry(editorGeometry.poster, { x: 150, y: 1246, width: 275, height: 411 });
  expectGeometry(editorGeometry.title, { x: 484, y: 1246, width: 406, height: 76 });
  expectGeometry(editorGeometry.titleValue, { x: 484, y: 1290, width: 406, height: 41 });
  expectGeometry(editorGeometry.duration, { x: 922, y: 1246, height: 76 });
  expectGeometry(editorGeometry.durationValue, { x: 922, y: 1290, width: 117, height: 41 });
  expectGeometry(editorGeometry.status, { x: 484, y: 1355, width: 406, height: 76 });
  expectGeometry(editorGeometry.statusValue, { x: 484, y: 1399, width: 406, height: 41 });
  expectGeometry(editorGeometry.language, { x: 922, y: 1355, height: 76 });
  expectGeometry(editorGeometry.languageValue, { x: 922, y: 1399, width: 107, height: 41 });
  expectGeometry(editorGeometry.posterChange, { x: 484, y: 1464 });
  expectGeometry(editorGeometry.releaseDate, { x: 150, y: 1777, width: 386, height: 41 });
  expectGeometry(editorGeometry.genreLabel, { x: 150, y: 1848 });
  expectGeometry(editorGeometry.genres, { x: 150, y: 1892, width: 645, height: 41 });
  expectGeometry(editorGeometry.plotLabel, { x: 150, y: 1963, width: 653 });
  expectGeometry(editorGeometry.plot, { x: 150, y: 2007, width: 653, height: 249 });
  expectGeometry(editorGeometry.credits, { x: 150, y: 2286 });
  expectGeometry(editorGeometry.director, { x: 150, y: 2330, height: 41 });
  expectGeometry(editorGeometry.actors, { x: 150, y: 2445, height: 41 });
  expectGeometry(editorGeometry.metrics, { x: 150, y: 2516 });
  expectGeometry(editorGeometry.rating, { x: 150, y: 2564, width: 91, height: 41 });
  expectGeometry(editorGeometry.reviewCount, { x: 409, y: 2564, width: 76, height: 41 });
  expectGeometry(editorGeometry.deleteAction, { x: 647, y: 2635, width: 146, height: 41 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(captureDirectory, "admin-edit-film-en-desktop-1440.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
});
