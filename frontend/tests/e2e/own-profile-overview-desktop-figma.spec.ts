import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

const owner = { id: 99400, username: "emma-cerys", displayName: "Emma Cerys", role: "USER", email: "emma@example.invalid" };
const poster = (id: number, title: string, artwork: string) => ({ id, title, releaseDate: "2023-01-01", rating: 4, photoUrl: `https://profile-fixture.invalid/${artwork}` });
const favorites = [
  poster(99401, "Babylon", "favorite-babylon.png"), poster(99402, "The Holiday", "favorite-holiday.png"), poster(99403, "Whiplash", "favorite-whiplash.png"), poster(99404, "Dead Again", "favorite-dead-again.png"),
];
const reviews = [
  { reviewId: 99421, movieId: 99401, movieTitle: "Avatar: Fire and Ash", moviePhotoUrl: "https://profile-fixture.invalid/activity-avatar-fire-and-ash.png", content: "James Cameron is in no hurry. This guy has been working on Avatar in some shape or form since at least 1994, and the two Avatar sequels for the last 16 years. Compared to all of that, Avatar: Fire and Ash’s 197-minute runtime is like a drop in the ocean where Payakan (The Mighty Tulkun) roams. If spending three hours and 15 minutes in a theater intimidates you, stay home and look at social media on your phone.", updatedAt: "2025-12-18T12:00:00Z", rating: 4 },
  { reviewId: 99422, movieId: 99402, movieTitle: "The Hunt", moviePhotoUrl: "https://profile-fixture.invalid/activity-the-hunt.png", content: "Look, I KNEW what this film was about, I knew this was going to be difficult to watch, but nothing could have prepared me for the amount of frustration, anxiety, and just plain sadness I felt watching The Hunt. Mikkelsen’s performance is particularly powerful and heartbreaking, even though everyone in this film is great. But yea, I'm pretty much emotionally exhausted now.", updatedAt: "2025-12-10T12:00:00Z", rating: 5 },
];
const profile = {
  ...owner, avatarUrl: "https://profile-fixture.invalid/profile-avatar.png", bannerUrl: null, bio: "Obsessed with great directing, bold storytelling, and films that stick with you long after the credits roll.", location: "USA", supabaseLinked: false,
  stats: { ratings: 834, reviews: 17, watched: 834, watchlist: 32, favorites: 24 },
  lists: [{ id: 99431, name: "The Cillian Murphy Correction", listType: "CUSTOM", isPublic: true }], recentRatings: [], recentReviews: reviews,
};
const activityTitles = ["Avatar: Fire and Ash", "The Hunt", "Crazy Stupid Love", "The Smashing Machine"];
const activityArtwork = ["activity-avatar-fire-and-ash.png", "activity-the-hunt.png", "activity-crazy-stupid-love.png", "activity-smashing-machine.png"];
const activities = favorites.map((movie, index) => ({
  id: 99450 + index, type: "RATING" as const, createdAt: `2026-11-${20 - index}T12:00:00Z`, actor: null,
  movie: { id: movie.id, title: activityTitles[index] }, relatedUser: null, list: null, rating: [4, 5, 3.5, 4][index],
}));
const followingArtwork = [null, "following-02.png", "following-03.png", "following-04.png", "following-05.png", "following-06.png", "following-07.png", "following-08.png", "following-09.png", null, "following-11.png", "following-12.png", "following-13.png", "following-14.png"];
const following = followingArtwork.map((artwork, index) => ({ id: 99500 + index, username: `film-reader-${index + 1}`, displayName: `Film Reader ${index + 1}`, avatarUrl: artwork ? `https://profile-fixture.invalid/${artwork}` : null }));
const listArtwork = ["list-film-05.png", "list-film-01.png", "list-film-02.png", "list-film-03.png", "list-film-04.png"];
const imageFiles = ["profile-avatar.png", ...favorites.map(movie => movie.photoUrl.split("/").at(-1)!), ...activityArtwork, ...followingArtwork.filter((artwork): artwork is string => artwork !== null), ...listArtwork];
const pageOf = <T,>(content: T[], totalElements = content.length, size = content.length) => ({ content, number: 0, size, totalElements, totalPages: totalElements ? Math.ceil(totalElements / size) : 0 });

