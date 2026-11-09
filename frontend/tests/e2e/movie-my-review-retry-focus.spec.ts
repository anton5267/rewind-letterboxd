import { expect, test, type Page, type Route } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261103", "movie-my-review-retry-focus");
mkdirSync(evidenceDir, { recursive: true });

const user = { id: 95170, username: "movie-review-owner", role: "USER", displayName: "Movie Review Owner", avatarUrl: null };
const details = {
  id: 35, title: "Dune", imdbId: null, shortPlot: "A long, responsive film description used for the supported review state.",
  photoUrl: null, backdropUrl: null, releaseDate: "2021-10-22", durationMinutes: 155, ageRating: "12+", rating: 3.9,
  trailerUrl: null, genres: [{ id: 1, name: "Science Fiction" }], actors: [], directors: [], producers: [], externalRatings: [], similarMovies: [], myFlags: null,
};
const emptyReviews = { content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 };

async function installFixture(page: Page, options: { delayedSuccess?: boolean; failures?: number } = {}) {
  let myReviewAttempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: user });
    if (pathname === "/api/movies/35/details") return route.fulfill({ json: details });
    if (pathname === "/api/movies/35/reviews") return route.fulfill({ json: emptyReviews });
    if (pathname === "/api/movies/35/reviews/me") {
      myReviewAttempts++;
      if (myReviewAttempts <= (options.failures ?? 2)) return route.fulfill({ status: 503, json: {} });
      if (options.delayedSuccess) await new Promise(resolve => setTimeout(resolve, 300));
      return route.fulfill({ status: 204 });
    }
    if (pathname === "/api/lists/my") return route.fulfill({ json: [] });
    if (pathname.includes("/rating")) return route.fulfill({ status: 204 });
    if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: [] });
  });
  return () => myReviewAttempts;
}

for (const { lang, width, label } of [
  { lang: "uk", width: 393, label: "phone UK" },
  { lang: "uk", width: 1440, label: "desktop UK" },
  { lang: "en", width: 393, label: "phone EN" },
  { lang: "en", width: 1440, label: "desktop EN" },
]) {
  test(`my review Retry restores focus after repeated failure and recovery on ${label}`, async ({ page }) => {
    const getAttempts = await installFixture(page);
    await page.setViewportSize({ width, height: width < 500 ? 900 : 1100 });
    await page.goto(`/${lang}/films/35`);
    const section = page.locator("[aria-labelledby='reviews-title']");
    const retry = section.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(getAttempts).toBe(2);
    const retryAgain = section.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retryAgain).toBeFocused();
    await retryAgain.press("Enter");
    await expect.poll(getAttempts).toBe(3);
    await expect(section).toHaveAttribute("aria-busy", "false");
    await expect(section).toBeFocused();
    await expect(section).toHaveCSS("outline-style", "solid");
    await expect(section.locator("#review-content")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    if (lang === "uk" && (width === 393 || width === 1440)) {
      await page.screenshot({ path: path.join(evidenceDir, `my-review-retry-${width === 393 ? "mobile" : "desktop"}-uk.png`), fullPage: true });
    }
  });
}

test("my review Retry preserves manual Tab during delayed success", async ({ page }) => {
  const getAttempts = await installFixture(page, { delayedSuccess: true });
  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/films/35");
  const section = page.locator("[aria-labelledby='reviews-title']");
  const retry = section.getByRole("button", { name: /retry|try again|спробувати/i });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(getAttempts).toBe(2);
  const retryAgain = section.getByRole("button", { name: /retry|try again|спробувати/i });
  await expect(retryAgain).toBeFocused();
  await retryAgain.press("Enter");
  await expect.poll(getAttempts).toBe(3);
  await expect(section).toHaveAttribute("aria-busy", "true");
  await page.keyboard.press("Tab");
  const manualFocus = await page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName);
  await expect(section).toHaveAttribute("aria-busy", "false");
  await expect(section).not.toBeFocused();
  await expect.poll(async () => page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName)).toBe(manualFocus);
});

test("review cannot be published with whitespace-only content", async ({ page }) => {
  let createRequests = 0;
  await installFixture(page, { failures: 0 });
  await page.route("**/api/movies/35/reviews", async route => {
    if (route.request().method() === "POST") createRequests++;
    await route.fulfill({ json: emptyReviews });
  });
  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/films/35");
  const composer = page.locator("#review-content");
  await expect(composer).toBeVisible();
  const publish = page.getByRole("button", { name: "Опублікувати огляд" });
  await composer.fill("   \n\t   ");
  await expect(publish).toBeDisabled();
  await composer.evaluate(element => (element as HTMLTextAreaElement).form?.requestSubmit());
  await page.waitForTimeout(100);
  expect(createRequests).toBe(0);
  await composer.fill("A useful review.");
  await expect(publish).toBeEnabled();
});
