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
    const watchedButton = page.getByRole("button", { name: "Переглянуто" });
    await expect(watchedButton).toBeVisible();
    const movieTitle = await page.getByRole("heading", { level: 1 }).textContent();
    expect(movieTitle).toBeTruthy();
    await watchedButton.click();
    await expect(watchedButton).toHaveAttribute("aria-pressed", "true");

    const movieId = Number(page.url().match(/\/films\/(\d+)$/)?.[1]);
    expect(movieId).toBeGreaterThan(0);
    const reviewText = `Profile review navigation ${suffix}`;
    const createdReview = await page.request.post(`/api/movies/${movieId}/reviews`, {
      headers: await csrfHeaders(),
      data: { content: reviewText, rating: 4 },
    });
    expect(createdReview.ok(), "The disposable account must own a real review for navigation").toBeTruthy();
    const reviewId = (await createdReview.json() as { id: number }).id;
    expect(reviewId).toBeGreaterThan(0);

    const currentUser = await page.evaluate(async () => (await fetch("/api/users/me")).json() as { id: number });
    expect(currentUser.id).toBeGreaterThan(0);

    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/uk/profile");
    const ownOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(ownOverflow, `own profile overflows horizontally by ${ownOverflow}px`).toBeLessThanOrEqual(1);
    await expect(page.getByRole("heading", { name: "Мій профіль" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Підписки" })).toBeVisible();
    const watchedStat = page.locator("article").filter({ has: page.getByText("Переглянуто", { exact: true }) });
    await expect(watchedStat.getByText("1", { exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Переглянуто" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel").getByRole("link", { name: movieTitle!.trim(), exact: true })).toBeVisible();

    const ownReviewLink = page.locator("#profile-reviews").getByRole("link", { name: reviewText, exact: true });
    await expect(ownReviewLink).toHaveAttribute("href", `/uk/reviews/${reviewId}`);
    await ownReviewLink.focus();
    await expect(ownReviewLink).toBeFocused();
    await ownReviewLink.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/uk/reviews/${reviewId}$`));
    await expect(page.getByText(reviewText, { exact: true })).toBeVisible();
    await page.goto("/uk/profile");

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
    const publicWatchedStat = page.locator("article").filter({ has: page.getByText("Переглянуто", { exact: true }) });
    await expect(publicWatchedStat.getByText("1", { exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Переглянуто" })).toBeVisible();
    await expect(page.getByRole("tabpanel").getByRole("link", { name: movieTitle!.trim(), exact: true })).toBeVisible();
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
