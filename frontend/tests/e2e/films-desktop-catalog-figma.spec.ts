import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const figmaFilmTitles = [
  "Superman", "Barbie", "La La Land", "Whiplash", "Oppenheimer", "F1",
  "Black Swan", "The Silence of the Lambs", "Weapons", "Wicked", "Call Me by Your Name", "The Dark Knight",
  "Midsommar", "The Grand Budapest Hotel", "Challengers", "Shutter Island", "The Godfather", "Deadpool & Wolverine",
  "Avengers: Endgame", "Avengers: Infinity War", "Spider-Man: Across the Spider-Verse", "The Wolf of Wall Street", "Saltburn", "Spirited Away",
  "American Psycho", "Little Women", "Gone Girl", "The Menu", "Once Upon a Time in Hollywood", "Fantastic Mr. Fox",
  "The Lord of the Rings: The Fellowship of the Ring", "The Shawshank Redemption", "Hereditary", "No Country for Old Men", "Black Panther", "Titanic",
];

const movies = figmaFilmTitles.map((title, index) => ({
  id: 98200 + index,
  title,
  releaseDate: "2025-01-01",
  rating: 7.2,
  photoUrl: `http://127.0.0.1:5173/__fixtures/films-catalog-figma/poster-${String(index + 1).padStart(2, "0")}.png`,
}));

test("desktop All Films exposes only the three catalogue filters shown in Figma", async ({ page }) => {
  await page.route("**/__fixtures/films-catalog-figma/**", async route => {
    const filename = new URL(route.request().url()).pathname.split("/").pop() ?? "";
    if (!/^poster-\d{2}\.png$/.test(filename)) return route.abort();
    const body = await readFile(resolve(process.cwd(), "tests/e2e/fixtures/films-catalog-figma", filename));
    await route.fulfill({ contentType: "image/png", body });
  });
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "films-catalog-figma" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/genres", route => route.fulfill({ json: [
    { id: 1, name: "Drama" }, { id: 2, name: "Comedy" }, { id: 3, name: "Thriller" },
  ] }));
  await page.route("**/api/movies/search**", route => route.fulfill({ json: {
    content: movies, number: 0, size: 36, totalPages: 2, totalElements: 50,
  } }));
  await page.route("**/api/tmdb/movies/discover**", route => route.fulfill({ json: {
    content: [{ tmdbId: 101, title: "TMDB fixture", releaseDate: "2025-01-01", posterUrl: null, overview: "A fixture." }],
    page: 1, totalPages: 1, totalResults: 1,
  } }));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/films");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");

  const filters = page.locator("#film-filter-controls");
  await expect(filters).toBeVisible();
  await expect(filters.locator("label:visible")).toHaveCount(3);
  await expect(filters.getByLabel("Year")).toBeVisible();
  await expect(filters.getByLabel("Rating")).toBeVisible();
  await expect(filters.getByLabel("Genre")).toBeVisible();
  await expect(filters.getByLabel("Sort by")).toBeHidden();
  await expect(page.locator('main [class*="catalogCount_"]')).toHaveText("There are 50 films.");
  await expect(page.locator("main [data-search-results-focus] article")).toHaveCount(36);
  await expect(page.locator("main [data-search-results-focus] article h2")).toHaveText(figmaFilmTitles);
  const figmaPosters = page.locator("main [data-search-results-focus] article img");
  await expect(figmaPosters).toHaveCount(36);
  await expect.poll(() => figmaPosters.evaluateAll(images => images.every(image => image.complete && image.naturalWidth === 174))).toBe(true);
  const contrast = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  expect(contrast.violations).toEqual([]);

  const filterBounds = await filters.boundingBox();
  expect(filterBounds?.x).toBe(989);
  expect(filterBounds?.y).toBe(294);
  expect(filterBounds?.width).toBe(331);
  expect(filterBounds?.height).toBe(49);
  const firstPoster = await page.locator('main article a[href*="/films/"]').first().boundingBox();
  expect(firstPoster?.x).toBeCloseTo(120.5, 1);
  expect(firstPoster?.y).toBeCloseTo(607, 0);
  expect(firstPoster?.width).toBeCloseTo(174, 0);
  expect(firstPoster?.height).toBeCloseTo(260, 0);

  const hoverTransitions = await page.evaluate(() => {
    const poster = document.querySelector('[data-poster-hover-overlay]');
    const yearFilter = document.querySelector('#film-filter-controls select');
    return [poster, yearFilter].map(element => element && getComputedStyle(element).transitionDuration);
  });
  expect(hoverTransitions).toEqual(["0.3s", "0.3s"]);

  const posterLink = page.locator('main article a[href*="/films/"]').first();
  const posterOverlay = posterLink.locator('[data-poster-hover-overlay]');
  await expect(posterOverlay).toHaveCSS("opacity", "0");
  await posterLink.hover();
  await expect(posterOverlay).toHaveCSS("opacity", "1");
  const actionTray = posterLink.locator('[data-poster-action-tray]');
  await expect(actionTray).toBeVisible();
  const trayBounds = await actionTray.boundingBox();
  expect(trayBounds?.x).toBeCloseTo((firstPoster?.x ?? 0) + 44.5, 0);
  expect(trayBounds?.y).toBeCloseTo((firstPoster?.y ?? 0) + 224, 0);
  expect(trayBounds?.width).toBe(85);
  expect(trayBounds?.height).toBe(25);
  await expect(posterLink).toHaveCSS("transform", "none");
  await expect(posterLink).toHaveCSS("box-shadow", "none");

  const filterSelect = page.locator("#film-search-rating");
  await expect(filterSelect).toHaveCSS("color", "rgb(153, 153, 153)");
  await expect(page.locator('main [class*="catalogCount_"]')).toHaveCSS("color", "rgb(153, 153, 153)");
  await filterSelect.hover();
  await expect(filterSelect).toHaveCSS("color", "rgb(255, 255, 255)");
  const yearFilter = page.locator("#film-search-year");
  await yearFilter.hover();
  await expect(yearFilter).toHaveCSS("color", "rgb(255, 255, 255)");
  const yearPlaceholderColor = await yearFilter.evaluate(input => getComputedStyle(input, "::placeholder").color);
  expect(yearPlaceholderColor).toBe("rgb(255, 255, 255)");
  const genreFilter = page.locator("#film-search-genre");
  await genreFilter.hover();
  await expect(genreFilter).toHaveCSS("color", "rgb(255, 255, 255)");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(posterOverlay).toHaveCSS("transition-duration", "1e-05s");

  await page.goto("/uk/films");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator('main [class*="catalogCount_"]')).toHaveText("У каталозі 50 фільмів.");
});
