import { expect, test, type Page } from "@playwright/test";

const emptyPage = { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0, first: true, last: true };
const movies = Array.from({ length: 6 }, (_, index) => ({
  id: 981001 + index, title: `Profile film ${index + 1}: ${"A deliberately long title ".repeat(4)}`,
  releaseDate: "2024-01-01", rating: 4, photoUrl: `https://profile-fixture.invalid/poster-${index}.svg`,
}));
const ratings = Array.from({ length: 10 }, (_, index) => ({ movieId: 981001 + index, movieTitle: `Profile rated film ${index + 1}`, moviePhotoUrl: `https://profile-fixture.invalid/poster-${index}.svg`, rating: 4, updatedAt: "2026-10-20T12:00:00Z" }));
const review = { reviewId: 981100, movieId: movies[0].id, movieTitle: movies[0].title, moviePhotoUrl: movies[0].photoUrl, content: "A complete own review remains a keyboard accessible link. ".repeat(12).trim(), updatedAt: "2026-10-20T12:00:00Z" };
const olderReviews = [
  { ...review, reviewId: 981110, movieId: 981101, movieTitle: "An older reviewed film with an available poster", moviePhotoUrl: "https://profile-fixture.invalid/older-review.svg" },
  { ...review, reviewId: 981111, movieId: 981002, movieTitle: "Missing poster film", moviePhotoUrl: null },
];
const pageOf = <T,>(content: T[]) => ({ ...emptyPage, content, totalElements: content.length, totalPages: content.length ? 1 : 0 });
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

/** Synthetic HTTP responses are confined to this browser context; every API write is blocked. */
async function fixture(page: Page, options?: { gate?: ReturnType<typeof deferred>; failFirst?: boolean; activityFailFirst?: boolean; empty?: boolean; olderReviews?: boolean; legacyReview?: boolean }) {
  const mutations: string[] = [];
  let favoriteRequests = 0;
  let activityRequests = 0;
  const reviewData = options?.olderReviews ? olderReviews : [{ ...review, moviePhotoUrl: options?.legacyReview ? undefined : review.moviePhotoUrl }];
  await page.route("https://profile-fixture.invalid/**", route => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="79" height="116"><rect width="79" height="116" fill="#4a3a61"/><circle cx="39" cy="45" r="22" fill="#c9a56b"/></svg>' }));
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request(), pathname = new URL(request.url()).pathname;
    if (request.method() !== "GET") { mutations.push(`${request.method()} ${pathname}`); return route.abort(); }
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: 981000, username: "profile-reader", role: "USER" } });
    if (pathname === "/api/profile/me") return route.fulfill({ json: {
      id: 981000, username: "profile-reader", displayName: "A profile name that wraps safely", email: `${"long".repeat(12)}@example.invalid`, role: "USER", avatarUrl: null,
      stats: { watched: 17, watchlist: 2, favorites: 6, reviews: options?.olderReviews ? 2 : 1, ratings: ratings.length },
      lists: [{ id: 981201, name: "My public list with a long descriptive title", listType: "CUSTOM", isPublic: true }, { id: 981202, name: "My private list", listType: "CUSTOM", isPublic: false }],
      recentRatings: ratings, recentReviews: reviewData,
    } });
    if (pathname === "/api/profile/me/favorites") {
      const attempt = ++favoriteRequests;
      if (options?.gate && attempt === 1) await options.gate.promise;
      return route.fulfill(options?.failFirst && attempt === 1 ? { status: 503, json: {} } : { json: pageOf(options?.empty ? [] : movies) });
    }
    if (pathname === "/api/profile/me/watched") return route.fulfill({ json: pageOf([movies[0]]) });
    if (pathname === "/api/profile/me/ratings") return route.fulfill({ json: pageOf(ratings) });
    if (pathname === "/api/profile/me/reviews") return route.fulfill({ json: pageOf(reviewData) });
    if (pathname === "/api/lists/my" || /^\/api\/lists\/\d+\/items$/.test(pathname)) return route.fulfill({ json: [] });
    if (pathname === "/api/users/981000/activity") {
      const attempt = ++activityRequests;
      if (options?.activityFailFirst && attempt === 1) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({ json: pageOf([{ id: 981400, type: "RATING", createdAt: "2026-10-20T12:00:00Z", actor: null, movie: { id: movies[0].id, title: movies[0].title }, relatedUser: null, list: null }]) });
    }
    if (pathname === "/api/users/981000/following") return route.fulfill({ json: pageOf(Array.from({ length: 8 }, (_, index) => ({ id: 981300 + index, username: `following-${index}`, displayName: `Following reader ${index}`, avatarUrl: null }))) });
    if (pathname.endsWith("/social-links")) return route.fulfill({ json: [] });
    if (pathname === "/api/newsletter/subscription") return route.fulfill({ json: { subscribed: false } });
    if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: emptyPage });
  });
  return { mutations, favoriteRequests: () => favoriteRequests };
}

