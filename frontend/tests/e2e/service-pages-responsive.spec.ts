import { expect, test } from "@playwright/test";

test("service pages use the Figma editorial hero and retain route navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const route of ["help", "contact", "rules", "privacy", "film-data", "delete-account"]) {
    await page.goto(`/uk/${route}`);
    const hero = page.locator('main > [class*="hero"]');
    await expect(hero).toHaveCSS("min-height", "818px");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('main > [class*="hero"] nav a')).toHaveCount(6);
    const details = await page.locator("main > article").boundingBox();
    expect(details?.width).toBeCloseTo(1200, 0);
  }
});

test("admin desktop hero follows the Figma dashboard frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900010, username: "admin-fixture", role: "ADMIN", displayName: "Admin Fixture",
    avatarUrl: null, isHq: true,
  } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/admin/dashboard", route => route.fulfill({ json: { users: 12, activeUsers: 9, hqUsers: 2, movies: 40, reviews: 18, hiddenReviews: 1 } }));
  await page.route("**/api/admin/users**", route => route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } }));
  await page.route("**/api/admin/settings", route => route.fulfill({ json: [
    { key: "site_name", value: "Rewind", updatedBy: null, updatedAt: null },
    { key: "default_locale", value: "uk", updatedBy: null, updatedAt: null },
    { key: "maintenance_mode", value: "false", updatedBy: null, updatedAt: null },
    { key: "journal_enabled", value: "true", updatedBy: null, updatedAt: null },
  ] }));
  await page.goto("/uk/admin");
  const hero = page.locator('main > [class*="hero"]');
  await expect(hero).toHaveCSS("min-height", "1020px");
  const avatar = await hero.locator('[class*="avatar"]').boundingBox();
  expect(avatar?.width).toBeCloseTo(272, 0);
  const summary = page.locator('main > [class*="summary"]');
  await expect(summary).toBeVisible();
  const summaryBox = await summary.boundingBox();
  expect(summaryBox?.x).toBeCloseTo(120, 0);
  expect(summaryBox?.width).toBe(1200);
  await expect(summary.locator('[class*="summaryCard"]')).toHaveCount(6);
  const cards = await summary.locator('[class*="summaryCard"]').evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height, top: rect.top };
  }));
  expect(cards.every(card => Math.abs(card.width - 368) < 1)).toBe(true);
  expect(cards.every(card => card.height >= 233)).toBe(true);
  expect(new Set(cards.map(card => card.top)).size).toBe(2);
  const users = page.getByRole("region", { name: "Користувачі" });
  await expect(users).toBeVisible();
  const usersBox = await users.boundingBox();
  expect(usersBox?.x).toBeCloseTo(120, 0);
  expect(usersBox?.width).toBe(1200);
  const userToolbar = users.locator('form').first();
  const userToolbarBox = await userToolbar.boundingBox();
  expect(userToolbarBox?.width).toBeCloseTo(402, 0);
  const settings = page.locator('section[aria-labelledby="admin-settings-title"]');
  await expect(settings).toBeVisible();
  const settingsBox = await settings.boundingBox();
  expect(settingsBox?.x).toBeCloseTo(120, 0);
  expect(settingsBox?.width).toBe(1200);
  expect(settingsBox?.height).toBeGreaterThanOrEqual(734);
  await expect(settings.locator('input')).toHaveCount(4);
});
