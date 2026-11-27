import { expect, test } from "@playwright/test";

const users = (count: number, prefix: string) => Array.from({ length: count }, (_, index) => ({
  id: 73000 + index,
  username: `${prefix}-${index + 1}`,
  displayName: `${prefix} ${index + 1}`,
  avatarUrl: `https://images.example.invalid/${prefix}-${index + 1}.png`,
  watchedCount: 100 + index,
  reviewCount: 20 + index,
  listCount: 3 + index,
  likes: 50 + index,
  followerCount: 12 + index,
  followingCount: 8 + index,
  favoriteMovies: Array.from({ length: 4 }, (_, filmIndex) => ({
    id: filmIndex + 1,
    title: `Film ${filmIndex + 1}`,
    photoUrl: `https://images.example.invalid/${prefix}-${index + 1}-film-${filmIndex + 1}.png`,
    rating: null,
    releaseDate: null,
  })),
}));

const hq = users(5, "featured");
const reviewers = users(5, "popular");
const directoryUsers = users(16, "member");
const extraDirectoryUsers = users(4, "member-extra");
const extraMobileDirectoryUsers = users(6, "mobile-extra");

test("READY desktop members directory matches the Figma frame composition", async ({ context, page }) => {
  await context.route("https://images.example.invalid/**", route => route.fulfill({
    contentType: "image/png",
    body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aAZkAAAAASUVORK5CYII=", "base64"),
  }));
  await context.route(url => url.pathname.startsWith("/api/"), route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/users/hq") return route.fulfill({ json: { content: hq, totalPages: 1, totalElements: 5, number: 0 } });
    if (url.pathname === "/api/users/popular-reviewers") return route.fulfill({ json: reviewers });
    if (url.pathname === "/api/users/directory") {
      const page = Number(url.searchParams.get("page") ?? 0);
      return route.fulfill({ json: { content: page === 0 ? directoryUsers : extraDirectoryUsers, totalPages: 2, totalElements: 20, number: page } });
    }
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0 } });
  });

  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/en/community");
  await expect(page.locator("[data-community-section='hq'] [data-network-member-id]")).toHaveCount(5);
  await expect(page.locator("[data-community-section='reviewers'] [data-network-member-id]")).toHaveCount(5);
  const directory = page.locator("[data-community-section='directory']");
  await expect(directory.locator("[data-network-member-id]")).toHaveCount(16);
  await expect(directory.getByRole("button", { name: "View More" })).toBeVisible();

  const box = async (selector: string) => page.locator(selector).boundingBox();
  const banner = await box("main section[class*='hero'] > p");
  const hqHeading = await box("#community-hq");
  const firstFeatured = await page.locator("[data-community-section='hq'] [data-network-member-id]").first().boundingBox();
  const reviewerHeading = await box("#community-reviewers");
  const firstReviewer = await page.locator("[data-community-section='reviewers'] [data-network-member-id]").first().boundingBox();
  const firstDirectoryUser = await page.locator("[data-community-section='directory'] [data-network-member-id]").first().boundingBox();
  const footer = await box("footer");
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log("community-ready-desktop", { banner, hqHeading, firstFeatured, reviewerHeading, firstReviewer, firstDirectoryUser, footer, pageHeight });
  expect(banner?.x).toBeCloseTo(120, 0);
  expect(banner?.y).toBeCloseTo(316, 0);
  expect(banner?.width).toBe(1200);
  expect(banner?.height).toBe(260);
  expect(firstFeatured?.x).toBeCloseTo(120, 0);
  expect(firstFeatured?.width).toBe(194);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/community/rewind-members-en-desktop-1440x4201.png", fullPage: true });
  await directory.locator("[data-network-member-id]").first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/community/rewind-members-en-directory-check-1440.png" });
});

test("READY mobile members directory matches the Figma frame composition", async ({ context, page }) => {
  await context.route("https://images.example.invalid/**", route => route.fulfill({
    contentType: "image/png",
    body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aAZkAAAAASUVORK5CYII=", "base64"),
  }));
  await context.route(url => url.pathname.startsWith("/api/"), route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/users/hq") return route.fulfill({ json: { content: hq, totalPages: 1, totalElements: 5, number: 0 } });
    if (url.pathname === "/api/users/popular-reviewers") return route.fulfill({ json: reviewers });
    if (url.pathname === "/api/users/directory") {
      const page = Number(url.searchParams.get("page") ?? 0);
      return route.fulfill({ json: { content: page === 0 ? directoryUsers.slice(0, 14) : extraMobileDirectoryUsers, totalPages: 2, totalElements: 20, number: page } });
    }
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0 } });
  });
  await page.setViewportSize({ width: 393, height: 1796 });
  await page.goto("/en/community");
  await expect(page.locator("[data-community-section='hq'] [data-network-member-id]")).toHaveCount(5);
  await expect(page.locator("[data-community-section='reviewers'] [data-network-member-id]")).toHaveCount(5);
  const directory = page.locator("[data-community-section='directory']");
  await expect(directory.locator("[data-network-member-id]")).toHaveCount(14);
  await expect(directory.getByRole("button", { name: "View More" })).toBeVisible();
  const box = async (selector: string) => page.locator(selector).boundingBox();
  const hqHeading = await box("#community-hq");
  const firstFeatured = await page.locator("[data-community-section='hq'] [data-network-member-id]").first().boundingBox();
  const reviewerHeading = await box("#community-reviewers");
  const firstReviewer = await page.locator("[data-community-section='reviewers'] [data-network-member-id]").first().boundingBox();
  const firstDirectoryUser = await page.locator("[data-community-section='directory'] [data-network-member-id]").first().boundingBox();
  const viewMore = await directory.getByRole("button", { name: "View More" }).boundingBox();
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const navBoxes = await page.locator("nav").evaluateAll(items => items.map(item => { const { x, y, width, height } = item.getBoundingClientRect(); return { x, y, width, height }; }));
  console.log("community-ready-mobile", { hqHeading, firstFeatured, reviewerHeading, firstReviewer, firstDirectoryUser, viewMore, pageHeight, navBoxes, scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth) });
  expect(hqHeading?.y).toBeCloseTo(242, 0);
  expect(firstFeatured?.y).toBeCloseTo(282, 0);
  expect(reviewerHeading?.y).toBeCloseTo(499, 0);
  expect(firstReviewer?.y).toBeCloseTo(539, 0);
  expect(firstDirectoryUser?.y).toBeCloseTo(790, 0);
  expect(viewMore?.y).toBeCloseTo(1643, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/community/rewind-members-en-mobile-393x1796.png", fullPage: false });
  await directory.getByRole("button", { name: "View More" }).click();
  await expect(directory.locator("[data-network-member-id]")).toHaveCount(20);
});
