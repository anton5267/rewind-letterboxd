import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const evidenceDir = resolve(process.cwd(), "../artifacts/visual-audit-20261125/auth");

for (const language of ["uk", "en"] as const) {
  test(`${language} desktop registration password-byte-limit state matches Figma`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1752 });
    await page.goto(`/${language}/register`);
    await fillRegistrationForm(page, "а".repeat(37));
    await page.locator('main button[type="submit"]').click();
    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expectDesktopErrorGeometry(page, alert);
    await saveCapture(page, `register-password-limit-${language}-desktop-1440x1752.png`);
  });

  test(`${language} desktop registration request-failure state matches Figma`, async ({ page }) => {
    await page.route(url => new URL(url).pathname.endsWith("/auth/v1/signup"), route => route.fulfill({ status: 500, json: { message: "fixture registration failure" } }));
    await page.setViewportSize({ width: 1440, height: 1752 });
    await page.goto(`/${language}/register`);
    await fillRegistrationForm(page);
    await page.locator('main button[type="submit"]').click();
    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expectDesktopErrorGeometry(page, alert);
    await saveCapture(page, `register-request-error-${language}-desktop-1440x1752.png`);
  });

  test(`${language} desktop registration success state matches Figma`, async ({ page }) => {
    await installSuccessfulSignup(page);
    await page.setViewportSize({ width: 1440, height: 1752 });
    await page.goto(`/${language}/register`);
    await fillRegistrationForm(page);
    await page.locator('main button[type="submit"]').click();
    const main = page.locator("main[data-register-success]");
    const card = main.locator("[class*=card]");
    const heading = main.getByRole("heading", { name: language === "uk" ? "Акаунт створено" : "Account created" });
    const notice = main.getByRole("status");
    const action = main.getByRole("button", { name: language === "uk" ? "Перейти до входу" : "Go to login" });
    await expect(heading).toBeVisible();
    const cardBox = await card.boundingBox();
    const headingBox = await heading.boundingBox();
    expectNear(cardBox?.x, 121);
    expectNear(cardBox?.y, 316);
    expectNear(cardBox?.width, 1198);
    expectNear(cardBox?.height, 1011);
    expectNear(headingBox?.x, 420);
    expectNear(headingBox?.y, 410);
    expectNear(headingBox?.width, 600);
    expectNear((await notice.boundingBox())?.y, 645);
    expectNear((await action.boundingBox())?.x, 407);
    expectNear((await action.boundingBox())?.y, 697);
    expectNear((await action.boundingBox())?.width, 627);
    expectNear((await action.boundingBox())?.height, 89);
    await heading.evaluate(node => (node as HTMLElement).blur());
    await saveCapture(page, `register-success-${language}-desktop-1440x1752.png`);
  });
}

async function fillRegistrationForm(page: Page, password = "secure-pass-123") {
  await page.locator("#register-username").fill("rewind-member");
  await page.locator("#register-email").fill("member@example.invalid");
  await page.locator("#register-password").fill(password);
}

async function expectDesktopErrorGeometry(page: Page, alert: Locator) {
  const card = page.locator("main [class*=card]");
  const alertBox = await alert.boundingBox();
  const submit = page.locator('main button[type="submit"]');
  const footer = page.locator("main p[class*=footer]");
  const submitBox = await submit.boundingBox();
  const cardBox = await card.boundingBox();
  expectNear(cardBox?.x, 121);
  expectNear(cardBox?.y, 316);
  expectNear(cardBox?.width, 1198);
  expectNear(cardBox?.height, 1011);
  expectNear(alertBox?.x, 406);
  expectNear(alertBox?.y, 822);
  expectNear(alertBox?.width, 627);
  expectNear(alertBox?.height, 64);
  expectNear(submitBox?.x, 396);
  expectNear(submitBox?.y, 922);
  expectNear(submitBox?.width, 627);
  expectNear(submitBox?.height, 89);
  expectNear((await footer.boundingBox())?.y, 1067);
  await alert.evaluate(node => (node as HTMLElement).blur());
}

async function installSuccessfulSignup(page: Page) {
  await page.route(url => new URL(url).pathname.endsWith("/auth/v1/signup"), route => route.fulfill({ status: 200, json: {
    user: {
      id: "b1f5872a-148b-4878-8581-06b809b2992f",
      aud: "authenticated",
      role: "authenticated",
      email: "member@example.invalid",
      created_at: new Date().toISOString(),
    },
    session: null,
  } }));
}

async function saveCapture(page: Page, name: string) {
  await mkdir(evidenceDir, { recursive: true });
  await page.screenshot({ path: resolve(evidenceDir, name), fullPage: true });
}

function expectNear(actual: number | undefined, expected: number, tolerance = 5) {
  expect(actual).toBeDefined();
  expect(Math.abs(actual! - expected)).toBeLessThanOrEqual(tolerance);
}
