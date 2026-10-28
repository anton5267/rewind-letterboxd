import { expect, test } from "@playwright/test";

test("About follows the measured Figma editorial shell", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/about");

  const hero = page.locator('main > [class*="hero"]');
  const heroBox = await hero.boundingBox();
  expect(heroBox?.x).toBe(0);
  expect(heroBox?.width).toBe(1440);
  expect(heroBox?.height).toBe(818);
  await expect(hero.locator('[class*="title"]')).toHaveCSS("font-size", "58px");
  await expect(hero.locator('[class*="intro"]')).toHaveCSS("font-size", "24px");

  const content = page.locator('main > article[class*="content"]');
  const contentBox = await content.boundingBox();
  expect(contentBox?.x).toBe(120);
  expect(contentBox?.width).toBe(1200);
  const firstHeading = content.locator("h2").first();
  await expect(firstHeading).toBeVisible();
  const headingBox = await firstHeading.boundingBox();
  expect(headingBox?.x).toBe(120);
  expect(headingBox?.y).toBe(713);

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/about");
  await expect(page.getByRole("heading", { name: /^About Us$/i })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});
