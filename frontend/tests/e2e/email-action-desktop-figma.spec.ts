import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const tokenHash = "email-action-desktop-fixture";
const evidenceDir = resolve(process.cwd(), "../artifacts/visual-audit-20261125/auth");

for (const language of ["uk", "en"] as const) {
  test(`${language} desktop email-change confirmation matches Figma card and content anchors`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1614 });
    await page.goto(`/${language}/email-action/#rewind_action=email_change&type=email_change&token_hash=${tokenHash}`);
    const main = page.locator("main[data-rewind-auth-page]");
    const card = main.locator("section");
    const heading = main.getByRole("heading", { level: 1 });
    const description = main.locator("[class*=description]");
    const button = main.getByRole("button");
    const cardBox = await card.boundingBox();
    const titleBox = await heading.boundingBox();
    const descriptionBox = await description.boundingBox();
    const buttonBox = await button.boundingBox();
    expectNear(cardBox?.x, 121);
    expectNear(cardBox?.y, 316);
    expectNear(cardBox?.width, 1198);
    expectNear(cardBox?.height, 873);
    expectNear(titleBox?.x, 420);
    expectNear(titleBox?.y, 576);
    expectNear(titleBox?.width, 600);
    expectNear(descriptionBox?.y, 637);
    expectNear(buttonBox?.x, 407);
    expectNear(buttonBox?.y, 774);
    expectNear(buttonBox?.width, 627);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
    await mkdir(evidenceDir, { recursive: true });
    await page.screenshot({ path: resolve(evidenceDir, `email-change-confirm-${language}-desktop-1440x1614.png`), fullPage: true });
  });

  test(`${language} desktop invalid email link uses the shared Figma content anchors`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1614 });
    await page.goto(`/${language}/email-action/`);
    const main = page.locator("main[data-rewind-auth-page]");
    const title = main.getByRole("heading", { level: 1 });
    const description = main.locator("[class*=description]");
    const action = main.getByRole("link", { name: language === "uk" ? "Запросити нове посилання" : "Request a new link" });
    const login = main.locator("[class*=footer]").getByRole("link");
    expectNear((await main.locator("section").boundingBox())?.y, 316);
    expectNear((await title.boundingBox())?.y, 576);
    expectNear((await description.boundingBox())?.y, 637);
    expectNear((await action.boundingBox())?.y, 774);
    expectNear((await login.boundingBox())?.y, 982);
    await mkdir(evidenceDir, { recursive: true });
    await page.screenshot({ path: resolve(evidenceDir, `email-action-invalid-${language}-desktop-1440x1614.png`), fullPage: true });
  });

  test(`${language} desktop signup confirmation loading state follows Figma`, async ({ page }) => {
    await page.route("**/auth/v1/**", route => route.fulfill({ status: 404, json: { message: "fixture fallback" } }));
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/auth/v1/verify**", async route => {
      await pending;
      return route.fulfill({ status: 400, json: { code: "otp_expired", msg: "fixture finished" } });
    });
    await page.setViewportSize({ width: 1440, height: 1614 });
    await page.goto(`/${language}/email-action/#rewind_action=signup&type=email&token_hash=${tokenHash}`);
    await page.getByRole("button", { name: language === "uk" ? "Підтвердити пошту" : "Confirm email" }).click();
    const main = page.locator("main[data-rewind-auth-page]");
    await expect(main).toHaveAttribute("data-email-state", "loading");
    await expect(main.getByRole("heading", { name: language === "uk" ? "Підтвердьте свою пошту" : "Confirm your email" })).toBeVisible();
    await expectDesktopEmailActionFrame(page, main, language === "uk" ? "Завантаження..." : "Loading...");
    await mkdir(evidenceDir, { recursive: true });
    await page.screenshot({ path: resolve(evidenceDir, `email-confirm-loading-${language}-desktop-1440x1614.png`), fullPage: true });
    release();
    await expect(main).toHaveAttribute("data-email-state", "expired");
  });

  test(`${language} desktop signup profile-load error follows Figma`, async ({ page }) => {
    await installVerifiedSignup(page);
    await page.route("**/api/users/me", route => route.fulfill({ status: 503, json: { message: "fixture profile failure" } }));
    await page.setViewportSize({ width: 1440, height: 1614 });
    await page.goto(`/${language}/email-action/#rewind_action=signup&type=email&token_hash=${tokenHash}`);
    await page.getByRole("button", { name: language === "uk" ? "Підтвердити пошту" : "Confirm email" }).click();
    const main = page.locator("main[data-rewind-auth-page]");
    const title = language === "uk" ? "Пошту підтверджено" : "Email confirmed";
    await expect(main).toHaveAttribute("data-email-state", "profile-error");
    await expect(main.getByRole("heading", { name: title })).toBeVisible();
    await expectDesktopEmailActionFrame(page, main, language === "uk" ? "Увійти" : "Log in");
    await mkdir(evidenceDir, { recursive: true });
    await page.screenshot({ path: resolve(evidenceDir, `email-profile-error-${language}-desktop-1440x1614.png`), fullPage: true });
  });

  test(`${language} desktop password-change confirmation matches Figma`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1614 });
    await page.goto(`/${language}/email-action/#rewind_action=recovery&type=recovery&token_hash=${tokenHash}`);
    const main = page.locator("main[data-rewind-auth-page]");
    await expect(main).toHaveAttribute("data-email-action", "recovery");
    await expect(main.getByRole("heading", { name: language === "uk" ? "Підтвердіть зміну пароля" : "Confirm your password change" })).toBeVisible();
    await expectDesktopEmailActionFrame(page, main, language === "uk" ? "Продовжити до зміни пароля" : "Continue to password change");
    await mkdir(evidenceDir, { recursive: true });
    await page.screenshot({ path: resolve(evidenceDir, `password-change-confirm-${language}-desktop-1440x1614.png`), fullPage: true });
  });

  for (const complete of [false, true]) {
    test(`${language} desktop email-change ${complete ? "complete" : "pending"} state retains Figma anchors`, async ({ page }) => {
      await installEmailChangeVerification(page, complete);
      await page.setViewportSize({ width: 1440, height: 1614 });
      await page.goto(`/${language}/email-action/#rewind_action=email_change&type=email_change&token_hash=${tokenHash}`);
      await page.getByRole("button", { name: language === "uk" ? "Підтвердити пошту" : "Confirm email" }).click();
      const headingText = complete
        ? language === "uk" ? "Email оновлено" : "Email updated"
        : language === "uk" ? "Підтвердження прийнято" : "Confirmation accepted";
      const main = page.locator("main[data-rewind-auth-page]");
      const heading = main.getByRole("heading", { name: headingText });
      await expect(heading).toBeVisible();
      expectNear((await main.locator("section").boundingBox())?.y, 316);
      expectNear((await heading.boundingBox())?.y, 576);
      expectNear((await main.locator("[class*=description]").boundingBox())?.y, 637);
      const primaryAction = complete
        ? main.getByRole("link", { name: language === "uk" ? "Налаштування" : "Settings" })
        : main.getByRole("link", { name: language === "uk" ? "Увійти" : "Log in" }).first();
      expectNear((await primaryAction.boundingBox())?.y, 774);
      expectNear((await main.locator("[class*=footer]").getByRole("link").boundingBox())?.y, 982);
      await mkdir(evidenceDir, { recursive: true });
      await page.screenshot({ path: resolve(evidenceDir, `email-change-${complete ? "complete" : "pending"}-${language}-desktop-1440x1614.png`), fullPage: true });
    });
  }
}

