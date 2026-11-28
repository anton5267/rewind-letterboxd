import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

test("READY mobile login matches the Figma form and keeps password/error states accessible", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/auth/login", route => route.fulfill({ status: 401, json: { message: "Invalid email or password." } }));
  await page.route("**/token?grant_type=password", route => route.fulfill({ status: 400, json: { message: "Invalid login credentials" } }));
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/login");

  const box = async (locator: ReturnType<typeof page.locator>) => {
    const result = await locator.boundingBox();
    expect(result).not.toBeNull();
    return result!;
  };
  const titleBox = await box(page.getByRole("heading", { name: "Welcome back", exact: true }));
  const emailBox = await box(page.getByRole("textbox", { name: "Email", exact: true }));
  const passwordBox = await box(page.getByRole("textbox", { name: "Password", exact: true }));
  const submitBox = await box(page.getByRole("button", { name: "Log in", exact: true }));
  const eyeBox = await box(page.getByRole("button", { name: "Show password" }));
  const forgotBox = await box(page.getByRole("link", { name: "Forgot password?", exact: true }));
  const footerBox = await box(page.getByRole("link", { name: "Create one", exact: true }));
  const expectNear = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
  expect(titleBox.y).toBeCloseTo(169, 0);
  expectNear(emailBox.x, 52);
  expectNear(emailBox.y, 364);
  expectNear(emailBox.width, 290);
  expectNear(emailBox.height, 45);
  expectNear(passwordBox.x, 52);
  expectNear(passwordBox.y, 438);
  expectNear(passwordBox.width, 290);
  expectNear(passwordBox.height, 45);
  expectNear(submitBox.x, 52);
  expectNear(submitBox.y, 538);
  expectNear(submitBox.width, 290);
  expectNear(submitBox.height, 56);
  expectNear(eyeBox.width, 44);
  expectNear(eyeBox.height, 44);
  expectNear(forgotBox.x, 248);
  expectNear(forgotBox.y, 479);
  expect(Math.abs(forgotBox.width - 90)).toBeLessThanOrEqual(5);
  expect(Math.abs(footerBox.x - 228)).toBeLessThanOrEqual(3);
  expectNear(footerBox.y, 635);
  expectNear(footerBox.width, 58);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);

  const password = page.getByLabel("Password", { exact: true });
  const showPassword = page.getByRole("button", { name: "Show password" });
  await password.fill("correct-horse-battery");
  await showPassword.click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(page.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(password).toHaveAttribute("type", "password");

  await page.getByLabel("Email", { exact: true }).fill("user@example.com");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  const error = page.getByRole("alert");
  await expect(error).toHaveText("Invalid email or password.");
  await expect(error).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);

  const evidenceDir = path.resolve(process.cwd(), "..", "..", "artifacts", "visual-audit-20261126", "auth");
  mkdirSync(evidenceDir, { recursive: true });
  await page.goto("/en/login");
  await page.screenshot({ path: path.join(evidenceDir, "rewind-login-en-mobile-393x852.png"), fullPage: true });

  for (const locale of ["uk", "en"] as const) {
    await page.goto(`/${locale}/login`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    for (const width of [320, 393, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByRole("link", { name: locale === "en" ? "Forgot password?" : "Забули пароль?", exact: true }))
        .toHaveCSS("color", "rgb(153, 153, 153)");
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    }
  }

  await page.setViewportSize({ width: 1440, height: 1614 });
  await page.goto("/en/login");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("user@example.com");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("incorrect-password");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Invalid email or password.");
  await expect(page.getByRole("alert")).toBeFocused();
});

test("mobile auth retains standalone composition and supported local forms", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.setViewportSize({ width: 393, height: 852 });
  for (const route of ["login", "register", "forgot-password", "reset-password?token=responsive-fixture-token"]) {
    await page.goto(`en/${route}`);
    const main = page.locator("main");
    await expect(main.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(main.locator("form")).toHaveCount(1);
    // OAuth remains an explicit contract gap, never a decorative dead action.
    await expect(main.getByText("Sign in with", { exact: true })).toHaveCount(0);
    const geometry = await page.evaluate(() => {
      const heading = document.querySelector("main h1")!;
      const input = document.querySelector("main input")!.getBoundingClientRect();
      const submit = document.querySelector('main form button[type="submit"]')!.getBoundingClientRect();
      return { overflow: document.documentElement.scrollWidth - innerWidth,
        font: getComputedStyle(heading).fontFamily, title: heading.getBoundingClientRect().toJSON(),
        input: input.toJSON(), submit: submit.toJSON(),
        header: document.querySelector("header")?.getBoundingClientRect().height ?? 0,
        footer: document.querySelector("footer")?.getBoundingClientRect().height ?? 0 };
    });
    expect(geometry.overflow).toBe(0);
    expect(geometry.font).toContain("Inter");
    expect(geometry.header).toBeLessThanOrEqual(1);
    expect(geometry.footer).toBeLessThanOrEqual(1);
    expect(geometry.input.x).toBeGreaterThanOrEqual(16);
    expect(geometry.input.right).toBeLessThanOrEqual(393 - 16);
    expect(geometry.input.y).toBeGreaterThan(geometry.title.bottom);
    expect(geometry.submit.y).toBeGreaterThanOrEqual(geometry.input.bottom);
    expect(geometry.submit.height).toBeGreaterThanOrEqual(44);
    const field = main.locator("input").first();
    await field.focus();
    await expect(field).toBeFocused();
  }
  await expect(page.getByRole("textbox", { name: "New password", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Confirm password", exact: true })).toBeVisible();
});
