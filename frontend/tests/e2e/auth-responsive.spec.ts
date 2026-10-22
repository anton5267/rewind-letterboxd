import { expect, test } from "@playwright/test";

test("mobile auth matches the standalone Figma composition", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/login");

  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Return" })).toBeVisible();
  await expect(page.getByText("Sign in with", { exact: true })).toBeVisible();
  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
  await expect(page.locator("footer a, footer button")).toHaveCount(0);

  const geometry = await page.evaluate(() => {
    const main = document.querySelector("main")?.getBoundingClientRect();
    const header = document.querySelector("header")?.getBoundingClientRect();
    const footer = document.querySelector("footer")?.getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      mainTop: main?.top ?? -1,
      headerHeight: header?.height ?? -1,
      footerHeight: footer?.height ?? -1,
    };
  });

  expect(geometry.overflow).toBeLessThanOrEqual(1);
  expect(geometry.mainTop).toBeGreaterThanOrEqual(0);
  expect(geometry.headerHeight).toBeLessThanOrEqual(1);
  expect(geometry.footerHeight).toBeLessThanOrEqual(1);

  await page.goto("/en/register");
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Return" })).toBeVisible();
  await expect(page.getByText("Sign in with", { exact: true })).toBeVisible();

  await page.goto("/en/forgot-password");
  await expect(page.getByRole("heading", { name: "Forgot your password?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "← Return" })).toBeVisible();

  await page.goto("/en/reset-password?token=responsive-fixture-token");
  await expect(page.getByRole("heading", { name: "Set a new password" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "New password" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Confirm password" })).toBeVisible();
});
