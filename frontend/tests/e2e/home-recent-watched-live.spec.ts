import { expect, test } from "@playwright/test";
import { cleanupDisposableAccount } from "./helpers";

test.setTimeout(120_000);

test("Home recent-watched rail reflects a real event and respects responsive visibility", async ({ page, baseURL }, testInfo) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = `homewatched${suffix.slice(-10)}`;
  const email = `${username}@example.invalid`;
  const password = "E2e-password-123!";
  const mobile = testInfo.project.name.includes("emulation");
  let registered = false;

  try {
    const csrfHeaders = async () => {
      const csrf = await page.request.get("/api/auth/csrf");
      expect(csrf.status()).toBe(200);
      const cookie = (await page.context().cookies()).find(item => item.name === "XSRF-TOKEN");
      expect(cookie).toBeTruthy();
      return { "X-XSRF-TOKEN": decodeURIComponent(cookie!.value) };
    };
    const registration = await page.request.post("/api/auth/register", {
      headers: await csrfHeaders(), data: { username, email, password },
    });
    expect(registration.status()).toBe(200);
    registered = true;
    const login = await page.request.post("/api/auth/login", {
      headers: await csrfHeaders(), data: { email, password },
    });
    expect(login.status()).toBe(200);
    await page.goto("/uk/films");
    await expect(page).toHaveURL(/\/uk\/films$/);

    const firstFilm = page.locator('main article a[href^="/uk/films/"]').first();
    await expect(firstFilm).toBeVisible();
    await firstFilm.click();
    await expect(page).toHaveURL(/\/uk\/films\/\d+$/);
    if (mobile) await page.getByRole("button", { name: "Мої дії" }).click();
    const actionSheet = mobile ? page.getByRole("dialog") : null;
    const watched = page.getByRole("button", { name: "Переглянуто" });
    await expect(watched).toBeVisible();
    const movieTitle = (await page.getByRole("heading", { level: 1 }).textContent())?.trim();
    expect(movieTitle).toBeTruthy();
    await watched.click();
    await expect(watched).toHaveAttribute("aria-pressed", "true");
    if (mobile) await actionSheet!.getByRole("button", { name: "Готово" }).click();

    const movieId = Number(page.url().match(/\/films\/(\d+)$/)?.[1]);
    const currentUser = await page.evaluate(async () => (await fetch("/api/users/me")).json() as { id: number });
    expect(movieId).toBeGreaterThan(0);
    expect(currentUser.id).toBeGreaterThan(0);
    const authenticatedFeed = await page.request.get("/api/activity/recent-watched?size=6");
    expect(authenticatedFeed.ok()).toBeTruthy();
    const authenticatedItems = (await authenticatedFeed.json() as { content: Array<{ actor: { id: number } | null; movie: { id: number } | null }> }).content;
    expect(authenticatedItems.some(item => item.actor?.id === currentUser.id && item.movie?.id === movieId), "The real event must be present in the recent-watched API").toBe(true);

    await page.setViewportSize(mobile ? { width: 393, height: 852 } : { width: 1024, height: 1000 });
    const homeFeedResponse = page.waitForResponse(response => new URL(response.url()).pathname === "/api/activity/recent-watched");
    await page.goto("/uk/home");
    const homeFeed = await homeFeedResponse;
    expect(homeFeed.status()).toBe(200);
    const homeFeedItems = (await homeFeed.json() as { content: Array<{ actor: { id: number } | null; movie: { id: number } | null }> }).content;
    expect(homeFeedItems.some(item => item.actor?.id === currentUser.id && item.movie?.id === movieId), "Home must receive the just-created event").toBe(true);
    await expect(page.getByRole("heading", { name: "З поверненням. Ось що ми дивимося…" })).toBeVisible();
    const recentWatched = page.locator("#home-recent-watched");
    await expect(recentWatched).toHaveAttribute("aria-busy", "false");
    if (mobile) {
      await expect(recentWatched).toHaveCSS("display", "none");
    } else {
      await expect(recentWatched).toBeVisible();
      await expect(recentWatched.getByRole("link", { name: movieTitle!, exact: true })).toHaveAttribute("href", `/uk/films/${movieId}`);
      await expect(recentWatched.getByRole("link", { name: username, exact: true })).toHaveAttribute("href", `/uk/users/${currentUser.id}`);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  } finally {
    if (registered) await cleanupDisposableAccount(baseURL, email, password);
  }
});
