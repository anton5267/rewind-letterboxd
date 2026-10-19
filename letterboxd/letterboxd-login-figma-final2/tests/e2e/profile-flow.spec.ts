import { expect, test } from "@playwright/test";

test.setTimeout(60_000);

test("profile collection is visible in own and public profile", async ({ page }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = `profile${suffix.slice(-12)}`;
  const email = `${username}@example.invalid`;
  const password = "E2e-password-123!";
  const changedPassword = "E2e-password-changed-123!";
  let activePassword = password;

  const csrfHeaders = async () => {
    const cookie = (await page.context().cookies()).find(item => item.name === "XSRF-TOKEN");
    expect(cookie, "XSRF cookie must be present before cleanup").toBeTruthy();
    return { "X-XSRF-TOKEN": decodeURIComponent(cookie!.value) };
  };

  await page.goto("/uk/register");
  await page.getByLabel("Нікнейм").fill(username);
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
    const firstFilm = page.locator("main article h2 a").first();
    await expect(firstFilm).toBeVisible();
    await firstFilm.click();
    await expect(page).toHaveURL(/\/uk\/films\/\d+$/);
    const movieTitle = await page.getByRole("heading", { level: 1 }).textContent();
    expect(movieTitle).toBeTruthy();
    await page.getByRole("button", { name: "Переглянуто" }).click();
    await expect(page.getByRole("button", { name: "Переглянуто" })).toHaveAttribute("aria-pressed", "true");

    const currentUser = await page.evaluate(async () => (await fetch("/api/users/me")).json() as { id: number });
    expect(currentUser.id).toBeGreaterThan(0);

    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/uk/profile");
    const ownOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(ownOverflow, `own profile overflows horizontally by ${ownOverflow}px`).toBeLessThanOrEqual(1);
    await expect(page.getByRole("heading", { name: "Мій профіль" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Підписки" })).toBeVisible();
    await expect(page.getByText(/Переглянуто:\s*1/)).toBeVisible();
    await expect(page.getByRole("tab", { name: "Переглянуто" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("link", { name: movieTitle!.trim(), exact: true })).toBeVisible();

    const ownProfile = await page.request.get("/api/profile/me");
    expect(ownProfile.ok()).toBeTruthy();
    expect((await ownProfile.json() as { stats: { watched: number } }).stats.watched).toBe(1);

    await page.getByRole("button", { name: "Меню" }).click();
    await expect(page.getByRole("button", { name: "Вийти" })).toBeVisible();
    await page.getByRole("button", { name: "Вийти" }).click();
    await expect(page).toHaveURL(/\/uk\/login$/);
    await page.goto(`/uk/users/${currentUser.id}`);
    const publicOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(publicOverflow, `public profile overflows horizontally by ${publicOverflow}px`).toBeLessThanOrEqual(1);
    await expect(page.getByRole("heading", { name: username })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Статистика" })).toBeVisible();
    await expect(page.getByText(/Переглянуто:\s*1/)).toBeVisible();
    await expect(page.getByRole("tab", { name: "Переглянуто" })).toBeVisible();
    await expect(page.getByRole("link", { name: movieTitle!.trim(), exact: true })).toBeVisible();
    await expect(page.getByText("Не вдалося завантажити публічний список.")).toHaveCount(0);
    await expect(page.getByText("Публічних списків поки немає.")).toBeVisible();

    await page.goto("/uk/login");
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль").fill(password);
    await page.getByRole("button", { name: "Увійти" }).click();
    await expect(page).toHaveURL(/\/uk\/films$/);
    await page.goto("/uk/profile");
    const passwordForm = page.locator("form").filter({ has: page.getByRole("heading", { name: "Змінити пароль" }) });
    await passwordForm.getByLabel("Поточний пароль").fill(activePassword);
    await passwordForm.getByLabel("Новий пароль").fill(changedPassword);
    await passwordForm.getByRole("button", { name: "Змінити пароль" }).click();
    activePassword = changedPassword;
    await expect(page).toHaveURL(/\/uk\/login\?passwordChanged=1$/);
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль").fill(activePassword);
    await page.getByRole("button", { name: "Увійти" }).click();
    await expect(page).toHaveURL(/\/uk\/films$/);
    await page.goto("/uk/profile");
    const deletionForm = page.locator("form").filter({ has: page.getByRole("heading", { name: "Видалення акаунта" }) });
    await deletionForm.getByLabel("Поточний пароль").fill(activePassword);
    page.once("dialog", dialog => dialog.accept());
    await deletionForm.getByRole("button", { name: "Видалення акаунта" }).click();
    await expect(page).toHaveURL(/\/uk\/home$/);
    await page.goto("/uk/profile");
    await expect(page).toHaveURL(/\/uk\/login$/);
  } finally {
    const login = await page.request.post("/api/auth/login", { data: { email, password: activePassword }, headers: await csrfHeaders() });
    if (login.ok()) {
      const cleanup = await page.request.delete("/api/profile/me", {
        headers: await csrfHeaders(),
        data: { currentPassword: activePassword },
      });
      expect.soft(cleanup.ok(), "Disposable profile-test account must be removed").toBeTruthy();
    }
  }
});
