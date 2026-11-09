import { expect, test } from "@playwright/test";

test("public discovery stays open while private pages redirect to localized sign-in", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/rewind-letterboxd/uk/search/");
  await expect(page.getByRole("heading", { name: "Глобальний пошук" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);

  await page.goto("/rewind-letterboxd/uk/lists/discover/");
  await expect(page.getByRole("heading", { name: "Добірки", exact: true })).toBeVisible();

  await page.goto("/rewind-letterboxd/uk/profile/");
  await expect(page).toHaveURL(/\/rewind-letterboxd\/uk\/login\/?$/);
  await expect(page.getByRole("heading", { name: "З поверненням" })).toBeVisible();
  await expect(page.getByLabel("Електронна пошта")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);

  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/rewind-letterboxd/en/messages/");
  await expect(page).toHaveURL(/\/rewind-letterboxd\/en\/login\/?$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});
