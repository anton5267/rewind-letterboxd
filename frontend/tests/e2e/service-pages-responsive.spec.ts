import { expect, test } from "@playwright/test";

test("service pages use the Figma editorial hero and retain route navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const route of ["help", "contact", "rules", "privacy", "film-data", "delete-account"]) {
    await page.goto(`/uk/${route}`);
    const hero = page.locator('main > [class*="hero"]');
    await expect(hero).toHaveCSS("min-height", "818px");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('main > [class*="hero"] nav a')).toHaveCount(6);
    const details = await page.locator("main > article").boundingBox();
    expect(details?.width).toBeCloseTo(1200, 0);
  }
});
