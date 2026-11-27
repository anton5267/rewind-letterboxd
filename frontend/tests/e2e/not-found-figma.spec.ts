import { expect, test } from "@playwright/test";

test("404 page follows the READY desktop Figma composition", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("en/this-route-does-not-exist");

  const hero = page.locator('main > [class*="hero"]');
  const heading = page.getByRole("heading", { name: "Ooops! Page not found", exact: true });
  const backToHome = page.getByRole("link", { name: "Back to home", exact: true });

  await expect(heading).toBeVisible();
  await expect(backToHome).toBeVisible();
  await expect(hero).toHaveCSS("background-image", /search-hero-desktop\.png/);

  const headingBox = await heading.boundingBox();
  expect(headingBox?.y).toBeGreaterThan(580);
  expect(headingBox?.y).toBeLessThan(660);
  await expect(backToHome).toHaveAttribute("href", "/en/home");

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("en/this-route-does-not-exist");
  await expect(page.getByRole("heading", { name: "Ooops! Page not found", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await page.screenshot({ path: "test-results/not-found-mobile-393.png" });

  await page.goto("uk/this-route-does-not-exist");
  await expect(page.getByRole("heading", { name: "Ой! Сторінку не знайдено", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "На головну", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});
