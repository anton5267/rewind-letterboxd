import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const makeFilmPage = () => ({
  content: Array.from({ length: 6 }, (_, index) => ({
    id: 88001 + index,
    title: `Design fixture film ${index + 1}`,
    releaseDate: "2024-02-29",
    rating: 4.7,
    photoUrl: null,
  })),
  totalPages: 1,
  totalElements: 6,
  number: 0,
  size: 6,
});

const makeReviews = (count: number) => ({
  content: Array.from({ length: count }, (_, index) => ({
    id: 88101 + index,
    movieId: 88201 + index,
    movieTitle: `Design review film ${index + 1}`,
    userId: 88301 + index,
    username: `reviewer-${index + 1}`,
    content: "A short fixture review for matched responsive geometry.",
    rating: 4,
    createdAt: "2026-10-18T12:30:00Z",
    moviePhotoUrl: null,
    userAvatarUrl: null,
  })),
  totalPages: 1,
  totalElements: count,
  number: 0,
  size: count,
});

const near = (actual: number | undefined, expected: number) => {
  expect(actual).toBeDefined();
  expect(Math.abs(actual! - expected)).toBeLessThan(1.1);
};

test("Films Discovery matches current desktop and phone READY anchors", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "films-discovery-layout" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/movies/search**", route => route.fulfill({ json: makeFilmPage() }));
  await page.route("**/api/genres", route => route.fulfill({ json: [{ id: 2, name: "Science Fiction" }] }));
  await page.route("**/api/reviews/recent**", route => route.fulfill({ json: makeReviews(8) }));
  await page.route("**/api/reviews/popular**", route => route.fulfill({ json: makeReviews(4) }));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/uk/films/discover");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  const headings = {
    popular: page.getByRole("heading", { level: 2, name: "Популярні фільми" }),
    recent: page.getByRole("heading", { level: 2, name: "Щойно переглянули…" }),
    reviews: page.getByRole("heading", { level: 2, name: "Популярні огляди цього тижня" }),
    crew: page.getByRole("heading", { level: 2, name: "Вибір команди" }),
  };
  await expect(page.locator('main header select[aria-label="Жанр"]')).toBeEnabled();

  const popularSection = headings.popular.locator("xpath=ancestor::section[1]");
  const recentSection = headings.recent.locator("xpath=ancestor::section[1]");
  const reviewsSection = headings.reviews.locator("xpath=ancestor::section[1]");
  const crewSection = headings.crew.locator("xpath=ancestor::section[1]");
  near((await headings.popular.boundingBox())?.y, 432);
  near((await popularSection.locator("ol > li a").first().boundingBox())?.y, 514);
  near((await recentSection.boundingBox())?.y, 944);
  near((await headings.recent.boundingBox())?.y, 962);
  near((await recentSection.locator('a[class*="railPoster"]').first().boundingBox())?.y, 1044);
  near((await reviewsSection.boundingBox())?.y, 1309);
  near((await headings.reviews.boundingBox())?.y, 1327);
  near((await reviewsSection.locator("article").first().boundingBox())?.y, 1409);
  near((await crewSection.boundingBox())?.y, 2017);
  near((await headings.crew.boundingBox())?.y, 2035);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261102/films-discovery-platform-emulation");
  await mkdir(captureDirectory, { recursive: true });
  const platform = testInfo.project.name.includes("iOS") ? "ios-webkit" : testInfo.project.name.includes("Android") ? "android-chromium" : "desktop-chromium";
  await page.screenshot({ path: resolve(captureDirectory, `${platform}-uk-desktop-1440.png`), fullPage: true });

  await page.setViewportSize({ width: 393, height: 1235 });
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  near((await popularSection.locator("ol > li a").first().boundingBox())?.y, 168);
  near((await recentSection.boundingBox())?.y, 388);
  near((await recentSection.locator('a[class*="railPoster"]').first().boundingBox())?.y, 436);
  near((await reviewsSection.boundingBox())?.y, 587);
  near((await reviewsSection.locator("article").nth(0).boundingBox())?.y, 635);
  near((await reviewsSection.locator("article").nth(1).boundingBox())?.y, 784);
  near((await crewSection.boundingBox())?.y, 944);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: resolve(captureDirectory, `${platform}-uk-phone-393.png`), fullPage: true });

  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  for (const width of [320, 600, 720, 768, 1024]) {
    await page.setViewportSize({ width, height: 852 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
  expect(pageErrors).toEqual([]);
});
