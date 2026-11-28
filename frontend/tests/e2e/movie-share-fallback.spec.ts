import { expect, test } from "@playwright/test";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

test("copies a film link when the native share sheet is unavailable", async ({ page }) => {
  await installHostedAuthFixture(page.context());
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "share-fixture-csrf" } });
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: 7, username: "share-reader", role: "USER" } });
    if (pathname === "/api/movies/35/details") return route.fulfill({ json: {
      id: 35, title: "Dune", imdbId: null, shortPlot: null, photoUrl: null, backdropUrl: null,
      releaseDate: "2021-10-22", durationMinutes: 155, ageRating: "12+", rating: 3.9, trailerUrl: null,
      genres: [], actors: [], directors: [], producers: [], externalRatings: [], similarMovies: [],
      myFlags: { watched: false, watchlist: false, favorites: false },
    } });
    if (pathname === "/api/movies/35/reviews") return route.fulfill({ json: {
      content: [], number: 0, size: 10, totalElements: 0, totalPages: 0,
    } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ status: 200, json: { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 } });
  });

  await page.setViewportSize({ width: 393, height: 852 });
  await signInHostedFixture(page, "en");
  await page.goto("/en/films/35");
  await expect(page.locator("#movie-title")).toBeVisible();
  await page.getByRole("button", { name: "My actions" }).click();
  const dialog = page.getByRole("dialog", { name: "Dune" });
  await expect(dialog).toBeVisible();

  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async () => { throw new DOMException("Native share unavailable", "NotAllowedError"); },
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (value: string) => {
        (window as Window & { __copiedFilmUrl?: string }).__copiedFilmUrl = value;
      } },
    });
  });

  await dialog.getByRole("button", { name: "Share", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as Window & { __copiedFilmUrl?: string }).__copiedFilmUrl)).toBe(page.url());
  await expect(page.getByRole("status").filter({ hasText: "Link copied." })).toBeVisible();
});
