import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("Admin dashboard Figma review uses only API-backed profile metrics", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 44010, username: "Lola James", role: "ADMIN", displayName: "Lola James",
    email: "lola@example.invalid", avatarUrl: null, isActive: true, isHq: false,
  } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "admin-dashboard-review" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/admin/dashboard", route => route.fulfill({ json: { users: 31, activeUsers: 22, hqUsers: 4, movies: 245, reviews: 34, hiddenReviews: 2 } }));
  await page.route("**/api/admin/users/44010/overview", route => route.fulfill({ json: {
    stats: { watched: 245, reviews: 34, ratings: 51, watchlist: 28, favorites: 7, comments: 11, likesReceived: 16, followers: 12, customLists: 12 },
    adminHistory: [],
  } }));
  await page.route("**/api/users/44010/profile", route => route.fulfill({ json: {
    id: 44010, username: "lola-james", displayName: "Lola James", avatarUrl: null, hq: false,
    stats: { ratings: 51, reviews: 34, watched: 245, watchlist: 28, favorites: 7 },
    ratingDistribution: [{ rating: 8, count: 20 }, { rating: 9, count: 10 }], socialLinks: [], lists: [], recentReviews: [],
  } }));

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en/admin");
  await expect(page.getByRole("heading", { name: "Workspace" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => ["header", "main", "footer"].map(selector => {
    const element = document.querySelector(selector);
    return element ? getComputedStyle(element).fontFamily.split(",")[0].replace(/[\"']/g, "").trim() : "missing";
  }))).toEqual(["Inter", "Inter", "Inter"]);
  const personal = page.getByRole("region", { name: "Key Metrics" });
  await expect(personal.getByRole("heading", { name: "Key Metrics" })).toBeVisible();
  await expect(personal.locator("div[class*='card']")).toHaveCount(9);
  await expect(personal.getByText("245", { exact: true })).toBeVisible();
  await expect(personal.getByText("34", { exact: true })).toBeVisible();
  await expect(personal.getByText("28", { exact: true })).toBeVisible();
  await expect(personal.getByRole("heading", { name: "Favorite films" })).toBeVisible();
  await expect(personal.getByText("7", { exact: true })).toBeVisible();
  await expect(personal.getByText("Unavailable", { exact: true })).toHaveCount(2);
  await expect(personal.getByRole("img", { name: "Ratings distribution from 1 to 10" }).locator("[class*='bar']")).toHaveCount(10);
  const platformDisclosure = page.locator("details").filter({ hasText: "Platform statistics" });
  await expect(platformDisclosure).toBeVisible();
  await expect(platformDisclosure.locator("summary")).toBeVisible();
  expect(await platformDisclosure.evaluate(details => details.open)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  const gridBox = await personal.locator("div[class*='grid']").boundingBox();
  const footerBox = await page.locator("footer").boundingBox();
  expect(Math.abs((await page.getByRole("heading", { name: "Workspace" }).boundingBox())?.y! - 390)).toBeLessThanOrEqual(5);
  expect(Math.abs((await personal.getByRole("heading", { name: "Key Metrics" }).boundingBox())?.y! - 440)).toBeLessThanOrEqual(5);
  expect(Math.abs((gridBox?.x ?? 0) - 148.5)).toBeLessThanOrEqual(1);
  expect(Math.abs((gridBox?.y ?? 0) - 500)).toBeLessThanOrEqual(5);
  expect(Math.abs((gridBox?.width ?? 0) - 1143)).toBeLessThanOrEqual(1);
  expect(Math.abs((gridBox?.height ?? 0) - 753)).toBeLessThanOrEqual(4);
  expect(Math.abs((footerBox?.y ?? 0) - 1340)).toBeLessThanOrEqual(8);
  expect(Math.abs(await page.evaluate(() => document.documentElement.scrollHeight) - 1605)).toBeLessThanOrEqual(8);

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261125/admin-dashboard");
  await mkdir(captureDirectory, { recursive: true });
  await page.screenshot({ path: resolve(captureDirectory, "admin-dashboard-en-desktop-1440.png"), fullPage: true });
  await platformDisclosure.locator("summary").click();
  await expect(page.getByRole("region", { name: "Platform statistics" })).toBeVisible();
  await expect(page.getByText("31", { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/uk/admin");
  await expect.poll(() => page.evaluate(() => ["header", "main", "footer"].map(selector => {
    const element = document.querySelector(selector);
    return element ? getComputedStyle(element).fontFamily.split(",")[0].replace(/[\"']/g, "").trim() : "missing";
  }))).toEqual(["Inter", "Inter", "Inter"]);
  const mobilePersonal = page.getByRole("region", { name: "Ключові показники" });
  await expect(mobilePersonal.locator("div[class*='card']")).toHaveCount(9);
  await expect(mobilePersonal.getByRole("heading", { name: "Улюблені фільми" })).toBeVisible();
  await expect(mobilePersonal.getByRole("img", { name: "Розподіл оцінок від 1 до 10" }).locator("[class*='bar']")).toHaveCount(10);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: resolve(captureDirectory, "admin-dashboard-uk-mobile-393.png"), fullPage: true });
});
