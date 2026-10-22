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
  await page.goto("/uk/admin");
  const hero = page.locator('main > [class*="hero"]');
  await expect(hero).toHaveCSS("min-height", "1020px");
  const avatar = await hero.locator('[class*="avatar"]').boundingBox();
  expect(avatar?.width).toBeCloseTo(272, 0);
});
