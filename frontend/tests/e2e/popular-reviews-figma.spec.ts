import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261124", "popular-reviews-desktop");
const mobileEvidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261124", "popular-reviews-mobile");
mkdirSync(evidenceDir, { recursive: true });
mkdirSync(mobileEvidenceDir, { recursive: true });
const popularReviewPosterUrls = Array.from({ length: 4 }, (_, index) =>
  `https://popular-reviews-fixture.invalid/review-0${index + 1}.png`,
);
const popularReviewerAvatarUrls = Array.from({ length: 14 }, (_, index) =>
  `https://popular-reviews-fixture.invalid/popular-member-${String(index + 1).padStart(2, "0")}.png`,
);

async function mockPopularReviewArtwork(page: import("@playwright/test").Page) {
  const reviewFixtureRoot = path.resolve(process.cwd(), "tests/e2e/fixtures/home-member-ready-figma");
  const reviewerFixtureRoot = path.resolve(process.cwd(), "tests/e2e/fixtures/popular-reviewers-mobile-figma");
  await page.route(/^https:\/\/popular-reviews-fixture\.invalid\//, route => {
    const filename = path.basename(new URL(route.request().url()).pathname);
    const fixtureRoot = filename.startsWith("popular-member-") ? reviewerFixtureRoot : reviewFixtureRoot;
    return route.fulfill({ path: path.join(fixtureRoot, filename), contentType: "image/png" });
  });
}

const reviews = Array.from({ length: 4 }, (_, index) => ({
  id: 982100 + index,
  movieId: 982200 + index,
  movieTitle: ["Superman", "Avatar: Fire and Ash", "The Hunt", "Wake Up Dead Man"][index],
  userId: 982300 + index,
  username: ["CineMindset", "MovieMoon", "ReelRaven", "MoonlitCritic"][index],
  content: [
    "This version of Superman feels more human than mythic. He doubts, listens, and considers the consequences of his presence instead of blindly embracing the symbol he represents. The film leans into emotional sincerity, allowing quiet moments to carry as much weight as the action set pieces, which are clean, purposeful, and never empty noise.",
    "James Cameron is in no hurry. He has spent decades building this world, and the long runtime gives the story room to settle into its strange, vivid landscapes. The scale is immense, but the quiet scenes with the people of Pandora are what make the journey feel personal.",
    "I knew what this film was about, and I knew this was going to be difficult to watch, but nothing could have prepared me for the amount of frustration, anxiety, and just plain sadness I felt watching The Hunt. Mikkelsen's performance is particularly powerful and heartbreaking.",
    "Wake Up Dead Man leans into a darker, more somber tone than previous Knives Out films, trading playful chaos for quiet tension. The mystery unfolds patiently, letting atmosphere and character suspicion do the heavy lifting.",
  ][index],
  rating: 4,
  createdAt: "2026-10-20T12:00:00Z",
  moviePhotoUrl: popularReviewPosterUrls[index] ?? null,
}));

