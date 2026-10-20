import { expect, test } from "@playwright/test";

test("journal renders the dark editorial feed with cover art", async ({ page }) => {
  await page.route("https://cdn.example.invalid/rewind-cover.jpg", async route => {
    await route.fulfill({
      status: 200,
      contentType: "image/jpeg",
      body: Buffer.from("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/Aaf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/Aaf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Aqf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z", "base64"),
    });
  });
  await page.route("**/api/journal/articles?*", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        content: [{
          id: 910001,
          slug: "design-journal-fixture",
          language: "uk",
          category: "Community",
          title: "Тестова історія Rewind",
          excerpt: "Короткий опис редакційної статті для visual flow.",
          content: "Повний текст",
          coverUrl: "https://cdn.example.invalid/rewind-cover.jpg",
          audioUrl: null,
          publishedAt: "2025-12-25T12:00:00Z",
        }],
        totalPages: 1,
        totalElements: 1,
      }),
    });
  });
  await page.route("**/api/journal/articles/archive?*", async route => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  await page.goto("/uk/journal");

  await expect(page.getByRole("heading", { name: "Журнал", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Тестова історія Rewind", level: 3 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Читати" })).toHaveAttribute("href", "/uk/journal/design-journal-fixture");
  await expect(page.locator('a[href="/uk/journal/design-journal-fixture"] img').first()).toHaveAttribute("src", "https://cdn.example.invalid/rewind-cover.jpg");
  await expect(page.locator("main")).toHaveCSS("background-color", "rgb(31, 31, 31)");
});
