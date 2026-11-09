import { expect, test, type Page, type Route } from "@playwright/test";

const emptyPage = { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 };
const publicProfile = {
  id: 95161, username: "retry-target", displayName: "Retry Target", avatarUrl: null, hq: false,
  stats: { ratings: 0, reviews: 1, watched: 0, watchlist: 0, favorites: 0 }, ratingDistribution: [], socialLinks: [], lists: [],
  recentReviews: [{ id: 77801, movieId: 77802, movieTitle: "Review Film", content: "A short review.", rating: 4, updatedAt: "2025-01-10T12:00:00Z" }],
};
const movieDetails = { id: 77802, title: "Activity Film", photoUrl: null };
const reviewDetails = {
  id: 77801, content: "A short review.", rating: 4, createdAt: "2025-01-10T12:00:00Z",
  author: { id: 95161, username: "retry-target", displayName: "Retry Target", avatarUrl: null },
  movie: { id: 77802, title: "Review Film", releaseDate: null, durationMinutes: null, ageRating: null, photoUrl: null, backdropUrl: null, trailerUrl: null },
  likes: 0, likedBy: [],
};

async function installPublicProfile(page: Page, detailsPath: string) {
  let attempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/users/95161/profile") return route.fulfill({ json: publicProfile });
    if (pathname === "/api/users/95161/activity") return route.fulfill({ json: {
      content: [{ id: 77803, type: "WATCHED", createdAt: "2025-01-10T12:00:00Z", actor: { id: 95161, username: "retry-target", displayName: "Retry Target", avatarUrl: null }, movie: { id: 77802, title: "Activity Film" }, relatedUser: null, list: null }],
      number: 0, size: 10, totalElements: 1, totalPages: 1,
    } });
    if (pathname === detailsPath) {
      attempts++;
      if (attempts < 3) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({ json: detailsPath.includes("/reviews/") ? reviewDetails : movieDetails });
    }
    if (pathname.endsWith("/followers") || pathname.endsWith("/following")) return route.fulfill({ json: emptyPage });
    if (pathname.includes("/collections/") || pathname.endsWith("/liked-reviews") || pathname.endsWith("/lists")) return route.fulfill({ json: emptyPage });
    if (pathname.includes("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: [] });
  });
  return () => attempts;
}

test("public profile activity poster retry keeps focus after repeat error and focuses the poster link after recovery", async ({ page }) => {
  const getAttempts = await installPublicProfile(page, "/api/movies/77802/details");
  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/users/95161");
  const activity = page.locator('[data-retry-focus-section="activity"]');
  const retry = activity.getByRole("button", { name: "Спробувати ще", exact: true });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(getAttempts).toBe(2);
  const retryAgain = activity.getByRole("button", { name: "Спробувати ще", exact: true });
  await expect(retryAgain).toBeFocused();
  await retryAgain.press("Enter");
  await expect.poll(getAttempts).toBe(3);
  await expect(activity.locator('a[aria-label="Activity Film"]')).toBeFocused();
});

test("public profile review poster retry restores focus after repeat failure and successful recovery", async ({ page }) => {
  const getAttempts = await installPublicProfile(page, "/api/reviews/77801");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/users/95161");
  const card = page.locator('[aria-labelledby="public-profile-reviews"] li').first();
  const retry = card.getByRole("button", { name: "Retry", exact: true });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(getAttempts).toBe(2);
  const retryAgain = card.getByRole("button", { name: "Retry", exact: true });
  await expect(retryAgain).toBeFocused();
  await retryAgain.press("Enter");
  await expect.poll(getAttempts).toBe(3);
  await expect(card.locator('a[aria-label="Review Film"]')).toBeFocused();
});

test("owner profile review score retry restores focus after error and focuses a recovered rating", async ({ page }) => {
  const user = { id: 95170, username: "rating-owner", role: "USER", displayName: "Rating Owner", avatarUrl: null };
  const profile = { ...user, email: "rating-owner@example.invalid", stats: { ratings: 1, reviews: 1, watched: 0, watchlist: 0, favorites: 0 }, lists: [], recentRatings: [], recentReviews: [] };
  const review = { reviewId: 95171, movieId: 95172, movieTitle: "My Rated Film", moviePhotoUrl: null, content: "A review.", updatedAt: "2025-01-10T12:00:00Z" };
  let attempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: user });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/profile/me/social-links") return route.fulfill({ json: [] });
    if (pathname === "/api/profile/me/reviews") return route.fulfill({ json: { ...emptyPage, content: [review], totalElements: 1, totalPages: 1 } });
    if (pathname.startsWith("/api/profile/me/")) return route.fulfill({ json: emptyPage });
    if (pathname === "/api/movies/95172/rating/me") {
      attempts++;
      return attempts < 3 ? route.fulfill({ status: 503, json: {} }) : route.fulfill({ json: { rating: 4 } });
    }
    if (pathname.endsWith("/activity") || pathname.endsWith("/followers") || pathname.endsWith("/following")) return route.fulfill({ json: emptyPage });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: [] });
  });
  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/profile?view=reviews");
  const scoreGroup = page.locator('[role="group"][aria-label="My Rated Film: Ваша оцінка"]');
  const retry = scoreGroup.getByRole("button", { name: "Спробувати ще", exact: true });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(() => attempts).toBe(2);
  const retryAgain = scoreGroup.getByRole("button", { name: "Спробувати ще", exact: true });
  await expect(retryAgain).toBeFocused();
  await retryAgain.press("Enter");
  await expect.poll(() => attempts).toBe(3);
  await expect(page.getByLabel("Ваша оцінка: 4/5")).toBeFocused();
});
