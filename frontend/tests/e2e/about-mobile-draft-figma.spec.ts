import { expect, test } from "@playwright/test";
import { resolve } from "node:path";

function expectBox(box: { x: number; y: number; width: number; height: number } | null, expected: { x: number; y: number; width: number; height?: number }) {
  expect(box).not.toBeNull();
  expect(box!.x).toBeCloseTo(expected.x, 0);
  expect(box!.y).toBeCloseTo(expected.y, 0);
  expect(box!.width).toBeCloseTo(expected.width, 0);
  if (expected.height !== undefined) expect(box!.height).toBeCloseTo(expected.height, 0);
}

test("mobile About follows the Figma draft anchors and credits", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 3910 });
  await page.goto("uk/about");

  const hero = page.locator('main > div[class*="hero"]');
  const heroBox = await hero.boundingBox();
  expectBox(heroBox, { x: 0, y: 64, width: 393, height: 438 });

  const overline = page.getByText("REWIND / ПРО НАС", { exact: true });
  await expect(overline).toBeVisible();
  expectBox(await overline.boundingBox(), { x: 20, y: 90, width: 353 });

  const title = page.getByRole("heading", { name: "Про нас" });
  expectBox(await title.boundingBox(), { x: 20, y: 124, width: 353 });

  const intro = page.getByText("Rewind — культурний простір для тих, хто живе кінематографом і бачить у ньому частину сучасного життя.", { exact: true });
  expectBox(await intro.boundingBox(), { x: 20, y: 168, width: 353 });

  const serviceLinks = page.locator('nav[aria-label="Навігація сервісу"] a');
  expect(await serviceLinks.count()).toBe(10);
  expectBox(await serviceLinks.nth(0).boundingBox(), { x: 20, y: 246, width: 173, height: 42 });
  expectBox(await serviceLinks.nth(1).boundingBox(), { x: 200, y: 246, width: 173, height: 42 });

  const firstStoryHeading = page.getByRole("heading", { name: "Наша місія" });
  expectBox(await firstStoryHeading.boundingBox(), { x: 20, y: 538, width: 353 });
  await expect(page.getByRole("heading", { name: "Дані та зображення фільмів" })).toBeVisible();
  await expect(page.getByText("TMDB API", { exact: true })).toBeVisible();
  await expect(page.getByText("Цей продукт використовує TMDB API, але не схвалений і не сертифікований TMDB.", { exact: true })).toBeVisible();

  const headingsY = [538, 938, 1361, 1692, 2000, 2331, 2639, 2947];
  for (const [index, y] of headingsY.entries()) {
    expectBox(await page.locator('main article div[class*="story"] h2').nth(index).boundingBox(), { x: 20, y, width: 353 });
  }
  expectBox(await page.locator('main article section[class*="credits"] h2').boundingBox(), { x: 20, y: 3222, width: 353 });
  expectBox(await page.locator('main article a[class*="tmdbLink"]').boundingBox(), { x: 20, y: 3264, width: 230 });
  expectBox(await page.locator('main article p[class*="disclaimer"]').boundingBox(), { x: 20, y: 3302, width: 353 });
  expectBox(await page.locator("footer").boundingBox(), { x: 0, y: 3467, width: 393, height: 351 });
  expectBox(await page.locator('header nav[aria-label="Головна навігація"]').nth(1).boundingBox(), { x: 0, y: 3818, width: 393, height: 92 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261124/about/rewind-about-uk-mobile-393x3910.png") });
});

test("mobile About EN follows its translated Figma draft", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 3899 });
  await page.goto("en/about");

  await expect(page.getByText("REWIND  /  ABOUT", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Frequent Questions" })).toBeVisible();
  const headingsY = [538, 938, 1384, 1715, 2046, 2377, 2685, 2993];
  for (const [index, y] of headingsY.entries()) {
    expectBox(await page.locator('main article div[class*="story"] h2').nth(index).boundingBox(), { x: 20, y, width: 353 });
  }
  expectBox(await page.locator('main article section[class*="credits"] h2').boundingBox(), { x: 20, y: 3268, width: 353 });
  expectBox(await page.locator('main article a[class*="tmdbLink"]').boundingBox(), { x: 20, y: 3310, width: 230 });
  expectBox(await page.locator('main article p[class*="disclaimer"]').boundingBox(), { x: 20, y: 3348, width: 353 });
  expectBox(await page.locator("footer").boundingBox(), { x: 0, y: 3512, width: 393, height: 295 });
  expectBox(await page.locator('header nav[aria-label="Main navigation"]').nth(1).boundingBox(), { x: 0, y: 3807, width: 393, height: 92 });
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261124/about/rewind-about-en-mobile-393x3899.png") });
});
