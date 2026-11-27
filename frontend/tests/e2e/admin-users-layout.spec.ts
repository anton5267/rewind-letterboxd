import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const userRows = [
  { id: 900020, username: "Liza Salvinko", displayName: "Liza Salvinko", email: "liza.salv@gmail.com", role: "ADMIN", avatarUrl: null, isActive: true, isHq: false, createdAt: "2025-12-09T12:00:00Z" },
  { id: 900021, username: "Stas Honchar", displayName: "Stas Honchar", email: "stas.honchar@gmail.com", role: "USER", avatarUrl: null, isActive: true, isHq: false, createdAt: "2025-12-10T12:00:00Z" },
  { id: 900022, username: "Roman Pavluk", displayName: "Roman Pavluk", email: "roma.pavli@gmail.com", role: "USER", avatarUrl: null, isActive: false, isHq: true, createdAt: "2025-12-11T12:00:00Z" },
  { id: 900023, username: "Sveta Chernova", displayName: "Sveta Chernova", email: "sveta.cher@gmail.com", role: "ADMIN", avatarUrl: null, isActive: true, isHq: false, createdAt: "2025-12-12T12:00:00Z" },
];

test("Admin Users keeps its search and API rows contained across languages and responsive widths", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900010, username: "admin-fixture", role: "ADMIN", displayName: "Admin Fixture",
    email: "admin@example.invalid", avatarUrl: null, isActive: true, isHq: false,
  } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "admin-users-layout" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/admin/users**", route => route.fulfill({ json: {
    content: userRows, totalPages: 1, totalElements: userRows.length, number: 0, size: 50,
  } }));

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261125/admin-users");
  await mkdir(captureDirectory, { recursive: true });
  for (const locale of ["uk", "en"] as const) {
    const usersName = locale === "uk" ? "Користувачі" : "Users";
    const searchName = locale === "uk" ? "Пошук користувача" : "Search users";
    const listTitle = locale === "uk" ? "Список користувачів" : "User List";
    const profileAction = locale === "uk" ? /^Редагувати:/ : /^Edit:/;
    for (const width of [320, 393, 600, 720, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/admin?view=users`);
      const section = page.getByRole("region", { name: usersName });
      await expect(section.getByRole("heading", { name: listTitle })).toBeVisible();
      await expect(section.getByRole("searchbox", { name: searchName })).toBeVisible();
      await expect(section.getByRole("button", { name: locale === "uk" ? "Пошук" : "Search" })).toBeVisible();
      await expect(section.getByText("Liza Salvinko")).toBeVisible();
      await expect(section.getByText("sveta.cher@gmail.com")).toBeVisible();
      await expect(section.getByRole("button", { name: profileAction }).first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      if ((locale === "uk" && width === 1440) || (locale === "en" && (width === 393 || width === 1440))) {
        await page.screenshot({ path: resolve(captureDirectory, `admin-users-${locale}-${width}-fixture.png`), fullPage: true });
      }
    }
  }
});
