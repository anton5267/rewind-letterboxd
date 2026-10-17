import { expect, test } from "@playwright/test";

test("public pages render in both locales without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });

  for (const route of ["/uk/home", "/en/home", "/uk/films", "/en/help", "/uk/journal"]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${route} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
    const expectedLanguage = route.startsWith("/en/") ? "en" : "uk";
    await expect(page.locator("html")).toHaveAttribute("lang", expectedLanguage);
  }
});

test("guest users cannot open private or admin pages", async ({ page }) => {
  const expectedRedirects: Record<string, RegExp> = {
    "/uk/profile": /\/uk\/login$/,
    "/uk/lists": /\/uk\/login$/,
    "/uk/messages": /\/uk\/login$/,
    "/uk/notifications": /\/uk\/login$/,
    "/uk/admin": /\/uk\/home$/,
  };

  for (const [route, redirect] of Object.entries(expectedRedirects)) {
    await page.goto(route);
    await expect(page).toHaveURL(redirect);
    await expect(page.locator("h1")).toBeVisible();
  }
});