function expectNear(actual: number | undefined, expected: number, tolerance = 5) {
  expect(actual).toBeDefined();
  expect(Math.abs(actual! - expected)).toBeLessThanOrEqual(tolerance);
}

async function installEmailChangeVerification(page: import("@playwright/test").Page, complete: boolean) {
  await page.route("**/auth/v1/**", route => route.fulfill({ status: 404, json: { message: "Unmocked fixture Auth request" } }));
  await page.route("**/auth/v1/verify**", route => route.fulfill({ json: complete ? {
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
  } : { msg: "Confirmation accepted" } }));
  const appOrigin = new URL(process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000").origin;
  await page.route(url => {
    const requestUrl = new URL(url);
    return requestUrl.origin === appOrigin && requestUrl.pathname.startsWith("/api/");
  }, async route => {
    const path = new URL(route.request().url()).pathname;
    if (complete && path === "/api/users/me") return route.fulfill({ json: { id: 7, username: "fixture-member", role: "USER" } });
    return route.fulfill({ status: 401, json: { message: "Unauthenticated fixture request" } });
  });
}

async function installVerifiedSignup(page: import("@playwright/test").Page) {
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

async function expectDesktopEmailActionFrame(page: import("@playwright/test").Page, main: import("@playwright/test").Locator, actionName: string) {
  const action = main.locator("[class*=button]").filter({ hasText: actionName });
  const lock = main.locator("[class*=lockIllustration]");
  await expect(lock).toBeVisible();
  expectNear((await lock.boundingBox())?.x, 668, 2);
  expectNear((await lock.boundingBox())?.y, 401, 2);
  expectNear((await lock.boundingBox())?.width, 104, 2);
  expectNear((await lock.boundingBox())?.height, 120, 2);
  await expect(action).toBeVisible();
  expectNear((await main.locator("section").boundingBox())?.x, 121);
  expectNear((await main.locator("section").boundingBox())?.y, 316);
  expectNear((await main.locator("section").boundingBox())?.width, 1198);
  expectNear((await main.locator("section").boundingBox())?.height, 873);
  expectNear((await main.getByRole("heading", { level: 1 }).boundingBox())?.y, 576);
  expectNear((await main.locator("[class*=description]").boundingBox())?.y, 637);
  expectNear((await action.boundingBox())?.x, 407);
  expectNear((await action.boundingBox())?.y, 774);
  expectNear((await action.boundingBox())?.width, 627);
  expectNear((await main.locator("[class*=footer]").getByRole("link").boundingBox())?.y, 982);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
}
