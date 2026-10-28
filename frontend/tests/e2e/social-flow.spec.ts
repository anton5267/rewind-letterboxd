import { expect, test } from "@playwright/test";

async function registerAndLogin(page: import("@playwright/test").Page, suffix: string, username: string) {
  const email = `${username}-${suffix}@example.invalid`;
  const password = "E2e-password-123!";
  await page.goto("/uk/register");
  await page.getByLabel("Нікнейм").fill(`${username}${suffix}`);
  await page.getByLabel("Електронна пошта").fill(email);
  await getByLabel(page, "Пароль").fill(password);
  await page.getByRole("button", { name: "Створити акаунт" }).click();
  await expect(page.getByRole("heading", { name: /Акаунт створено/ })).toBeVisible();
  await page.getByRole("button", { name: "Перейти до входу" }).click();
  await page.getByLabel("Електронна пошта").fill(email);
  await getByLabel(page, "Пароль").fill(password);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);
  return { email, password };
}

function getByLabel(page: import("@playwright/test").Page, label: string) {
  return page.getByLabel(label);
}

async function deleteCurrentSession(page: import("@playwright/test").Page, password: string) {
  try {
    const csrf = await page.request.get("/api/auth/csrf", { timeout: 3000 });
    if (!csrf.ok()) return false;
    const cookie = (await page.context().cookies()).find(item => item.name === "XSRF-TOKEN");
    if (!cookie) return false;
    const response = await page.request.delete("/api/profile/me", {
      headers: { "X-XSRF-TOKEN": decodeURIComponent(cookie.value) },
      data: { currentPassword: password },
      timeout: 3000,
    });
    return response.ok();
  } catch {
    return false;
  }
}

async function cleanupUser(page: import("@playwright/test").Page, credentials: { email: string; password: string }) {
  if (await deleteCurrentSession(page, credentials.password)) return true;
  try {
    const csrf = await page.request.get("/api/auth/csrf", { timeout: 3000 });
    const cookie = (await page.context().cookies()).find(item => item.name === "XSRF-TOKEN");
    if (!csrf.ok() || !cookie) throw new Error(`CSRF status ${csrf.status()}`);
    const login = await page.request.post("/api/auth/login", {
      data: credentials,
      headers: { "X-XSRF-TOKEN": decodeURIComponent(cookie.value) },
      timeout: 3000,
    });
    if (!login.ok()) throw new Error(`login status ${login.status()}`);
    return await deleteCurrentSession(page, credentials.password);
  } catch (error) {
    test.info().annotations.push({ type: "cleanup-warning", description: `${credentials.email}: ${String(error)}` });
    return false;
  }
}

test("user can follow another profile and receive a notification", async ({ page }) => {
  test.setTimeout(60_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  let first: { email: string; password: string } | null = null;
  let second: { email: string; password: string } | null = null;
  try {
    first = await registerAndLogin(page, suffix, "social-a");
    const firstCredentials = first!;
    const firstUser = await page.evaluate(async () => (await fetch("/api/users/me")).json() as { id: number });

    await page.getByRole("button", { name: "Вийти" }).click();
    await expect(page).toHaveURL(/\/uk\/login$/);

    second = await registerAndLogin(page, suffix, "social-b");
    const secondUser = await page.evaluate(async () => (await fetch("/api/users/me")).json() as { id: number });
    await page.goto(`/uk/users/${firstUser.id}`);
    await expect(page.getByRole("heading", { name: new RegExp(`social-a${suffix}`) })).toBeVisible();
    const followButton = page.getByRole("button", { name: "Підписатися" });
    await expect(followButton).toBeVisible();
    await followButton.click();
    await expect(page.getByRole("button", { name: "Відписатися" })).toBeVisible();
    const followersSection = page.locator("section").filter({ has: page.getByRole("heading", { name: "Підписники" }) });
    await expect(followersSection).toBeVisible();
    await expect(followersSection.getByRole("link", { name: new RegExp(`social-b${suffix}`) })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Остання активність" })).toBeVisible();

    await page.getByRole("button", { name: "Вийти" }).click();
    await expect(page).toHaveURL(/\/uk\/login$/);
    await page.getByLabel("Електронна пошта").fill(firstCredentials.email);
    await page.getByLabel("Пароль", { exact: true }).fill(firstCredentials.password);
    await page.getByRole("button", { name: "Увійти" }).click();
    await expect(page).toHaveURL(/\/uk\/films$/);
    await expect(page.getByRole("button", { name: "Вийти" })).toBeVisible();
    await expect(page.getByLabel(/не прочитано: \d+/)).toBeVisible();
    await page.goto("/uk/notifications");
    await expect(page.getByRole("heading", { name: "Сповіщення" })).toBeVisible();
    await expect(page.getByText(/підписав/)).toBeVisible();

    const followPreference = page.getByLabel("Нові підписки");
    const originalFollowPreference = await followPreference.isChecked();
    await followPreference.click();
    await expect(page.getByRole("status")).toContainText("Налаштування збережено.");
    await page.reload();
    await expect(page.getByLabel("Нові підписки")).toBeChecked({ checked: !originalFollowPreference });
    await page.getByLabel("Нові підписки").click();
    await expect(page.getByRole("status")).toContainText("Налаштування збережено.");

    const message = `E2E private message ${suffix}`;
    await page.goto(`/uk/messages?user=${secondUser.id}`);
    await expect(page.getByRole("heading", { name: "Повідомлення" })).toBeVisible();
    await page.getByLabel("Текст повідомлення").fill(message);
    await page.getByRole("button", { name: "Написати" }).click();
    await expect(page.getByText(message).last()).toBeVisible();

    await page.getByRole("button", { name: "Вийти" }).click();
    await expect(page).toHaveURL(/\/uk\/login$/);
    await page.getByLabel("Електронна пошта").fill(`${"social-b"}-${suffix}@example.invalid`);
    await getByLabel(page, "Пароль").fill("E2e-password-123!");
    await page.getByRole("button", { name: "Увійти" }).click();
    await expect(page).toHaveURL(/\/uk\/films$/);
    await page.goto(`/uk/users/${firstUser.id}`);
    await expect(page.getByRole("button", { name: "Заблокувати" })).toBeVisible();
    await page.getByRole("button", { name: "Заблокувати" }).click();
    await expect(page.getByRole("button", { name: "Розблокувати" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Написати" })).toHaveCount(0);
    await page.goto(`/uk/messages?user=${firstUser.id}`);
    await expect(page.getByRole("alert")).toContainText("Не вдалося відкрити діалог.");
    await page.goto(`/uk/users/${firstUser.id}`);
    await page.getByRole("button", { name: "Розблокувати" }).click();
    await expect(page.getByRole("button", { name: "Заблокувати" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Написати" })).toBeVisible();
    await page.goto("/uk/messages");
    await expect(page.getByText(message).last()).toBeVisible();
  } finally {
    if (second) await cleanupUser(page, second);
    if (first) await cleanupUser(page, first);
  }
});
