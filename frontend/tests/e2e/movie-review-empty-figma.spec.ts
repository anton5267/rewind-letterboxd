import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const details = {
  id: 35, title: "Dune", imdbId: null, shortPlot: "A mythic and emotionally charged journey across Arrakis.",
  photoUrl: null, backdropUrl: null, releaseDate: "2021-10-22", durationMinutes: 155,
  ageRating: "12+", rating: 3.9, trailerUrl: null,
  genres: [{ id: 1, name: "Action" }], actors: [], directors: [], producers: [], externalRatings: [],
  similarMovies: [], myFlags: null,
};

test("empty mobile film reviews match UK and EN Figma states", async ({ page }) => {
  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261125/films");
  await mkdir(captureDirectory, { recursive: true });
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "empty-reviews-fixture" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/movies/35/details", route => route.fulfill({ json: details }));
  await page.route("**/api/movies/35/reviews**", route => route.fulfill({ json: { content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 } }));

  await page.setViewportSize({ width: 393, height: 852 });
  for (const [locale, expectedTitle, expectedEmpty] of [
    ["uk", "Останні огляди", "Оглядів поки немає."],
    ["en", "Recent reviews", "No reviews yet."],
  ]) {
    await page.goto(`/${locale}/films/35`);
    const section = page.locator('section[aria-labelledby="reviews-title"]');
    await expect(section).toHaveAttribute("aria-busy", "false");
    const title = section.locator('h2 [class*="mobileReviewTitle"]');
    const empty = section.locator("p").filter({ hasText: expectedEmpty });
    await expect(title).toHaveText(expectedTitle);
    await expect(empty).toBeVisible();
    const geometry = await page.evaluate(() => {
      const section = document.querySelector<HTMLElement>('section[aria-labelledby="reviews-title"]')!;
      const title = section.querySelector<HTMLElement>('h2 [class*="mobileReviewTitle"]')!;
      const empty = Array.from(section.querySelectorAll<HTMLElement>("p")).find(item => /no reviews yet|оглядів поки немає/i.test(item.textContent ?? ""))!;
      const relativeRect = (element: HTMLElement) => {
        const parent = section.getBoundingClientRect();
        const rect = element.getBoundingClientRect();
        return { x: rect.x - parent.x, y: rect.y - parent.y, width: rect.width, height: rect.height };
      };
      return { section: { width: section.getBoundingClientRect().width, height: section.getBoundingClientRect().height }, title: relativeRect(title), empty: relativeRect(empty) };
    });
    expect(geometry.section.width).toBe(393);
    expect(geometry.section.height).toBeGreaterThanOrEqual(104);
    expect(geometry.section.height).toBeLessThanOrEqual(105);
    expect(geometry.title.x).toBe(16);
    expect(geometry.title.y).toBe(16);
    expect(geometry.empty.x).toBe(16);
    expect(geometry.empty.y).toBeGreaterThanOrEqual(52);
    expect(geometry.empty.y).toBeLessThanOrEqual(53);
    expect(geometry.empty.width).toBe(361);
    expect(geometry.empty.height).toBe(24);
    await section.screenshot({ path: resolve(captureDirectory, `movie-reviews-empty-${locale}-393.png`) });
  }
});

test("mobile external rating pills match the rating source component", async ({ page }) => {
  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261125/films");
  await mkdir(captureDirectory, { recursive: true });
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "rating-pill-fixture" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  let ratingState: "all" | "community" | "none" = "all";
  await page.route("**/api/movies/35/details", route => route.fulfill({ json: {
    ...details,
    rating: ratingState === "none" ? null : 3.9,
    externalRatings: ratingState === "all" ? [{ source: "IMDb", rating: 8.0 }, { source: "TMDB", rating: 7.8 }] : [],
  } }));
  await page.route("**/api/movies/35/reviews**", route => route.fulfill({ json: { content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 } }));
  await page.setViewportSize({ width: 393, height: 852 });
  for (const state of ["all", "community", "none"] as const) {
    ratingState = state;
    await page.goto(`/en/films/35?rating-fixture=${state}`);
    const ratingSection = page.locator('section[aria-labelledby="mobile-rating-title"]');
    const pills = ratingSection.locator('[class*="externalRatingPill"]');
    await expect(pills).toHaveCount(state === "all" ? 2 : 0);
    await expect(ratingSection.locator('[class*="movieRating"]')).toContainText(state === "none" ? "—" : "3.9");
    if (state === "all") {
      await expect(pills.first()).toHaveText("IMDb 8.0");
      await expect(pills.nth(1)).toHaveText("TMDB 7.8");
      const style = await pills.first().evaluate(element => {
        const rect = element.getBoundingClientRect();
        const computed = getComputedStyle(element);
        return { width: rect.width, height: rect.height, background: computed.backgroundColor, border: computed.borderColor, fontSize: computed.fontSize, padding: computed.padding };
      });
      expect(style.width).toBeCloseTo(61, 0);
      expect(style).toMatchObject({ height: 24, background: "rgb(0, 0, 0)", border: "rgb(85, 85, 85)", fontSize: "10px", padding: "5px 8px" });
    }
    await ratingSection.screenshot({ path: resolve(captureDirectory, `movie-rating-state-${state}-en-393.png`) });
  }
});
