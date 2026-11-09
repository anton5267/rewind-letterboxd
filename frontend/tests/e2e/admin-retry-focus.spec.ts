import { expect, test, type Page } from "@playwright/test";

const admin = { id: 91050, username: "retry-admin", role: "ADMIN", displayName: "Retry Admin", email: "retry-admin@example.invalid", avatarUrl: null, isActive: true, isHq: false };
const emptyPage = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 50 };
type Target = "reviews" | "comments" | "users" | "dashboard" | "settings" | "movie-details";

async function installFixture(page: Page, target: Target) {
  let attempts = 0;
  const endpoint = target === "reviews" ? "/api/admin/reviews"
    : target === "comments" ? "/api/admin/comments"
      : target === "users" ? "/api/admin/users"
        : target === "dashboard" ? "/api/admin/dashboard"
          : target === "settings" ? "/api/admin/settings" : "/api/movies/91051/details";
  await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
    const url = new URL(route.request().url());
    const { pathname } = url;
    if (pathname === "/api/users/me") return route.fulfill({ json: admin });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "admin-retry-focus" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (target === "movie-details" && pathname === "/api/admin/movies") return route.fulfill({ json: { ...emptyPage, content: [{ id: 91051, tmdbId: 91051, title: "Retry Movie", releaseDate: "2020-01-01", rating: null, photoUrl: null }], totalElements: 1, totalPages: 1 } });
    if (pathname === endpoint && (target !== "movie-details" || route.request().method() === "GET")) {
      attempts++;
      if (attempts < 3) return route.fulfill({ status: 503, json: {} });
      if (target === "reviews" || target === "comments" || target === "users") return route.fulfill({ json: emptyPage });
      if (target === "dashboard") return route.fulfill({ json: { users: 0, activeUsers: 0, hqUsers: 0, movies: 0, reviews: 0, hiddenReviews: 0 } });
      if (target === "settings") return route.fulfill({ json: [] });
      return route.fulfill({ json: {
        id: 91051, title: "Retry Movie", imdbId: null, shortPlot: null, photoUrl: null, backdropUrl: null, releaseDate: "2020-01-01",
        durationMinutes: null, ageRating: null, rating: null, trailerUrl: null, genres: [], actors: [], directors: [], producers: [], externalRatings: [], similarMovies: [], myFlags: null,
      } });
    }
    if (pathname === "/api/admin/users/91050/overview") return route.fulfill({ json: { stats: { watched: 0, reviews: 0, ratings: 0, watchlist: 0, favorites: 0, comments: 0, likesReceived: 0, customLists: 0 }, adminHistory: [] } });
    if (pathname === "/api/users/91050/profile") return route.fulfill({ json: { id: 91050, username: admin.username, displayName: admin.displayName, avatarUrl: null, hq: false, stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 }, ratingDistribution: [], socialLinks: [], lists: [], recentReviews: [] } });
    if (pathname === "/api/admin/movies/tmdb-quality") return route.fulfill({ json: { totalMovies: 0, tmdbLinkedMovies: 0, completeTmdbMovies: 0, missingPoster: 0, missingBackdrop: 0, missingPlot: 0, missingRuntime: 0, missingTrailer: 0, missingTmdbRating: 0, linkedCoveragePercent: 0, metadataCompletenessPercent: 0 } });
    if (pathname === "/api/genres") return route.fulfill({ json: [] });
    return route.fulfill({ json: emptyPage });
  });
  return () => attempts;
}

const listTargets = [
  { target: "reviews" as const, lang: "uk", view: "reviews", section: /огляди/i, heading: /огляди/i },
  { target: "comments" as const, lang: "en", view: "comments", section: /comments/i, heading: /comments/i },
  { target: "users" as const, lang: "uk", view: "users", section: /користувачі/i, heading: /список користувачів/i },
];

for (const item of listTargets) {
  test(`Admin ${item.target} Retry stays on the button after repeat failure and focuses heading after recovery`, async ({ page }) => {
    const attempts = await installFixture(page, item.target);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${item.lang}/admin?view=${item.view}`);
    const section = page.getByRole("region", { name: item.section });
    const retry = section.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(attempts).toBe(2);
    const retryAgain = section.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retryAgain).toBeFocused();
    await retryAgain.press("Enter");
    await expect.poll(attempts).toBe(3);
    await expect(section.getByRole("heading", { name: item.heading })).toBeFocused();
  });
}

for (const target of ["dashboard", "settings"] as const) {
  test(`Admin ${target} Retry stays on the button after repeat failure and focuses the title after recovery`, async ({ page }) => {
    const attempts = await installFixture(page, target);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/en/admin${target === "settings" ? "?view=settings" : ""}`);
    const retry = page.getByRole("button", { name: "Retry", exact: true }).last();
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(attempts).toBe(2);
    const repeat = page.getByRole("button", { name: "Retry", exact: true }).last();
    await expect(repeat).toBeFocused();
    await repeat.press("Enter");
    await expect.poll(attempts).toBe(3);
    if (target === "dashboard") await expect(page.getByRole("heading", { name: "Platform statistics", exact: true })).toBeFocused();
    else await expect(page.locator("#admin-settings-title")).toBeFocused();
  });
}

test("Admin Settings save Retry focuses the new Retry after repeated failure and Save after recovery", async ({ page }) => {
  let writes = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/users/me") return route.fulfill({ json: admin });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "admin-setting-save-retry" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/admin/settings" && route.request().method() === "GET") return route.fulfill({ json: [{ key: "site_name", value: "Rewind" }] });
    if (pathname === "/api/admin/settings/site_name" && route.request().method() === "PUT") {
      writes++;
      if (writes < 3) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({ json: { key: "site_name", value: (route.request().postDataJSON() as { value: string }).value } });
    }
    return route.fulfill({ json: [] });
  });
  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/en/admin?view=settings");
  const section = page.getByRole("region", { name: "General Settings" });
  const name = section.getByRole("textbox", { name: "Site name" });
  await name.fill("Rewind Updated");
  const save = section.getByRole("button", { name: "Save", exact: true });
  await save.focus();
  await save.press("Enter");
  await expect(section.getByRole("alert")).toBeVisible();
  const retry = section.getByRole("button", { name: "Retry" });
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(() => writes).toBe(2);
  await expect(retry).toBeFocused();
  await retry.press("Enter");
  await expect.poll(() => writes).toBe(3);
  await expect(save).toBeFocused();
  await expect(name).toHaveValue("Rewind Updated");
});

test("Admin Movie editor details Retry stays focused on repeated failure then focuses title after recovery", async ({ page }) => {
  const attempts = await installFixture(page, "movie-details");
  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/admin?view=movies");
  const section = page.getByRole("region", { name: /база фільмів/i });
  await section.getByRole("button", { name: "Редагувати", exact: true }).click();
  const retry = section.getByRole("button", { name: "Спробувати ще", exact: true });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(attempts).toBe(2);
  const repeat = section.getByRole("button", { name: "Спробувати ще", exact: true });
  await expect(repeat).toBeFocused();
  await repeat.press("Enter");
  await expect.poll(attempts).toBe(3);
  await expect(section.getByLabel("Назва фільму")).toBeFocused();
});
