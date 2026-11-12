import { expect, test, type Page } from "@playwright/test";

// These controlled API responses test UI validation and focus, never TMDB or a database.
async function adminMovieFixture(page: Page, options: { candidateStatus?: number } = {}) {
  const movie = { id: 940001, tmdbId: null, title: "Strict ID film", releaseDate: "2026-10-01", rating: 4, photoUrl: null, durationMinutes: 123, ageRating: "12+", reviewCount: 0, published: true };
  const emptyPage = { content: [], totalPages: 0, totalElements: 0 };
  const writes: { path: string; data: unknown }[] = [];
  const candidateSearches: string[] = [];
  let batchSyncRequestCount = 0;
  let failedBatchSyncRequest: number | null = null;
  await page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== "GET") {
      writes.push({ path: url.pathname, data: request.postDataJSON() });
      if (url.pathname === `/api/admin/movies/${movie.id}` && request.method() === "PUT") {
        const body = request.postDataJSON();
        Object.assign(movie, body);
        return route.fulfill({ json: movie });
      }
      if (url.pathname === `/api/admin/movies/${movie.id}/tmdb-sync`) return route.fulfill({ json: { movieId: movie.id, tmdbId: request.postDataJSON().tmdbId, title: movie.title, genresUpdated: 0, actorsUpdated: 0, directorsUpdated: 0, producersUpdated: 0, similarMoviesLinked: 0, trailerUpdated: false } });
      if (url.pathname === "/api/admin/movies/tmdb-import") return route.fulfill({ json: { requested: request.postDataJSON().tmdbIds.length, succeeded: 0, failed: 0, items: [] } });
      if (url.pathname === "/api/admin/movies/tmdb-sync/batch") {
        batchSyncRequestCount += 1;
        if (batchSyncRequestCount === failedBatchSyncRequest) return route.abort();
        const body = request.postDataJSON();
        return route.fulfill({ json: { requested: body.movies.length, succeeded: body.movies.length, failed: 0, items: body.movies.map((pair: { movieId: number; tmdbId: number }) => ({ ...pair, status: "SYNCED", title: movie.title, message: "Movie metadata synchronized" })) } });
      }
      return route.abort();
    }
    if (url.pathname === "/api/users/me") return route.fulfill({ json: { id: 940100, username: "movie-controls-admin", role: "ADMIN" } });
    if (url.pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "controlled-csrf" } });
    if (url.pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (url.pathname === "/api/admin/dashboard") return route.fulfill({ json: { users: 0, activeUsers: 0, hqUsers: 0, movies: 1, reviews: 0, hiddenReviews: 0 } });
    if (url.pathname === "/api/admin/settings") return route.fulfill({ json: [] });
    if (url.pathname === "/api/admin/movies/tmdb-quality") return route.fulfill({ json: { totalMovies: 1, tmdbLinkedMovies: 0, completeTmdbMovies: 0, missingPoster: 1, missingBackdrop: 1, missingPlot: 1, missingRuntime: 1, missingTrailer: 1, missingTmdbRating: 1, missingOriginalLanguage: 1, linkedCoveragePercent: 0, metadataCompletenessPercent: 0 } });
    if (url.pathname === "/api/genres") return route.fulfill({ json: [{ id: 7, name: "Drama" }, { id: 8, name: "Comedy" }] });
    if (url.pathname === "/api/people/search") {
      const type = url.searchParams.get("type");
      const person = type === "actor" ? { id: 31, name: "Test Actor", type: "ACTOR" }
        : type === "director" ? { id: 32, name: "Test Director", type: "DIRECTOR" }
        : { id: 33, name: "Test Producer", type: "PRODUCER" };
      return route.fulfill({ json: { content: [{ ...person, photoUrl: null, filmCount: 0 }], totalPages: 1, totalElements: 1, number: 0 } });
    }
    if (url.pathname === `/api/admin/movies/${movie.id}/tmdb-candidates`) {
      candidateSearches.push(url.pathname);
      if (options.candidateStatus) return route.fulfill({ status: options.candidateStatus, json: { message: "TMDB integration is disabled" } });
      return route.fulfill({ json: [
        { tmdbId: 672, title: "Strict ID film", releaseDate: "2026-10-01", overview: "Exact title and year match", posterUrl: null },
        { tmdbId: 673, title: "Strict ID Film: Revisited", releaseDate: "2025-10-01", overview: null, posterUrl: null },
      ] });
    }
    if (url.pathname === "/api/admin/movies") return route.fulfill({ json: { content: [movie], totalPages: 1, totalElements: 1 } });
    if (url.pathname === `/api/movies/${movie.id}/details`) return route.fulfill({ json: { ...movie, originalLanguage: "ja", genres: [{ id: 7, name: "Drama" }], directors: [], actors: [], producers: [], shortPlot: null, backdropUrl: null, trailerUrl: null, durationMinutes: null, ageRating: null } });
    return route.fulfill({ json: emptyPage });
  });
  await page.goto("/en/admin?view=movies");
  const movies = page.getByRole("region", { name: "Film database", exact: true });
  await expect(movies).toHaveAttribute("aria-busy", "false");
  const card = movies.getByRole("listitem").filter({ hasText: movie.title });
  await expect(card).toContainText("Age rating: 12+");
  await expect(card).toContainText("Duration (minutes): 123");
  await expect(card).toContainText("Visible reviews: 0");
  await expect(card).toContainText("Published");
  return { movie, movies, writes, candidateSearches, failBatchSyncRequest: (number: number) => { failedBatchSyncRequest = number; } };
}