async function setupOverviewFixture(context: Parameters<typeof installHostedAuthFixture>[0], page: import("@playwright/test").Page) {
  await installHostedAuthFixture(context);
  const fixtures = new Map(await Promise.all(imageFiles.map(async name => [name, await readFile(new URL(`./fixtures/own-profile-overview-figma/${name}`, import.meta.url))] as const)));
  await page.route("https://profile-fixture.invalid/**", route => {
    const name = new URL(route.request().url()).pathname.slice(1);
    const body = fixtures.get(name);
    return body ? route.fulfill({ contentType: "image/png", body }) : route.abort();
  });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: owner });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 204 });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/profile/me/social-links") return route.fulfill({ json: [{ platform: "x", url: "https://x.com/emma-cerys" }] });
    if (pathname === "/api/profile/me/favorites") return route.fulfill({ json: pageOf(favorites, 24, 24) });
    if (pathname === `/api/users/${owner.id}/activity`) return route.fulfill({ json: pageOf(activities) });
    if (pathname === `/api/users/${owner.id}/following`) return route.fulfill({ json: pageOf(following, 32, 16) });
    if (pathname === `/api/users/${owner.id}/followers`) return route.fulfill({ json: pageOf([], 287, 16) });
    if (pathname === "/api/lists/my") return route.fulfill({ json: [{ ...profile.lists[0], description: "Tom Cruise holds my Most Watched Actor spot for 2025, and I refuse to allow that. I need to watch FIVE more Cillian Murphy films before the end of the year to get him back to the top. Rewatches allowed, don’t really care where he is on the billing order as long as it’s an obvious role." }] });
    if (pathname === `/api/lists/${profile.lists[0].id}/items`) return route.fulfill({ json: Array.from({ length: 11 }, (_, index) => ({ id: 99550 + index, position: index + 1, movie: { ...favorites[index % favorites.length], id: 99600 + index, title: `Cillian film ${index + 1}`, photoUrl: `https://profile-fixture.invalid/${listArtwork[index % listArtwork.length]}` } })) });
    const movieMatch = pathname.match(/^\/api\/movies\/(\d+)\/details$/);
    if (movieMatch) {
      const movieIndex = favorites.findIndex(item => item.id === Number(movieMatch[1]));
      const movie = favorites[movieIndex];
      return route.fulfill({ json: { ...movie, photoUrl: `https://profile-fixture.invalid/${activityArtwork[movieIndex]}`, runtime: 120, overview: "Fixture film details", genres: [], credits: [] } });
    }
    if (/^\/api\/movies\/\d+\/rating\/me$/.test(pathname)) return route.fulfill({ json: { rating: pathname.includes("99401") ? 4.5 : 5 } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (/^\/api\/users\/\d+\/follow-status$/.test(pathname)) return route.fulfill({ json: { following: true, followers: 12, followingCount: 9 } });
    return route.fulfill({ json: { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 } });
  });
}

