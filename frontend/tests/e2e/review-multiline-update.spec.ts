import { expect, test } from "@playwright/test";
import { browserMutation, cleanupDisposableAccount } from "./helpers";

test("review update API accepts multiline text and rejects whitespace-only edits", async ({ page, baseURL }, testInfo) => {
  testInfo.setTimeout(60_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = `multiline${suffix.slice(-12)}`;
  const email = `${username}@example.invalid`;
  const password = "E2e-password-123!";
  let registered = false;

  try {
    await page.goto("/en/register");
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Create your account" }).click();
    await expect(page.getByRole("heading", { name: /Account created/ })).toBeVisible();
    registered = true;

    await page.getByRole("button", { name: "Go to login" }).click();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/en\/films$/);

    const moviesResponse = await page.request.get("/api/movies/search?sort=rating_desc&page=0&size=1");
    expect(moviesResponse.ok()).toBeTruthy();
    const movie = (await moviesResponse.json() as { content: Array<{ id: number }> }).content[0];
    expect(movie?.id).toBeGreaterThan(0);

    const create = await browserMutation(page, `/api/movies/${movie.id}/reviews`, "POST", {
      content: "Initial review text",
      rating: 4,
    });
    expect(create.status).toBe(200);
    const reviewId = Number((create.data as { id: number }).id);
    expect(reviewId).toBeGreaterThan(0);

    const multiline = "First paragraph.\n\nSecond paragraph.";
    const update = await browserMutation(page, `/api/reviews/${reviewId}`, "PATCH", { content: multiline });
    expect(update.status).toBe(200);
    const saved = await page.request.get(`/api/reviews/${reviewId}`);
    expect(saved.ok()).toBeTruthy();
    expect((await saved.json() as { content: string }).content).toBe(multiline);

    const blankUpdate = await browserMutation(page, `/api/reviews/${reviewId}`, "PATCH", { content: " \n\t " });
    expect(blankUpdate.status).toBe(400);
    const unchanged = await page.request.get(`/api/reviews/${reviewId}`);
    expect((await unchanged.json() as { content: string }).content).toBe(multiline);
  } finally {
    if (registered) {
      await cleanupDisposableAccount(baseURL, email, password);
      expect((await page.request.get("/api/users/me")).status()).toBe(401);
    }
  }
});