test("Admin can change a film publication status", async ({ page }) => {
  const { movie, movies, writes } = await adminMovieFixture(page);
  const card = movies.getByRole("listitem").filter({ hasText: movie.title });
  await card.getByRole("button", { name: "Change status" }).click();
  await expect(card).toContainText("Unpublished");
  expect(writes.find(write => write.path === `/api/admin/movies/${movie.id}`)?.data).toEqual({ title: movie.title, published: false });
});

test("Admin can replace the genre selection when editing a film", async ({ page }) => {
  const { movie, movies, writes } = await adminMovieFixture(page);
  const row = movies.getByRole("listitem").filter({ hasText: movie.title });
  await row.getByRole("button", { name: "Edit", exact: true }).click();

  const drama = movies.getByRole("checkbox", { name: "Drama", exact: true });
  const comedy = movies.getByRole("checkbox", { name: "Comedy", exact: true });
  await expect(drama).toBeChecked();
  await expect(comedy).not.toBeChecked();
  await drama.uncheck();
  await comedy.check();
  await movies.getByRole("button", { name: "Save", exact: true }).click();

  await expect(row.getByRole("button", { name: "Edit", exact: true })).toBeFocused();
  expect(writes.find(write => write.path === `/api/admin/movies/${movie.id}`)?.data).toMatchObject({ genreIds: [8] });
});

test("Admin can edit actor, director, and producer credits", async ({ page }) => {
  const { movie, movies, writes } = await adminMovieFixture(page);
  await movies.locator("summary").filter({ hasText: "Add film" }).click();
  await expect(movies.getByText("Missing original language: 1")).toBeVisible();
  await movies.locator("summary").filter({ hasText: "Add film" }).click();
  const row = movies.getByRole("listitem").filter({ hasText: movie.title });
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  const language = movies.getByLabel("Original language (ISO code, for example en)");
  await expect(language).toHaveValue("ja");
  await language.fill("fr");

  const credits = movies.getByRole("region", { name: "Cast & Crew" });
  for (const [type, label, person] of [["actor", "Cast", "Test Actor"], ["director", "Directors", "Test Director"], ["producer", "Producers", "Test Producer"]] as const) {
    const group = credits.getByRole("group", { name: label });
    await group.getByLabel(`Find a person · ${label}`).fill(person);
    await group.getByRole("button", { name: "Search", exact: true }).click();
    await group.getByRole("list", { name: `${label} · Search results` }).getByRole("button", { name: "Add", exact: true }).click();
  }
  await credits.getByLabel("Character name").fill("The Lead");
  await credits.getByLabel("Cast order").fill("2");
  await movies.getByRole("button", { name: "Save", exact: true }).click();

  await expect(row.getByRole("button", { name: "Edit", exact: true })).toBeFocused();
  expect(writes.find(write => write.path === `/api/admin/movies/${movie.id}`)?.data).toMatchObject({
    originalLanguage: "fr",
    actorCredits: [{ actorId: 31, characterName: "The Lead", castOrder: 2 }],
    directorIds: [32],
    producerIds: [33],
  });
});

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