test("READY own-profile Overview matches the desktop Figma section anchors", async ({ context, page }) => {
  await setupOverviewFixture(context, page);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await signInHostedFixture(page, "en");
  await page.goto("/en/profile");
  for (const selector of ["#profile-overview", "#profile-activity", "#profile-lists"]) await expect(page.locator(selector)).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("#profile-activity [aria-busy='true']")).toHaveCount(0);
  await expect(page.locator("#profile-activity [data-retry-button]")).toHaveCount(0);
  await expect(page.locator("#profile-lists [data-profile-list-id]")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("#profile-overview [class*='overviewPosterGrid'] > li")).toHaveCount(4);
  await expect(page.locator("main section[class*='hero'] [class*='heroMetrics'] dt")).toHaveText(["Films", "Following", "Followers"]);
  await expect(page.locator("main section[class*='hero'] [class*='heroMetrics'] dd")).toHaveText(["834", "32", "287"]);
  await expect(page.locator("#profile-activity [class*='overviewPosterGrid'] > li")).toHaveCount(4);
  await expect(page.locator("#profile-activity [aria-busy='true']")).toHaveCount(0);
  await expect.poll(() => page.locator("#profile-activity a img").evaluateAll(images => images.length === 4 && images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(page.locator("#profile-activity [role='img'][aria-label$='/ 5']")).toHaveCount(4);
  await expect(page.locator("#profile-activity [class*='previewAll']")).toHaveText("All");
  await expect(page.locator("#profile-review-preview ul > li")).toHaveCount(2);
  await expect(page.locator("#profile-review-preview [data-profile-review-title='99401']")).toHaveText("Avatar: Fire and Ash");
  await expect(page.locator("#profile-review-preview [data-profile-review-title='99402']")).toHaveText("The Hunt");
  await expect(page.locator("#profile-review-preview")).toContainText("★ 4.5");
  await expect(page.locator("#profile-review-preview")).toContainText("★ 5.0");
  await expect(page.locator("#profile-activity-preview a[aria-label='Avatar: Fire and Ash']")).toHaveCount(1);
  await expect(page.locator("#profile-activity-preview a[aria-label='The Smashing Machine']")).toHaveCount(1);
  await expect(page.locator("#profile-following-preview ul > li")).toHaveCount(14);
  await expect(page.locator('main nav a[href="https://x.com/emma-cerys"]')).toHaveAttribute("aria-label", "X");
  await expect(page.locator("#profile-lists")).toContainText("11 films");
  for (const section of ["#profile-review-preview", "#profile-following-preview", "#profile-lists"]) await expect(page.locator(`${section} [class*='previewAll']`)).toHaveText("All");

  const geometry = await page.evaluate(() => {
    const rect = (element: Element | null) => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { x: Math.round(box.x * 10) / 10, y: Math.round((box.y + window.scrollY) * 10) / 10, width: Math.round(box.width * 10) / 10, height: Math.round(box.height * 10) / 10 };
    };
    const get = (selector: string) => document.querySelector(selector);
    return {
      header: rect(get("header")), hero: rect(get("main[class*='page'] > div[class*='content'] > section[class*='hero']")), profileNav: rect(get("nav[class*='profileNav']")), main: rect(get("main[class*='page']")), content: rect(get("main[class*='page'] > div[class*='content']")),
      favoritesHeading: rect(get("#profile-favorite-preview-title")), favoritePosters: rect(get("#profile-overview [class*='overviewPosterGrid']")),
      activityHeading: rect(get("#profile-activity-title")), activityPosters: rect(get("#profile-activity [class*='overviewPosterGrid']")),
      reviewsHeading: rect(get("#profile-review-preview-title")), reviewCards: Array.from(document.querySelectorAll("#profile-review-preview ul > li")).map(rect),
      followingHeading: rect(get("#profile-following-preview-title")), followingAvatars: rect(get("#profile-following-preview ul")), followingFirstAvatar: rect(get("#profile-following-preview ul > li")),
      listsHeading: rect(get("#profile-lists-title")), listCard: rect(get("#profile-lists [data-profile-list-id]")), footer: rect(get("footer")), documentHeight: document.documentElement.scrollHeight,
      statistics: rect(get("#profile-statistics")),
      activityAll: rect(get("#profile-activity [class*='previewAll']")), reviewsAll: rect(get("#profile-review-preview [class*='previewAll']")), followingAll: rect(get("#profile-following-preview [class*='previewAll']")), listsAll: rect(get("#profile-lists [class*='previewAll']")),
      heroChildren: Array.from(document.querySelector("main[class*='page'] section[class*='hero']")?.children ?? []).map(rect),
    };
  });
  console.log("OWN_PROFILE_OVERVIEW_FIGMA_GEOMETRY", JSON.stringify(geometry));
  const expectY = (actual: { y: number } | null, expected: number, label: string) => {
    expect(actual, `${label} must exist`).not.toBeNull();
    expect(Math.abs(actual!.y - expected), `${label} Figma y-position`).toBeLessThanOrEqual(3);
  };
  expect(Math.abs((geometry.hero?.height ?? 0) - 1020), "profile hero height").toBeLessThanOrEqual(1);
  expectY(geometry.profileNav, 1105, "profile navigation");
  expectY(geometry.favoritesHeading, 1287, "Favorite Films heading");
  expectY(geometry.favoritePosters, 1373, "favorite posters");
  expectY(geometry.activityHeading, 1871, "Recent Activity heading");
  expectY(geometry.activityPosters, 1957, "activity posters");
  expectY(geometry.activityAll, 1871, "Recent Activity All action");
  expectY(geometry.reviewsHeading, 2497, "Recent Reviews heading");
  expectY(geometry.reviewsAll, 2497, "Recent Reviews All action");
  expectY(geometry.reviewCards[0] ?? null, 2579, "first review card");
  expectY(geometry.reviewCards[1] ?? null, 2930, "second review card");
  for (const card of geometry.reviewCards) expect(Math.abs(card.height - 315), "review card height").toBeLessThanOrEqual(1);
  expectY(geometry.followingHeading, 3348, "Following heading");
  expectY(geometry.followingAll, 3348, "Following All action");
  expectY(geometry.followingFirstAvatar, 3430, "first following avatar");
  expectY(geometry.listsHeading, 3613, "Lists heading");
  expectY(geometry.listsAll, 3610, "Lists All action");
  expectY(geometry.listCard, 3695, "list card");
  expectY(geometry.footer, 4194, "footer");
  expect(Math.abs(geometry.documentHeight - 4459), "document height").toBeLessThanOrEqual(2);
  expect(geometry.statistics?.width).toBe(0);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-own-overview-en-desktop-1440.png", fullPage: true });
});

