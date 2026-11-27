import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const owner = { id: 94110, username: "emma-cerys", displayName: "Emma Cerys", role: "USER", email: "emma@example.invalid" };
const reviews = [
  { reviewId: 95101, movieId: 95201, movieTitle: "Avatar: Fire and Ash", moviePhotoUrl: "https://fixture.invalid/own-reviews/avatar-fire-ash.png", content: "James Cameron is in no hurry. This guy has been working on Avatar in some shape or form since at least 1994, and the two Avatar sequels for the last 16 years. Compared to all of that, Avatar: Fire and Ash’s 197-minute runtime is like a drop in the ocean where Payakan (The Mighty Tulkun) roams. If spending three hours and 15 minutes in a theater intimidates you, stay home and look at social media on your phone.", updatedAt: "2025-12-18T12:00:00Z" },
  { reviewId: 95102, movieId: 95202, movieTitle: "The Hunt", moviePhotoUrl: "https://fixture.invalid/own-reviews/the-hunt.png", content: "Look, I KNEW what this film was about, I knew this was going to be difficult to watch, but nothing could have prepared me for the amount of frustration, anxiety, and just plain sadness I felt watching The Hunt. Mikkelsen’s performance is particularly powerful and heartbreaking, even though everyone in this film is great. But yea, I'm pretty much emotionally exhausted now.", updatedAt: "2025-12-10T12:00:00Z" },
  { reviewId: 95103, movieId: 95203, movieTitle: "City Of God", moviePhotoUrl: "https://fixture.invalid/own-reviews/city-of-god.png", content: "I knew City of God would be intense, but I didn’t expect it to feel this raw and uncompromising. From the first minutes, it throws you into chaos and never lets you look away. The pacing is relentless, the violence is brutal, and every moment feels dangerously alive. What makes it truly unforgettable is how real everything feels — the performances, the desperation, the lack of escape. It’s not just a crime story, it’s a portrait of a world where survival comes at a cost no one should have to pay.", updatedAt: "2025-12-03T12:00:00Z" },
].map((review, index) => ({ ...review, rating: index === 0 ? 4.5 : 5 }));
const profile = {
  ...owner, avatarUrl: "https://fixture.invalid/own-reviews/profile-avatar.png", bannerUrl: "https://fixture.invalid/own-reviews/profile-banner.png", bio: "Obsessed with great directing, bold storytelling, and films that stick with you long after the credits roll.", location: "USA",
  stats: { ratings: 212, reviews: 17, watched: 834, watchlist: 32, favorites: 24 }, lists: [], recentRatings: [], recentReviews: reviews,
};
const reviewDetails = {
  id: reviews[0].reviewId, content: reviews[0].content, rating: 4.5, createdAt: reviews[0].updatedAt,
  author: { id: owner.id, username: owner.username, displayName: owner.displayName, avatarUrl: null },
  movie: { id: reviews[0].movieId, title: reviews[0].movieTitle, releaseDate: "2025-12-18", durationMinutes: null, ageRating: null, photoUrl: null, backdropUrl: null, trailerUrl: null },
  likes: 0, likedBy: [],
};

async function mockOwnReviewsApi(page: import("@playwright/test").Page) {
  const fixtureFiles = ["avatar-fire-ash.png", "the-hunt.png", "city-of-god.png"];
  const fixtureImages = new Map(await Promise.all([
    ...fixtureFiles.map(async name => [name, await readFile(join(testDir, "fixtures", "own-profile-reviews-figma", name))] as const),
    ["profile-avatar.png", await readFile(join(testDir, "fixtures", "own-profile-likes-figma", "profile-avatar.png"))] as const,
    ["profile-banner.png", await readFile(join(testDir, "fixtures", "own-profile-reviews-figma", "profile-banner.png"))] as const,
  ]));
  await page.route("https://fixture.invalid/own-reviews/**", route => {
    const name = new URL(route.request().url()).pathname.split("/").at(-1)!;
    const body = fixtureImages.get(name);
    return body ? route.fulfill({ contentType: "image/png", body }) : route.abort();
  });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/users/me") return route.fulfill({ json: owner });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 204 });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/profile/me/social-links") return route.fulfill({ json: [] });
    if (pathname === `/api/users/${owner.id}/following`) return route.fulfill({ json: { content: [], totalPages: 2, totalElements: 32, number: 0, size: 16 } });
    if (pathname === `/api/users/${owner.id}/followers`) return route.fulfill({ json: { content: [], totalPages: 18, totalElements: 287, number: 0, size: 16 } });
    if (pathname === "/api/profile/me/reviews") return route.fulfill({ json: { content: reviews, totalPages: 1, totalElements: 17, number: 0, size: 12 } });
    if (pathname === `/api/reviews/${reviews[0].reviewId}`) return route.fulfill({ json: reviewDetails });
    if (["/api/profile/me/favorites", "/api/profile/me/watchlist", "/api/profile/me/watched"].includes(pathname)) return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 24 } });
    const ratingMatch = pathname.match(/^\/api\/movies\/(\d+)\/rating\/me$/);
    if (ratingMatch) return route.fulfill({ json: { rating: reviews.find(item => item.movieId === Number(ratingMatch[1]))?.rating ?? 4 } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 12 } });
  });
}

