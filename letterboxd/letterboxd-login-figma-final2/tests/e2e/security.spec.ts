import { expect, test } from "@playwright/test";

test("review text is rendered as text and search rejects no SQL input", async ({ page }) => {
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

  await page.goto("/uk/register");
  await page.getByLabel("Нікнейм").fill(`security${suffix}`);
  await page.getByLabel("Електронна пошта").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Створити акаунт" }).click();
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

  const response = await page.goto(`/uk/films?q=${encodeURIComponent("' OR 1=1 --")}`);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Фільми" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
