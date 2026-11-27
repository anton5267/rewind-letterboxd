import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const evidenceDir = resolve(process.cwd(), "../artifacts/visual-audit-20261125/auth");
const near = (actual: number | undefined, expected: number, tolerance = 5) => {
  expect(actual).toBeDefined();
  expect(Math.abs(actual! - expected)).toBeLessThanOrEqual(tolerance);
};

for (const lang of ["uk", "en"] as const) {
  const copy = lang === "uk"
    ? { password: "Поточний пароль", connect: "Підключити акаунт", title: "Завершити підключення акаунта", settings: "Налаштування акаунта", login: "Увійти" }
    : { password: "Current password", connect: "Connect account", title: "Finish connecting your account", settings: "Account Settings", login: "Log in" };

  test(`${lang} desktop account-link form matches Figma`, async ({ page }) => {
    await installAccountLinkToken(page, lang);
    await expectDesktopShell(page, copy);
    const input = page.getByLabel(copy.password);
    const hint = page.locator("main p").filter({ hasText: lang === "uk" ? "Введіть поточний пароль" : "Enter your current Rewind password" });
    const submit = page.getByRole("button", { name: copy.connect });
    near((await input.boundingBox())?.x, 407);
    near((await input.boundingBox())?.y, 600);
    near((await input.boundingBox())?.width, 627);
    near((await input.boundingBox())?.height, 72);
    near((await hint.boundingBox())?.y, 702);
    near((await submit.boundingBox())?.x, 407);
    near((await submit.boundingBox())?.y, 838);
    near((await submit.boundingBox())?.width, 627);
    near((await submit.boundingBox())?.height, 89);
    await capture(page, `account-link-form-${lang}-desktop-1440x1614.png`);
  });

  test(`${lang} desktop account-link verification error matches Figma`, async ({ page }) => {
    await installAccountLinkToken(page, lang);
    await page.route("**/api/auth/supabase-link/complete", route => route.fulfill({ status: 401, json: { message: "fixture verification error" } }));
    await page.getByLabel(copy.password).fill("current-password-fixture");
    await page.getByRole("button", { name: copy.connect }).click();
    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    const alertBox = await alert.boundingBox();
    const submitBox = await page.getByRole("button", { name: copy.connect }).boundingBox();
    near(alertBox?.x, 407); near(alertBox?.y, 748); near(alertBox?.width, 627); near(alertBox?.height, 77);
    near(submitBox?.x, 407); near(submitBox?.y, 838); near(submitBox?.width, 627); near(submitBox?.height, 89);
    await capture(page, `account-link-error-${lang}-desktop-1440x1614.png`);
  });

  test(`${lang} desktop account-link success matches Figma`, async ({ page }) => {
    await installAccountLinkToken(page, lang);
    await page.route("**/api/auth/supabase-link/complete", route => route.fulfill({ status: 200, json: { id: 7, username: "fixture-member", role: "USER" } }));
    await page.getByLabel(copy.password).fill("current-password-fixture");
    await page.getByRole("button", { name: copy.connect }).click();
    const status = page.getByRole("status");
    await expect(status).toBeVisible();
    const box = await status.boundingBox();
    near(box?.x, 407); near(box?.y, 600); near(box?.width, 627); near(box?.height, 116);
    const login = page.getByRole("link", { name: copy.login });
    await expect(login).toBeVisible();
    const loginBox = await login.boundingBox();
    near(loginBox?.x, 434); near(loginBox?.y, 686); near(loginBox?.width, 110);
    await status.evaluate(node => (node as HTMLElement).blur());
    await capture(page, `account-link-success-${lang}-desktop-1440x1614.png`);
  });

  test(`${lang} desktop account-link expired state matches Figma`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1614 });
    await page.goto(`/${lang}/link-account#error=access_denied&error_description=expired`);
    await expectDesktopShell(page, copy, true);
    const alert = page.getByRole("alert");
    const box = await alert.boundingBox();
    near(box?.x, 407); near(box?.y, 610); near(box?.width, 627); near(box?.height, 118);
    await capture(page, `account-link-expired-${lang}-desktop-1440x1614.png`);
  });
}

async function installAccountLinkToken(page: Page, lang: string) {
  await page.setViewportSize({ width: 1440, height: 1614 });
  await page.goto(`/${lang}/link-account#access_token=figma-account-link&type=signup`);
}

async function expectDesktopShell(page: Page, copy: { title: string; settings: string; login: string }, expired = false) {
  const main = page.locator("main[data-rewind-auth-page]");
  const card = main.locator("section");
  const heading = main.getByRole("heading", { name: copy.title });
  const back = page.getByRole("link", { name: expired ? copy.login : copy.settings });
  const cardBox = await card.boundingBox();
  const titleBox = await heading.boundingBox();
  const backBox = await back.boundingBox();
  const backTextBox = await back.locator("span").nth(1).boundingBox();
  const navFilm = await page.getByRole("link", { name: "Films", exact: true }).boundingBox();
  const search = await page.getByRole("link", { name: /search|пошук/i }).first().boundingBox();
  near(cardBox?.x, 121); near(cardBox?.y, 316); near(cardBox?.width, 1198); near(cardBox?.height, 873);
  near(titleBox?.x, 410); near(titleBox?.y, 486); near(titleBox?.width, 620);
  near(backBox?.x, 173); near(backBox?.y, 360);
  near(backTextBox?.x, 228); near(backTextBox?.y, 368);
  near(navFilm?.x, 453); near(navFilm?.width, 46);
  near(search?.x, 939); near(search?.width, 47);
}

async function capture(page: Page, name: string) {
  await mkdir(evidenceDir, { recursive: true });
  await page.screenshot({ path: resolve(evidenceDir, name), fullPage: true });
}
