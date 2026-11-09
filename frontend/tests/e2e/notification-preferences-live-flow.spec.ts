import { expect, request, test, type APIRequestContext } from "@playwright/test";
import { cleanupDisposableAccount } from "./helpers";

async function mutate(api: APIRequestContext, method: "POST", path: string, data?: unknown) {
  expect((await api.get("/api/auth/csrf")).status()).toBe(200);
  const cookie = (await api.storageState()).cookies.find(item => item.name === "XSRF-TOKEN");
  expect(cookie).toBeTruthy();
  return api.fetch(path, { method, headers: { "X-XSRF-TOKEN": decodeURIComponent(cookie!.value) }, data });
}

test("notification preferences persist through the live API", async ({ page, baseURL }) => {
  test.setTimeout(60_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = `notify_live_${suffix}`;
  const email = `${username}@example.invalid`;
  const password = "E2e-password-123!";
  let registered = false;

  try {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/uk/register");
    await page.getByLabel("Нікнейм").fill(username);
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    const registration = page.waitForResponse(response => new URL(response.url()).pathname === "/api/auth/register" && response.request().method() === "POST");
    await page.getByRole("button", { name: "Створити акаунт" }).click();
    expect((await registration).status()).toBe(200);
    registered = true;

    await page.getByRole("button", { name: "Перейти до входу" }).click();
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Увійти" }).click();
    await expect(page).toHaveURL(/\/uk\/films$/);

    await page.goto("/uk/notifications");
    await expect(page.getByRole("heading", { name: "Сповіщення" })).toBeVisible();
    const followsPreference = page.getByRole("checkbox", { name: "Нові підписки" });
    await expect(followsPreference).toBeVisible();
    const before = await (await page.request.get("/api/notifications/preferences")).json() as { followsEnabled: boolean; reviewLikesEnabled: boolean };
    await expect(followsPreference).toBeChecked({ checked: before.followsEnabled });

    const save = page.waitForResponse(response => new URL(response.url()).pathname === "/api/notifications/preferences" && response.request().method() === "PUT");
    await followsPreference.click();
    expect((await save).status()).toBe(200);
    await expect(followsPreference).toBeChecked({ checked: !before.followsEnabled });
    expect(await (await page.request.get("/api/notifications/preferences")).json()).toEqual({
      ...before,
      followsEnabled: !before.followsEnabled,
    });

    await page.reload();
    await expect(page.getByRole("checkbox", { name: "Нові підписки" })).toBeChecked({ checked: !before.followsEnabled });
    expect(await (await page.request.get("/api/notifications/preferences")).json()).toEqual({
      ...before,
      followsEnabled: !before.followsEnabled,
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
  } finally {
    if (registered) await cleanupDisposableAccount(baseURL, email, password);
  }
});

test("a live follow notification remains read after reload", async ({ page, baseURL }) => {
  test.setTimeout(60_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const targetUsername = `notify_target_${suffix}`;
  const actorUsername = `notify_actor_${suffix}`;
  const targetEmail = `${targetUsername}@example.invalid`;
  const actorEmail = `${actorUsername}@example.invalid`;
  const password = "E2e-password-123!";
  let targetRegistered = false;
  let actorRegistered = false;
  const actorApi = await request.newContext({ baseURL });

  try {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/uk/register");
    await page.getByLabel("Нікнейм").fill(targetUsername);
    await page.getByLabel("Електронна пошта").fill(targetEmail);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    const targetRegistration = page.waitForResponse(response => new URL(response.url()).pathname === "/api/auth/register" && response.request().method() === "POST");
    await page.getByRole("button", { name: "Створити акаунт" }).click();
    const targetResponse = await targetRegistration;
    expect(targetResponse.status()).toBe(200);
    targetRegistered = true;
    const targetId = Number((await targetResponse.json() as { id: number }).id);

    const actorRegistration = await mutate(actorApi, "POST", "/api/auth/register", { username: actorUsername, email: actorEmail, password });
    expect(actorRegistration.status()).toBe(200);
    actorRegistered = true;
    const actorId = Number((await actorRegistration.json() as { id: number }).id);
    const actorLogin = await mutate(actorApi, "POST", "/api/auth/login", { email: actorEmail, password });
    expect(actorLogin.status()).toBe(200);

    const follow = await mutate(actorApi, "POST", `/api/users/${targetId}/follow`);
    expect(follow.status()).toBe(204);
    await page.getByRole("button", { name: "Перейти до входу" }).click();
    await page.getByLabel("Електронна пошта").fill(targetEmail);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Увійти" }).click();
    await expect(page).toHaveURL(/\/uk\/films$/);

    await page.goto("/uk/notifications");
    const feed = page.locator('section[aria-label="Сповіщення"]');
    const notification = feed.locator("li").filter({ hasText: actorUsername });
    await expect(notification).toBeVisible();
    const markRead = notification.getByRole("button", { name: "Прочитано", exact: true });
    const readRequest = page.waitForResponse(response => /^\/api\/notifications\/\d+\/read$/.test(new URL(response.url()).pathname) && response.request().method() === "POST");
    await markRead.click();
    expect((await readRequest).status()).toBe(204);
    await expect(markRead).toHaveCount(0);
    expect(await (await page.request.get("/api/notifications/unread-count")).json()).toEqual({ count: 0 });

    await page.reload();
    const pageData = await (await page.request.get("/api/notifications?page=0&size=20")).json() as { content: { actor: { id: number } | null; readAt: string | null }[] };
    expect(pageData.content.find(item => item.actor?.id === actorId)?.readAt).not.toBeNull();
    await expect(feed.locator("li").filter({ hasText: actorUsername }).getByRole("button", { name: "Прочитано", exact: true })).toHaveCount(0);
  } finally {
    if (actorRegistered) await cleanupDisposableAccount(baseURL, actorEmail, password);
    if (targetRegistered) await cleanupDisposableAccount(baseURL, targetEmail, password);
    await actorApi.dispose();
  }
});
