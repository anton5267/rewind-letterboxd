import { expect, test, type Page } from "@playwright/test";

// These controlled API responses test UI validation and focus, never TMDB or a database.
async function adminMovieFixture(page: Page) {
  const movie = { id: 940001, tmdbId: null, title: "Strict ID film", releaseDate: "2026-10-01", rating: 4, photoUrl: null };
  const emptyPage = { content: [], totalPages: 0, totalElements: 0 };
  const writes: { path: string; data: unknown }[] = [];
  await page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== "GET") {
      writes.push({ path: url.pathname, data: request.postDataJSON() });
      if (url.pathname === `/api/admin/movies/${movie.id}/tmdb-sync`) return route.fulfill({ json: { movieId: movie.id, tmdbId: request.postDataJSON().tmdbId, title: movie.title, genresUpdated: 0, actorsUpdated: 0, directorsUpdated: 0, producersUpdated: 0, similarMoviesLinked: 0, trailerUpdated: false } });
      if (url.pathname === "/api/admin/movies/tmdb-import") return route.fulfill({ json: { requested: request.postDataJSON().tmdbIds.length, succeeded: 0, failed: 0, items: [] } });
      return route.abort();
    }
    if (url.pathname === "/api/users/me") return route.fulfill({ json: { id: 940100, username: "movie-controls-admin", role: "ADMIN" } });
    if (url.pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "controlled-csrf" } });
    if (url.pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (url.pathname === "/api/admin/dashboard") return route.fulfill({ json: { users: 0, activeUsers: 0, hqUsers: 0, movies: 1, reviews: 0, hiddenReviews: 0 } });
    if (url.pathname === "/api/admin/settings") return route.fulfill({ json: [] });
    if (url.pathname === "/api/admin/movies/tmdb-quality") return route.fulfill({ json: { totalMovies: 1, tmdbLinkedMovies: 0, completeTmdbMovies: 0, missingPoster: 1, missingBackdrop: 1, missingPlot: 1, missingRuntime: 1, missingTrailer: 1, missingTmdbRating: 1, linkedCoveragePercent: 0, metadataCompletenessPercent: 0 } });
    if (url.pathname === "/api/admin/movies") return route.fulfill({ json: { content: [movie], totalPages: 1, totalElements: 1 } });
    if (url.pathname === `/api/movies/${movie.id}/details`) return route.fulfill({ json: { ...movie, genres: [], directors: [], actors: [], producers: [], shortPlot: null, backdropUrl: null, trailerUrl: null, durationMinutes: null, ageRating: null } });
    return route.fulfill({ json: emptyPage });
  });
  await page.goto("/en/admin?view=movies");
  const movies = page.getByRole("region", { name: "Film database", exact: true });
  await expect(movies).toHaveAttribute("aria-busy", "false");
  return { movie, movies, writes };
}

test("single TMDB sync rejects malformed IDs and submits the exact valid ID", async ({ page }) => {
  const { movie, movies, writes } = await adminMovieFixture(page);
  await movies.locator("summary").filter({ hasText: "More actions" }).click();
  const field = movies.getByRole("textbox", { name: `TMDB ID ${movie.title}`, exact: true });
  const sync = movies.getByRole("button", { name: "Sync TMDB", exact: true });
  for (const invalid of ["550abc", "1.5", "1e3", "0", "-1", "Infinity", "9007199254740992", ""]) {
    await field.fill(invalid);
    await sync.click();
    await expect(movies.getByRole("alert")).toHaveText("Enter a valid TMDB ID.");
    expect(writes, `Invalid ID ${invalid} must not reach a mutation`).toEqual([]);
  }
  await field.fill("000550");
  await sync.click();
  await expect(movies.getByRole("status").filter({ hasText: "TMDB updated" })).toBeVisible();
  expect(writes).toEqual([{ path: `/api/admin/movies/${movie.id}/tmdb-sync`, data: { tmdbId: 550, syncSimilar: true } }]);
});

test("batch TMDB import rejects the whole invalid input and deduplicates valid IDs", async ({ page }) => {
  const { movies, writes } = await adminMovieFixture(page);
  await movies.locator("summary").filter({ hasText: "Add film" }).click();
  const field = movies.getByRole("textbox", { name: "TMDB IDs", exact: true });
  const submit = movies.getByRole("button", { name: "Import IDs", exact: true });
  for (const invalid of ["550abc 603", "550,1.5", "550 9007199254740992", "550,0", "550,-1", "550,1e3", "", Array.from({ length: 21 }, (_, index) => index + 1).join(",")]) {
    await field.fill(invalid);
    await submit.click();
    await expect(movies.getByRole("alert")).toHaveText("Enter 1 to 20 valid TMDB IDs.");
    expect(writes, `Invalid batch ${invalid} must not submit a partial list`).toEqual([]);
  }
  await field.fill("000550, 603 550 603");
  await submit.click();
  await expect(movies.getByRole("status").filter({ hasText: "Import completed" })).toBeVisible();
  expect(writes).toEqual([{ path: "/api/admin/movies/tmdb-import", data: { tmdbIds: [550, 603], syncSimilar: true } }]);
});

for (const width of [320, 1440]) {
  test(`admin film edit focuses the form and cancel returns to its row at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const { movie, movies, writes } = await adminMovieFixture(page);
    const row = movies.getByRole("listitem").filter({ hasText: movie.title });
    const edit = row.getByRole("button", { name: "Edit", exact: true });
    await edit.focus();
    await edit.press("Enter");
    const title = movies.getByRole("textbox", { name: "Film title", exact: true });
    await expect(title).toBeFocused();
    await expect(title).toHaveValue(movie.title);
    await expect(title).toBeInViewport();
    const focusedLayout = await title.evaluate(element => ({ top: element.getBoundingClientRect().top, headerBottom: document.querySelector("header")!.getBoundingClientRect().bottom }));
    expect(focusedLayout.top).toBeGreaterThanOrEqual(focusedLayout.headerBottom);
    await page.keyboard.press("Tab");
    await expect(movies.getByLabel("Duration (minutes)", { exact: true })).toBeFocused();
    await movies.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(edit).toBeFocused();
    await movies.locator("summary").filter({ hasText: "Add film" }).click();
    await expect(title).toHaveValue("");
    expect(writes).toEqual([]);
  });
}
