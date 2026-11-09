import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("marking notifications read returns focus to retry, next action, then heading", async ({ page }) => {
  const user = { id: 97000, username: "notification-owner", role: "USER", displayName: "Notification Owner", avatarUrl: null };
  const notifications = [97001, 97002].map((id, index) => ({
    id,
    type: "FOLLOW",
    createdAt: `2026-11-0${index + 1}T12:00:00Z`,
    readAt: null,
    actor: { id: 97010 + index, username: `follower-${index}`, displayName: `Follower ${index + 1}`, avatarUrl: null },
    relatedUserId: 97010 + index,
    reviewId: null,
  }));
  const readNotifications = new Set<number>();
  let failFirstRead = true;
  let preferenceWrites = 0;
  let followsEnabled = true;
  await page.route("**/api/users/me", route => route.fulfill({ json: user }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "notification-focus-fixture" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 2 } }));
  await page.route("**/api/notifications/stream", route => route.abort());
  await page.route("**/api/notifications/preferences", route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { followsEnabled, reviewLikesEnabled: true } });
    preferenceWrites++;
    if (preferenceWrites === 1) return route.fulfill({ status: 503, json: {} });
    followsEnabled = (route.request().postDataJSON() as { followsEnabled: boolean }).followsEnabled;
    return route.fulfill({ json: { followsEnabled, reviewLikesEnabled: true } });
  });
  await page.route(/\/api\/notifications(?:\?.*)?$/, route => route.fulfill({ json: {
    content: notifications.map(item => ({ ...item, readAt: readNotifications.has(item.id) ? "2026-11-03T13:00:00Z" : null })),
    totalPages: 1,
    totalElements: notifications.length,
  } }));
  await page.route(/\/api\/notifications\/(97001|97002)\/read$/, async route => {
    const id = Number(new URL(route.request().url()).pathname.split("/").at(-2));
    if (failFirstRead) {
      failFirstRead = false;
      return route.fulfill({ status: 503, json: {} });
    }
    readNotifications.add(id);
    return route.fulfill({ status: 204, body: "" });
  });

  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/uk/notifications");
  const actions = page.locator("button[data-notification-mark-unread]");
  await expect(actions).toHaveCount(2);
  await actions.nth(0).focus();
  await actions.nth(0).press("Enter");
  const actionError = page.getByRole("alert").filter({ has: page.getByRole("button", { name: "Спробувати ще" }) });
  const retry = actionError.getByRole("button", { name: "Спробувати ще" });
  await expect(actionError).toContainText("Не вдалося змінити стан сповіщення.");
  await expect(retry).toBeFocused();
  await retry.press("Enter");
  await expect(actions).toHaveCount(1);
  await expect(actions).toBeFocused();
  await actions.press("Enter");
  await expect(actions).toHaveCount(0);
  const heading = page.getByRole("heading", { name: "Сповіщення" });
  await expect(heading).toBeFocused();

  const captureDirectory = resolve(process.cwd(), "../artifacts/functional-audit-20261103/notification-mark-focus");
  await mkdir(captureDirectory, { recursive: true });
  await page.screenshot({ path: resolve(captureDirectory, "notification-read-uk-393-fixture.png"), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: resolve(captureDirectory, "notification-read-uk-1440-fixture.png"), fullPage: true });

  await page.setViewportSize({ width: 393, height: 844 });
  const preferences = page.getByRole("region", { name: "Налаштування сповіщень" });
  const followPreference = preferences.getByRole("checkbox", { name: "Нові підписки" });
  await followPreference.focus();
  await followPreference.press("Space");
  const preferenceAlert = preferences.getByRole("alert");
  await expect(preferenceAlert).toContainText("Не вдалося зберегти налаштування.");
  await expect(followPreference).toBeChecked();
  await expect(followPreference).toBeFocused();
  const preferenceRetry = preferences.getByRole("button", { name: "Спробувати ще" });
  await preferenceRetry.focus();
  await preferenceRetry.press("Enter");
  await expect(preferences.getByRole("status")).toContainText("Налаштування збережено.");
  await expect(followPreference).not.toBeChecked();
  await expect(followPreference).toBeFocused();
  expect(preferenceWrites).toBe(2);
});
