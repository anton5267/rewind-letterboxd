import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page, type Route } from "@playwright/test";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261103", "movie-retry-focus");
mkdirSync(evidenceDir, { recursive: true });

type ApiReply = (route: Route) => Promise<void> | void;

async function installApi(page: Page, overrides: Record<string, ApiReply>) {
  await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
    const pathname = new URL(route.request().url()).pathname;
    const override = overrides[pathname];
    if (override) return override(route);
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: { message: "Unauthenticated" } });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "movie-retry-focus-csrf" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: { message: "Unauthenticated" } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: [] });
  });
}

const details = {
  id: 35, title: "Dune", imdbId: null,
  shortPlot: "A mythic and emotionally charged hero's journey follows Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding. He must travel to the most dangerous planet in the universe to ensure the future of his family and his people. The story grows naturally with its content, leaving the poster below the complete plot on narrow screens.",
  photoUrl: null, backdropUrl: null, releaseDate: "2021-10-22", durationMinutes: 155, ageRating: "12+", rating: 3.9,
  trailerUrl: null, genres: [{ id: 1, name: "Science Fiction" }], actors: [], directors: [{ id: 1, name: "Denis Villeneuve" }],
  producers: [], externalRatings: [], similarMovies: [], myFlags: null,
};
const emptyReviews = { content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 };
const review = { id: 771035, userId: 771001, username: "retry-reader", content: "A review loaded after recovery.", rating: 4, createdAt: "2026-10-20T12:00:00Z" };
const reviewPage = { content: [review], number: 0, size: 10, totalElements: 1, totalPages: 1 };

test("movie details keyboard Retry returns to the error then focuses the loaded title", async ({ page }) => {
  let detailsAttempts = 0;
  await installApi(page, {
    "/api/movies/35/details": route => {
      detailsAttempts += 1;
      return detailsAttempts < 3
        ? route.fulfill({ status: 503, json: { message: "Temporary failure" } })
        : route.fulfill({ json: details });
    },
    "/api/movies/35/reviews": route => route.fulfill({ json: emptyReviews }),
  });

  await page.setViewportSize({ width: 393, height: 2245 });
  await page.goto("/uk/films/35");
  const retry = page.getByRole("button", { name: "Спробувати ще" });
  await expect(retry).toBeVisible();
  await retry.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => detailsAttempts).toBe(2);
  const repeatedFailure = page.getByRole("button", { name: "Спробувати ще" });
  await expect(repeatedFailure).toBeFocused();
  await expect(repeatedFailure).toHaveCSS("outline-style", "solid");

  await page.keyboard.press("Enter");
  await expect.poll(() => detailsAttempts).toBe(3);
  await expect(page.getByRole("heading", { level: 1, name: "Dune" })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: path.join(evidenceDir, "movie-details-mobile-uk-after-retry.png") });

  await page.setViewportSize({ width: 1440, height: 3506 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await page.screenshot({ path: path.join(evidenceDir, "movie-details-desktop-uk-after-retry.png") });
  expect(detailsAttempts).toBe(3);
});

test("movie reviews retry restores focus after failure and focuses results on recovery", async ({ page }) => {
  let reviewAttempts = 0;
  await installApi(page, {
    "/api/movies/35/details": route => route.fulfill({ json: details }),
    "/api/movies/35/reviews": route => {
      reviewAttempts += 1;
      return reviewAttempts < 3
        ? route.fulfill({ status: 503, json: { message: "Temporary failure" } })
        : route.fulfill({ json: reviewPage });
    },
  });

  await page.setViewportSize({ width: 1440, height: 3506 });
  await page.goto("/en/films/35");
  const section = page.locator('[aria-labelledby="reviews-title"]');
  const retry = section.getByRole("button", { name: "Retry" });
  await expect(retry).toBeVisible();
  await retry.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => reviewAttempts).toBe(2);
  const repeatedFailure = section.getByRole("button", { name: "Retry" });
  await expect(repeatedFailure).toBeFocused();
  await expect(repeatedFailure).toHaveCSS("outline-style", "solid");

  await page.keyboard.press("Enter");
  await expect.poll(() => reviewAttempts).toBe(3);
  await expect(section.locator("article")).toHaveCount(1);
  await expect(section).toBeFocused();
  await expect(section).toHaveCSS("outline-style", "solid");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await page.screenshot({ path: path.join(evidenceDir, "movie-reviews-desktop-en-after-retry.png") });

  await page.setViewportSize({ width: 393, height: 2245 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: path.join(evidenceDir, "movie-reviews-mobile-en-after-retry.png") });
});

test("movie details preserves a keyboard focus move while the retried request is pending", async ({ page }) => {
  let detailsAttempts = 0;
  let markRetryStarted!: () => void;
  let releaseRetry!: () => void;
  const retryStarted = new Promise<void>(resolve => { markRetryStarted = resolve; });
  const delayedResponse = new Promise<void>(resolve => { releaseRetry = resolve; });
  await installApi(page, {
    "/api/movies/35/details": async route => {
      detailsAttempts += 1;
      if (detailsAttempts === 1) return route.fulfill({ status: 503, json: { message: "Temporary failure" } });
      markRetryStarted();
      await delayedResponse;
      return route.fulfill({ json: details });
    },
    "/api/movies/35/reviews": route => route.fulfill({ json: emptyReviews }),
  });

  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/en/films/35");
  const retry = page.getByRole("button", { name: "Retry" });
  await expect(retry).toBeVisible();
  await retry.focus();
  await page.keyboard.press("Enter");
  await retryStarted;
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "true");
  await page.keyboard.press("Tab");
  const movedFocusHtml = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.outerHTML ?? "");
  expect(movedFocusHtml).not.toBe("");
  releaseRetry();
  await expect(page.getByRole("heading", { level: 1, name: "Dune" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => (document.activeElement as HTMLElement | null)?.outerHTML ?? "")).toBe(movedFocusHtml);
  expect(detailsAttempts).toBe(2);
});