test("TMDB candidate selection only fills the ID until the admin explicitly syncs", async ({ page }) => {
  const { movie, movies, writes, candidateSearches } = await adminMovieFixture(page);
  const row = movies.getByRole("listitem").filter({ hasText: movie.title });
  await row.locator("summary").click();
  await row.getByRole("button", { name: "Find TMDB matches", exact: true }).click();
  const candidate = row.getByRole("button", { name: /Strict ID film · 2026 · 672/ });
  await expect(candidate).toBeVisible();
  expect(candidateSearches).toEqual([`/api/admin/movies/${movie.id}/tmdb-candidates`]);
  expect(writes).toEqual([]);

  await candidate.click();
  const field = row.getByRole("textbox", { name: `TMDB ID ${movie.title}`, exact: true });
  await expect(field).toHaveValue("672");
  expect(writes).toEqual([]);

  await row.getByRole("button", { name: "Sync TMDB", exact: true }).click();
  await expect(movies.getByRole("status").filter({ hasText: "TMDB updated" })).toBeVisible();
  expect(writes).toEqual([{ path: `/api/admin/movies/${movie.id}/tmdb-sync`, data: { tmdbId: 672, syncSimilar: true } }]);
});

test("TMDB candidate search explains when the server integration is not configured", async ({ page }) => {
  const { movie, movies, writes } = await adminMovieFixture(page, { candidateStatus: 503 });
  const row = movies.getByRole("listitem").filter({ hasText: movie.title });
  await row.locator("summary").click();
  await row.getByRole("button", { name: "Find TMDB matches", exact: true }).click();
  await expect(row.getByRole("alert")).toHaveText("TMDB integration is not configured. Add TMDB_API_KEY to the Edge Function secrets.");
  expect(writes).toEqual([]);
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

test("bulk TMDB sync validates unique ID pairs and submits them through the sync route", async ({ page }) => {
  const { movies, writes } = await adminMovieFixture(page);
  await movies.locator("summary").filter({ hasText: "Add film" }).click();
  const form = movies.getByRole("form", { name: "Bulk catalog sync" });
  const field = form.getByRole("textbox", { name: "Film ID pairs" });
  const submit = form.getByRole("button", { name: "Sync pairs" });
  await expect(form.getByRole("link", { name: "Open CSV with 49 verified pairs" })).toHaveAttribute("href", "https://raw.githubusercontent.com/anton5267/rewind-letterboxd/master/docs/project/TMDB_VERIFIED_CROSSWALK.csv");
  const invalidInputs = ["", "1,abc", "0,550", "1,550\n1,603", "1,550\n2,550", Array.from({ length: 51 }, (_, index) => `${index + 1},${index + 1000}`).join("\n")];
  for (const invalid of invalidInputs) {
    await field.fill(invalid);
    await submit.click();
    await expect(form.getByRole("alert")).toHaveText("Enter 1–50 pairs with unique positive REWIND and TMDB IDs.");
    expect(writes).toEqual([]);
  }
  await field.fill("940001,550");
  page.once("dialog", dialog => dialog.dismiss());
  await submit.click();
  expect(writes).toEqual([]);
  await field.fill("movie_id,tmdb_id\n000940001,000550\n940002,603");
  page.once("dialog", dialog => dialog.accept());
  await submit.click();
  await expect(form.getByRole("status")).toHaveText("Bulk sync finished: 2/2");
  expect(writes).toEqual([{ path: "/api/admin/movies/tmdb-sync/batch", data: { movies: [{ movieId: 940001, tmdbId: 550 }, { movieId: 940002, tmdbId: 603 }], syncSimilar: false } }]);
});

test("verified TMDB crosswalk loads into the form without submitting a mutation", async ({ page }) => {
  const { movies, writes } = await adminMovieFixture(page);
  await movies.locator("summary").filter({ hasText: "Add film" }).click();
  const form = movies.getByRole("form", { name: "Bulk catalog sync" });
  const csvUrl = "https://raw.githubusercontent.com/anton5267/rewind-letterboxd/master/docs/project/TMDB_VERIFIED_CROSSWALK.csv";
  const field = form.getByRole("textbox", { name: "Film ID pairs" });
  const load = form.getByRole("button", { name: "Load verified pairs", exact: true });
  await field.fill("940003,123");
  await expect(load).toBeDisabled();
  await field.fill("");
  await page.route(csvUrl, route => route.fulfill({
    status: 200,
    headers: { "access-control-allow-origin": "*", "content-type": "text/csv; charset=utf-8" },
    body: "movie_id,tmdb_id\n940001,1084242\n940002,840464\n",
  }));
  await load.click();
  await expect(field).toHaveValue("940001,1084242\n940002,840464");
  await expect(form.getByRole("status")).toHaveText("2 verified pairs loaded. Review them before syncing.");
  const preview = form.getByRole("table", { name: "TMDB pair review" });
  await expect(preview.getByRole("row").filter({ hasText: "Strict ID film (2026)" })).toContainText("1084242");
  await expect(preview.getByRole("link", { name: "1084242" })).toHaveAttribute("href", "https://www.themoviedb.org/movie/1084242");
  await expect(preview.getByRole("row").filter({ hasText: "Film not found (940002)" })).toContainText("840464");
  expect(writes).toEqual([]);
  await field.fill("940001,1084242");
  await expect(preview).toHaveCount(0);
  expect(writes).toEqual([]);
});

test("failed verified crosswalk load leaves the form unchanged", async ({ page }) => {
  const { movies, writes } = await adminMovieFixture(page);
  await movies.locator("summary").filter({ hasText: "Add film" }).click();
  const form = movies.getByRole("form", { name: "Bulk catalog sync" });
  await page.route("https://raw.githubusercontent.com/anton5267/rewind-letterboxd/master/docs/project/TMDB_VERIFIED_CROSSWALK.csv", route => route.fulfill({ status: 503, body: "unavailable" }));
  await form.getByRole("button", { name: "Load verified pairs", exact: true }).click();
  await expect(form.getByRole("alert")).toHaveText("Could not prepare the verified pair review. The list was not changed.");
  await expect(form.getByRole("textbox", { name: "Film ID pairs" })).toHaveValue("");
  expect(writes).toEqual([]);
});

test("bulk TMDB sync chunks requests and reports unknown outcomes without auto-retrying", async ({ page }) => {
  const { movies, writes, failBatchSyncRequest } = await adminMovieFixture(page);
  failBatchSyncRequest(2);
  await movies.locator("summary").filter({ hasText: "Add film" }).click();
  const form = movies.getByRole("form", { name: "Bulk catalog sync" });
  const pairs = Array.from({ length: 21 }, (_, index) => `${index + 1},${index + 1000}`).join("\n");
  await form.getByRole("textbox", { name: "Film ID pairs" }).fill(pairs);
  page.once("dialog", dialog => dialog.accept());
  await form.getByRole("button", { name: "Sync pairs" }).click();
  await expect(form.getByRole("alert")).toHaveText("A batch did not return a response. Check movie data before retrying unconfirmed pairs.: 20/21");
  await expect(form.getByText("The outcome for these pairs is unknown; check them in the catalog first:")).toBeVisible();
  await expect(form.getByText("21 → 1020")).toBeVisible();
  expect(writes).toHaveLength(2);
  expect(writes[0]?.data).toMatchObject({ movies: expect.arrayContaining([{ movieId: 1, tmdbId: 1000 }, { movieId: 20, tmdbId: 1019 }]), syncSimilar: false });
  expect(writes[1]?.data).toEqual({ movies: [{ movieId: 21, tmdbId: 1020 }], syncSimilar: false });
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
