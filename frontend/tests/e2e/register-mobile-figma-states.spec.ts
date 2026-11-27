import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const evidenceDir = resolve(process.cwd(), "../artifacts/visual-audit-20261125/auth");

for (const language of ["uk", "en"] as const) {
  test(`${language} registration password-byte-limit error matches mobile Figma`, async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(`/${language}/register`);
    await fillRegistrationForm(page, language, "а".repeat(37));
    await page.locator('main button[type="submit"]').click();
    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    const box = await alert.boundingBox();
    expectNear(box?.x, 52);
    expectNear(await documentY(page, box?.y), 496);
    expectNear(box?.width, 290);
    expectNear(box?.height, 56);
    await alert.evaluate(node => (node as HTMLElement).blur());
    await saveCapture(page, `register-password-limit-${language}-mobile-393.png`);
  });

  test(`${language} registration request-failure error matches mobile Figma`, async ({ page }) => {
    await page.route(url => new URL(url).pathname.endsWith("/auth/v1/signup"), route => route.fulfill({ status: 500, json: { message: "fixture registration failure" } }));
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(`/${language}/register`);
    await fillRegistrationForm(page, language);
    await page.locator('main button[type="submit"]').click();
    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    const box = await alert.boundingBox();
    expectNear(box?.x, 52);
    expectNear(await documentY(page, box?.y), 496);
    expectNear(box?.width, 290);
    expectNear(box?.height, 56);
    await alert.evaluate(node => (node as HTMLElement).blur());
    await saveCapture(page, `register-request-error-${language}-mobile-393.png`);
  });

  test(`${language} registration confirmation-required success matches mobile Figma`, async ({ page }) => {
    let intercepted = false;
    await page.route(url => new URL(url).pathname.endsWith("/api/auth/csrf"), route =>
      route.fulfill({ status: 200, json: { token: "register-confirmation-fixture" } })
    );
    await page.route(url => new URL(url).pathname.endsWith("/api/auth/register"), route => {
      intercepted = true;
      return route.fulfill({ status: 200, json: { confirmationRequired: true } });
    });
    await page.route(url => new URL(url).pathname.endsWith("/auth/v1/signup"), route => {
      intercepted = true;
      return route.fulfill({ status: 200, json: {
      user: {
        id: "b1f5872a-148b-4878-8581-06b809b2992f",
        aud: "authenticated",
        role: "authenticated",
        email: "member@example.invalid",
        created_at: new Date().toISOString(),
      },
      session: null,
      } });
    });
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(`/${language}/register`);
    await fillRegistrationForm(page, language);
    await page.locator('main button[type="submit"]').click();
    await expect.poll(() => intercepted).toBe(true);
    const heading = page.getByRole("heading", { name: language === "uk" ? "Акаунт створено" : "Account created" });
    await expect(heading).toBeVisible();
    const headingBox = await heading.boundingBox();
    const notice = page.getByRole("status");
    const action = page.getByRole("button", { name: language === "uk" ? "Перейти до входу" : "Go to login" });
    expectNear(headingBox?.x, 32);
    expectNear(await documentY(page, headingBox?.y), 101);
    expectNear(headingBox?.width, 329);
    expectNear(await documentY(page, (await notice.boundingBox())?.y), 148);
    expectNear((await action.boundingBox())?.x, 52);
    expectNear(await documentY(page, (await action.boundingBox())?.y), 220);
    expectNear((await action.boundingBox())?.width, 290);
    expectNear((await action.boundingBox())?.height, 72);
    await heading.evaluate(node => (node as HTMLElement).blur());
    await saveCapture(page, `register-success-${language}-mobile-393.png`);
  });
}

async function fillRegistrationForm(page: Page, _language: "uk" | "en", password = "secure-pass-123") {
  await page.locator("#register-username").fill("rewind-member");
  await page.locator("#register-email").fill("member@example.invalid");
  await page.locator("#register-password").fill(password);
}

async function saveCapture(page: Page, name: string) {
  await mkdir(evidenceDir, { recursive: true });
  await page.screenshot({ path: resolve(evidenceDir, name), fullPage: true });
}

async function documentY(page: Page, viewportY: number | undefined) {
  return viewportY === undefined ? undefined : viewportY + await page.evaluate(() => window.scrollY);
}

function expectNear(actual: number | undefined, expected: number, tolerance = 4) {
  expect(actual).toBeDefined();
  expect(Math.abs(actual! - expected)).toBeLessThanOrEqual(tolerance);
}
