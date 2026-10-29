import { expect, test, type Response } from "@playwright/test";
import { cleanupDisposableAccount, waitForPageContent } from "./helpers";

function csrfCookie(header: string | undefined) {
  const value = header?.split(";").map(part => part.trim()).find(part => part.startsWith("XSRF-TOKEN="))?.slice("XSRF-TOKEN=".length);
  return value ? decodeURIComponent(value) : null;
}

async function expectMutation(response: Response, status: number) {
  const headers = await response.request().allHeaders();
  const token = csrfCookie(headers.cookie);
  expect(Boolean(token) && headers["x-xsrf-token"] === token, "The mutation CSRF header must match its actual request cookie").toBe(true);
  expect(response.status(), "The real API must accept the authenticated mutation").toBe(status);
}

test("parallel authenticated reads do not invalidate rapid review mutations", async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `csrf-race-${suffix}@example.invalid`;
  const password = "E2e-csrf-password-123!";
  let registered = false;
  const aliases = new Map<string, string>();
  const alias = (value: string | null | undefined) => {
    if (!value) return null;
    if (!aliases.has(value)) aliases.set(value, `T${aliases.size + 1}`);
    return aliases.get(value)!;
  };
  const chronology: object[] = [];
  const captures: Promise<void>[] = [];
  page.on("response", response => {
    if (!new URL(response.url()).pathname.startsWith("/api/")) return;
    captures.push((async () => {
      const request = response.request();
      const headers = await request.allHeaders();
      const cookie = csrfCookie(headers.cookie);
      const setCookies = (await response.headersArray()).filter(header => header.name.toLowerCase() === "set-cookie" && header.value.startsWith("XSRF-TOKEN="));
      chronology.push({
        path: new URL(response.url()).pathname, method: request.method(), status: response.status(),
        started: request.timing().startTime, cookieAlias: alias(cookie), headerAlias: alias(headers["x-xsrf-token"]),
        headerMatchesCookie: Boolean(cookie) && cookie === headers["x-xsrf-token"],
        responseCookieAliases: setCookies.map(header => alias(csrfCookie(header.value)) ?? "CLEARED"),
      });
    })());
  });

  try {
    await page.goto("/uk/register");
    await waitForPageContent(page);
    await page.getByLabel("Нікнейм").fill(`csrfrace${suffix}`);
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    const registration = page.waitForResponse(response => response.url().endsWith("/api/auth/register") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Створити акаунт", exact: true }).click();
    expect((await registration).status()).toBe(200);
    registered = true;
    await page.getByRole("button", { name: "Перейти до входу" }).click();
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Увійти", exact: true }).click();
    await expect(page).toHaveURL(/\/uk\/films$/);
    await waitForPageContent(page);
    await expect(page.locator('main[aria-busy="true"], main [aria-busy="true"]')).toHaveCount(0);
    await page.locator("main article h2 a").first().click();
    await waitForPageContent(page);
    await expect(page.locator('main[aria-busy="true"], main [aria-busy="true"]')).toHaveCount(0);
    const movieId = Number(page.url().match(/\/films\/(\d+)$/)?.[1]);
    expect(movieId).toBeGreaterThan(0);
    const rating = page.waitForResponse(response => new URL(response.url()).pathname === `/api/movies/${movieId}/rating` && response.request().method() === "PUT");
    await page.getByRole("button", { name: "Оцінити на 4", exact: true }).click();
    await expectMutation(await rating, 200);

    for (let cycle = 0; cycle < 8; cycle += 1) {
      const reviewText = `CSRF review ${suffix} cycle ${cycle}`;
      const commentText = `CSRF comment ${suffix} cycle ${cycle}`;
      await page.getByRole("textbox", { name: "Ваш огляд", exact: true }).fill(reviewText);
      const createdReview = page.waitForResponse(response => new URL(response.url()).pathname === `/api/movies/${movieId}/reviews` && response.request().method() === "POST");
      await page.getByRole("button", { name: "Опублікувати огляд", exact: true }).click();
      await expectMutation(await createdReview, 200);
      const ownReview = page.locator("article").filter({ hasText: reviewText });
      await expect(ownReview).toBeVisible();
      await ownReview.getByRole("button", { name: "Показати коментарі", exact: true }).click();
      await ownReview.getByLabel("Ваш коментар", { exact: true }).fill(commentText);

      // Only real GETs run in parallel; no routes, responses or application state are mocked.
      const reads = page.evaluate(async id => Promise.all([
        `/api/movies/${id}/details`, `/api/movies/${id}/reviews`, `/api/movies/${id}/rating/me`,
        "/api/users/me", "/api/lists/my", "/api/genres",
      ].map(async path => (await fetch(path, { credentials: "same-origin" })).status)), movieId);
      try {
        const comment = page.waitForResponse(response => /\/api\/reviews\/\d+\/comments$/.test(new URL(response.url()).pathname) && response.request().method() === "POST");
        await ownReview.getByRole("button", { name: "Надіслати", exact: true }).click();
        await expectMutation(await comment, 200);
        await expect(ownReview.getByText(commentText, { exact: true })).toBeVisible();
        const removed = page.waitForResponse(response => /\/api\/reviews\/\d+$/.test(new URL(response.url()).pathname) && response.request().method() === "DELETE");
        await ownReview.getByRole("button", { name: "Видалити огляд", exact: true }).click();
        await page.getByRole("alertdialog").getByRole("button", { name: "Видалити огляд", exact: true }).click();
        await expectMutation(await removed, 204);
        await expect(ownReview).toHaveCount(0);
      } finally {
        expect(await reads, "Every parallel real catalog/profile read must succeed").toEqual([200, 200, 200, 200, 200, 200]);
      }
    }
  } finally {
    if (registered) await cleanupDisposableAccount(baseURL, email, password);
    await Promise.allSettled(captures);
    await test.info().attach("sanitized-csrf-chronology", { body: Buffer.from(JSON.stringify(chronology, null, 2)), contentType: "application/json" });
  }
});
