import { expect, test } from "@playwright/test";

const routes = [
  "/uk/home",
  "/en/films",
  "/uk/films/35",
  "/uk/search?q=a",
  "/uk/lists/discover",
  "/uk/community",
  "/uk/journal",
  "/en/help",
  "/uk/contact",
  "/en/login",
  "/en/register",
  "/en/forgot-password",
];

test("release routes keep landmarks and no horizontal overflow across the viewport matrix", async ({ page }) => {
  test.setTimeout(120_000);

  for (const width of [320, 393, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const pageErrors: string[] = [];
      page.removeAllListeners("pageerror");
      page.on("pageerror", error => pageErrors.push(error.message));

      await page.goto(route);
      await expect(page.locator("h1").first()).toBeVisible();
      const audit = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        main: document.querySelectorAll("main").length,
        header: document.querySelectorAll("header").length,
        footer: document.querySelectorAll("footer").length,
        h1: document.querySelectorAll("h1").length,
      }));

      expect(audit, `${route} at ${width}px`).toEqual({
        overflow: 0,
        main: 1,
        header: 1,
        footer: 1,
        h1: 1,
      });
      expect(pageErrors, `${route} at ${width}px has page errors`).toEqual([]);
    }
  }
});
