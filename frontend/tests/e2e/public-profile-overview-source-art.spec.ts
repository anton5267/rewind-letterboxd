import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const profileId = 981234;
const imageBase = "https://profile-figma-fixture.invalid";
const assetNames = [
  "profile-avatar.png",
  "favorite-01.png", "favorite-02.png", "favorite-03.png", "favorite-04.png",
  "activity-01.png", "activity-02.png", "activity-03.png", "activity-04.png",
  "poster-10.png", "poster-12.png", "poster-14.png", "poster-15.png", "poster-16.png",
  ...Array.from({ length: 11 }, (_, index) => `following-${String(index + 1).padStart(2, "0")}.png`),
];
const imageUrl = (name: string) => `${imageBase}/${name}`;
const movie = (id: number, title: string, photoUrl: string) => ({ id, title, releaseDate: "2023-01-01", rating: null, photoUrl });
const pageOf = <T,>(content: T[], totalElements = content.length) => ({
  content, number: 0, size: Math.max(content.length, 1), totalElements,
  totalPages: totalElements ? Math.ceil(totalElements / Math.max(content.length, 1)) : 0,
  first: true, last: true,
});

const favorites = ["favorite-01.png", "favorite-02.png", "favorite-03.png", "favorite-04.png"]
  .map((name, index) => movie(981500 + index, `Favorite ${index + 1}`, imageUrl(name)));
const activityMovies = ["activity-01.png", "activity-02.png", "activity-03.png", "activity-04.png"]
  .map((name, index) => movie(981510 + index, `Activity ${index + 1}`, imageUrl(name)));
const followingNames: (string | null)[] = [
  "following-01.png", "following-02.png", null, "following-03.png", "following-04.png", "following-05.png",
  "following-06.png", "following-07.png", "following-08.png", null, "following-09.png", "following-10.png",
  "following-03.png", "following-11.png",
];
const profile = {
  id: profileId, username: "jeremy-b", displayName: "Jeremy B.", avatarUrl: imageUrl("profile-avatar.png"), hq: false,
  location: "Germany", bio: "I watch movies and overthink them. Probably more than I should.",
  stats: { ratings: 834, reviews: 32, watched: 834, watchlist: 32, favorites: 24 }, ratingDistribution: [], socialLinks: [],
  lists: [],
  recentReviews: [
    { id: 981520, movieId: 981530, movieTitle: "The Grand Budapest Hotel", content: "The Grand Budapest Hotel is a beautifully crafted fairytale about memory, loyalty, and the passing of time. Wes Anderson turns a simple story into a vibrant, meticulously designed world where every frame feels intentional. The film balances playful humor with quiet melancholy, reminding us that behind the pastel colors and quirky characters lies a story about loss and the end of an era. Ralph Fiennes delivers a brilliant performance, making Monsieur Gustave both hilarious and deeply human.", rating: 4.5, updatedAt: "2025-12-18T12:00:00Z" },
    { id: 981521, movieId: 981531, movieTitle: "The Dark Knight", content: "Christopher Nolan grounds Gotham in reality, making every decision feel heavy and consequential. Heath Ledger's Joker is unforgettable, a force of pure unpredictability that challenges not just Batman, but the idea of order itself. The film asks uncomfortable questions about justice and sacrifice, and it never offers easy answers. Dark, gripping, and emotionally intense, The Dark Knight proves how powerful the genre can be when taken seriously.", rating: 4, updatedAt: "2025-12-17T12:00:00Z" },
  ],
};
const activity = activityMovies.map((item, index) => ({
  id: 981540 + index, type: "RATING" as const, createdAt: `2025-12-${18 - index}T12:00:00Z`,
  actor: null, movie: { id: item.id, title: item.title }, relatedUser: null, list: null, rating: [3.5, 4, 3.5, 4.5][index],
}));
const following = followingNames.map((name, index) => ({
  id: 981600 + index, username: `following-${index + 1}`, displayName: `Following ${index + 1}`,
  avatarUrl: name ? imageUrl(name) : null,
}));
const listPosterNames = ["poster-10.png", "poster-12.png", "poster-16.png", "poster-14.png", "poster-15.png"];
const publicList = {
  id: 981700, name: "Christopher Nolan Best Films", description: null, ownerId: profileId, ownerUsername: "jeremy-b",
  tags: [], itemCount: 12,
  previewMovies: listPosterNames.map((name, index) => movie(981710 + index, `List film ${index + 1}`, imageUrl(name))),
};

