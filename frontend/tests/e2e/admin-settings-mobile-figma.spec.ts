import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("mobile Admin Settings matches the UK and EN Figma frames", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900010, username: "admin-fixture", role: "ADMIN", displayName: "Lola James",
    avatarUrl: "https://images.example.invalid/lola-james.png", isHq: true,
  } }));
  await page.route("https://images.example.invalid/lola-james.png", route => route.fulfill({ path: resolve(process.cwd(), "tests/e2e/fixtures/admin-user-profile-figma/lola-james.png"), contentType: "image/png" }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/admin/settings", route => {
    return route.fulfill({ json: [
      { key: "site_name", value: "Rewind", updatedBy: null, updatedAt: null },
      { key: "default_locale", value: "uk", updatedBy: null, updatedAt: null },
      { key: "maintenance_mode", value: "false", updatedBy: null, updatedAt: null },
      { key: "journal_enabled", value: "true", updatedBy: null, updatedAt: null },
    ] });
  });

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261125/admin-settings-mobile");
  await mkdir(captureDirectory, { recursive: true });

  for (const locale of ["uk", "en"] as const) {
    await page.goto(`/${locale}/admin?view=settings`);
    const section = page.locator('section[aria-labelledby="admin-settings-title"]');
    await expect(section).toHaveAttribute("aria-busy", "false");
    await expect(section.locator("input, select")).toHaveCount(4);
    const hero = page.locator("main > header");
    await expect(hero.getByRole("heading", { level: 1, name: "Lola James" })).toBeVisible();
    const portrait = hero.locator("img").first();
    await expect(portrait).toHaveAttribute("src", "https://images.example.invalid/lola-james.png");
    await expect.poll(() => portrait.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    const navigation = hero.getByRole("navigation");
    await expect(navigation.getByRole("link")).toHaveCount(2);
    await expect(navigation.getByRole("link").nth(0)).toContainText(locale === "uk" ? "Журнал дій" : "Audit log");
    await expect(navigation.getByRole("link").nth(1)).toContainText(locale === "uk" ? "Налаштування сайту" : "Site settings");
    expect(await hero.boundingBox()).toMatchObject({ y: 0, height: 248 });
    expect(await hero.locator('[class*="avatar"]').boundingBox()).toMatchObject({ x: 16, y: 88, width: 64, height: 64 });
    expect(await navigation.boundingBox()).toMatchObject({ y: 176, height: 44 });
    const sectionBox = await section.boundingBox();
    const titleBox = await section.getByRole("heading", { level: 2 }).boundingBox();
    expect(sectionBox).toMatchObject({ x: 16, y: 280, width: 361 });
    expect(titleBox?.x).toBeCloseTo(32, 0);
    expect(titleBox?.y).toBeCloseTo(297, 0);
    expect((await section.locator("input, select").first().boundingBox())?.y).toBeCloseTo(368, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
    await page.screenshot({ path: resolve(captureDirectory, `admin-settings-${locale}-393x852.png`), fullPage: false });
  }
});
