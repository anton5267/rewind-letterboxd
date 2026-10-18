import { expect, test } from "@playwright/test";

test("localizes API-provided genre names on catalog language routes", async ({ page }) => {
  await page.goto("/uk/films");
  await expect(page.getByLabel("Жанр").locator("option", { hasText: "Бойовик" })).toHaveCount(1);
  await expect(page.getByLabel("Жанр").locator("option", { hasText: "Action" })).toHaveCount(0);

  await page.goto("/en/films");
  await expect(page.getByLabel("Genre").locator("option", { hasText: "Action" })).toHaveCount(1);
  await expect(page.getByLabel("Genre").locator("option", { hasText: "Бойовик" })).toHaveCount(0);
});
