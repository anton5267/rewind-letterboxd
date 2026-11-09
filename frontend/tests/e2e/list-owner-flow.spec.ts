import { expect, test } from "@playwright/test";
import { browserMutation, cleanupDisposableAccount } from "./helpers";

test("owner creates and deletes a custom list", async ({ page, baseURL }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `list-e2e-${suffix}@example.invalid`;
  const password = "E2e-password-123!";
  const listName = `Disposable list ${suffix}`;

  await page.goto("/uk/register");
  await page.getByLabel("Нікнейм").fill(`list${suffix.slice(-12)}`);
  await page.getByLabel("Електронна пошта").fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Створити акаунт" }).click();
  await expect(page.getByRole("heading", { name: /Акаунт створено/ })).toBeVisible();

  await page.getByRole("button", { name: "Перейти до входу" }).click();
  await page.getByLabel("Електронна пошта").fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
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
    await page.getByRole("button", { name: "Додати фільм" }).click();
    await page.getByLabel("Пошук фільмів").fill("The Wrecking Crew");
    await page.getByRole("button", { name: /The Wrecking Crew/ }).click();
    await page.getByRole("button", { name: "Зберегти", exact: true }).click();
    await expect(page).toHaveURL(/\/uk\/lists\?list=\d+&mode=view$/);
    const createdId = Number(new URL(page.url()).searchParams.get("list"));
    expect(createdId).toBeGreaterThan(0);
    await expect(page.getByRole("status").filter({ hasText: "Список створено." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Налаштування списку" })).toHaveAttribute("href", `/uk/lists?list=${createdId}&mode=edit`);
    await page.getByRole("link", { name: "Налаштування списку" }).click();
    await expect(page.locator("#edit-list-name")).toHaveValue(listName);
    const updatedListName = `${listName} updated`;
    await page.locator("#edit-list-name").fill(updatedListName);
    await page.getByRole("button", { name: "Зберегти", exact: true }).click();
    await expect(page.locator("#edit-list-name")).toHaveValue(updatedListName);
    let listNameUpdates = 0;
    page.on("request", request => {
      if (new URL(request.url()).pathname === `/api/lists/${createdId}` && request.method() === "PATCH") listNameUpdates += 1;
    });
    const saveList = page.getByRole("button", { name: "Зберегти", exact: true });
    await page.locator("#edit-list-name").fill("   ");
    await expect(page.locator("#edit-list-name")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#edit-list-name")).toHaveAttribute("aria-describedby", "edit-list-name-error");
    await expect(page.getByRole("alert")).toContainText("Введіть назву списку.");
    await expect(saveList).toBeDisabled();
    await saveList.click({ force: true });
    expect(listNameUpdates, "Blank list names must not reach the API").toBe(0);
    await page.locator("#edit-list-name").fill(updatedListName);
    await expect(saveList).toBeEnabled();
    const addFilmLink = page.getByRole("link", { name: "Додати фільм", exact: true }).first();
    await expect(addFilmLink).toHaveAttribute("href", "/uk/films");

    // Verify the public-list like against the live API, including its persisted
    // status/count after a reload, before deleting the disposable list.
    await page.goto(`/uk/lists/public/${createdId}`);
    const likeList = page.getByRole("button", { name: "Вподобати список", exact: true }).first();
    await expect(likeList).toBeVisible();
    await likeList.click();
    const unlikeList = page.getByRole("button", { name: "Прибрати вподобання", exact: true }).first();
    await expect(unlikeList).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "Прибрати вподобання", exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "Прибрати вподобання", exact: true }).first().click();
    await expect(page.getByRole("button", { name: "Вподобати список", exact: true }).first()).toBeVisible();
    await page.goto(`/uk/lists?list=${createdId}&mode=edit`);
    await page.getByRole("button", { name: "Видалити список" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Видалити список" }).click();
    await expect(page.getByText("Список видалено.", { exact: true })).toBeVisible();
    const lists = await page.request.get("/api/lists/my");
    expect(lists.ok()).toBeTruthy();
    expect((await lists.json() as Array<{ id: number }>).some(list => list.id === createdId)).toBeFalsy();
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
  const requestedPages: number[] = [];
  let linkedListId = 0;
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
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Створити акаунт" }).click();
  await expect(page.getByRole("heading", { name: /Акаунт створено/ })).toBeVisible();
  await page.getByRole("button", { name: "Перейти до входу" }).click();
  await page.getByLabel("Електронна пошта").fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);

  try {
    const createdList = await browserMutation(page, "/api/lists", "POST", {
      name: `Retry owner ${suffix}`, description: "Disposable list for the paginated editor flow", isPublic: false, tags: [], movieIds: [5],
    });
    expect(createdList.status).toBe(200);
    linkedListId = Number((createdList.data as { id: number }).id);
    expect(linkedListId).toBeGreaterThan(0);

    await page.route("**/api/lists/my/page**", async route => {
      const currentPage = Number(new URL(route.request().url()).searchParams.get("page") ?? "0");
      requestedPages.push(currentPage);
      if (deleted) {
        await route.fulfill({ json: { content: firstPage, totalPages: 1, totalElements: 12, number: 0 } });
      } else if (currentPage === 0) {
        await route.fulfill({ json: { content: firstPage, totalPages: 2, totalElements: 13, number: 0 } });
      } else {
        await route.fulfill({ json: { content: [{ ...firstPage[0], id: 77777, name: "Fixture last-page list" }], totalPages: 2, totalElements: 13, number: 1 } });
      }
    });
    await page.route("**/api/lists/my", route => route.fulfill({ json: deleted
      ? firstPage
      : [...firstPage, { ...firstPage[0], id: 77777, name: "Fixture last-page list" }, { ...firstPage[0], id: linkedListId, name: `Retry owner ${suffix}` }] }));
    await page.route("**/api/lists/77777/items", async route => {
      itemAttempts += 1;
      if (itemAttempts === 1) {
        await route.fulfill({ status: 503, json: { message: "Temporary item failure" } });
      } else {
        await route.fulfill({ json: [] });
      }
    });
    await page.route("**/api/lists/77777", async route => {
      if (route.request().method() === "GET") return route.fulfill({ json: { ...firstPage[0], id: 77777, name: "Fixture last-page list" } });
      if (route.request().method() !== "DELETE") return route.fallback();
      deleted = true;
      await route.fulfill({ status: 204, body: "" });
    });

    // The current /lists default is the standalone Create List screen. Open
    // an existing editable list so its supported list picker is visible.
    await page.goto(`/uk/lists?list=${linkedListId}&mode=edit`);
    await expect(page.locator('main[data-list-editor="edit"]')).toBeVisible();
    const listRegion = page.getByRole("region", { name: "Списки" });
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

    await page.getByRole("button", { name: "Видалити список" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Видалити список" }).click();
    await expect(page.getByText("Список видалено.", { exact: true })).toBeVisible();
    await expect(page.locator("#new-list-name")).toBeVisible();
    await expect.poll(() => requestedPages.at(-1)).toBe(0);
    expect(deleted).toBeTruthy();
  } finally {
    const cleanup = await page.request.delete("/api/profile/me", {
      headers: await csrfHeaders(),
      data: { currentPassword: password },
    });
    expect.soft(cleanup.ok(), "Disposable list-retry account must be removed").toBeTruthy();
  }
});