test("popular reviews follows the measured desktop Figma rail and card geometry", async ({ page }) => {
  await mockPopularReviewArtwork(page);
  await page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/users/me") return route.fulfill({ json: { id: 982400, username: "review-reader", role: "USER" } });
    if (url.pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "popular-reviews-csrf" } });
    if (url.pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (url.pathname === "/api/users/popular-reviewers") return route.fulfill({ json: Array.from({ length: 14 }, (_, index) => ({ id: 982500 + index, username: `reviewer-${index}`, displayName: `Reviewer ${index}`, avatarUrl: popularReviewerAvatarUrls[index], likes: 12 })) });
    if (url.pathname === "/api/reviews/popular") return route.fulfill({ json: { content: reviews, totalPages: 89, totalElements: 356, number: 0, size: 4 } });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 0 } });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/reviews");

  const hero = page.locator("main > section").first();
  await expect(hero).toHaveCSS("min-height", "486px");
  const shell = page.locator('main > div[class*="shell"]');
  const shellBox = await shell.boundingBox();
  expect(shellBox?.x).toBeCloseTo(120, 0);
  expect(shellBox?.width).toBe(1200);

  const reviewers = page.getByRole("region", { name: "Popular reviewers" });
  const reviewerBox = await reviewers.boundingBox();
  expect(reviewerBox?.x).toBeCloseTo(120, 0);
  expect(reviewerBox?.y).toBeCloseTo(280, 0);
  expect(reviewerBox?.width).toBe(1200);
  expect(reviewerBox?.height).toBe(180);
  await expect(reviewers.locator('[class*="reviewerRail"] a')).toHaveCount(14);
  const reviewerAvatars = reviewers.locator("a img");
  await expect.poll(() => reviewerAvatars.evaluateAll(images => images.map(image => image.getAttribute("src")))).toEqual(popularReviewerAvatarUrls);
  await expect.poll(() => reviewerAvatars.evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  expect(await reviewers.locator('a[href="/en/users/982500"]').boundingBox()).toMatchObject({ width: 80, height: 80 });

  const reviewsRegion = page.getByRole("region", { name: "Popular reviews" }).last();
  const sortButton = reviewsRegion.locator('button[class*="sortLabel"]');
  await expect(sortButton).toHaveAccessibleName("Sort by Popularity");
  await expect(sortButton).toBeVisible();
  await sortButton.click();
  const sortMenu = page.getByRole("menu", { name: "Sort by" });
  await expect(sortMenu.getByRole("menuitemradio", { name: "Newest" })).toBeVisible();
  const recentRequest = page.waitForRequest(request => new URL(request.url()).pathname === "/api/reviews/recent");
  await sortMenu.getByRole("menuitemradio", { name: "Newest" }).click();
  await recentRequest;
  await sortButton.click();
  const popularRequest = page.waitForRequest(request => new URL(request.url()).pathname === "/api/reviews/popular");
  await page.getByRole("menuitemradio", { name: "Popularity" }).click();
  await popularRequest;
  await expect(sortButton).toHaveAttribute("aria-expanded", "false");
  const reviewsBox = await reviewsRegion.boundingBox();
  expect(reviewsBox?.x).toBeCloseTo(120, 0);
  expect(reviewsBox?.y).toBeCloseTo(634, 0);
  expect(reviewsBox?.width).toBe(1200);
  const cards = reviewsRegion.locator("article");
  await expect(cards).toHaveCount(4);
  const posters = cards.locator('a img');
  await expect.poll(() => posters.evaluateAll(images => images.map(image => image.getAttribute("src")))).toEqual(popularReviewPosterUrls);
  await expect.poll(() => posters.evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(reviewsRegion.locator('[class*="pagination"]')).toBeVisible();
  const cardBox = await cards.first().boundingBox();
  expect(cardBox?.y).toBeCloseTo(733, 0);
  expect(cardBox?.width).toBe(1200);
  expect(cardBox?.height).toBe(315);
  const posterBox = await cards.first().locator("a").first().boundingBox();
  expect(posterBox?.width).toBe(175);
  expect(posterBox?.height).toBe(262);
  const footer = await page.locator("footer").boundingBox();
  const pagination = await reviewsRegion.locator('[class*="pagination"]').boundingBox();
  expect(pagination?.y).toBeCloseTo(2200, 0);
  expect(footer?.y).toBeCloseTo(2396, 0);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(2661);
  console.log("POPULAR_REVIEWS_DESKTOP_GEOMETRY", JSON.stringify({ pagination, footer, pageHeight: await page.evaluate(() => document.documentElement.scrollHeight) }));
  await page.screenshot({ path: path.join(evidenceDir, "rewind-popular-reviews-en-desktop-1440.png"), fullPage: true });
});

