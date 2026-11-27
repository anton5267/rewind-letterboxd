import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("mobile Moderator Logs matches the UK and EN Figma frames", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900010, username: "Admin example", role: "ADMIN", displayName: "Admin example",
    avatarUrl: null, isHq: true,
  } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/admin/audit-logs**", route => route.fulfill({ json: {
    content: [4821, 4822, 4823].map((id, index) => ({
      id, adminId: 900030, action: "REVIEW_HIDDEN", targetType: "REVIEW", targetId: id,
      metadata: null, createdAt: `2026-11-${16 + index}T15:42:00Z`,
    })),
    totalPages: 1, totalElements: 3, number: 0, size: 50,
  } }));
  await page.route("**/api/admin/users/900030", route => route.fulfill({ json: {
    id: 900030, username: "moderator104", displayName: "Moderator 104", email: "moderator@example.test",
    role: "ADMIN", avatarUrl: null, isActive: true, isHq: false, createdAt: "2026-01-01T00:00:00Z",
  } }));

  const captures = resolve(process.cwd(), "../artifacts/visual-audit-20261125/admin-moderator-logs-mobile");
  await mkdir(captures, { recursive: true });

  for (const locale of ["uk", "en"] as const) {
    await page.goto(`/${locale}/admin?view=moderator-logs`);
    const section = page.locator('main > section[class*="logFrameSection"]');
    await expect(section).toHaveAttribute("aria-busy", "false");
    await expect(section.locator('[class*="auditRow"]')).toHaveCount(3);
    const hero = page.locator("main > header");
    const navigation = hero.getByRole("navigation");
    await expect(navigation.getByRole("link")).toHaveCount(2);
    await expect(navigation.getByRole("link").nth(0)).toContainText(locale === "uk" ? "Журнал дій" : "Audit log");
    await expect(navigation.getByRole("link").nth(1)).toContainText(locale === "uk" ? "Налаштування сайту" : "Site settings");
    expect(await hero.boundingBox()).toMatchObject({ y: 0, height: 248 });
    expect(await hero.locator('[class*="avatar"]').boundingBox()).toMatchObject({ x: 16, y: 88, width: 64, height: 64 });
    expect(await navigation.boundingBox()).toMatchObject({ x: 18, y: 176, width: 349, height: 44 });
    const heading = await section.getByRole("heading", { level: 2 }).boundingBox();
    const description = await section.locator('[class*="mobileLogDescription"]').boundingBox();
    const cards = section.locator('[class*="auditRow"]');
    const firstCard = await cards.first().boundingBox();
    const secondCard = await cards.nth(1).boundingBox();
    expect(heading?.x).toBe(16);
    expect(heading?.y).toBeCloseTo(272, 0);
    expect(description?.y).toBeCloseTo(305, 0);
    expect(firstCard).toMatchObject({ x: 16, width: 361, height: 326 });
    expect(firstCard?.y).toBeCloseTo(340, 0);
    expect(secondCard?.y).toBeCloseTo(720, 0);
    const target = cards.first().locator('[class*="auditTarget"]');
    await expect(target).toBeVisible();
    await expect(target).toContainText(locale === "uk" ? "Огляд #4821" : "Review #4821");
    const mobileNavigation = page.getByRole("navigation", { name: locale === "uk" ? "Головна навігація" : "Main navigation" }).last();
    expect(await mobileNavigation.boundingBox()).toMatchObject({ x: 0, y: 760, width: 393, height: 92 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
    await page.screenshot({ path: resolve(captures, `moderator-logs-${locale}-393x852.png`), fullPage: false });
  }
});
