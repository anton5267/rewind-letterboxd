import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("admin notification delete keeps focus after failure and after row removal", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900010, username: "admin-fixture", role: "ADMIN", displayName: "Admin Fixture",
    email: "admin@example.invalid", avatarUrl: null, isActive: true, isHq: false,
  } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "notification-delete-fixture" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));

  let deleted = false;
  let deleteAttempts = 0;
  await page.route(/\/api\/admin\/notifications(?:\?.*)?$/, route => route.fulfill({ json: {
    content: deleted ? [] : [{ id: 901, recipientId: 902, actorId: null, type: "FOLLOW", reviewId: null,
      createdAt: "2026-11-03T12:00:00Z", readAt: null }],
    totalPages: deleted ? 0 : 1, totalElements: deleted ? 0 : 1, number: 0, size: 50,
  } }));
  await page.route("**/api/admin/notifications/901", async route => {
    deleteAttempts++;
    if (deleteAttempts === 1) await route.fulfill({ status: 503, json: {} });
    else { deleted = true; await route.fulfill({ status: 204, body: "" }); }
  });

  await page.goto("/uk/admin?view=notifications");
  const section = page.getByRole("region", { name: "Сповіщення" });
  const deleteButton = section.getByRole("button", { name: "Видалити сповіщення" });
  await deleteButton.click();
  const dialog = page.getByRole("alertdialog", { name: "Видалити сповіщення" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Скасувати" }).click();
  await expect(deleteButton).toBeFocused();

  await deleteButton.click();
  await dialog.getByRole("button", { name: "Видалити сповіщення" }).click();
  await expect(section.getByRole("alert")).toBeVisible();
  await expect(deleteButton).toBeFocused();

  await deleteButton.click();
  await dialog.getByRole("button", { name: "Видалити сповіщення" }).click();
  await expect(section.getByRole("listitem")).toHaveCount(0);
  await expect(section.getByRole("heading", { name: "Сповіщення" })).toBeFocused();
  await expect(section.getByRole("heading", { name: "Сповіщення" })).toHaveCSS("outline-style", "solid");
  expect(deleteAttempts).toBe(2);

  const captureDirectory = resolve(process.cwd(), "../artifacts/functional-audit-20261103/admin-notification-delete");
  await mkdir(captureDirectory, { recursive: true });
  for (const width of [1440, 393]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(section.getByRole("heading", { name: "Сповіщення" })).toBeFocused();
    await page.screenshot({ path: resolve(captureDirectory, `deleted-empty-uk-${width}-fixture.png`), fullPage: true });
  }
});

test("bulk notification delete restores focus on failure and keeps it in the empty section", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900010, username: "admin-fixture", role: "ADMIN", displayName: "Admin Fixture",
    email: "admin@example.invalid", avatarUrl: null, isActive: true, isHq: false,
  } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "notification-delete-fixture" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));

  let deleted = false;
  let deleteAttempts = 0;
  await page.route(/\/api\/admin\/notifications(?:\?.*)?$/, async route => {
    if (route.request().method() === "DELETE") {
      deleteAttempts++;
      if (deleteAttempts === 1) await route.fulfill({ status: 503, json: {} });
      else { deleted = true; await route.fulfill({ json: { deleted: 1 } }); }
      return;
    }
    await route.fulfill({ json: {
      content: deleted ? [] : [{ id: 901, recipientId: 902, actorId: null, type: "FOLLOW", reviewId: null,
        createdAt: "2026-11-03T12:00:00Z", readAt: null }],
      totalPages: deleted ? 0 : 1, totalElements: deleted ? 0 : 1, number: 0, size: 50,
    } });
  });

  await page.goto("/uk/admin?view=notifications");
  const section = page.getByRole("region", { name: "Сповіщення" });
  const deleteButton = section.getByRole("button", { name: "Видалити відфільтровані" });
  await deleteButton.click();
  const dialog = page.getByRole("alertdialog", { name: "Видалити відфільтровані" });
  await dialog.getByRole("button", { name: "Видалити відфільтровані" }).click();
  await expect(section.getByRole("alert")).toBeVisible();
  await expect(deleteButton).toBeFocused();

  await deleteButton.click();
  await dialog.getByRole("button", { name: "Видалити відфільтровані" }).click();
  await expect(section.getByRole("listitem")).toHaveCount(0);
  await expect(section.getByRole("heading", { name: "Сповіщення" })).toBeFocused();
  expect(deleteAttempts).toBe(2);
});
