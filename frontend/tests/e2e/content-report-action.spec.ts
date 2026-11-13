import { expect, test, type Route } from "@playwright/test";

const user = { id: 940103, username: "report-reader", role: "USER", displayName: "Report Reader", avatarUrl: null };
const movie = {
  id: 940101, title: "Report Fixture Film", imdbId: null, shortPlot: null, photoUrl: null, backdropUrl: null,
  releaseDate: "2024-01-01", durationMinutes: 100, ageRating: null, rating: null, trailerUrl: null,
  genres: [], actors: [], directors: [], producers: [], externalRatings: [], similarMovies: [], myFlags: null,
};
const reviewId = 940102;
const commentId = 940104;
const listId = 940105;
const emptyPage = { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 };

for (const locale of ["uk", "en"] as const) {
  test(`members can report another user's comment and public list in ${locale}`, async ({ page }) => {
    const submitted: Array<{ path: string; body: unknown }> = [];
    await page.route(url => url.pathname.startsWith("/api/"), async (route: Route) => {
      const request = route.request();
      const { pathname } = new URL(request.url());
      if (pathname === "/api/users/me") return route.fulfill({ json: user });
      if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "content-report-e2e" } });
      if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
      if (pathname === `/api/movies/${movie.id}/details`) return route.fulfill({ json: movie });
      if (pathname === `/api/movies/${movie.id}/reviews`) return route.fulfill({ json: {
        content: [{ id: reviewId, userId: 940106, username: "other-reviewer", content: "Review fixture", rating: 4, createdAt: "2026-11-01T12:00:00Z" }],
        number: 0, size: 10, totalElements: 1, totalPages: 1,
      } });
      if (pathname === `/api/movies/${movie.id}/reviews/me`) return route.fulfill({ status: 204 });
      if (pathname === `/api/reviews/${reviewId}/like-status`) return route.fulfill({ json: { liked: false, likes: 0 } });
      if (pathname === `/api/reviews/${reviewId}/likes`) return route.fulfill({ json: 0 });
      if (pathname === `/api/reviews/${reviewId}/comments` && request.method() === "GET") return route.fulfill({ json: {
        content: [{ id: commentId, reviewId, userId: 940107, username: "another-member", userAvatarUrl: null, text: "Comment to report", createdAt: "2026-11-02T12:00:00Z", updatedAt: "2026-11-02T12:00:00Z" }],
        number: 0, size: 20, totalElements: 1, totalPages: 1,
      } });
      if (pathname === `/api/comments/${commentId}/report` && request.method() === "GET") return route.fulfill({ json: { reported: false } });
      if (pathname === `/api/lists/public/${listId}/report` && request.method() === "GET") return route.fulfill({ json: { reported: false } });
      if (pathname === `/api/comments/${commentId}/report` || pathname === `/api/lists/public/${listId}/report`) {
        submitted.push({ path: pathname, body: request.postDataJSON() });
        return route.fulfill({ json: { id: 940108 + submitted.length, reason: request.postDataJSON().reason, createdAt: "2026-11-03T12:00:00Z" } });
      }
      if (pathname === `/api/lists/public/${listId}`) return route.fulfill({ json: {
        id: listId, name: "Public report fixture", description: null, ownerId: 940109,
        ownerUsername: "another-member", ownerAvatarUrl: null, tags: [], likeCount: 0, movies: [],
      } });
      if (pathname === `/api/lists/public/${listId}/like-status`) return route.fulfill({ json: { liked: false, likes: 0 } });
      if (["/api/lists/public", "/api/lists/public/popular", "/api/lists/public/recently-liked", "/api/lists/public/team", "/api/lists/public/featured", "/api/reviews/popular", "/api/journal/articles", "/api/movies/search"].includes(pathname)) return route.fulfill({ json: emptyPage });
      if (["/api/tags/popular", "/api/users/popular-reviewers"].includes(pathname)) return route.fulfill({ json: [] });
      return route.fulfill({ status: 404, json: {} });
    });

    const labels = locale === "uk"
      ? { showComments: "Показати коментарі", reportComment: "Поскаржитися на коментар", reportList: "Поскаржитися на список", reason: "Причина скарги", bullying: "Булінг", inappropriate: "Неприйнятний вміст", send: "Надіслати скаргу", submitted: "Скаргу надіслано." }
      : { showComments: "Show comments", reportComment: "Report comment", reportList: "Report list", reason: "Report reason", bullying: "Bullying", inappropriate: "Inappropriate content", send: "Submit report", submitted: "Report submitted." };

    await page.goto(`/${locale}/films/${movie.id}`);
    const comments = page.getByRole("region", { name: locale === "uk" ? "Коментарі" : "Comments" });
    await comments.getByRole("button", { name: labels.showComments }).click();
    const comment = comments.getByRole("listitem").filter({ hasText: "Comment to report" });
    await comment.getByRole("button", { name: labels.reportComment, exact: true }).click();
    await comment.getByLabel(labels.reason).selectOption("BULLYING");
    await comment.getByRole("button", { name: labels.send, exact: true }).click();
    await expect(comment.getByRole("status")).toContainText(labels.submitted);

    await page.goto(`/${locale}/lists/public/${listId}`);
    const listReportArea = page.locator('[data-content-report-type="list"]');
    const listReport = listReportArea.getByRole("button", { name: labels.reportList, exact: true });
    await expect(listReport).toBeVisible();
    await listReport.click();
    await listReportArea.getByLabel(labels.reason).selectOption("INAPPROPRIATE_CONTENT");
    await listReportArea.getByRole("button", { name: labels.send, exact: true }).click();
    await expect(listReportArea.getByRole("status")).toContainText(labels.submitted);

    expect(submitted).toEqual([
      { path: `/api/comments/${commentId}/report`, body: { reason: "BULLYING" } },
      { path: `/api/lists/public/${listId}/report`, body: { reason: "INAPPROPRIATE_CONTENT" } },
    ]);
  });
}
