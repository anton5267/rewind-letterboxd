import { expect, request, test, type APIRequestContext } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { browserMutation, cleanupDisposableAccount } from "./helpers";

async function apiMutation(api: APIRequestContext, method: "POST" | "PUT", url: string, data?: unknown) {
  expect((await api.get("/api/auth/csrf")).status()).toBe(200);
  const csrf = (await api.storageState()).cookies.find(cookie => cookie.name === "XSRF-TOKEN");
  expect(csrf).toBeTruthy();
  return api.fetch(url, {
    method,
    headers: { "X-XSRF-TOKEN": decodeURIComponent(csrf!.value) },
    ...(data === undefined ? {} : { data }),
  });
}

test("review likes persist across accounts and create one owner notification", async ({ page, baseURL }, testInfo) => {
  testInfo.setTimeout(90_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const authorUsername = `like_author_${suffix}`;
  const likerUsername = `like_actor_${suffix}`;
  const authorEmail = `${authorUsername}@example.invalid`;
  const likerEmail = `${likerUsername}@example.invalid`;
  const password = "E2e-password-123!";
  const authorApi = await request.newContext({ baseURL, timeout: 15_000 });
  let authorRegistered = false;
  let likerRegistered = false;

  try {
    const authorRegistration = await apiMutation(authorApi, "POST", "/api/auth/register", {
      username: authorUsername,
      email: authorEmail,
      password,
    });
    expect(authorRegistration.status()).toBe(200);
    authorRegistered = true;
    const authorId = Number((await authorRegistration.json() as { id: number }).id);
    const authorLogin = await apiMutation(authorApi, "POST", "/api/auth/login", { email: authorEmail, password });
    expect(authorLogin.status()).toBe(200);

    const moviesResponse = await authorApi.get("/api/movies/search?sort=rating_desc&page=0&size=1");
    expect(moviesResponse.ok()).toBeTruthy();
    const movie = (await moviesResponse.json() as { content: { id: number; title: string }[] }).content[0];
    expect(movie?.id).toBeGreaterThan(0);

    const createdReview = await apiMutation(authorApi, "POST", `/api/movies/${movie.id}/reviews`, {
      content: `A real review for the cross-account like flow (${suffix}).`,
      rating: 4,
    });
    expect(createdReview.status()).toBe(200);
    const reviewId = Number((await createdReview.json() as { id: number }).id);
    expect(reviewId).toBeGreaterThan(0);

    const preferencesResponse = await authorApi.get("/api/notifications/preferences");
    expect(preferencesResponse.ok()).toBeTruthy();
    const preferences = await preferencesResponse.json() as { followsEnabled: boolean; reviewLikesEnabled: boolean };
    if (!preferences.reviewLikesEnabled) {
      const enabled = await apiMutation(authorApi, "PUT", "/api/notifications/preferences", {
        ...preferences,
        reviewLikesEnabled: true,
      });
      expect(enabled.ok()).toBeTruthy();
    }

    await page.setViewportSize({ width: testInfo.project.name.toLowerCase().includes("ios") || testInfo.project.name.toLowerCase().includes("android") ? 393 : 1440, height: 900 });
    await page.goto("/uk/home");
    const registration = await browserMutation(page, "/api/auth/register", "POST", {
      username: likerUsername,
      email: likerEmail,
      password,
    });
    expect(registration.status).toBe(200);
    likerRegistered = true;
    const login = await browserMutation(page, "/api/auth/login", "POST", { email: likerEmail, password });
    expect(login.status).toBe(200);
    const actorResponse = await page.request.get("/api/users/me");
    expect(actorResponse.ok()).toBeTruthy();
    const actorId = Number((await actorResponse.json() as { id: number }).id);
    expect(actorId).not.toBe(authorId);

    await page.goto(`/uk/reviews/${reviewId}`);
    await expect(page.getByRole("heading", { name: movie.title }).first()).toBeVisible();
    const statusUrl = `/api/reviews/${reviewId}/like-status`;
    await expect.poll(async () => (await (await page.request.get(statusUrl)).json() as { liked: boolean }).liked).toBe(false);

    const isPhone = page.viewportSize()!.width < 500;
    const openLikeControl = async () => {
      if (!isPhone) return page.locator("[data-review-like-action]");
      await page.getByRole("button", { name: "Додаткові дії" }).click();
      return page.getByRole("dialog", { name: movie.title }).locator('button:has(img[src="/images/movie-action-favorite.png"])');
    };
    const like = await openLikeControl();
    await expect(like).toHaveAttribute("aria-pressed", "false");
    const likeResponse = page.waitForResponse(response => new URL(response.url()).pathname === `/api/reviews/${reviewId}/likes` && response.request().method() === "POST");
    await like.click();
    expect((await likeResponse).status()).toBe(204);
    await expect(like).toHaveAttribute("aria-pressed", "true");
    await expect.poll(async () => await (await page.request.get(statusUrl)).json()).toEqual({ liked: true, likes: 1 });

    await page.reload();
    await expect(page.getByRole("heading", { name: movie.title }).first()).toBeVisible();
    await expect.poll(async () => await (await page.request.get(statusUrl)).json()).toEqual({ liked: true, likes: 1 });
    await expect(page.getByRole("link", { name: likerUsername, exact: true })).toHaveAttribute("href", `/uk/users/${actorId}`);

    const duplicateLike = await browserMutation(page, `/api/reviews/${reviewId}/likes`, "POST");
    expect(duplicateLike.status).toBe(204);
    await expect.poll(async () => await (await page.request.get(statusUrl)).json()).toEqual({ liked: true, likes: 1 });

    const ownerNotifications = async () => {
      const response = await authorApi.get("/api/notifications?page=0&size=50");
      expect(response.ok()).toBeTruthy();
      const data = await response.json() as { content: { type: string; actor: { id: number } | null; reviewId: number | null }[] };
      return data.content.filter(note => note.type === "REVIEW_LIKED" && note.reviewId === reviewId && note.actor?.id === actorId);
    };
    await expect.poll(async () => (await ownerNotifications()).length).toBe(1);

    const unlike = await openLikeControl();
    await expect(unlike).toHaveAttribute("aria-pressed", "true");
    const unlikeResponse = page.waitForResponse(response => new URL(response.url()).pathname === `/api/reviews/${reviewId}/likes` && response.request().method() === "DELETE");
    await unlike.click();
    expect((await unlikeResponse).status()).toBe(204);
    await expect(unlike).toHaveAttribute("aria-pressed", "false");
    await expect.poll(async () => await (await page.request.get(statusUrl)).json()).toEqual({ liked: false, likes: 0 });
    expect((await ownerNotifications()).length).toBe(1);

    const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "functional-audit-20261104", "review-like-live");
    mkdirSync(evidenceDir, { recursive: true });
    const platform = testInfo.project.name.toLowerCase().includes("ios") ? "ios-webkit"
      : testInfo.project.name.toLowerCase().includes("android") ? "android-chromium" : "desktop-chromium";
    await page.screenshot({ path: path.join(evidenceDir, `${platform}-uk-${page.viewportSize()!.width}.png`), fullPage: true });
  } finally {
    if (likerRegistered) await cleanupDisposableAccount(baseURL, likerEmail, password);
    if (authorRegistered) await cleanupDisposableAccount(baseURL, authorEmail, password);
    await authorApi.dispose();
  }
});
