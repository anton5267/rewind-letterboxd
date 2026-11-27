import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const twoRowSource = [
  { id: 901001, username: "stas-honchar", displayName: "Stas Honchar", email: "stas.honchar@gmail.com", role: "USER", avatarUrl: null, isActive: true, isHq: false, createdAt: "2025-12-10T12:00:00Z" },
  { id: 901002, username: "roman-pavluk", displayName: "Roman Pavluk", email: "roma.pavl@gmail.com", role: "USER", avatarUrl: null, isActive: false, isHq: false, createdAt: "2025-12-11T12:00:00Z" },
];

const threeRowSource = [
  { id: 901003, username: "liza-salvinko", displayName: "Liza Salvinko", email: "liza.salv@gmail.com", role: "ADMIN", avatarUrl: null, isActive: true, isHq: false, createdAt: "2025-12-09T12:00:00Z" },
  ...twoRowSource,
];

for (const rowCount of [2, 3] as const) {
  test(`Admin Users renders the READY ${rowCount}-row list variant`, async ({ page }) => {
    const rows = rowCount === 2 ? twoRowSource : threeRowSource;
    await page.route("**/api/users/me", route => route.fulfill({ json: {
      id: 900010, username: "lola-james", role: "ADMIN", displayName: "Lola James",
      email: "admin@example.invalid", avatarUrl: null, isActive: true, isHq: false,
    } }));
    await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: `admin-users-${rowCount}-rows` } }));
    await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
    await page.route("**/api/admin/users**", route => route.fulfill({ json: {
      content: rows, totalPages: 1, totalElements: rows.length, number: 0, size: 50,
    } }));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/admin?view=users");
    const section = page.getByRole("region", { name: "Users" });
    const table = section.locator('[data-admin-user-list-rail="true"]');
    const bodyRows = table.locator("tbody tr");
    await expect(section.getByRole("heading", { name: "User List" })).toBeVisible();
    await expect(bodyRows).toHaveCount(rowCount);
    const expectedFooterTop = rowCount === 2 ? 1721 : 1776;
    const footerBox = await page.locator("footer").boundingBox();
    expect(Math.abs((footerBox?.y ?? 0) - expectedFooterTop)).toBeLessThanOrEqual(8);
    expect(Math.abs(await page.evaluate(() => document.documentElement.scrollHeight) - (rowCount === 2 ? 1986 : 2041))).toBeLessThanOrEqual(8);

    for (const row of rows) {
      await expect(bodyRows.filter({ hasText: row.displayName })).toHaveCount(1);
      await expect(bodyRows.filter({ hasText: row.email })).toHaveCount(1);
    }
    await expect(bodyRows.nth(0)).toContainText("active");
    await expect(bodyRows.nth(0)).toContainText(rowCount === 2 ? "Stas Honchar" : "Liza Salvinko");
    if (rowCount === 3) {
      await expect(bodyRows.nth(1)).toContainText("Stas Honchar");
      await expect(bodyRows.nth(2)).toContainText("Roman Pavluk");
    }
    if (rowCount === 2) {
      await expect(bodyRows.nth(0)).toContainText("Stas Honchar");
      await expect(bodyRows.nth(0)).toContainText("stas.honchar@gmail.com");
      await expect(bodyRows.nth(1)).toContainText("Roman Pavluk");
      await expect(bodyRows.nth(1)).toContainText("roma.pavl@gmail.com");
      await expect(bodyRows.nth(1)).toContainText("blocked");
    }

    const evidenceDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261127/admin-users");
    await mkdir(evidenceDirectory, { recursive: true });
    await page.screenshot({ path: resolve(evidenceDirectory, `admin-users-en-${rowCount}-rows-1440.png`), fullPage: true });
  });
}
