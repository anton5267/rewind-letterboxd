import { expect, test } from "@playwright/test";

test("Figma Lists and Search labels follow the selected locale", async ({ page }) => {
  await page.goto("/uk/lists/discover");
  await expect(page.locator("main")).toContainText("REWIND / ДОБІРКИ");
  await expect(page.locator("main")).toContainText("Збирайте фільми, створюйте добірки й діліться ними");

  await page.goto("/en/lists/discover");
  await expect(page.locator("main")).toContainText("REWIND / COLLECTIONS");
  await expect(page.locator("main")).toContainText("Collect, curate, and share");

  await page.goto("/uk/films");
  await expect(page.locator("main")).toContainText("REWIND / ПОШУК");
  await expect(page.locator("main")).toContainText("Знайдіть наступний фільм");

  await page.goto("/en/films");
  await expect(page.locator("main")).toContainText("REWIND / SEARCH");
  await expect(page.locator("main")).toContainText("Find the next film");
});
