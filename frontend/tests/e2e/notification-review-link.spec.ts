import { expect, test } from "@playwright/test";

const reviewId = 99203;
const notificationId = 99201;

for (const locale of ["uk", "en"] as const) {
  test(`review-like notification opens the review and marks itself read in ${locale}`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    const user = { id: 99200, username: "notification-reader", role: "USER", displayName: "Notification Reader" };
    const item = {
      id: notificationId, type: "REVIEW_LIKED", createdAt: "2026-11-03T12:00:00Z", readAt: null,
      actor: { id: 99202, username: "review-author", displayName: "Review Author", avatarUrl: null },
      relatedUserId: null, reviewId,
    };
    let markedRead = false;

    await page.route(url => url.pathname.startsWith("/api/"), route => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      if (pathname === "/api/users/me") return route.fulfill({ json: user });
      if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "notification-review-link" } });
      if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
      if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: markedRead ? 0 : 1 } });
      if (pathname === "/api/notifications/stream") return route.abort();
      if (pathname === "/api/notifications/preferences") return route.fulfill({ json: { followsEnabled: true, reviewLikesEnabled: true } });
      if (pathname === "/api/notifications" && request.method() === "GET") {
        return route.fulfill({ json: { content: [{ ...item, readAt: markedRead ? "2026-11-03T12:01:00Z" : null }], totalPages: 1, totalElements: 1 } });
      }
      if (pathname === `/api/notifications/${notificationId}/read` && request.method() === "POST") {
        markedRead = true;
        return route.fulfill({ status: 204, body: "" });
      }
      if (pathname === `/api/reviews/${reviewId}`) return route.fulfill({ json: {
        id: reviewId, content: "The review linked from the notification.", rating: 4, createdAt: "2026-11-03T11:00:00Z",
        author: { id: 99202, username: "review-author", displayName: "Review Author", avatarUrl: null },
        movie: { id: 99204, title: "Linked film", releaseDate: "2020-01-01", durationMinutes: 120, ageRating: null, photoUrl: null, backdropUrl: null, trailerUrl: null },
        likes: 1, likedBy: [],
      } });
      if (pathname === `/api/reviews/${reviewId}/like-status`) return route.fulfill({ json: { liked: false, likes: 1 } });
      return route.fulfill({ status: 404, json: {} });
    });

    await page.goto(`/${locale}/notifications`);
    const expectedLinkName = locale === "uk" ? "вподобав(-ла) ваш огляд" : "liked your review";
    const reviewLink = page.getByRole("link", { name: expectedLinkName, exact: true });
    await expect(reviewLink).toHaveAttribute("href", `/${locale}/reviews/${reviewId}`);
    await expect(page.getByRole("link", { name: "Review Author", exact: true })).toHaveAttribute("href", `/${locale}/users/99202`);

    const readResponse = page.waitForResponse(response => response.url().endsWith(`/api/notifications/${notificationId}/read`));
    await reviewLink.click();
    expect((await readResponse).status()).toBe(204);
    await expect(page).toHaveURL(new RegExp(`/${locale}/reviews/${reviewId}$`));
    await expect(page.getByText("The review linked from the notification.", { exact: true })).toBeVisible();
    expect(markedRead).toBeTruthy();
    expect(pageErrors).toEqual([]);
  });
}
