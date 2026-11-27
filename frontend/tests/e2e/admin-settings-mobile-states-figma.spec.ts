import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const settings = [
  { key: "site_name", value: "REWIND", updatedBy: null, updatedAt: null },
  { key: "default_locale", value: "uk", updatedBy: null, updatedAt: null },
  { key: "maintenance_mode", value: "false", updatedBy: null, updatedAt: null },
  { key: "journal_enabled", value: "true", updatedBy: null, updatedAt: null },
];

async function authFixture(page: Page) {
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900010, username: "Lola James", role: "ADMIN", displayName: "Lola James",
    avatarUrl: null, isHq: true,
  } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
}

const captures = resolve(process.cwd(), "../artifacts/visual-audit-20261125/admin-settings-mobile-states");

test("mobile Admin Settings loading state follows its UK and EN Figma frames", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await authFixture(page);
  await mkdir(captures, { recursive: true });

  for (const locale of ["uk", "en"] as const) {
    let release!: () => void;
    const pending = new Promise<void>(resolveRequest => { release = resolveRequest; });
    await page.route("**/api/admin/settings", async route => {
      await pending;
      await route.fulfill({ json: settings });
    });
    await page.goto(`/${locale}/admin?view=settings`);
    const section = page.locator('section[aria-labelledby="admin-settings-title"]');
    await expect(section).toHaveAttribute("aria-busy", "true");
    const skeleton = section.locator('[data-layout="settings"] > div');
    await expect(skeleton).toBeVisible();
    const box = await skeleton.boundingBox();
    expect(box).toMatchObject({ x: 32, width: 329, height: 253 });
    expect(box?.y).toBeCloseTo(353, 0);
    await page.screenshot({ path: resolve(captures, `settings-loading-${locale}-393x852.png`) });
    release();
    await expect(section).toHaveAttribute("aria-busy", "false");
    await page.unroute("**/api/admin/settings");
  }
});

test("mobile Admin Settings load errors align in UK and EN", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await authFixture(page);
  await page.route("**/api/admin/settings", route => route.fulfill({ status: 503, json: {} }));
  await mkdir(captures, { recursive: true });

  for (const locale of ["uk", "en"] as const) {
    await page.goto(`/${locale}/admin?view=settings`);
    const section = page.locator('section[aria-labelledby="admin-settings-title"]');
    const alert = section.getByRole("alert");
    await expect(alert).toBeVisible();
    const alertBox = await alert.boundingBox();
    const retry = alert.getByRole("button");
    const retryBox = await retry.boundingBox();
    expect(alertBox?.x).toBe(32);
    expect(alertBox?.y).toBeCloseTo(351, 0);
    expect(retryBox?.x).toBe(32);
    expect(retryBox?.y).toBeCloseTo(410, 0);
    expect(retryBox?.height).toBe(44);
    expect(retryBox?.width).toBeCloseTo(locale === "uk" ? 131 : 83, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
    await page.screenshot({ path: resolve(captures, `settings-load-error-${locale}-393x852.png`) });
  }
});

test("mobile Admin Settings save errors remain visible and match the UK and EN frames", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await authFixture(page);
  await page.route("**/api/admin/settings", route => route.fulfill({ json: settings }));
  await page.route("**/api/admin/settings/site_name", route => route.fulfill({ status: 503, json: {} }));
  await mkdir(captures, { recursive: true });

  for (const locale of ["uk", "en"] as const) {
    await page.goto(`/${locale}/admin?view=settings`);
    const section = page.locator('section[aria-labelledby="admin-settings-title"]');
    await expect(section.locator("input, select")).toHaveCount(4);
    await section.getByRole("button", { name: locale === "uk" ? "Зберегти" : "Save", exact: true }).first().click();
    const alert = section.getByRole("alert");
    await expect(alert).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
    await section.evaluate(element => window.scrollTo({
      top: element.getBoundingClientRect().top + window.scrollY - 71,
      behavior: "instant",
    }));
    const sectionBox = await section.boundingBox();
    const finalRetryBox = await alert.getByRole("button").boundingBox();
    expect(sectionBox?.height).toBeCloseTo(650, 0);
    expect(finalRetryBox?.y! - sectionBox!.y).toBeCloseTo(locale === "uk" ? 567 : 526, 0);
    await page.screenshot({ path: resolve(captures, `settings-save-error-${locale}-393x852.png`) });
  }
});
