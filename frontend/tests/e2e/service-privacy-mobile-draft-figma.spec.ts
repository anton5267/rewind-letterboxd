import { expect, test } from "@playwright/test";

function expectBox(box: { x: number; y: number; width: number; height: number } | null, expected: { x: number; y: number; width: number; height?: number }) {
  expect(box).not.toBeNull();
  expect(box!.x).toBeCloseTo(expected.x, 0);
  expect(box!.y).toBeCloseTo(expected.y, 0);
  expect(box!.width).toBeCloseTo(expected.width, 0);
  if (expected.height !== undefined) expect(box!.height).toBeCloseTo(expected.height, 0);
}

test("mobile Privacy Policy follows the Figma draft layout", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 1496 });
  await page.goto("uk/privacy");

  const hero = page.locator('main > div[class*="hero"]');
  expectBox(await hero.boundingBox(), { x: 0, y: 64, width: 393, height: 454 });
  expectBox(await page.locator('main > div[class*="hero"] p[class*="eyebrow"]').boundingBox(), { x: 20, y: 90, width: 353 });
  expectBox(await page.locator("#service-page-title").boundingBox(), { x: 20, y: 124, width: 353 });
  expectBox(await page.locator('main > div[class*="hero"] nav a').nth(0).boundingBox(), { x: 20, y: 262, width: 173, height: 42 });
  expect(await page.locator('main > div[class*="hero"] nav a').count()).toBe(10);

  expectBox(await page.locator('main article div[class*="editorialIntro"] > p').first().boundingBox(), { x: 20, y: 552, width: 353 });
  const sectionHeadingsY = [644, 793, 959, 1074, 1189];
  for (const [index, y] of sectionHeadingsY.entries()) {
    expectBox(await page.locator('main article section[class*="editorialSection"] h3').nth(index).boundingBox(), { x: 20, y, width: 353 });
  }
  expectBox(await page.locator("footer").boundingBox(), { x: 0, y: 1293, width: 393, height: 111 });
  expectBox(await page.locator('header nav[aria-label="Головна навігація"]').nth(1).boundingBox(), { x: 0, y: 1404, width: 393, height: 92 });
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/service-pages/rewind-privacy-uk-mobile-393x1496.png", fullPage: true });
});

test("mobile English Privacy Policy follows its Figma draft layout", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 1497 });
  await page.goto("/en/privacy");

  expectBox(await page.locator('main > div[class*="hero"]').boundingBox(), { x: 0, y: 64, width: 393, height: 438 });
  expectBox(await page.locator('main > div[class*="hero"] nav a').nth(0).boundingBox(), { x: 20, y: 246, width: 173, height: 42 });
  expectBox(await page.locator('main article div[class*="editorialIntro"] > p').first().boundingBox(), { x: 20, y: 536, width: 353 });
  const sectionHeadingsY = [628, 794, 977, 1092, 1207];
  for (const [index, y] of sectionHeadingsY.entries()) {
    expectBox(await page.locator('main article section[class*="editorialSection"] h3').nth(index).boundingBox(), { x: 20, y, width: 353 });
  }
  expectBox(await page.locator("footer").boundingBox(), { x: 0, y: 1294, width: 393, height: 111 });
  expectBox(await page.locator('header nav[aria-label="Main navigation"]').nth(1).boundingBox(), { x: 0, y: 1405, width: 393, height: 92 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/service-pages/rewind-privacy-en-mobile-393x1497.png", fullPage: true });
});