test("READY own-profile Overview matches the mobile Figma section anchors", async ({ context, page }) => {
  await setupOverviewFixture(context, page);
  await page.setViewportSize({ width: 393, height: 2319 });
  await signInHostedFixture(page, "en");
  await page.goto("/en/profile");
  for (const selector of ["#profile-overview", "#profile-activity", "#profile-lists"]) await expect(page.locator(selector)).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("#profile-overview [class*='overviewPosterGrid'] > li")).toHaveCount(4);
  await expect(page.locator("main section[class*='hero'] [class*='heroMetrics'] dt")).toHaveText(["Films", "Following", "Followers"]);
  await expect(page.locator("main section[class*='hero'] [class*='heroMetrics'] dd")).toHaveText(["834", "32", "287"]);
  await expect(page.locator("#profile-activity [class*='overviewPosterGrid'] > li")).toHaveCount(4);
  await expect(page.locator("#profile-activity [aria-busy='true']")).toHaveCount(0);
  await expect.poll(() => page.locator("#profile-activity a img").evaluateAll(images => images.length === 4 && images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(page.locator("#profile-review-preview ul > li")).toHaveCount(2);
  await expect(page.locator("#profile-following-preview ul > li")).toHaveCount(14);
  await expect(page.locator("#profile-lists [data-profile-list-id]")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("#profile-lists [data-profile-list-posters] img")).toHaveCount(5);
  await expect.poll(() => page.locator("#profile-lists [data-profile-list-posters] img").evaluateAll(images => images.length === 5 && images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(page.locator("#profile-lists [data-profile-list-posters] img").evaluateAll(images => images.map(image => new URL((image as HTMLImageElement).src).pathname.split("/").at(-1)))).resolves.toEqual(listArtwork);
  await expect(page.locator("#profile-following-preview li:first-child [class*='followingInitial']")).toBeVisible();

  const geometry = await page.evaluate(() => {
    const rect = (element: Element | null) => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { x: Math.round(box.x * 10) / 10, y: Math.round((box.y + window.scrollY) * 10) / 10, width: Math.round(box.width * 10) / 10, height: Math.round(box.height * 10) / 10 };
    };
    const get = (selector: string) => document.querySelector(selector);
    return {
      hero: rect(get("main[class*='page'] > div[class*='content'] > section[class*='hero']")),
      profileNav: rect(get("nav[class*='profileNav']")),
      favoritesHeading: rect(get("#profile-favorite-preview-title")),
      favoritePosters: rect(get("#profile-overview [class*='overviewPosterGrid']")),
      activityHeading: rect(get("#profile-activity-title")),
      activityPosters: rect(get("#profile-activity [class*='overviewPosterGrid']")),
      activityAll: rect(get("#profile-activity [class*='previewAll']")),
      reviewsHeading: rect(get("#profile-review-preview-title")),
      reviewCards: Array.from(document.querySelectorAll("#profile-review-preview ul > li")).map(rect),
      followingHeading: rect(get("#profile-following-preview-title")),
      followingFirstAvatar: rect(get("#profile-following-preview ul > li")),
      listsHeading: rect(get("#profile-lists-title")),
      listCard: rect(get("#profile-lists [data-profile-list-id]")),
      navigation: rect(get("nav[class*='mobileNav']")),
      documentHeight: document.documentElement.scrollHeight,
      documentWidth: document.documentElement.scrollWidth,
    };
  });
  const expectY = (actual: { y: number } | null, expected: number, label: string) => {
    expect(actual, `${label} must exist`).not.toBeNull();
    expect(Math.abs(actual!.y - expected), `${label} Figma y-position`).toBeLessThanOrEqual(3);
  };
  expectY(geometry.profileNav, 531, "profile navigation");
  expectY(geometry.favoritesHeading, 606, "Favorite Films heading");
  expectY(geometry.favoritePosters, 646, "favorite posters");
  expectY(geometry.activityHeading, 805, "Recent Activity heading");
  expectY(geometry.activityPosters, 845, "activity posters");
  expectY(geometry.activityAll, 1016, "Recent Activity All action");
  expectY(geometry.reviewsHeading, 1091, "Recent Reviews heading");
  expectY(geometry.reviewCards[0] ?? null, 1130, "first review card");
  expectY(geometry.followingHeading, 1588, "Following heading");
  expectY(geometry.followingFirstAvatar, 1628, "first following avatar");
  expectY(geometry.listsHeading, 1711, "Lists heading");
  expectY(geometry.listCard, 1750, "list card");
  expectY(geometry.navigation, 2227, "fixed mobile navigation");
  expect(geometry.navigation?.height).toBe(92);
  expect(geometry.documentWidth).toBe(393);
  expect(geometry.documentHeight).toBeGreaterThanOrEqual(2319);
  await page.screenshot({ path: "../artifacts/visual-audit-20261125/profile/rewind-own-overview-en-mobile-393x2319.png" });
});

test("own-profile Overview keeps its mobile layout and localizes in Ukrainian", async ({ context, page }) => {
  await setupOverviewFixture(context, page);
  await page.setViewportSize({ width: 393, height: 2319 });
  await signInHostedFixture(page, "uk");
  await page.goto("/uk/profile");
  for (const selector of ["#profile-overview", "#profile-activity", "#profile-lists"]) await expect(page.locator(selector)).toHaveAttribute("aria-busy", "false");

  const watchedTab = page.locator('nav[class*="profileNav"] a[data-collection-kind="watched"]');
  await expect(watchedTab).toBeVisible();
  await expect(watchedTab.locator("[data-mobile-label]")).toHaveText("Переглянуто");
  await expect(page.locator('nav[class*="profileNav"] a[data-collection-kind="watchlist"]')).toBeHidden();

  await expect(page.locator("main section[class*='hero'] [class*='heroMetrics'] dt")).toHaveText(["Фільми", "Підписки", "Підписники"]);
  await expect(page.locator("#profile-favorite-preview-title")).toHaveText("Улюблені фільми");
  await expect(page.locator("#profile-activity-title")).toHaveText("Остання активність");
  await expect(page.locator("#profile-review-preview-title")).toHaveText("Останні огляди");
  await expect(page.locator("#profile-following-preview-title")).toHaveText("Підписки");
  await expect(page.locator("#profile-lists-title")).toHaveText("Списки");
  await expect(page.locator('main nav a[href="https://x.com/emma-cerys"]')).toHaveAttribute("aria-label", "X");
  await expect(page.locator("#profile-activity [class*='overviewPosterGrid'] > li")).toHaveCount(4);
  await expect(page.locator("#profile-review-preview ul > li")).toHaveCount(2);
  await expect(page.locator("#profile-lists [data-profile-list-posters] img")).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: "../artifacts/visual-audit-20261126/profile/rewind-own-overview-uk-mobile-393x2319.png" });
});
