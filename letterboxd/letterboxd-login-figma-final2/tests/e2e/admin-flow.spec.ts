import { expect, test } from "@playwright/test";

test("admin can open the dashboard, manage a notification and manage a movie", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  const username = process.env.E2E_ADMIN_USERNAME;
  test.skip(!email || !password || !username, "Run scripts/verify-admin-browser.ps1 for the disposable ADMIN fixture.");

  await page.goto("/uk/login");
  await page.getByLabel("Електронна пошта").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);

  await page.goto("/uk/admin");
  await expect(page.getByRole("heading", { name: "Панель адміністратора" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Користувачі" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Фільми" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Налаштування сайту" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Журнал дій" })).toBeVisible();

  const adminUsers = await page.evaluate(async (query) => {
    const response = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}&size=10`);
    return response.json();
  }, username);
  const recipientId = adminUsers.content[0].id as number;
  const notificationSection = page.locator("section").filter({ has: page.getByRole("heading", { name: "Сповіщення" }) });
  await notificationSection.getByLabel("ID отримувача").fill(String(recipientId));
  await notificationSection.getByRole("button", { name: "Створити сповіщення" }).click();
  await expect(notificationSection.getByText(`отримувач #${recipientId}`, { exact: false }).first()).toBeVisible();

  await page.getByLabel("Пошук користувача").fill(username);
  await page.getByRole("button", { name: "Пошук" }).click();
  await expect(page.getByText(username, { exact: false }).first()).toBeVisible();

  const movieSection = page.locator("section").filter({ has: page.getByRole("heading", { name: "Фільми" }) });
  const title = `Admin browser ${Date.now()}`;
  await movieSection.getByLabel("Назва фільму").fill(title);
  await movieSection.getByLabel("Рейтинг").fill("7.5");
  await movieSection.getByRole("button", { name: "Створити" }).click();
  const createdMovie = movieSection.locator("li").filter({ hasText: title });
  await expect(createdMovie).toBeVisible();

  page.once("dialog", dialog => dialog.accept());
  await createdMovie.getByRole("button", { name: "Видалити" }).click();
  await expect(createdMovie).toHaveCount(0);
});
