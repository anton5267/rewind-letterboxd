import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const tokenHash = "email-action-figma-fixture";
const evidenceDir = resolve(process.cwd(), "../artifacts/visual-audit-20261125/auth");

for (const language of ["uk", "en"] as const) {
  const copy = language === "uk"
    ? { invalid: "Посилання недійсне або застаріле", profile: "Пошту підтверджено", login: "Увійти", loading: "Завантаження..." }
    : { invalid: "This link is invalid or expired", profile: "Email confirmed", login: "Log in", loading: "Loading..." };

  test(`${language} invalid email link matches mobile Figma anchors`, async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 895 });
    await page.goto(`/${language}/email-action/`);
    const main = page.locator("main[data-rewind-auth-page]");
    const title = main.getByRole("heading", { name: copy.invalid });
    const action = main.getByRole("link", { name: language === "uk" ? "Запросити нове посилання" : "Request a new link" });
    const login = main.getByRole("link", { name: copy.login });
    await expect(title).toBeVisible();
    expectNear((await title.boundingBox())?.y, 380);
    expectNear((await main.locator("[class*=description]").boundingBox())?.y, 440);
    expectNear((await action.boundingBox())?.y, language === "uk" ? 585 : 575);
    expectNear((await login.boundingBox())?.y, language === "uk" ? 697 : 687);
    await saveCapture(page, `email-action-invalid-${language}-mobile-393.png`);
  });

  test(`${language} profile-load error matches mobile Figma and preserves login recovery`, async ({ page }) => {
    await installVerifiedAuthFixture(page);
    await page.route("**/api/users/me", route => route.fulfill({ status: 503, json: { message: "fixture profile failure" } }));
    await page.setViewportSize({ width: 393, height: 895 });
    await page.goto(`/${language}/email-action/#rewind_action=signup&type=email&token_hash=${tokenHash}`);
    await page.getByRole("button", { name: language === "uk" ? "Підтвердити пошту" : "Confirm email" }).click();
    const main = page.locator("main[data-rewind-auth-page]");
    const title = main.getByRole("heading", { name: copy.profile });
    await expect(title).toBeVisible();
    expectNear((await title.boundingBox())?.y, 380);
    expectNear((await main.locator("[class*=description]").boundingBox())?.y, 425);
    expectNear((await main.getByRole("link", { name: copy.login }).first().boundingBox())?.y, 548);
    expect(await page.evaluate(() => window.location.hash)).toBe("");
    await saveCapture(page, `email-action-profile-error-${language}-mobile-393.png`);
  });

  test(`${language} loading confirmation keeps the Figma button position`, async ({ page }) => {
    await page.route("**/auth/v1/**", route => route.fulfill({ status: 404, json: { message: "fixture fallback" } }));
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/auth/v1/verify**", async route => {
      await pending;
      await route.fulfill({ status: 400, json: { code: "otp_expired", msg: "fixture finished" } });
    });
    await page.setViewportSize({ width: 393, height: 895 });
    await page.goto(`/${language}/email-action/#rewind_action=signup&type=email&token_hash=${tokenHash}`);
    const button = page.getByRole("button", { name: language === "uk" ? "Підтвердити пошту" : "Confirm email" });
    await button.click();
    const loading = page.getByRole("button", { name: copy.loading });
    await expect(loading).toBeVisible();
    expectNear((await loading.boundingBox())?.y, 548);
    expect(await page.locator("main[data-email-state=loading]").getAttribute("aria-busy")).toBe("true");
    await saveCapture(page, `email-action-loading-${language}-mobile-393.png`);
    release();
    await expect(page.getByRole("heading", { name: copy.invalid })).toBeVisible();
  });
}

async function installVerifiedAuthFixture(page: Page) {
  await page.route("**/auth/v1/**", route => route.fulfill({ status: 404, json: { message: "fixture fallback" } }));
  await page.route("**/auth/v1/verify**", route => route.fulfill({ json: {
    access_token: "fixture-access-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "fixture-refresh-token",
    user: {
      id: "b1f5872a-148b-4878-8581-06b809b2992f",
      aud: "authenticated",
      role: "authenticated",
      email: "member@example.invalid",
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: { username: "fixture-member", language: "uk" },
      created_at: new Date().toISOString(),
    },
  } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: { message: "fixture unauthenticated" } }));
}

function expectNear(actual: number | undefined, expected: number, tolerance = 4) {
  expect(actual).toBeDefined();
  expect(Math.abs(actual! - expected)).toBeLessThanOrEqual(tolerance);
}

async function saveCapture(page: Page, name: string) {
  await mkdir(evidenceDir, { recursive: true });
  await page.screenshot({ path: resolve(evidenceDir, name), fullPage: true });
}
