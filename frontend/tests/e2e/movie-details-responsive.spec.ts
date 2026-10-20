import { expect, test } from "@playwright/test";

test("movie details stays localized and responsive across the Figma viewport matrix", async ({ page }) => {
  test.setTimeout(45_000);

  for (const locale of ["uk", "en"] as const) {
    for (const width of [320, 393, 768, 1440]) {
      const pageErrors: string[] = [];
      page.removeAllListeners("pageerror");
      page.on("pageerror", error => pageErrors.push(error.message));

      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${locale}/films/35`);
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");

      const audit = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        main: document.querySelectorAll("main").length,
        header: document.querySelectorAll("header").length,
        footer: document.querySelectorAll("footer").length,
        h1: document.querySelectorAll("h1").length,
      }));

      expect(audit, `${locale} Movie Details at ${width}px`).toEqual({
        overflow: 0,
        main: 1,
        header: 1,
        footer: 1,
        h1: 1,
      });
      await expect(page.getByRole("alert")).toHaveCount(0);
      expect(pageErrors, `${locale} Movie Details at ${width}px has page errors`).toEqual([]);
    }
  }
});
