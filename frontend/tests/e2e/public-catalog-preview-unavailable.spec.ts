import { expect, test } from "@playwright/test";

test("unsupported preview routes explain the limit in Ukrainian and English", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/rewind-letterboxd/uk/profile/");
  await expect(page.getByRole("heading", { name: "Ця сторінка ще не доступна" })).toBeVisible();
  await expect(page.getByText(/Профілі, списки, відгуки й повідомлення поки не підключені/)).toBeVisible();
  await page.getByRole("link", { name: "Перейти до каталогу" }).click();
  await expect(page.getByRole("heading", { name: "Відкрий своє наступне кіно" })).toBeVisible();

  await page.goto("/rewind-letterboxd/en/messages/");
  await expect(page.getByRole("heading", { name: "This page is not available yet" })).toBeVisible();
  await expect(page.getByText(/Profiles, lists, reviews, and messages are not connected yet/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse the catalogue" })).toHaveAttribute("href", "/rewind-letterboxd/en/home/");
  await expect(page).toHaveTitle("This page is not available yet | REWIND");
});
