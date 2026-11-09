import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("mark filtered as read never changes notifications hidden by the read filter", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900010, username: "admin-fixture", role: "ADMIN", displayName: "Admin Fixture",
    email: "admin@example.invalid", avatarUrl: null, isActive: true, isHq: false,
  } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "notification-fixture" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));

  const listFilters: string[] = [];
  await page.route(/\/api\/admin\/notifications(?:\?.*)?$/, async route => {
    const read = new URL(route.request().url()).searchParams.get("read");
    listFilters.push(read ?? "all");
    await route.fulfill({ json: {
      content: [{ id: 901, recipientId: 902, actorId: null, type: "FOLLOW", reviewId: null,
        createdAt: "2026-11-03T12:00:00Z", readAt: read === "false" ? null : "2026-11-03T13:00:00Z" }],
      totalPages: 1, totalElements: 1, number: 0, size: 50,
    } });
  });
  let bulkReadRequests = 0;
  await page.route("**/api/admin/notifications/read-all**", async route => {
    bulkReadRequests++;
    await route.fulfill({ json: { updated: 1 } });
  });

  await page.goto("/uk/admin?view=notifications");
  const section = page.getByRole("region", { name: "Сповіщення" });
  const bulkRead = section.getByRole("button", { name: "Позначити відфільтровані прочитаними" });
  await expect(bulkRead).toBeEnabled();

  await section.getByLabel("Фільтр стану").selectOption("read");
  await section.getByRole("button", { name: "Фільтрувати" }).click();
  await expect(section.getByRole("listitem")).toHaveCount(1);
  await expect(bulkRead).toBeDisabled();
  expect(bulkReadRequests).toBe(0);
  expect(listFilters).toContain("true");
  const captureDirectory = resolve(process.cwd(), "../artifacts/functional-audit-20261103/admin-notifications");
  await mkdir(captureDirectory, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(captureDirectory, "read-filter-uk-1440-fixture.png"), fullPage: true });

  await section.getByLabel("Фільтр стану").selectOption("unread");
  await section.getByRole("button", { name: "Фільтрувати" }).click();
  await expect(section.getByRole("listitem")).toHaveCount(1);
  await expect(bulkRead).toBeEnabled();
  await bulkRead.click();
  await expect.poll(() => bulkReadRequests).toBe(1);
  expect(listFilters).toContain("false");

  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/admin?view=notifications");
  await section.getByLabel("Фільтр стану").selectOption("read");
  await section.getByRole("button", { name: "Фільтрувати" }).click();
  await expect(bulkRead).toBeDisabled();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(captureDirectory, "read-filter-uk-393-fixture.png"), fullPage: true });
});
