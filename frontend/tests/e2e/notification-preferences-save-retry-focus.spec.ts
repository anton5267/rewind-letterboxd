import { expect, test, type Page, type Route } from "@playwright/test";

const user = { id: 97000, username: "notification-owner", role: "USER", displayName: "Notification Owner", avatarUrl: null };

async function installFixture(page: Page, failures: number, delayedRecovery = false) {
  let writes = 0;
  await page.route("**/api/notifications/stream", route => route.abort());
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ json: user });
    if (url.pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "notification-preference-focus" } });
    if (url.pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (url.pathname === "/api/notifications") return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } });
    if (url.pathname === "/api/notifications/preferences") {
      if (route.request().method() === "GET") return route.fulfill({ json: { followsEnabled: true, reviewLikesEnabled: true } });
      writes++;
      if (writes <= failures) return route.fulfill({ status: 503, json: {} });
      if (delayedRecovery) await new Promise(resolve => setTimeout(resolve, 350));
      return route.fulfill({ json: route.request().postDataJSON() });
    }
    return route.fulfill({ json: [] });
  });
  return () => writes;
}

test("Notifications preference save Retry focuses the new Retry after repeated failure, then the input after recovery", async ({ page }) => {
  const getWrites = await installFixture(page, 2);
  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/uk/notifications");
  const settings = page.getByRole("region", { name: "Налаштування сповіщень" });
  const input = settings.getByRole("checkbox", { name: "Нові підписки" });
  await input.focus();
  await input.press("Space");
  await expect(settings.getByRole("alert")).toContainText("Не вдалося зберегти");
  await expect(input).toBeFocused();
  const retry = settings.getByRole("button", { name: "Спробувати ще" });
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(getWrites).toBe(2);
  await expect(retry).toBeFocused();
  await retry.press("Enter");
  await expect.poll(getWrites).toBe(3);
  await expect(settings.getByRole("status")).toContainText("Налаштування збережено");
  await expect(input).not.toBeChecked();
  await expect(input).toBeFocused();
});

test("Notifications preference save Retry respects manual Tab while recovery is pending", async ({ page }) => {
  const getWrites = await installFixture(page, 1, true);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/notifications");
  const settings = page.getByRole("region", { name: "Notification settings" });
  const input = settings.getByRole("checkbox", { name: "New followers" });
  await input.focus();
  await input.press("Space");
  const retry = settings.getByRole("button", { name: "Retry" });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(getWrites).toBe(2);
  await page.keyboard.press("Tab");
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) document.activeElement.dataset.manualTabTarget = "true";
  });
  const manualTarget = page.locator('[data-manual-tab-target="true"]');
  await expect(manualTarget).toBeFocused();
  await expect(settings.getByRole("status")).toContainText("Settings saved.");
  await expect(manualTarget).toBeFocused();
  await expect(input).not.toBeFocused();
});
