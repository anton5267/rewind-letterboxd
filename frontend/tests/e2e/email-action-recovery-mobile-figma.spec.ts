import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const evidenceDir = resolve(process.cwd(), "../artifacts/visual-audit-20261124/auth");

function expectNear(actual: number | undefined, expected: number, tolerance = 4) {
  expect(actual).toBeDefined();
  expect(Math.abs(actual! - expected)).toBeLessThanOrEqual(tolerance);
}

test("mobile password recovery confirmation matches the Figma EN draft", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.setViewportSize({ width: 393, height: 895 });
  await page.goto("/en/email-action#rewind_action=recovery&type=recovery&token_hash=figma-recovery-token");

  const main = page.locator("main[data-rewind-auth-page]");
  const title = await main.getByRole("heading", { level: 1 }).boundingBox();
  const description = await main.locator("[class*=description]").boundingBox();
  const action = await main.getByRole("button", { name: "Continue to password change" }).boundingBox();
  const login = await main.getByRole("link", { name: "Log in" }).boundingBox();
  expectNear(title?.x, 32);
  expectNear(title?.y, 380);
  expectNear(description?.y, 449);
  expectNear(action?.x, 51);
  expectNear(action?.y, 548);
  expectNear(action?.width, 290);
  expectNear(login?.y, 646);
  expect(await page.evaluate(() => window.location.hash)).toBe("");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await mkdir(evidenceDir, { recursive: true });
  await page.screenshot({ path: resolve(evidenceDir, "rewind-password-recovery-confirm-en-mobile-393x895.png"), fullPage: true });
});

test("mobile password recovery confirmation matches the Figma UK draft", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.setViewportSize({ width: 393, height: 895 });
  await page.goto("/uk/email-action#rewind_action=recovery&type=recovery&token_hash=figma-recovery-token");

  const main = page.locator("main[data-rewind-auth-page]");
  expectNear((await main.getByRole("heading", { level: 1 }).boundingBox())?.x, 32);
  expectNear((await main.getByRole("heading", { level: 1 }).boundingBox())?.y, 380);
  expectNear((await main.locator("[class*=description]").boundingBox())?.y, 425);
  expectNear((await main.getByRole("button", { name: "Продовжити до зміни пароля" }).boundingBox())?.x, 51);
  expectNear((await main.getByRole("button", { name: "Продовжити до зміни пароля" }).boundingBox())?.y, 548);
  expectNear((await main.getByRole("link", { name: "Увійти" }).boundingBox())?.y, 646);
  expect(await page.evaluate(() => window.location.hash)).toBe("");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await mkdir(evidenceDir, { recursive: true });
  await page.screenshot({ path: resolve(evidenceDir, "rewind-password-recovery-confirm-uk-mobile-393x895.png"), fullPage: true });
});
