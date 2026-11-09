import { expect, test, type Page, type Route } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261103", "movie-lists-retry-focus");
mkdirSync(evidenceDir, { recursive: true });

const user = { id: 95170, username: "movie-list-owner", role: "USER", displayName: "Movie List Owner", avatarUrl: null };
const details = {
  id: 35, title: "Dune", imdbId: null, shortPlot: "A film description used to verify focus after recovering the list request.",
  photoUrl: null, backdropUrl: null, releaseDate: "2021-10-22", durationMinutes: 155, ageRating: "12+", rating: 3.9,
  trailerUrl: null, genres: [{ id: 1, name: "Science Fiction" }], actors: [], directors: [], producers: [], externalRatings: [], similarMovies: [], myFlags: null,
};
const emptyReviews = { content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 };

async function installFixture(page: Page, delayedSuccess = false) {
  let attempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: user });
    if (pathname === "/api/movies/35/details") return route.fulfill({ json: details });
    if (pathname === "/api/movies/35/reviews") return route.fulfill({ json: emptyReviews });
    if (pathname === "/api/movies/35/reviews/me") return route.fulfill({ status: 204 });
    if (pathname === "/api/lists/my") {
      attempts++;
      if (attempts < 3) return route.fulfill({ status: 503, json: {} });
      if (delayedSuccess) await new Promise(resolve => setTimeout(resolve, 300));
      return route.fulfill({ json: [] });
    }
    if (pathname.includes("/rating")) return route.fulfill({ status: 204 });
    if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: [] });
  });
  return () => attempts;
}

for (const { lang, width, label } of [
  { lang: "uk", width: 393, label: "phone UK" },
  { lang: "uk", width: 1440, label: "desktop UK" },
  { lang: "en", width: 393, label: "phone EN" },
  { lang: "en", width: 1440, label: "desktop EN" },
]) {
  test(`movie list Retry restores focus after repeated failure and recovery on ${label}`, async ({ page }) => {
    const getAttempts = await installFixture(page);
    await page.setViewportSize({ width, height: width < 500 ? 900 : 1100 });
    await page.goto(`/${lang}/films/35`);
    let retry: ReturnType<typeof page.getByRole>;
    if (width < 500) {
      await page.getByRole("button", { name: /my actions|мої дії/i }).click();
      const dialog = page.getByRole("dialog", { name: "Dune" });
      await dialog.getByRole("button", { name: /add to lists|додати до списків/i }).click();
      retry = dialog.getByRole("button", { name: /retry|try again|спробувати/i });
    } else {
      retry = page.getByRole("region", { name: /my actions|мої дії/i }).getByRole("button", { name: /retry|try again|спробувати/i });
    }
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(getAttempts).toBe(2);
    const retryAgain = width < 500
      ? page.getByRole("dialog", { name: "Dune" }).getByRole("button", { name: /retry|try again|спробувати/i })
      : page.getByRole("region", { name: /my actions|мої дії/i }).getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retryAgain).toBeFocused();
    await retryAgain.press("Enter");
    await expect.poll(getAttempts).toBe(3);
    const target = width < 500
      ? page.getByRole("dialog", { name: "Dune" }).getByRole("button", { name: /add to lists|додати до списків/i })
      : page.locator("[data-movie-list-focus]");
    await expect(target).toBeFocused();
    await expect(target).toHaveCSS("outline-style", "solid");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    if (lang === "uk") await page.screenshot({ path: path.join(evidenceDir, `movie-lists-${width < 500 ? "mobile" : "desktop"}-uk.png`), fullPage: true });
  });
}

test("movie list Retry preserves manual Tab during delayed success", async ({ page }) => {
  const getAttempts = await installFixture(page, true);
  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/films/35");
  await page.getByRole("button", { name: /my actions|мої дії/i }).click();
  const dialog = page.getByRole("dialog", { name: "Dune" });
  await dialog.getByRole("button", { name: /add to lists|додати до списків/i }).click();
  const retry = dialog.getByRole("button", { name: /retry|try again|спробувати/i });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(getAttempts).toBe(2);
  const retryAgain = dialog.getByRole("button", { name: /retry|try again|спробувати/i });
  await expect(retryAgain).toBeFocused();
  await retryAgain.press("Enter");
  await expect.poll(getAttempts).toBe(3);
  await expect(dialog.getByRole("status")).toBeVisible();
  await page.keyboard.press("Tab");
  const manualFocus = await page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName);
  await expect(dialog.getByRole("status")).toBeHidden();
  await expect(dialog.getByRole("button", { name: /add to lists|додати до списків/i })).not.toBeFocused();
  await expect.poll(async () => page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName)).toBe(manualFocus);
});
