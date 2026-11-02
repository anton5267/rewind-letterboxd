import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("mobile touch flow for Movie ActionSheet in Android and iOS browser emulation", async ({ page }, testInfo) => {
  const mutations: string[] = [];
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: 99001, username: "mobile-reader", role: "USER" } });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "mobile-emulation" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/movies/35/details") return route.fulfill({ json: {
      id: 35, title: "Dune", imdbId: null, shortPlot: "A long journey across Arrakis.", photoUrl: null, backdropUrl: null,
      releaseDate: "2021-10-22", durationMinutes: 155, ageRating: "12+", rating: 4,
      trailerUrl: null, genres: [], actors: [], directors: [], producers: [], externalRatings: [], similarMovies: [],
      myFlags: { watched: false, watchlist: false, favorites: false },
    } });
    if (pathname === "/api/movies/35/reviews") return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } });
    if (pathname === "/api/movies/35/reviews/me") return route.fulfill({ status: 204 });
    if (pathname === "/api/movies/35/rating/me") return route.fulfill({ json: { rating: 0 } });
    if (pathname === "/api/lists/my") return route.fulfill({ json: [{ id: 11, name: "Travel films", description: null, listType: "CUSTOM", isPublic: false, tags: [] }] });
    if (request.method() === "POST" && pathname === "/api/lists/11/movies") {
      mutations.push("add-to-list");
      return route.fulfill({ status: 200 });
    }
    if (request.method() === "POST" && pathname === "/api/movies/35/watched") {
      mutations.push("watched");
      return route.fulfill({ status: 200 });
    }
    if (request.method() === "POST" && pathname === "/api/movies/35/reviews") return route.fulfill({ status: 200, json: {} });
    if (request.method() === "PUT" && pathname === "/api/movies/35/rating") return route.fulfill({ status: 204 });
    if (request.method() === "GET" && pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/uk/films/35");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  const trigger = page.getByRole("button", { name: "Мої дії" });
  await trigger.tap();
  const dialog = page.getByRole("dialog", { name: "Dune" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Готово", exact: true })).toBeFocused();
  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261102/device-emulation");
  await mkdir(captureDirectory, { recursive: true });
  const platform = testInfo.project.name.includes("iOS") ? "ios-webkit" : "android-chromium";
  await page.screenshot({ path: resolve(captureDirectory, `${platform}-movie-action-sheet-393.png`) });

  await dialog.getByRole("button", { name: "Додати до списків", exact: true }).tap();
  await expect(dialog.getByRole("button", { name: "Додати до списків", exact: true })).toHaveAttribute("aria-expanded", "true");
  await dialog.getByRole("combobox", { name: "Оберіть список" }).selectOption("11");
  await dialog.getByRole("button", { name: "Додати", exact: true }).tap();
  await expect(page.getByRole("status").filter({ hasText: "Фільм додано до списку." })).toBeVisible();

  await dialog.getByRole("button", { name: "Переглянуто", exact: true }).tap();
  await expect(page.getByRole("status").filter({ hasText: "Збережено." })).toBeVisible();
  expect(mutations).toEqual(["add-to-list", "watched"]);

  await dialog.getByRole("button", { name: "Огляд", exact: true }).tap();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("textbox", { name: "Ваш огляд" })).toBeFocused();

  await page.goto("/uk/films/35");
  await trigger.tap();
  await expect(dialog).toBeVisible();
  await page.evaluate(() => Object.defineProperty(navigator, "share", {
    configurable: true,
    value: async (payload: ShareData) => { (window as Window & { __sharedUrl?: string }).__sharedUrl = payload.url; },
  }));
  await dialog.getByRole("button", { name: "Поділитися", exact: true }).tap();
  await expect.poll(() => page.evaluate(() => (window as Window & { __sharedUrl?: string }).__sharedUrl)).toBe(page.url());
  await dialog.getByRole("button", { name: "Готово", exact: true }).tap();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(394);
  expect(pageErrors).toEqual([]);
});

test("mobile touch flow for Review RatingSheet in Android and iOS browser emulation", async ({ page }, testInfo) => {
  const mutations: string[] = [];
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: 99001, username: "mobile-reader", role: "USER" } });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "mobile-emulation" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/reviews/99001") return route.fulfill({ json: {
      id: 99001, content: "A thoughtful story about choices and consequence.", rating: 4, createdAt: "2026-10-18T12:30:00Z",
      author: { id: 99002, username: "film-writer", displayName: "Film Writer", avatarUrl: null },
      movie: { id: 35, title: "Dune", releaseDate: "2021-10-22", durationMinutes: 155, ageRating: "12+", photoUrl: null, backdropUrl: null, trailerUrl: null },
      likes: 3, likedBy: [],
    } });
    if (pathname === "/api/reviews/99001/like-status") return route.fulfill({ json: { liked: false, likes: 3 } });
    if (pathname === "/api/movies/35/rating/me") return route.fulfill({ json: { rating: 0 } });
    if (request.method() === "POST" && pathname === "/api/reviews/99001/likes") {
      mutations.push("like-review");
      return route.fulfill({ status: 200 });
    }
    if (request.method() === "PUT" && pathname === "/api/movies/35/rating") {
      mutations.push("rate-movie");
      return route.fulfill({ status: 204 });
    }
    if (request.method() === "GET" && pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/uk/reviews/99001");
  const more = page.getByRole("button", { name: "Додаткові дії", exact: true });
  await more.tap();
  const dialog = page.getByRole("dialog", { name: "Dune" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Готово", exact: true })).toBeFocused();

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261102/device-emulation");
  await mkdir(captureDirectory, { recursive: true });
  const platform = testInfo.project.name.includes("iOS") ? "ios-webkit" : "android-chromium";
  await page.screenshot({ path: resolve(captureDirectory, `${platform}-review-rating-sheet-393.png`) });

  await dialog.getByRole("button", { name: /Вподобати Dune/ }).tap();
  await expect.poll(() => mutations.includes("like-review")).toBe(true);
  await dialog.getByRole("button", { name: "Оцінити на 5", exact: true }).tap();
  await expect.poll(() => mutations.includes("rate-movie")).toBe(true);
  expect(mutations).toEqual(["like-review", "rate-movie"]);
  await dialog.getByRole("button", { name: "Готово", exact: true }).tap();
  await expect(dialog).toBeHidden();
  await expect(more).toBeFocused();
  await expect(more).toHaveAttribute("aria-expanded", "false");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(394);
});
