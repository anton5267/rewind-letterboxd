import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("admin conversation delete returns keyboard focus after the row disappears", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900010, username: "admin-fixture", role: "ADMIN", displayName: "Admin Fixture",
    email: "admin@example.invalid", avatarUrl: null, isActive: true, isHq: false,
  } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "conversation-fixture" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));

  let deleted = false;
  let deleteAttempts = 0;
  await page.route(/\/api\/admin\/conversations(?:\?.*)?$/, route => route.fulfill({ json: {
    content: deleted ? [] : [{ id: 901, userOneId: 902, userTwoId: 903, messageCount: 2,
      createdAt: "2026-11-03T12:00:00Z", updatedAt: "2026-11-03T13:00:00Z", lastMessageAt: "2026-11-03T13:00:00Z" }],
    totalPages: deleted ? 0 : 1, totalElements: deleted ? 0 : 1, number: 0, size: 50,
  } }));
  await page.route("**/api/admin/conversations/901", async route => {
    deleteAttempts++;
    if (deleteAttempts === 1) {
      await route.fulfill({ status: 503, json: {} });
      return;
    }
    deleted = true;
    await route.fulfill({ status: 204, body: "" });
  });

  await page.goto("/uk/admin?view=conversations");
  const section = page.getByRole("region", { name: "Діалоги" });
  const deleteButton = section.getByRole("button", { name: "Видалити діалог" });
  await deleteButton.click();
  const dialog = page.getByRole("alertdialog", { name: "Видалити діалог" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Скасувати" }).click();
  await expect(deleteButton).toBeFocused();

  await deleteButton.click();
  await dialog.getByRole("button", { name: "Видалити діалог" }).click();
  await expect(section.getByRole("alert")).toBeVisible();
  await expect(deleteButton).toBeFocused();

  await deleteButton.click();
  await dialog.getByRole("button", { name: "Видалити діалог" }).click();
  await expect(section.getByRole("listitem")).toHaveCount(0);
  await expect(section.getByRole("heading", { name: "Діалоги" })).toBeFocused();
  expect(deleteAttempts).toBe(2);

  const captureDirectory = resolve(process.cwd(), "../artifacts/functional-audit-20261103/admin-conversations");
  await mkdir(captureDirectory, { recursive: true });
  for (const width of [1440, 393]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(captureDirectory, `deleted-empty-uk-${width}-fixture.png`), fullPage: true });
  }
});
