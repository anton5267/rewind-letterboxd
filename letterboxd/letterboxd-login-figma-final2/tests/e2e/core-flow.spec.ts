import { expect, test } from "@playwright/test";

test("register, use a film, edit and remove review", async ({ page }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `e2e-${suffix}@example.invalid`;
  const password = "E2e-password-123!";
  const review = `E2E review ${suffix}`;
  const editedReview = `${review} edited`;

  await page.goto("/uk/register");
  await page.getByLabel("Нікнейм").fill(`e2e${suffix}`);
  await page.getByLabel("Електронна пошта").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Створити акаунт" }).click();
  await expect(page.getByRole("heading", { name: /Акаунт створено/ })).toBeVisible();

  await page.getByRole("button", { name: "Перейти до входу" }).click();
  await page.getByLabel("Електронна пошта").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);
  await expect(page.getByRole("status")).toContainText("Знайдено фільмів");

  const firstFilm = page.locator("main article h2 a").first();
  await expect(firstFilm).toBeVisible();
  await firstFilm.click();
  await expect(page.getByRole("heading", { name: "Мої дії" })).toBeVisible();

  const watchlist = page.getByRole("button", { name: "До перегляду" });
  await watchlist.click();
  await expect(watchlist).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Оцінити на 4" }).click();
  await expect(page.getByText("Ваша оцінка: 4")).toBeVisible();

  await page.getByRole("textbox", { name: "Ваш огляд" }).fill(review);
  await page.getByRole("button", { name: "Опублікувати огляд" }).click();
  await expect(page.getByRole("status")).toContainText("Огляд опубліковано");
  await expect(page.getByText(review)).toBeVisible();

  await page.getByRole("button", { name: "Редагувати" }).click();
  await page.getByRole("textbox", { name: "Ваш огляд" }).fill(editedReview);
  await page.getByRole("button", { name: "Зберегти огляд" }).click();
  await expect(page.getByRole("status")).toContainText("Огляд оновлено");
  await expect(page.getByText(editedReview)).toBeVisible();

  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Видалити огляд" }).click();
  await expect(page.getByRole("status")).toContainText("Огляд видалено");
  await expect(page.getByText(editedReview)).toHaveCount(0);

  await page.getByRole("button", { name: "Видалити оцінку" }).click();
  await expect(page.getByRole("status")).toContainText("Оцінку видалено");

  await watchlist.click();
  await expect(watchlist).toHaveAttribute("aria-pressed", "false");
});
