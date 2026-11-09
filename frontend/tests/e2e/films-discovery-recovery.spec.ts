import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const filmPage = (title: string) => ({
  content: [{ id: 51001, title, releaseDate: "2024-02-29", rating: 4.7, photoUrl: null }],
  totalPages: 1,
  totalElements: 1,
  number: 0,
  size: 6,
});

const reviewPage = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 4 };

test("Films Discovery recovers API failures, applies filters and keeps retry keyboard focus", async ({ page }, testInfo) => {
  let filmRequests = 0;
  let genreRequests = 0;

  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "films-discovery-recovery" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/movies/search**", route => {
    filmRequests += 1;
    return filmRequests < 3
      ? route.fulfill({ status: 503, json: { message: "Temporary failure" } })
      : route.fulfill({ json: filmPage("Dune") });
  });
  await page.route("**/api/genres", route => {
    genreRequests += 1;
    return genreRequests === 1
      ? route.fulfill({ status: 503, json: { message: "Temporary failure" } })
      : route.fulfill({ json: [{ id: 2, name: "Science Fiction" }] });
  });
  await page.route("**/api/reviews/recent**", route => route.fulfill({ json: reviewPage }));
  await page.route("**/api/reviews/popular**", route => route.fulfill({ json: reviewPage }));

  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/uk/films/discover");

  const popular = page.getByRole("region", { name: "Популярні фільми" });
  const retry = popular.getByRole("button", { name: "Спробувати ще" });
  await expect(retry).toBeVisible();
  await retry.focus();
  await page.keyboard.press("Enter");
  await expect(popular).toHaveAttribute("aria-busy", "false");
  const repeatedRetry = popular.getByRole("button", { name: "Спробувати ще" });
  await expect(repeatedRetry).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(popular.getByRole("link", { name: "1. Dune" })).toBeVisible();
  await expect(popular.locator("[class*=fallback]")).toHaveText("Dune");
  await expect(page.locator("#popular-films-title")).toBeFocused();

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261104/films-discovery-fallback");
  await mkdir(captureDirectory, { recursive: true });
  const platform = testInfo.project.name.includes("iOS") ? "ios-webkit" : testInfo.project.name.includes("Android") ? "android-chromium" : "desktop-chromium";
  await page.setViewportSize({ width: 393, height: 852 });
  await page.screenshot({ path: resolve(captureDirectory, `${platform}-uk-phone-393.png`), fullPage: true });

  await page.setViewportSize({ width: 1440, height: 1000 });
  const genreRetry = page.getByRole("button", { name: "Спробувати ще" });
  await expect(genreRetry).toBeVisible();
  await genreRetry.click();
  const genre = page.getByRole("combobox", { name: "Жанр" });
  await expect(genre).toBeEnabled();
  await expect(genre.locator("option")).toHaveText(["Жанр", "Наукова фантастика"]);

  await page.getByLabel("Рік").selectOption("2024");
  await page.getByLabel("Рейтинг").selectOption("4");
  await genre.selectOption("2");
  await page.getByLabel("Пошук фільмів").fill("Dune");
  const filteredRequest = page.waitForRequest(request => {
    if (!request.url().includes("/api/movies/search")) return false;
    const query = new URL(request.url()).searchParams;
    return query.get("q") === "Dune" && query.get("year") === "2024" && query.get("minRating") === "4" && query.get("genreId") === "2";
  });
  await page.getByRole("button", { name: "Пошук", exact: true }).click();
  await filteredRequest;

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
  await expect(page.getByRole("link", { name: "1. Dune" })).toBeVisible();
  await page.screenshot({ path: resolve(captureDirectory, `${platform}-uk-desktop-1440.png`), fullPage: true });
});
