import { expect, test } from "@playwright/test";
import { cleanupDisposableAccount } from "./helpers";

test("review text is rendered as text and search rejects no SQL input", async ({ page, baseURL }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `security-${suffix}@example.invalid`;
  const password = "E2e-password-123!";
  const payload = `<img src=x onerror=alert(1)> review ${suffix}`;
  let dialogSeen = false;
  page.on("dialog", async dialog => {
    dialogSeen = true;
    if (dialog.type() === "alert") await dialog.dismiss();
    else await dialog.accept();
  });

  let registered = false;
  try {
    await page.goto("/uk/register");
    await page.getByLabel("Нікнейм").fill(`security${suffix}`);
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль").fill(password);
    const registration = page.waitForResponse(response => response.url().endsWith("/api/auth/register") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Створити акаунт" }).click();
    expect((await registration).status()).toBe(200);
    registered = true;
    await page.getByRole("button", { name: "Перейти до входу" }).click();
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль").fill(password);
    await page.getByRole("button", { name: "Увійти" }).click();
    await expect(page).toHaveURL(/\/uk\/films$/);

    await page.locator("main article h2 a").first().click();
    await page.getByRole("button", { name: "Оцінити на 4" }).click();
    await page.getByRole("textbox", { name: "Ваш огляд" }).fill(payload);
    await page.getByRole("button", { name: "Опублікувати огляд" }).click();
    await expect(page.getByText(payload)).toBeVisible();
    expect(dialogSeen).toBe(false);
    await expect(page.locator('img[src="x"]')).toHaveCount(0);

    const ownReview = page.locator("article").filter({ hasText: payload });
    const commentPayload = `<img src=x onerror=alert(2)> comment ${suffix}`;
    await ownReview.getByRole("button", { name: "Показати коментарі" }).click();
    await ownReview.getByLabel("Ваш коментар").fill(commentPayload);
    await ownReview.getByRole("button", { name: "Надіслати" }).click();
    await expect(ownReview.getByText(commentPayload)).toBeVisible();
    expect(dialogSeen).toBe(false);
    await expect(page.locator('img[src="x"]')).toHaveCount(0);

    await ownReview.getByRole("button", { name: "Видалити огляд" }).click();
    await expect(ownReview).toHaveCount(0);
    await page.getByRole("button", { name: "Видалити оцінку" }).click();
    dialogSeen = false;

    const searchPayloads = [
      "' OR 1=1 --",
      "1); DROP TABLE movies;--",
      "\\\" UNION SELECT NULL--",
      "<script>alert(3)</script>",
    ];
    for (const searchPayload of searchPayloads) {
      const response = await page.goto(`/uk/films?q=${encodeURIComponent(searchPayload)}`);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { name: "Фільми" })).toBeVisible();
      await expect(page.getByRole("alert")).toHaveCount(0);
      expect(dialogSeen, `unexpected dialog for search payload: ${searchPayload}`).toBe(false);
    }
  } finally {
    if (registered) await cleanupDisposableAccount(baseURL, email, password);
  }
});