test("READY public-profile mobile overview uses the source artwork in its real rendered slots", async ({ page }) => {
  const imageFiles = new Map(await Promise.all(assetNames.map(async name => [
    name, await readFile(path.resolve(process.cwd(), "tests/e2e/fixtures/public-profile-overview-figma", name)),
  ] as const)));
  await page.route(`${imageBase}/**`, route => {
    const name = new URL(route.request().url()).pathname.slice(1);
    const body = imageFiles.get(name);
    return body ? route.fulfill({ contentType: "image/png", body }) : route.abort();
  });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (pathname === `/api/users/${profileId}/profile`) return route.fulfill({ json: profile });
    if (pathname === `/api/users/${profileId}/collections/favorites`) return route.fulfill({ json: pageOf(favorites, 24) });
    if (pathname === `/api/users/${profileId}/activity`) return route.fulfill({ json: pageOf(activity, 8) });
    if (pathname === `/api/users/${profileId}/following`) return route.fulfill({ json: pageOf(following, 32) });
    if (pathname === `/api/users/${profileId}/followers`) return route.fulfill({ json: pageOf([], 287) });
    if (pathname === `/api/users/${profileId}/lists`) return route.fulfill({ json: pageOf([publicList], 1) });
    if (pathname === `/api/users/${profileId}/liked-reviews`) return route.fulfill({ json: pageOf([]) });
    if (pathname === `/api/users/${profileId}/follow-status`) return route.fulfill({ json: { following: false, followers: 287, followingCount: 32 } });
    if (pathname === `/api/users/${profileId}/block-status`) return route.fulfill({ json: { blocked: false } });
    if (pathname === "/api/users/981530/reviews/981520" || pathname === "/api/reviews/981520") return route.fulfill({ json: { movie: { id: 981530, title: "The Grand Budapest Hotel", photoUrl: imageUrl("activity-01.png") } } });
    if (pathname === "/api/reviews/981521") return route.fulfill({ json: { movie: { id: 981531, title: "The Dark Knight", photoUrl: imageUrl("poster-10.png") } } });
    const movieMatch = pathname.match(/^\/api\/movies\/(98151\d+)\/details$/);
    if (movieMatch) {
      const item = activityMovies.find(candidate => candidate.id === Number(movieMatch[1]));
      return route.fulfill({ json: { ...item, runtime: 120, overview: "Fixture film", genres: [], credits: [] } });
    }
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: pageOf([]) });
  });

  await page.setViewportSize({ width: 393, height: 2355 });
  await page.goto(`/en/users/${profileId}`);
  await expect(page.getByRole("heading", { level: 1, name: "Jeremy B." })).toBeVisible();
  const heroBackground = await page.locator("main section[class*=hero]").evaluate(element => getComputedStyle(element).backgroundImage);
  expect(heroBackground).not.toContain("public-profile-hero-phone.png");
  await expect(page.locator('[class*=mobileToolbar] > span')).toHaveCount(1);
  await expect(page.locator('[class*=mobileToolbar] > span')).not.toContainText("Профіль");
  await expect(page.locator('[class*=mobileBack] img')).toHaveAttribute("src", "/images/public-profile-back.png");
  await expect(page.locator('[class*=mobileMore] img')).toHaveAttribute("src", "/images/public-profile-more.png");
  await expect(page.locator("#public-profile-overview [class*=overviewAction]")).toBeHidden();
  await expect(page.locator("nav[class*=mobileCollectionNavigation]")).toBeHidden();
  await expect(page.locator("main section[class*=hero] [class*=heroMetrics] dt")).toHaveText(["Watched", "Following", "Followers"]);
  await expect(page.locator("main section[class*=hero] [class*=heroMetrics] dd")).toHaveText(["834", "32", "287"]);
  await expect(page.locator("#public-profile-overview [class*=previewGrid] img")).toHaveCount(4);
  await expect(page.locator("#public-profile-activity-content a img")).toHaveCount(4);
  await expect(page.locator('#public-profile-activity-content li > [class*=mobileActivityRating]')).toHaveCount(4);
  await expect(page.locator("#public-profile-activity-content li [class*=activityCaption]")).toHaveCount(4);
  await expect(page.locator("#public-profile-reviews-content img")).toHaveCount(2);
  await expect(page.locator('[data-retry-focus-section="following-preview"] img')).toHaveCount(12);
  await expect(page.locator("#public-profile-lists [role=img] img")).toHaveCount(5);
  const unloaded = await page.locator('main img[src*="profile-figma-fixture.invalid"]').evaluateAll(async images => {
    return Promise.all(images.map(async image => {
      const target = image as HTMLImageElement;
      target.loading = "eager";
      try { await target.decode(); } catch { return target.src; }
      return target.naturalWidth > 0 ? null : target.src;
    })).then(results => results.filter((src): src is string => src !== null));
  });
  expect(unloaded, "every source image used by the overview must load from a local fixture").toEqual([]);
  const geometry = await page.evaluate(() => {
    const rect = (element: Element | null) => element ? element.getBoundingClientRect().top + window.scrollY : null;
    const box = (element: Element | null) => {
      if (!element) return null;
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y: y + window.scrollY, width, height };
    };
    return {
      heroBottom: document.querySelector("main section[class*=hero]")?.getBoundingClientRect().bottom ?? null,
      avatar: box(document.querySelector("main section[class*=hero] img[class*=avatar]")),
      name: box(document.querySelector("main section[class*=hero] h1")),
      locationIcon: box(document.querySelector("main section[class*=hero] img[src*=public-profile-location]")),
      bio: box(document.querySelector("main section[class*=hero] [class*=bio]")),
      metrics: box(document.querySelector("main section[class*=hero] [class*=heroMetrics]")),
      follow: box(document.querySelector("main section[class*=hero] [class*=guestFollowButton]")),
      favoriteHeading: rect(document.querySelector("#public-profile-favorites-title")),
      favoritePosters: rect(document.querySelector("#public-profile-overview [class*=previewGrid]")),
      activityHeading: rect(document.querySelector("#public-profile-activity")),
      activityPosters: rect(document.querySelector("#public-profile-activity-content")),
      reviewHeading: rect(document.querySelector("#public-profile-reviews")),
      reviewCards: Array.from(document.querySelectorAll("#public-profile-reviews-content > li")).map(box),
      followingHeading: rect(document.querySelector("#public-profile-following-preview-title")),
      followingAvatars: rect(document.querySelector('[data-retry-focus-section="following-preview"] ul')),
      listsHeading: rect(document.querySelector("#public-profile-lists-title")),
      listCard: rect(document.querySelector("#public-profile-lists article")),
      navigation: rect(document.querySelector("nav[class*=mobileNav]")),
    };
  });
  expect(Math.abs((geometry.heroBottom ?? 0) - 547)).toBeLessThanOrEqual(1);
  expect(geometry.avatar).toMatchObject({ y: 190, width: 120, height: 120 });
  expect(geometry.name?.y).toBeCloseTo(317, 0);
  expect(geometry.locationIcon?.y).toBeCloseTo(349, 0);
  expect(geometry.bio).toMatchObject({ x: 34, y: 382, width: 325 });
  expect(geometry.metrics?.y).toBeCloseTo(427, 0);
  expect(geometry.follow).toMatchObject({ width: 124, height: 32 });
  expect(geometry.follow?.x).toBeCloseTo(134.5, 0);
  expect(geometry.follow?.y).toBeCloseTo(480, 0);
  expect(Math.abs((geometry.favoriteHeading ?? 0) - 590)).toBeLessThanOrEqual(2);
  expect(Math.abs((geometry.favoritePosters ?? 0) - 630)).toBeLessThanOrEqual(2);
  expect(Math.abs((geometry.activityHeading ?? 0) - 789)).toBeLessThanOrEqual(2);
  expect(Math.abs((geometry.activityPosters ?? 0) - 829)).toBeLessThanOrEqual(2);
  expect(Math.abs((geometry.reviewHeading ?? 0) - 1074)).toBeLessThanOrEqual(3);
  expect(geometry.reviewCards[0]).toMatchObject({ x: 16, y: 1114, width: 361, height: 234 });
  expect(geometry.reviewCards[1]?.y).toBeCloseTo(1360, 0);
  expect(Math.abs((geometry.followingHeading ?? 0) - 1624)).toBeLessThanOrEqual(3);
  expect(Math.abs((geometry.followingAvatars ?? 0) - 1664)).toBeLessThanOrEqual(3);
  expect(Math.abs((geometry.listsHeading ?? 0) - 1747)).toBeLessThanOrEqual(3);
  expect(Math.abs((geometry.listCard ?? 0) - 1787)).toBeLessThanOrEqual(3);
  expect(Math.abs((geometry.navigation ?? 0) - 2263)).toBeLessThanOrEqual(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: path.resolve(process.cwd(), "..", "artifacts/visual-audit-20261126/public-profile-overview/rewind-public-profile-jeremy-en-mobile-393x2355.png") });
  await page.goto(`/uk/users/${profileId}`);
  await expect(page.getByRole("heading", { level: 2, name: "Улюблені фільми" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Остання активність" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Останні огляди" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
});
