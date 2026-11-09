import { expect, test } from "@playwright/test";

test("journal renders the dark editorial feed with cover art", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
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
        content: Array.from({ length: 5 }, (_, index) => ({
          id: 910001 + index,
          slug: index === 0 ? "design-journal-fixture" : `design-journal-fixture-${index}`,
          language: "uk",
          category: "Community",
          title: index === 0 ? "Тестова історія Rewind" : `Тестова історія ${index}`,
          excerpt: "Короткий опис редакційної статті для visual flow.",
          content: "Повний текст",
          coverUrl: "https://cdn.example.invalid/rewind-cover.jpg",
          audioUrl: null,
          publishedAt: "2025-12-25T12:00:00Z",
        })),
        totalPages: 1,
        totalElements: 5,
      }),
    });
  });
  await page.route("**/api/journal/articles/archive?*", async route => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  await page.goto("/uk/journal");

  await expect(page.getByRole("heading", { name: "Журнал", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Тестова історія Rewind", level: 3 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Читати" }).first()).toHaveAttribute("href", "/uk/journal/design-journal-fixture");
  await expect(page.locator('a[href="/uk/journal/design-journal-fixture"] img').first()).toHaveAttribute("src", "https://cdn.example.invalid/rewind-cover.jpg");
  await expect(page.locator("main")).toHaveCSS("background-color", "rgb(31, 31, 31)");

  const feature = page.locator("article").first();
  const cover = feature.locator('a[href="/uk/journal/design-journal-fixture"]').first();
  await expect(cover).toHaveCSS("border-radius", "30px");
  const intro = await page.locator('[class*="intro"]').boundingBox();
  expect(intro?.x).toBe(0);
  expect(intro?.width).toBe(1440);
  expect(intro?.height).toBe(818);
  const desktopCover = await cover.boundingBox();
  expect(desktopCover?.x).toBeCloseTo(120, 0);
  expect(desktopCover?.y).toBeCloseTo(212, 0);
  expect(desktopCover?.width).toBe(513);
  expect(desktopCover?.height).toBe(612);
  const featureBody = await feature.locator('[class*="cardBody"]').boundingBox();
  expect(featureBody?.x).toBeCloseTo(748, 0);
  expect(featureBody?.width).toBeCloseTo(572, 0);
  const secondCover = await page.locator("article").nth(1).locator('[class*="cover"]').boundingBox();
  expect(secondCover?.x).toBeCloseTo(120, 0);
  expect(secondCover?.y).toBeCloseTo(995, 0);
  expect(secondCover?.width).toBe(444);
  expect(secondCover?.height).toBe(408);
  const thirdCover = await page.locator("article").nth(2).locator('[class*="cover"]').boundingBox();
  expect(thirdCover?.y).toBeGreaterThanOrEqual(1570);
  expect(thirdCover?.y).toBeLessThanOrEqual(1573);

  await page.setViewportSize({ width: 393, height: 852 });
  await expect(cover).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test("journal article keeps its cover and content in the editorial frame", async ({ page }) => {
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

  await expect(page.getByRole("heading", { level: 1, name: 'Movies "Christmas Adventures"' })).toBeVisible();
  const metadata = page.locator('[class*="eyebrow"]');
  await expect(metadata).toContainText("Cinemascope");
  await expect(metadata.locator("time")).toHaveText("Dec 22, 2025");
  await expect(page.locator('[class*="meta"] time')).toHaveCount(0);
  expect(await metadata.evaluate(element => Boolean(element.compareDocumentPosition(document.querySelector("h1")!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  const frame = page.locator('[class*="articleHeader"]');
  const frameBox = await frame.boundingBox();
  expect(frameBox?.x).toBeCloseTo(120, 0);
  expect(frameBox?.y).toBe(0);
  expect(frameBox?.width).toBe(1126);
  expect(frameBox!.height).toBeGreaterThanOrEqual(909);

  const hero = page.locator('[class*="coverHero"]');
  const heroBox = await hero.boundingBox();
  expect(heroBox?.x).toBeCloseTo(120, 0);
  expect(heroBox?.y).toBeCloseTo(433, 0);
  expect(heroBox?.width).toBe(1126);
  expect(heroBox?.height).toBe(642);
  expect(heroBox?.y).toBeGreaterThan(400);

  const content = await page.locator('[class*="articleContent"]').boundingBox();
  expect(content!.y).toBeGreaterThanOrEqual(heroBox!.y + heroBox!.height - 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test("empty Journal skips unusable filters and archive and offers a useful next step", async ({ page }) => {
  await page.route("**/api/journal/articles?*", route => route.fulfill({ json: {
    content: [], totalPages: 0, totalElements: 0, number: 0, size: 20,
  } }));
  await page.route("**/api/journal/articles/archive?*", route => route.fulfill({ json: [] }));

  for (const [locale, width, expectedTitle, expectedEmpty, expectedAction] of [
    ["uk", 393, "Журнал", "Опублікованих статей поки немає.", "Переглянути фільми"],
    ["en", 393, "Journal", "No published articles yet.", "Browse films"],
    ["uk", 1440, "Журнал", "Опублікованих статей поки немає.", "Переглянути фільми"],
    ["en", 1440, "Journal", "No published articles yet.", "Browse films"],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/${locale}/journal`);
    const main = page.locator("main");
    await expect(main).toHaveAttribute("aria-busy", "false");
    await expect(main.getByRole("heading", { level: 1, name: expectedTitle })).toBeVisible();
    await expect(main.getByText(expectedEmpty, { exact: true })).toBeVisible();
    await expect(main.getByRole("link", { name: expectedAction })).toHaveAttribute("href", `/${locale}/films/discover`);
    await expect(main.getByRole("combobox")).toHaveCount(0);
    await expect(main.getByRole("heading", { name: /Архів|Archive/ })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    expect((await main.boundingBox())?.height).toBeLessThan(600);
  }
});
