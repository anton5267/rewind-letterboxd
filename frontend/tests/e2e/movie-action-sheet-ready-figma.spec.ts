import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

test("READY Avatar watched-date editor matches Figma mobile frame", async ({ page }) => {
  await installHostedAuthFixture(page.context());
  let watchedOn: string | null = "2025-12-18";
  const watchedDateWrites: string[] = [];
  await page.route(url => url.pathname.startsWith("/api/"), route => {
    const { pathname } = new URL(route.request().url());
    const method = route.request().method();
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: 99001, username: "figma-member", role: "USER" } });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "figma-fixture" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/movies/35/details") return route.fulfill({ json: {
      id: 35, title: "Avatar: Fire and Ash", imdbId: null, shortPlot: "James Cameron is in no hurry. This guy has been working on Avatar in some shape or form since at least 1994, and the two Avatar sequels for the last 16 years. Compared to all of that, Avatar: Fire and Ash's 197-minute runtime is like a drop in the ocean where Payakan (The Mighty Tulkun) roams. If spending three hours and 15 minutes in a theater intimidates you, stay home and look at social media on your phone.", photoUrl: null, backdropUrl: null,
      releaseDate: "2021-10-22", durationMinutes: 155, ageRating: "12+", rating: 4,
      trailerUrl: null, genres: [], actors: [], directors: [], producers: [], externalRatings: [], similarMovies: [],
      myFlags: { watched: true, watchlist: false, favorites: true },
    } });
    if (pathname === "/api/movies/35/reviews") return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } });
    if (pathname === "/api/movies/35/reviews/me") return route.fulfill({ status: 204 });
    if (pathname === "/api/movies/35/rating/me") return route.fulfill({ json: { rating: 4 } });
    if (pathname === "/api/movies/35/watched-date" && method === "GET") return route.fulfill({ json: { watchedOn } });
    if (pathname === "/api/movies/35/watched-date" && method === "PUT") { watchedOn = route.request().postDataJSON().watchedOn; watchedDateWrites.push(watchedOn!); return route.fulfill({ status: 204 }); }
    if (pathname === "/api/lists/my") return route.fulfill({ json: [] });
    return route.fulfill({ json: [] });
  });

  await signInHostedFixture(page, "en");
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/films/35");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  await page.getByRole("button", { name: "My actions" }).click();
  const dialog = page.getByRole("dialog", { name: "Avatar: Fire and Ash" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Done", exact: true })).toBeFocused();
  for (const label of ["Watched", "Like", "Watchlist", "Add to lists", "Review", "Share", "Done"]) {
    await expect(dialog.getByRole("button", { name: label, exact: true })).toBeVisible();
  }
  await expect(dialog.locator('[class*="blockLabel"]')).toHaveText("Rate");
  await expect(dialog.getByRole("button", { name: /Change watched date/ })).toContainText("18 December 2025");
  await expect(dialog.getByRole("button", { name: "Rate as 4" })).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.getByRole("button", { name: "Like", exact: true })).toHaveAttribute("aria-pressed", "true");

  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return null;
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      viewport: innerWidth,
      document: document.documentElement.scrollWidth,
      panel: rect('[role="dialog"] [class*="actionPanel"]'),
      heading: rect('[role="dialog"] [class*="heading"]'),
      flags: rect('[role="dialog"] [class*="flagGrid"]'),
      rating: rect('[role="dialog"] [class*="ratingBlock"]'),
      done: rect('[role="dialog"] [class*="doneButton"]'),
      rows: Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"] [class*="sheetRow"], [role="dialog"] [class*="secondaryActions"] button')).map(element => {
        const { y, height } = element.getBoundingClientRect();
        return { y, height, text: element.innerText };
      }),
    };
  });
  console.log(`READY_AVATAR_ACTION_SHEET ${JSON.stringify(geometry)}`);
  expect(geometry.document).toBe(393);
  expect(geometry.panel?.x).toBe(16);
  expect(geometry.panel?.width).toBe(361);
  expect(Math.abs((geometry.panel?.y ?? 0) - 282)).toBeLessThanOrEqual(1);
  expect((geometry.panel?.height ?? 0)).toBeGreaterThan(369);
  expect(geometry.done?.y).toBeGreaterThan(geometry.rating?.y ?? 0);
  await mkdir(resolve(process.cwd(), "../artifacts/visual-audit-20261126/watched-date"), { recursive: true });
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261126/watched-date/avatar-action-sheet-en-393.png") });

  await dialog.getByRole("button", { name: /Change watched date/ }).click();
  const dateInput = dialog.getByLabel("Date");
  await expect(dateInput).toHaveValue("2025-12-18");
  await dateInput.fill("2025-12-19");
  await expect(dialog.getByText(/James Cameron is in no hurry/)).toBeVisible();
  await dateInput.evaluate((input: HTMLInputElement) => input.blur());
  await mkdir(resolve(process.cwd(), "../artifacts/visual-audit-20261126/watched-date"), { recursive: true });
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261126/watched-date/avatar-watched-date-editor-en-393.png") });
  await expect(dialog.locator("h2")).toHaveText("Avatar: Fire and Ash");
  await expect(dialog.locator('[class*="dateRating"] > span')).toHaveText("Rated");
  await expect(dialog.getByRole("button", { name: "Rate as 1" })).toHaveClass(/dateRatingActive/);
  await expect(dialog.getByRole("button", { name: "Rate as 4" })).toHaveClass(/dateRatingActive/);
  await expect(dialog.getByRole("button", { name: "Rate as 5" })).not.toHaveClass(/dateRatingActive/);
  await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(watchedDateWrites).toEqual(["2025-12-19"]);
  await page.getByRole("button", { name: "My actions" }).click();
  const reopenedDialog = page.getByRole("dialog", { name: "Avatar: Fire and Ash" });
  await expect(reopenedDialog).toBeVisible();
  await expect(reopenedDialog.locator('[class*="watchedDateRow"]')).toContainText("19 December 2025");
});