test("popular reviews source avatars, phone content, focus and More navigation work in UK and EN", async ({ page }) => {
  await mockPopularReviewArtwork(page);
  await page.route("**/api/users/me", route => route.fulfill({ json: { id: 982400, username: "review-reader", role: "USER" } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "popular-reviews-csrf" } }));
  const reviewerFixtures = Array.from({ length: 14 }, (_, index) => ({ id: 982500 + index, username: `reviewer-${index}`, displayName: `Reviewer ${index}`, avatarUrl: popularReviewerAvatarUrls[index], likes: 12 }));
  await page.route("**/api/users/popular-reviewers**", route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/popular-reviewers/page") {
      const pageNumber = Number(url.searchParams.get("page") ?? 0);
      const size = Number(url.searchParams.get("size") ?? 10);
      return route.fulfill({ json: { content: reviewerFixtures.slice(pageNumber * size, (pageNumber + 1) * size), totalPages: 2, totalElements: reviewerFixtures.length, number: pageNumber, size } });
    }
    return route.fulfill({ json: reviewerFixtures });
  });
  await page.route("**/api/reviews/popular**", route => route.fulfill({ json: { content: reviews, totalPages: 89, totalElements: 356, number: 0, size: 4 } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));

  for (const scenario of [
    { lang: "uk", width: 320, moreName: "Більше Популярні рецензенти", destination: "/uk/community/reviewers", destinationHeading: "Популярні рецензенти" },
    { lang: "en", width: 393, moreName: "More Popular reviewers", destination: "/en/community/reviewers", destinationHeading: "Popular reviewers" },
  ]) {
    await page.setViewportSize({ width: scenario.width, height: 844 });
    await page.goto(`/${scenario.lang}/reviews`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const reviewersGroup = page.getByRole("group", { name: scenario.lang === "uk" ? "Популярні рецензенти" : "Popular reviewers" });
    await expect(reviewersGroup.getByRole("link")).toHaveCount(14);
    const reviewerAvatars = reviewersGroup.locator("a img");
    await expect.poll(() => reviewerAvatars.evaluateAll(images => images.map(image => image.getAttribute("src")))).toEqual(popularReviewerAvatarUrls);
    await expect.poll(() => reviewerAvatars.evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    const reviewsRegion = page.getByRole("region", { name: scenario.lang === "uk" ? "Популярні огляди" : "Popular reviews" }).last();
    const cards = reviewsRegion.locator("article");
    await expect(cards).toHaveCount(4);
    const posters = cards.locator('a img');
    await expect.poll(() => posters.evaluateAll(images => images.map(image => image.getAttribute("src")))).toEqual(popularReviewPosterUrls);
    await expect.poll(() => posters.evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    await expect(cards.first().getByRole("link", { name: /reviewer-0|CineMindset/i })).toBeVisible();
    await expect(cards.first().locator("a img").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(scenario.width);

    if (scenario.width === 393) {
      await page.setViewportSize({ width: 393, height: 1265 });
      const reviewersSection = page.locator("main section[aria-labelledby='popular-reviewers-title']");
      const reviewsRegionAtPhone = page.locator("main section[aria-labelledby='reviews-title']");
      const firstCard = cards.first();
      const lastCard = cards.last();
      const pagination = reviewsRegionAtPhone.locator('[class*="pagination"]');
      const measured = {
        page: await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight })),
        reviewers: await reviewersSection.boundingBox(),
        reviewerHeading: await reviewersSection.locator("h2").boundingBox(),
        avatars: await reviewersGroup.locator("a").first().boundingBox(),
        reviewsHeading: await reviewsRegionAtPhone.locator("h2").boundingBox(),
        firstCard: await firstCard.boundingBox(),
        lastCard: await lastCard.boundingBox(),
        pagination: await pagination.boundingBox(),
        footer: await page.locator("footer").boundingBox(),
        bottomNavigation: await page.locator('header nav[class*="mobileNav"]').boundingBox(),
      };
      expect(measured.page).toEqual({ width: 393, height: 1265 });
      expect(measured.reviewers).toMatchObject({ x: 16, y: 120, width: 361, height: 88 });
      expect(measured.avatars).toMatchObject({ x: 16, y: 168, width: 40, height: 40 });
      expect(measured.reviewerHeading?.y).toBeCloseTo(128, 0);
      expect(measured.reviewsHeading?.y).toBeCloseTo(287, 0);
      expect(measured.firstCard).toMatchObject({ x: 16, y: 327, width: 361, height: 168 });
      expect(measured.lastCard).toMatchObject({ x: 16, y: 903, width: 361, height: 168 });
      expect(measured.pagination).toMatchObject({ x: 16, y: 1106, width: 361, height: 32 });
      expect(measured.bottomNavigation).toMatchObject({ x: 0, y: 1173, width: 393, height: 92 });
      console.log("POPULAR_REVIEWS_MOBILE_GEOMETRY", JSON.stringify(measured));
      await page.screenshot({ path: path.join(mobileEvidenceDir, "rewind-popular-reviews-en-phone-393x1265.png"), fullPage: true });
    }

    const more = page.getByRole("link", { name: scenario.moreName, exact: true });
    await more.focus();
    await expect(more).toBeFocused();
    await expect(more).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(scenario.destination);
    await expect(page.getByRole("heading", { level: 1, name: scenario.destinationHeading })).toBeVisible();
  }
});
