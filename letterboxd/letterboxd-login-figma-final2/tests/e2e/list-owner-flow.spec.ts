import { expect, test } from "@playwright/test";

test("owner creates and deletes a custom list", async ({ page }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `list-e2e-${suffix}@example.invalid`;
  const password = "E2e-password-123!";
  const listName = `Disposable list ${suffix}`;

  const csrfHeaders = async () => {
    const cookie = (await page.context().cookies()).find(item => item.name === "XSRF-TOKEN");
    expect(cookie, "XSRF cookie must be present before a state-changing request").toBeTruthy();
    return { "X-XSRF-TOKEN": decodeURIComponent(cookie!.value) };
  };

  await page.goto("/uk/register");
  await page.getByLabel("Нікнейм").fill(`list${suffix.slice(-12)}`);
  await page.getByLabel("Електронна пошта").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Створити акаунт" }).click();
  await expect(page.getByRole("heading", { name: /Акаунт створено/ })).toBeVisible();

  await page.getByRole("button", { name: "Перейти до входу" }).click();
  await page.getByLabel("Електронна пошта").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);

  try {
    await page.goto("/uk/lists");
    await page.getByLabel("Новий список").fill(listName);
    await page.getByLabel("Опис").first().fill("Browser to API to MySQL deletion fixture");
    await page.getByLabel("Теги").first().fill("playwright, owner-delete");
    await page.getByLabel("Публічний список").first().check();
    await page.getByRole("button", { name: "Створити" }).click();

    const listButton = page.getByRole("button", { name: listName, exact: true });
    await expect(listButton).toBeVisible();
    await page.route("**/api/lists/*/items", async route => {
      await new Promise(resolve => setTimeout(resolve, 250));
      await route.continue();
    });
    await listButton.click();
    await expect(page.getByText("Завантаження...", { exact: true })).toBeVisible();
    await expect(page.getByText("Тут поки немає фільмів. Додайте їх зі сторінки фільму.", { exact: true })).toBeVisible();

    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Видалити список" }).click();
    await expect(page.getByRole("status")).toHaveText("Список видалено.");
    await expect(listButton).toHaveCount(0);

    const lists = await page.request.get("/api/lists/my");
    expect(lists.ok()).toBeTruthy();
    expect((await lists.json() as Array<{ name: string }>).some(list => list.name === listName)).toBeFalsy();
  } finally {
    const cleanup = await page.request.delete("/api/profile/me", {
      headers: await csrfHeaders(),
      data: { currentPassword: password },
    });
    expect.soft(cleanup.ok(), "Disposable browser-test account must be removed").toBeTruthy();
  }
});