test("READY own Reviews list mobile and desktop frames render review cards", async ({ page }) => {
  await mockOwnReviewsApi(page);

  await page.setViewportSize({ width: 393, height: 1434 });
  await page.goto("/en/profile?view=reviews");
  await expect(page.locator("#profile-reviews")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("#profile-reviews ul > li[class*='reviewCard']")).toHaveCount(3);
  await expect(page.getByRole("heading", { level: 2, name: "Reviews" })).toBeVisible();
  await expect(page.locator("#profile-reviews [class*='reviewPosterLink'] img")).toHaveCount(3);
  const mobile = await page.evaluate(() => {
    const rect = (element: Element | null) => { if (!element) return null; const box = element.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height }; };
    return {
      avatar: rect(document.querySelector("[class*='avatar']:not([aria-hidden='true'])")),
      profileNav: rect(document.querySelector("nav[class*='profileNav']")),
      heading: rect(document.querySelector("#profile-reviews-title")),
      cards: [...document.querySelectorAll("#profile-reviews ul > li[class*='reviewCard']")].map(rect),
      posters: [...document.querySelectorAll("#profile-reviews [class*='reviewPosterLink']")].map(rect),
      imageWidths: [...document.querySelectorAll<HTMLImageElement>("#profile-reviews [class*='reviewPosterLink'] img")].map(image => image.naturalWidth),
      width: document.documentElement.scrollWidth,
    };
  });
  expect(mobile.width).toBe(393);
  expect(mobile.cards[0]?.x).toBe(16);
  expect(mobile.cards[0]?.y).toBeCloseTo(646, 0);
  expect(mobile.posters[0]).toMatchObject({ x: 34, y: 672, width: 79, height: 116 });
  expect(mobile.imageWidths.every(width => width > 0)).toBe(true);
  console.log("OWN_REVIEWS_MOBILE_FIGMA_GEOMETRY", JSON.stringify(mobile));
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-own-reviews-en-mobile-393.png" });

  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await expect(page.locator("#profile-reviews ul > li[class*='reviewCard']")).toHaveCount(3);
    await page.screenshot({ path: `../artifacts/visual-audit-20261124/profile/rewind-own-reviews-en-responsive-${width}.png` });
  }

  await page.setViewportSize({ width: 393, height: 1434 });
  await page.goto("/uk/profile?view=reviews");
  await expect(page.getByRole("heading", { level: 2, name: "Огляди" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-own-reviews-uk-mobile-393.png" });

  await page.setViewportSize({ width: 1440, height: 2859 });
  await page.goto("/en/profile?view=reviews");
  await expect(page.locator("#profile-reviews ul > li[class*='reviewCard']")).toHaveCount(3);
  await expect(page.locator("footer")).toHaveJSProperty("offsetHeight", 265);
  const desktop = await page.evaluate(() => {
    const rect = (element: Element | null) => { if (!element) return null; const box = element.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height }; };
    return { firstCard: rect(document.querySelector("#profile-reviews ul > li[class*='reviewCard']")), footer: rect(document.querySelector("footer")), width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight };
  });
  expect(desktop.width).toBe(1440);
  console.log("OWN_REVIEWS_FIGMA_GEOMETRY", JSON.stringify(desktop));
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-own-reviews-en-desktop-1440.png", fullPage: true });
});

test("READY own review edit frame opens the editable review with save and delete actions", async ({ page }) => {
  await mockOwnReviewsApi(page);
  await page.setViewportSize({ width: 1440, height: 2335 });
  await page.goto(`/en/profile?view=reviews&review=${reviews[0].reviewId}`);
  await expect(page.locator("#profile-reviews")).toHaveAttribute("aria-busy", "false");
  await page.getByRole("button", { name: "Edit review: Avatar: Fire and Ash" }).click();
  await expect(page.getByRole("textbox", { name: "Review" })).toHaveValue(reviews[0].content);
  await expect(page.getByRole("button", { name: "Cancel" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Save review" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete review" }).last()).toBeVisible();
  const geometry = await page.evaluate(() => {
    const rect = (element: Element | null) => { if (!element) return null; const box = element.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height }; };
    return { poster: rect(document.querySelector("#profile-reviews [class*='reviewPosterLink']")), card: rect(document.querySelector("#profile-reviews ul > li")), footer: rect(document.querySelector("footer")), width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight };
  });
  expect(geometry.width).toBe(1440);
  console.log("OWN_REVIEW_EDIT_FIGMA_GEOMETRY", JSON.stringify(geometry));
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-own-review-edit-en-desktop-1440.png", fullPage: true });
});
