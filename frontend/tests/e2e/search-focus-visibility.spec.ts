import { expect, test } from "@playwright/test";
import { waitForPageContent } from "./helpers";

test("search fields and film filters keep a visible keyboard focus ring", async ({ page }) => {
  const expectKeyboardRing = async (selector: string) => {
    const control = page.locator(selector);
    await control.focus();
    await expect(control).toBeFocused();
    await expect(control).toHaveCSS("outline-style", "solid");
    await expect(control).toHaveCSS("outline-width", "3px");
    await expect(control).toHaveCSS("outline-color", "rgb(123, 223, 242)");
    await expect(control).toHaveCSS("outline-offset", "3px");
    expect(await control.evaluate(element => element.matches(":focus-visible"))).toBe(true);
  };

  await page.goto("uk/films/");
  await waitForPageContent(page);
  await expectKeyboardRing("#film-search-query");
  await expectKeyboardRing("#film-search-year");

  await page.goto("uk/search/");
  await waitForPageContent(page);
  await expectKeyboardRing("#global-search-query");
});
