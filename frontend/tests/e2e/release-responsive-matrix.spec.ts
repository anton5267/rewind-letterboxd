import { expect, test } from "@playwright/test";
import { waitForPageContent } from "./helpers";

const routes = [
  "/uk/home",
  "/en/films",
  "/uk/films/35",
  "/uk/search?q=a",
  "/uk/lists/discover",
  "/uk/community",
  "/uk/community/reviewers",
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
      await waitForPageContent(page);
      await expect(page.locator('main[aria-busy="true"], main [aria-busy="true"]')).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      const audit = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        main: document.querySelectorAll("main").length,
        h1: document.querySelectorAll("h1").length,
      }));

      expect(audit, `${route} at ${width}px`).toEqual({
        overflow: 0,
        main: 1,
        h1: 1,
      });
      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);
      if (route === "/uk/community/reviewers") {
        const header = await page.getByRole("banner").boundingBox();
        const back = await page.locator("main a").first().boundingBox();
        expect(header).not.toBeNull();
        expect(back).not.toBeNull();
        expect(back!.y, `Reviewers toolbar clears the header at ${width}px`).toBeGreaterThanOrEqual(header!.y + header!.height);
      }
      expect(pageErrors, `${route} at ${width}px has page errors`).toEqual([]);
    }
  }
});
