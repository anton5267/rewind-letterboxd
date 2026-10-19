import { expect, test } from "@playwright/test";

test("journal retries a failed public load", async ({ page }) => {
  let failedOnce = false;
  await page.route("**/api/journal/articles**", async route => {
    if (!failedOnce && new URL(route.request().url()).pathname === "/api/journal/articles") {
      failedOnce = true;
      await route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
      return;
    }
    await route.continue();
  });

  await page.goto("/uk/journal");
  await expect(page.getByRole("alert")).toContainText("Не вдалося завантажити журнал.");
  await page.getByRole("button", { name: "Спробувати ще" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Журнал", level: 1 })).toBeVisible();
});
