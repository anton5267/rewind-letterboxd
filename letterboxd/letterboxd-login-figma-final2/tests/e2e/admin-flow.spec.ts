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
  await notificationSection.getByLabel("ID отримувача", { exact: true }).fill(String(recipientId));
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

  const createdMovieData = await page.evaluate(async (movieTitle) => {
    const response = await fetch("/api/admin/movies?size=50");
    const data = await response.json();
    return data.content.find((movie: { id: number; title: string }) => movie.title === movieTitle) as { id: number } | undefined;
  }, title);
  expect(createdMovieData?.id).toBeTruthy();
  const moderationContent = `Admin moderation ${Date.now()}`;
  const xsrf = await page.evaluate(() => decodeURIComponent(document.cookie.split("; ").find(value => value.startsWith("XSRF-TOKEN="))?.slice("XSRF-TOKEN=".length) ?? ""));
  const reviewResponse = await page.evaluate(async ({ movieId, content, token }) => {
    const response = await fetch(`/api/movies/${movieId}/reviews`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": token },
      body: JSON.stringify({ content, rating: 4 })
    });
    return response.status;
  }, { movieId: createdMovieData!.id, content: moderationContent, token: xsrf });
  expect(reviewResponse).toBe(200);

  await page.reload();
  const moderationSection = page.locator("section").filter({ has: page.getByRole("heading", { name: "Черга модерації" }) });
  const moderationItem = moderationSection.locator("li").filter({ hasText: moderationContent });
  await expect(moderationItem).toBeVisible();
  await moderationItem.getByRole("button", { name: "Приховати" }).click();
  await expect(moderationItem).toHaveCount(0);

  page.once("dialog", dialog => dialog.accept());
  const refreshedMovieSection = page.locator("section").filter({ has: page.getByRole("heading", { name: "Фільми" }) });
  const refreshedMovie = refreshedMovieSection.locator("li").filter({ hasText: title });
  await refreshedMovie.getByRole("button", { name: "Видалити" }).click();
  await expect(refreshedMovie).toHaveCount(0);
});