test("legacy review posters remain available when the API field is absent", async ({ page }) => {
  const api = await fixture(page, { legacyReview: true });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.setViewportSize({ width: 393, height: 900 });
  const responsePromise = page.waitForResponse(response => new URL(response.url()).pathname === "/api/profile/me/reviews");
  await page.goto("/en/profile?view=reviews");
  const response = await responsePromise;
  const payload = await response.json() as { content: Record<string, unknown>[] };
  expect(payload.content[0]).not.toHaveProperty("moviePhotoUrl");
  const poster = page.locator("#profile-reviews").getByRole("link", { name: review.movieTitle, exact: true }).first().locator("img");
  await poster.scrollIntoViewIfNeeded();
  await expect(poster).toHaveAttribute("src", ratings[0].moviePhotoUrl);
  await expect.poll(() => poster.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  expect(api.mutations).toEqual([]);
  expect(errors).toEqual([]);
});

for (const lang of ["uk", "en"] as const) {
  test(`older review posters are independent of recent ratings in ${lang}`, async ({ page }) => {
    const api = await fixture(page, { olderReviews: true });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    expect(ratings).toHaveLength(10);
    expect(ratings.some(rating => rating.movieId === olderReviews[0].movieId)).toBe(false);
    // An explicit null must win even if a stale rating snapshot still has a poster.
    expect(ratings.some(rating => rating.movieId === olderReviews[1].movieId)).toBe(true);
    await page.goto(`/${lang}/profile?view=reviews`);
    const reviews = page.locator("#profile-reviews");
    await expect(reviews.locator("li")).toHaveCount(2);
    const olderPoster = reviews.getByRole("link", { name: olderReviews[0].movieTitle, exact: true }).first();
    const missingPoster = reviews.getByRole("link", { name: olderReviews[1].movieTitle, exact: true }).first();

    for (const width of [320, 393, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await olderPoster.scrollIntoViewIfNeeded();
      await expect(olderPoster.locator("img")).toHaveAttribute("src", olderReviews[0].moviePhotoUrl!);
      await expect.poll(() => olderPoster.locator("img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
      await expect(missingPoster.locator("img")).toHaveCount(0);
      await expect(missingPoster).toHaveText("M");
      await expect(missingPoster).toHaveAttribute("href", `/${lang}/films/${olderReviews[1].movieId}`);
      await olderPoster.focus();
      await expect(olderPoster).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    }
    expect(api.mutations).toEqual([]);
    expect(errors).toEqual([]);
  });

  test(`authenticated profile keeps content, forms and keyboard access across widths in ${lang}`, async ({ page }, testInfo) => {
    const api = await fixture(page);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`/${lang}/profile`);
    const favorites = page.locator("#profile-overview ul a");
    await expect(favorites).toHaveCount(4);
    await expect(page.locator("#profile-activity").getByRole("link", { name: movies[0].title, exact: true })).toHaveAttribute("href", `/${lang}/films/${movies[0].id}`);
    await expect(page.locator("#profile-review-preview").getByText(review.content, { exact: true })).toBeVisible();
    for (const width of [320, 393, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.locator("#profile-page-title")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
      await favorites.first().focus();
      await expect(favorites.first()).toBeFocused();
      await expect(favorites.first()).toHaveAttribute("href", `/${lang}/films/${movies[0].id}`);
      await page.screenshot({ path: testInfo.outputPath(`auth-profile-${width}.png`), animations: "disabled" });
    }
    await page.goto(`/${lang}/profile?view=collection&collection=watched`);
    await expect(page.locator("#profile-collection-tab-watched")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#profile-collection-content").getByRole("link", { name: movies[0].title, exact: true })).toBeVisible();
    await page.locator('nav[class*="profileNav"]').getByRole("link", { name: lang === "uk" ? "До перегляду" : "Watchlist", exact: true }).click();
    await expect(page.locator("#profile-collection-tab-watchlist")).toHaveAttribute("aria-selected", "true");
    await page.goto(`/${lang}/profile?view=reviews`);
    await expect(page.locator("#profile-reviews").getByText(review.content, { exact: true })).toBeVisible();
    await page.goto(`/${lang}/profile?settings=profile`);
    await expect(page.locator("#profile-display-name")).toBeEnabled();
    await page.goto(`/${lang}/profile?settings=avatar`);
    await expect(page.locator("#profile-avatar-url")).toBeEnabled();
    await page.goto(`/${lang}/profile?settings=authentication`);
    await expect(page.locator("#profile-current-password")).toBeEnabled();
    await expect(page.locator("#profile-new-password")).toBeEnabled();
    await page.goto(`/${lang}/profile#profile-delete-form-title`);
    await expect(page.locator("#profile-delete-password")).toBeEnabled();
    expect(api.mutations).toEqual([]);
    expect(errors).toEqual([]);
  });

  test(`favorite preview has independent loading, error and retry without changing watched in ${lang}`, async ({ page }) => {
    const gate = deferred();
    const api = await fixture(page, { gate, failFirst: true });
    await page.setViewportSize({ width: 393, height: 900 });
    await page.goto(`/${lang}/profile`);
    const preview = page.locator('section[aria-labelledby="profile-favorite-preview-title"]');
    await expect(preview).toHaveAttribute("aria-busy", "true");
    await expect(preview.getByRole("status")).toBeVisible();
    await expect(page.locator("#profile-identity")).toBeVisible();
    gate.resolve();
    await expect(preview.getByRole("alert")).toContainText(lang === "uk" ? "Не вдалося завантажити добірку." : "Could not load this collection.");
    await preview.getByRole("button", { name: lang === "uk" ? "Спробувати ще" : "Retry" }).click();
    await expect(preview.locator("ul").getByRole("link")).toHaveCount(4);
    await expect(page).toHaveURL(new RegExp(`/${lang}/profile$`));
    expect(api.favoriteRequests()).toBeGreaterThanOrEqual(2);
    expect(api.mutations).toEqual([]);
  });
}

for (const lang of ["uk", "en"] as const) {
  test(`profile activity exposes retry in ${lang}`, async ({ page }) => {
    const api = await fixture(page, { activityFailFirst: true });
    await page.goto(`/${lang}/profile`);
    const activity = page.locator("#profile-activity");
    await expect(activity.getByRole("alert")).toContainText(lang === "uk" ? "Не вдалося завантажити активність." : "Could not load activity.");
    await activity.getByRole("button", { name: lang === "uk" ? "Спробувати ще" : "Retry" }).click();
    await expect(activity.getByRole("link", { name: movies[0].title, exact: true })).toBeVisible();
    expect(api.mutations).toEqual([]);
  });
}

test("favorite preview exposes an honest empty collection", async ({ page }) => {
  const gate = deferred(); gate.resolve();
  const api = await fixture(page, { gate, empty: true });
  await page.goto("/en/profile");
  const preview = page.locator('section[aria-labelledby="profile-favorite-preview-title"]');
  await expect(preview).toContainText("There are no films in this collection yet.");
  await expect(preview.locator("ul").getByRole("link")).toHaveCount(0);
  await expect(page).toHaveURL(/\/en\/profile$/);
  expect(api.mutations).toEqual([]);
});
