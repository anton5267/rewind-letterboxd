import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const rows = [
  { id: 900020, username: "Liza Salvinko", displayName: "Liza Salvinko", email: "liza.salv@gmail.com", role: "ADMIN", avatarUrl: null, isActive: true, isHq: false, createdAt: "2025-12-09T12:00:00Z" },
  { id: 900021, username: "Stas Honchar", displayName: "Stas Honchar", email: "stas.honchar@gmail.com", role: "USER", avatarUrl: null, isActive: true, isHq: false, createdAt: "2025-12-10T12:00:00Z" },
  { id: 900022, username: "Roman Pavluk", displayName: "Roman Pavluk", email: "roma.pavli@gmail.com", role: "USER", avatarUrl: null, isActive: false, isHq: true, createdAt: "2025-12-11T12:00:00Z" },
  { id: 900023, username: "Sveta Chernova", displayName: "Sveta Chernova", email: "sveta.cher@gmail.com", role: "ADMIN", avatarUrl: null, isActive: true, isHq: false, createdAt: "2025-12-12T12:00:00Z" },
];

test("Admin Users uses the READY Figma hero and table shell without inventing user actions", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900010, username: "lola-james", role: "ADMIN", displayName: "Lola James",
    email: "admin@example.invalid", avatarUrl: "https://images.example.invalid/admin-users-figma-avatar.png", isActive: true, isHq: false,
  } }));
  await page.route("https://images.example.invalid/admin-users-figma-avatar.png", route => route.fulfill({ path: resolve(process.cwd(), "tests/e2e/fixtures/admin-users-list-figma-avatar.png"), contentType: "image/png" }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "admin-users-figma" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/admin/users**", route => route.fulfill({ json: {
    content: rows, totalPages: 1, totalElements: rows.length, number: 0, size: 50,
  } }));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/admin?view=users");
  const main = page.locator("main");
  const hero = main.locator(":scope > header");
  const section = page.getByRole("region", { name: "Users" });
  const avatar = hero.locator("img").first();
  const heroBox = await hero.boundingBox();
  expect(heroBox?.height).toBe(1020);
  const avatarBox = await avatar.boundingBox();
  expect(avatarBox?.x).toBeCloseTo(584, 0);
  expect(avatarBox?.y).toBeCloseTo(293, 0);
  expect(avatarBox?.width).toBe(272);
  expect(avatarBox?.height).toBe(277);
  expect((await hero.getByRole("heading", { name: "Lola James" }).boundingBox())?.y).toBeCloseTo(582, 0);
  const navBox = await hero.locator("nav").boundingBox();
  expect(navBox?.y).toBeCloseTo(772, 0);
  await expect(section.getByRole("heading", { name: "User List" })).toBeVisible();
  const searchBox = await section.locator("form").boundingBox();
  expect(searchBox?.width).toBe(402);
  expect(searchBox?.y).toBeCloseTo(1222, 0);
  const table = section.locator('[data-admin-user-list-rail="true"]');
  const tableBox = await table.boundingBox();
  expect(tableBox?.x).toBe(120);
  expect(tableBox?.y).toBeCloseTo(1295, 0);
  expect(tableBox?.width).toBe(1200);
  await expect(table.locator("tbody tr")).toHaveCount(4);
  const addUser = table.getByRole("button", { name: /Add User/ });
  await expect(addUser).toBeDisabled();
  const footer = page.locator("footer");
  expect((await footer.boundingBox())?.y).toBeCloseTo(1833, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  const evidenceDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261126/admin-users");
  await mkdir(evidenceDirectory, { recursive: true });
  await page.screenshot({ path: resolve(evidenceDirectory, "admin-users-en-desktop-1440.png"), fullPage: true });
});
