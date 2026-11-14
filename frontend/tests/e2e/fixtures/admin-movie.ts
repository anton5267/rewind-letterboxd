import { expect, type Page } from "@playwright/test";

// These controlled API responses test UI validation and focus, never TMDB or a database.
export async function adminMovieFixture(page: Page, options: { candidateStatus?: number } = {}) {
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
