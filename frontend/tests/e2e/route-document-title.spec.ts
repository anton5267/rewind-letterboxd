import { expect, test, type Page } from "@playwright/test";

const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0 };
const film = { id: 940001, title: "A fixture film", releaseDate: "2026-10-01", photoUrl: null, rating: null };

async function installCatalogue(page: Page) {
  await page.route(url => url.pathname.startsWith("/api/"), route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/csrf") return route.fulfill({ json: { token: "title-fixture" } });
    if (path === "/api/auth/refresh" || path === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (route.request().method() !== "GET") return route.abort();
    if (path === `/api/movies/${film.id}/details`) return route.fulfill({ json: {
      ...film, shortPlot: null, backdropUrl: null, durationMinutes: null, ageRating: null,
      trailerUrl: null, genres: [], actors: [], directors: [], producers: [], externalRatings: [],
      similarMovies: [{ ...film, id: 940002, title: "A delayed film" }], myFlags: null,
    } });
    if (path === "/api/movies/popular") return route.fulfill({ json: { ...emptyPage, content: [film], totalElements: 1, totalPages: 1 } });
    if (path.includes("/genres") || path.includes("/tags/") || path.includes("popular-reviewers")
      || path.endsWith("/archive")) return route.fulfill({ json: [] });
    return route.fulfill({ json: emptyPage });
  });
}

for (const language of ["uk", "en"] as const) {
  const searchTitle = language === "uk" ? "Глобальний пошук" : "Global search";
  const journalTitle = language === "uk" ? "Журнал" : "Journal";
  const homeTitle = language === "uk" ? "Ваш кіножурнал" : "Your film diary";

  test(`document title follows mobile navigation and history in ${language}`, async ({ page }) => {
    await installCatalogue(page);
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(`${language}/home`);
    await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
    await page.locator(`a[href="/${language}/search"]:visible`).first().click();
    await expect(page.locator("#global-search-title")).toBeVisible();
    await expect(page).toHaveTitle(`${searchTitle} | REWIND`);
    await page.locator(`a[href="/${language}/journal"]:visible`).first().click();
    await expect(page).toHaveTitle(`${journalTitle} | REWIND`);
    await page.goBack();
    await expect(page).toHaveTitle(`${searchTitle} | REWIND`);
    await page.goBack();
    await expect(page).toHaveTitle(`${homeTitle} | REWIND`);
    await page.goForward();
    await expect(page).toHaveTitle(`${searchTitle} | REWIND`);
    await expect(page.locator("#global-search-query")).toBeVisible();
  });

  test(`film title includes its year and a late response preserves the next screen title in ${language}`, async ({ page }) => {
    await installCatalogue(page);
    let releaseDetails!: () => void;
    const delayed = new Promise<void>(resolve => { releaseDetails = resolve; });
    let detailsStarted = false;
    let detailsFinished = false;
    await page.route("**/api/movies/940002/details", async route => {
      detailsStarted = true;
      await delayed;
      await route.fulfill({ json: { ...film, id: 940002, title: "A delayed film" } });
      detailsFinished = true;
    });
    await page.goto(`${language}/films/${film.id}`);
    await expect(page.locator("#movie-title")).toHaveText(film.title);
    await expect(page).toHaveTitle(`${film.title} (2026) | REWIND`);
    await page.locator(`a[href="/${language}/films/940002"]:visible`).first().click();
    await expect.poll(() => detailsStarted).toBe(true);
    await page.locator(`a[href="/${language}/search"]:visible`).first().click();
    await expect(page).toHaveTitle(`${searchTitle} | REWIND`);
    releaseDetails();
    await expect.poll(() => detailsFinished).toBe(true);
    await expect(page.locator("#global-search-title")).toBeVisible();
    await expect(page).toHaveTitle(`${searchTitle} | REWIND`);
  });

  test(`profile query navigation updates the title when main is replaced in ${language}`, async ({ page }) => {
    await installCatalogue(page);
    await page.route("**/api/users/me", route => route.fulfill({ json: { id: 7, username: "title-reader", role: "USER" } }));
    await page.route("**/api/profile/me", route => route.fulfill({ json: {
      id: 7, username: "title-reader", displayName: null, email: "fixture@example.invalid", role: "USER",
      avatarUrl: null, bio: null, supabaseLinked: false, lists: [], recentRatings: [], recentReviews: [],
      stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
    } }));
    await page.route("**/api/profile/me/social-links", route => route.fulfill({ json: [] }));
    await page.route("**/api/lists/my", route => route.fulfill({ json: [] }));
    await page.route("**/api/newsletter/subscription", route => route.fulfill({ json: { subscribed: false } }));
    await page.goto(`${language}/profile?settings=profile`);
    const settingsTitle = language === "uk" ? "Налаштування акаунта" : "Account Settings";
    const profileTitle = language === "uk" ? "Мій профіль" : "My profile";
    await expect(page).toHaveTitle(`${settingsTitle} | REWIND`);
    await page.locator(`main a[href="/${language}/profile"]:visible`).first().click();
    await expect(page.locator("#profile-page-title")).toHaveText(profileTitle);
    await expect(page).toHaveTitle(`${profileTitle} | REWIND`);
    await page.goBack();
    await expect(page).toHaveTitle(`${settingsTitle} | REWIND`);
  });
}
