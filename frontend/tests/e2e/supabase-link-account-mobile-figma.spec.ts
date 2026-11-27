import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const evidenceDir = resolve(process.cwd(), "../artifacts/visual-audit-20261124/auth");
const near = (actual: number | undefined, expected: number, tolerance = 3) => {
  expect(actual).toBeDefined();
  expect(Math.abs(actual! - expected)).toBeLessThanOrEqual(tolerance);
};

for (const lang of ["uk", "en"] as const) {
  const copy = lang === "uk"
    ? { password: "Поточний пароль", submit: "Підключити акаунт", login: "Увійти" }
    : { password: "Current password", submit: "Connect account", login: "Log in" };

  test(`mobile account-link form and verification error match Figma (${lang})`, async ({ page }) => {
    await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));
    await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
    await page.route("**/api/auth/supabase-link/complete", route => route.fulfill({ status: 401, json: { message: "Fixture error" } }));
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(`/${lang}/link-account#access_token=figma-account-link&type=signup`);
    const main = page.locator("main[data-rewind-auth-page]");
    const title = await main.getByRole("heading", { level: 1 }).boundingBox();
    const label = await main.locator("label[for='supabase-link-password']").boundingBox();
    const input = await main.locator("#supabase-link-password").boundingBox();
    const submit = await main.getByRole("button", { name: copy.submit }).boundingBox();
    near(title?.x, 24); near(title?.y, 166); near(title?.width, 345);
    near(label?.x, 32); near(label?.y, 376);
    near(input?.x, 24); near(input?.y, 403); near(input?.width, 345); near(input?.height, 45);
    near(submit?.x, 24); near(submit?.y, 485); near(submit?.width, 345); near(submit?.height, 56);
    await expect(page).toHaveURL(new RegExp(`/${lang}/link-account$`));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
    await mkdir(evidenceDir, { recursive: true });
    await page.screenshot({ path: resolve(evidenceDir, `rewind-account-link-${lang}-mobile-form-393.png`), fullPage: true });
    await main.locator("#supabase-link-password").fill("current-password-fixture");
    await page.getByRole("button", { name: copy.submit }).click();
    await expect(main.getByRole("alert")).toBeVisible();
    near((await main.getByRole("alert").boundingBox())?.y, 470);
    near((await main.getByRole("alert").boundingBox())?.height, 76);
    near((await page.getByRole("button", { name: copy.submit }).boundingBox())?.y, 576);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
    await mkdir(evidenceDir, { recursive: true });
    await page.screenshot({ path: resolve(evidenceDir, `rewind-account-link-${lang}-mobile-error-393.png`), fullPage: true });
  });

  test(`mobile account-link success state matches Figma (${lang})`, async ({ page }) => {
    await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));
    await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
    await page.route("**/api/auth/supabase-link/complete", route => route.fulfill({ status: 200, json: { id: 7, username: "fixture-member", role: "USER" } }));
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(`/${lang}/link-account#access_token=figma-account-link&type=signup`);
    await page.locator("#supabase-link-password").fill("current-password-fixture");
    await page.getByRole("button", { name: copy.submit }).click();
    const status = await page.getByRole("status").boundingBox();
    const login = await page.getByRole("link", { name: copy.login }).boundingBox();
    near(status?.x, 24); near(status?.y, 296); near(status?.width, 345); near(status?.height, 118);
    near(login?.x, 24); near(login?.y, 456); near(login?.width, 345); near(login?.height, 56);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await mkdir(evidenceDir, { recursive: true });
    await page.screenshot({ path: resolve(evidenceDir, `rewind-account-link-${lang}-mobile-success-393.png`), fullPage: true });
  });

  test(`mobile account-link expired state matches Figma (${lang})`, async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(`/${lang}/link-account#error=access_denied&error_description=expired`);
    const alert = await page.getByRole("alert").boundingBox();
    const login = await page.getByRole("link", { name: copy.login }).boundingBox();
    near(alert?.x, 24); near(alert?.y, 296); near(alert?.width, 345); near(alert?.height, 164);
    near(login?.x, 24); near(login?.y, 498); near(login?.width, 345);
    expect(await page.evaluate(() => window.location.hash)).toBe("");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
    await mkdir(evidenceDir, { recursive: true });
    await page.screenshot({ path: resolve(evidenceDir, `rewind-account-link-${lang}-mobile-expired-393.png`), fullPage: true });
  });
}
