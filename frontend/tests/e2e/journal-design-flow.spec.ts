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

  const feature = page.locator("article").first();
  const cover = feature.locator('a[href="/uk/journal/design-journal-fixture"]').first();
  await expect(cover).toHaveCSS("border-radius", "30px");
  const desktopCover = await cover.boundingBox();
  expect(desktopCover?.height).toBe(612);

  await page.setViewportSize({ width: 393, height: 852 });
  await expect(cover).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test("journal article follows the Figma editorial frame geometry", async ({ page }) => {
  await page.route("**/api/journal/articles/editorial-frame-fixture**", route => route.fulfill({ json: {
    id: 910002,
    slug: "editorial-frame-fixture",
    language: "en",
    category: "Cinemascope",
    title: "Movies \"Christmas Adventures\"",
    excerpt: "A long form editorial introduction that remains readable below the hero image.",
    content: "The complete editorial text.",
    coverUrl: null,
    audioUrl: null,
    publishedAt: "2025-12-22T12:00:00Z",
  } }));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/journal/editorial-frame-fixture");

  const frame = page.locator('[class*="articleHeader"]');
  const frameBox = await frame.boundingBox();
  expect(frameBox?.x).toBeCloseTo(120, 0);
  expect(frameBox?.y).toBe(0);
  expect(frameBox?.width).toBe(1126);
  expect(frameBox?.height).toBe(909);

  const hero = page.locator('[class*="coverHero"]');
  const heroBox = await hero.boundingBox();
  expect(heroBox?.x).toBeCloseTo(120, 0);
  expect(heroBox?.width).toBe(1126);
  expect(heroBox?.height).toBe(642);
  expect(heroBox?.y).toBeGreaterThan(400);

  const content = await page.locator('[class*="articleContent"]').boundingBox();
  expect(content?.y).toBe(909);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});