test("Dune actions sheet hides watched-date controls until the film is watched", async ({ context, page }) => {
  await installHostedAuthFixture(context);
  let watched = false;
  let watchedDateReads = 0;
  await page.route(url => url.pathname.startsWith("/api/"), route => {
    const { pathname } = new URL(route.request().url());
    const method = route.request().method();
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: 99002, username: "dune-reader", role: "USER" } });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "dune-actions-fixture" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/movies/35/details") return route.fulfill({ json: {
      id: 35, title: "Dune", imdbId: null, shortPlot: "A mythic journey across Arrakis.", photoUrl: null, backdropUrl: null,
      releaseDate: "2021-10-22", durationMinutes: 155, ageRating: "12+", rating: 3.9,
      trailerUrl: null, genres: [], actors: [], directors: [], producers: [], externalRatings: [], similarMovies: [],
      myFlags: { watched, watchlist: false, favorites: false },
    } });
    if (pathname === "/api/movies/35/reviews") return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } });
    if (pathname === "/api/movies/35/reviews/me") return route.fulfill({ status: 204 });
    if (pathname === "/api/movies/35/rating/me") return route.fulfill({ json: { rating: 0 } });
    if (pathname === "/api/movies/35/watched-date" && method === "GET") { watchedDateReads += 1; return route.fulfill({ json: { watchedOn: null } }); }
    if (pathname === "/api/movies/35/watched" && method === "POST") { watched = true; return route.fulfill({ status: 204 }); }
    if (pathname === "/api/lists/my") return route.fulfill({ json: [] });
    return route.fulfill({ json: [] });
  });

  await signInHostedFixture(page, "en");
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/films/35");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  await page.getByRole("button", { name: "My actions" }).click();
  const dialog = page.getByRole("dialog", { name: "Dune" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[class*="watchedDateRow"]')).toHaveCount(0);
  expect(watchedDateReads).toBe(0);
  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return null;
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    return { panel: rect('[role="dialog"] [class*="actionPanel"]'), done: rect('[role="dialog"] [class*="doneButton"]') };
  });
  console.log(`DUNE_ACTIONS_FIGMA ${JSON.stringify(geometry)}`);
  expect(geometry.panel?.x).toBe(16);
  expect(geometry.panel?.width).toBe(361);
  expect(Math.abs((geometry.panel?.y ?? 0) - 373)).toBeLessThanOrEqual(2);
  expect(Math.abs((geometry.panel?.height ?? 0) - 369)).toBeLessThanOrEqual(2);
  expect(Math.abs((geometry.done?.y ?? 0) - 760)).toBeLessThanOrEqual(2);
  for (const label of ["Watched", "Like", "Watchlist", "Add to lists", "Review", "Share", "Done"]) {
    await expect(dialog.getByRole("button", { name: label, exact: true })).toBeVisible();
  }
  await dialog.getByRole("button", { name: "Watched", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Watched", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.locator('[class*="watchedDateRow"]')).toBeVisible();
  await expect.poll(() => watchedDateReads).toBe(1);
});
