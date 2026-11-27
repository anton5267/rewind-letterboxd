import { expect, test } from "@playwright/test";

const ownerId = 95161;
const reviewId = 95280;
const title = "Avatar: Fire and Ash";
const content = "James Cameron is in no hurry. This guy has been working on Avatar in some shape or form since at least 1994, and the two Avatar sequels for the last 16 years. Compared to all of that, Avatar: Fire and Ash's 197-minute runtime is like a drop in the ocean where Payakan (The Mighty Tulkun) roams. If spending three hours and 15 minutes in a theater intimidates you, stay home and look at social media on your phone.";
const profile = {
  id: ownerId, username: "emma-cerys", displayName: "Emma Cerys", email: "owner@example.invalid", role: "USER", avatarUrl: "https://fixtures.rewind.invalid/emma-cerys.png",
  location: "USA", bio: "Obsessed with great directing, bold storytelling, and films that stick with you long after the credits roll.",
  stats: { ratings: 212, reviews: 32, watched: 212, watchlist: 32, favorites: 24 }, lists: [], recentRatings: [], recentReviews: [],
};
const review = {
  id: reviewId, content, rating: 4.5, createdAt: "2025-12-18T12:00:00Z",
  author: { id: ownerId, username: "emma-cerys", displayName: "Emma Cerys", avatarUrl: "https://fixtures.rewind.invalid/emma-cerys.png" },
  movie: { id: 99300, title, releaseDate: "2025-12-18", durationMinutes: 197, ageRating: null, photoUrl: "https://fixtures.rewind.invalid/avatar-fire-and-ash.png", backdropUrl: null, trailerUrl: null },
  likes: 0, likedBy: [],
};
const emptyPage = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 12 };

test("READY own-profile review detail matches mobile and desktop frames", async ({ page }) => {
  page.on("pageerror", error => console.log("OWN_REVIEW_PAGE_ERROR", error.stack ?? error.message));
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: ownerId, username: "emma-cerys", displayName: "Emma Cerys", role: "USER" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 204 });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/profile/me/social-links") return route.fulfill({ json: [] });
    if (pathname === `/api/reviews/${reviewId}`) return route.fulfill({ json: review });
    if (pathname === "/api/movies/99300/rating/me") return route.fulfill({ json: { rating: 4.5 } });
    if (pathname === "/api/profile/me/reviews") return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 12 } });
    if (pathname === `/api/users/${ownerId}/following`) return route.fulfill({ json: { ...emptyPage, totalElements: 17 } });
    if (pathname === `/api/users/${ownerId}/followers`) return route.fulfill({ json: { ...emptyPage, totalElements: 98 } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: emptyPage });
  });
  await page.route("https://fixtures.rewind.invalid/avatar-fire-and-ash.png", route => route.fulfill({
    path: "tests/e2e/fixtures/own-profile-review-detail-figma/avatar-fire-and-ash.png",
    contentType: "image/png",
  }));
  await page.route("https://fixtures.rewind.invalid/emma-cerys.png", route => route.fulfill({
    path: "tests/e2e/fixtures/own-profile-overview-figma/profile-avatar.png",
    contentType: "image/png",
  }));
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto(`/en/profile?view=reviews&review=${reviewId}`);
  await expect(page.locator('[class*="reviewDetailToolbar"] h2')).toHaveText("Review");
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await expect(page.getByText(content, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: `Edit review: ${title}` })).toBeVisible();
  await expect(page.getByRole("button", { name: `Delete review: ${title}` })).toBeVisible();
  const posterImage = page.locator('[data-review-detail="true"] [class*="reviewPosterLink"] img');
  await expect(posterImage).toBeVisible();
  await expect.poll(() => posterImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing ${selector}`);
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      card: rect('[data-review-detail="true"] [class*="reviewCard"]'),
      panel: rect('[data-review-detail="true"] [class*="reviewCopy"]'),
      poster: rect('[data-review-detail="true"] [class*="reviewPosterLink"]'),
      actions: rect('[data-review-detail="true"] [class*="reviewActions"]'),
      title: rect('[data-review-detail="true"] [class*="reviewHeading"] h3'),
      date: rect('[data-review-detail="true"] [class*="reviewCopy"] time'),
      body: rect('[data-review-detail="true"] [class*="reviewContent"]'),
    };
  });
  expect(geometry.poster.x).toBe(34);
  expect(geometry.poster.y).toBe(149);
  expect(geometry.actions.x).toBeGreaterThanOrEqual(155);
  expect(geometry.actions.x).toBeLessThanOrEqual(165);
  expect(geometry.actions.y).toBe(350);
  expect(geometry.actions.width).toBeGreaterThanOrEqual(210);
  expect(geometry.actions.width).toBeLessThanOrEqual(220);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-own-review-detail-en-mobile-393.png" });

  await page.setViewportSize({ width: 1440, height: 2237 });
  await page.goto(`/en/profile?view=reviews&review=${reviewId}`);
  await expect(page.getByRole("heading", { name: `Review by ${profile.displayName}` })).toBeVisible();
  await expect(page.getByText(profile.location, { exact: true })).toBeVisible();
  await expect(page.getByText(profile.bio, { exact: true })).toBeVisible();
  await expect(page.locator('[class*="heroMetrics"] dd').nth(0)).toHaveText("212");
  await expect(page.locator('[class*="heroMetrics"] dd').nth(1)).toHaveText("17");
  await expect(page.locator('[class*="heroMetrics"] dd').nth(2)).toHaveText("98");
  const profileAvatar = page.locator('[class*="hero"] img');
  await expect(profileAvatar).toBeVisible();
  await expect.poll(() => profileAvatar.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  const desktopGeometry = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing ${selector}`);
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      poster: rect('[data-review-detail="true"] [class*="reviewPosterLink"]'),
      panel: rect('[data-review-detail="true"] [class*="reviewCopy"]'),
      footer: rect("footer"),
      bodyStyle: (() => { const body = document.querySelector<HTMLElement>('[data-review-detail="true"] [class*="reviewContent"]'); return body ? { fontSize: getComputedStyle(body).fontSize, lineHeight: getComputedStyle(body).lineHeight, height: body.getBoundingClientRect().height } : null; })(),
    };
  });
  expect(desktopGeometry.poster).toMatchObject({ x: 121, width: 265, height: 395 });
  expect(desktopGeometry.poster.y).toBeCloseTo(1416, 0);
  expect(desktopGeometry.panel).toMatchObject({ x: 414, width: 906, height: 395 });
  expect(desktopGeometry.panel.y).toBeCloseTo(1416, 0);
  expect(desktopGeometry.footer.y).toBe(1973);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-own-review-detail-en-desktop-1440.png", fullPage: true });
});
