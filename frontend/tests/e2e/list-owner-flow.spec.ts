import { expect, test } from "@playwright/test";
import { cleanupDisposableAccount } from "./helpers";

test("owner creates and deletes a custom list", async ({ page, baseURL }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `list-e2e-${suffix}@example.invalid`;
  const password = "E2e-password-123!";
  const listName = `Disposable list ${suffix}`;

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
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/uk/lists");
    const listsOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(listsOverflow, `lists page overflows horizontally by ${listsOverflow}px`).toBeLessThanOrEqual(1);
    await page.locator("#new-list-name").fill(listName);
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
    await expect(page.getByRole("link", { name: "Додати фільм", exact: true })).toHaveAttribute("href", "/uk/films");

    const updatedListName = `${listName} updated`;
    await page.getByLabel("Назва списку").fill(updatedListName);
    await page.getByRole("button", { name: "Зберегти", exact: true }).click();
    await expect(page.getByRole("button", { name: updatedListName, exact: true })).toBeVisible();

    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Видалити список" }).click();
    await expect(page.getByText("Список видалено.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: updatedListName, exact: true })).toHaveCount(0);
    await expect(page.locator("button[aria-pressed]").first()).toBeEnabled();

    const nextListName = `${listName} next`;
    await page.locator("#new-list-name").fill(nextListName);
    await page.getByRole("button", { name: "Створити", exact: true }).click();
    const nextListButton = page.getByRole("button", { name: nextListName, exact: true });
    await expect(nextListButton).toBeEnabled();
    await nextListButton.click();
    await expect(page.getByLabel("Назва списку")).toHaveValue(nextListName);
    await expect(page.getByRole("button", { name: "Зберегти", exact: true })).toBeEnabled();

    const lists = await page.request.get("/api/lists/my");
    expect(lists.ok()).toBeTruthy();
    expect((await lists.json() as Array<{ name: string }>).some(list => list.name === listName || list.name === updatedListName)).toBeFalsy();
  } finally {
    await cleanupDisposableAccount(baseURL, email, password);
  }
});

test("owner retries failed list items and returns from an emptied last page", async ({ page }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `list-retry-${suffix}@example.invalid`;
  const password = "E2e-password-123!";
  let itemAttempts = 0;
  let deleted = false;
  const firstPage = Array.from({ length: 12 }, (_, index) => ({
    id: 77000 + index,
    name: `Fixture list ${index + 1}`,
    description: null,
    listType: "CUSTOM",
    isPublic: false,
    tags: [],
  }));

  const csrfHeaders = async () => {
    await page.request.get("/api/auth/csrf");
    const cookie = (await page.context().cookies()).find(item => item.name === "XSRF-TOKEN");
    expect(cookie, "XSRF cookie must be present before cleanup").toBeTruthy();
    return { "X-XSRF-TOKEN": decodeURIComponent(cookie!.value) };
  };

  await page.goto("/uk/register");
  await page.getByLabel("Нікнейм").fill(`retry${suffix.slice(-12)}`);
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
    await page.route("**/api/lists/my/page**", async route => {
      const currentPage = Number(new URL(route.request().url()).searchParams.get("page") ?? "0");
      if (deleted) {
        await route.fulfill({ json: { content: firstPage, totalPages: 1, totalElements: 12, number: 0 } });
      } else if (currentPage === 0) {
        await route.fulfill({ json: { content: firstPage, totalPages: 2, totalElements: 13, number: 0 } });
      } else {
        await route.fulfill({ json: { content: [{ ...firstPage[0], id: 77777, name: "Fixture last-page list" }], totalPages: 2, totalElements: 13, number: 1 } });
      }
    });
    await page.route("**/api/lists/77777/items", async route => {
      itemAttempts += 1;
      if (itemAttempts === 1) {
        await route.fulfill({ status: 503, json: { message: "Temporary item failure" } });
      } else {
        await route.fulfill({ json: [] });
      }
    });
    await page.route("**/api/lists/77777", async route => {
      if (route.request().method() !== "DELETE") return route.fallback();
      deleted = true;
      await route.fulfill({ status: 204, body: "" });
    });

    await page.goto("/uk/lists");
    const listRegion = page.getByRole("region", { name: "Списки" }).first();
    const pagination = listRegion.getByRole("navigation", { name: "Сторінки списків" });
    await expect(listRegion).toHaveAttribute("aria-busy", "false");
    await expect(pagination.getByText("Сторінка 1 з 2 · 13", { exact: true })).toBeVisible();
    await pagination.getByRole("button", { name: "Далі" }).click();
    await expect(pagination.getByText("Сторінка 2 з 2 · 13", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Fixture last-page list", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Не вдалося завантажити фільми.");
    await expect(page.getByRole("button", { name: "Спробувати ще" })).toBeVisible();
    await page.getByRole("button", { name: "Спробувати ще" }).click();
    await expect(page.getByText("Тут поки немає фільмів. Додайте їх зі сторінки фільму.", { exact: true })).toBeVisible();
    expect(itemAttempts).toBe(2);

    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Видалити список" }).click();
    await expect(page.getByText("Список видалено.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Fixture list 1", exact: true })).toBeVisible();
    await expect(pagination).toHaveCount(0);
    expect(deleted).toBeTruthy();
  } finally {
    const cleanup = await page.request.delete("/api/profile/me", {
      headers: await csrfHeaders(),
      data: { currentPassword: password },
    });
    expect.soft(cleanup.ok(), "Disposable list-retry account must be removed").toBeTruthy();
  }
});
