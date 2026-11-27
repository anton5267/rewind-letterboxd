import { expect, test } from "@playwright/test";

const emptyPage = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 20 };

test("mobile Journal error state matches the UK and EN Figma drafts", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.route("**/api/journal/articles/archive?*", route => route.fulfill({ json: [] }));
  await page.route("**/api/journal/articles?*", route => route.fulfill({ status: 503, json: {} }));

  for (const locale of ["uk", "en"] as const) {
    await page.goto(`/${locale}/journal`);
    const message = locale === "uk" ? "Не вдалося завантажити журнал." : "Could not load the journal.";
    const retry = locale === "uk" ? "Спробувати ще" : "Retry";
    const notice = page.locator("[class*='error']").filter({ hasText: message });
    await expect(notice).toBeVisible();
    await expect(notice.getByRole("button", { name: retry, exact: true })).toBeVisible();

    const geometry = await page.evaluate(() => {
      const rect = (element: Element | null) => {
        if (!element) return null;
        const box = element.getBoundingClientRect();
        return { x: box.x, y: box.y + window.scrollY, width: box.width, height: box.height };
      };
      const error = document.querySelector("[class*='error']");
      return { intro: rect(document.querySelector("main > section")), title: rect(document.querySelector("main > section h1")), toolbar: rect(document.querySelector("select")), error: rect(error), retry: rect(error?.querySelector("button") ?? null), retryText: rect(error?.querySelector("button")?.firstElementChild ?? null) };
    });
    console.log(`JOURNAL_${locale.toUpperCase()}_ERROR`, JSON.stringify(geometry));
    expect(geometry.intro).toMatchObject({ x: 16, y: 64, width: 361, height: 96 });
    expect(geometry.title).toMatchObject({ x: 16, y: 84, width: 150, height: 38 });
    expect(geometry.toolbar).toMatchObject({ x: 16, width: 361, height: 44 });
    expect(Math.abs(geometry.toolbar!.y - 188)).toBeLessThanOrEqual(1);
    expect(geometry.error).toMatchObject({ x: 16, width: 361, height: 135 });
    expect(Math.abs(geometry.error!.y - 253)).toBeLessThanOrEqual(1);
    expect(geometry.retry).toMatchObject({ width: 150, height: 44 });
    expect(Math.abs(geometry.retry!.x - 32)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.retry!.y - 327)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `../artifacts/visual-audit-20261124/journal/rewind-journal-error-${locale}-mobile-393.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  }
  await page.setViewportSize({ width: 320, height: 852 });
  await page.goto("/en/journal");
  await expect(page.locator("[class*='error']")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test("mobile Journal loading skeleton follows the Figma article rhythm", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.route("**/api/journal/articles/archive?*", route => route.fulfill({ json: [] }));
  let releaseFeed!: () => void;
  let signalRequest!: () => void;
  const gate = new Promise<void>(resolve => { releaseFeed = resolve; });
  const requestStarted = new Promise<void>(resolve => { signalRequest = resolve; });
  await page.route("**/api/journal/articles?*", async route => {
    signalRequest();
    await gate;
    return route.fulfill({ json: emptyPage });
  });

  await page.goto("/uk/journal");
  await requestStarted;
  const loading = page.locator("[class*='loadingGrid']");
  await expect(loading).toBeVisible();
  const geometry = await page.evaluate(() => {
    const rect = (element: Element | null) => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y + window.scrollY, width: box.width, height: box.height };
    };
    const lines = Array.from(document.querySelectorAll("[class*='loadingCard'] [class*='skeletonLine']"));
    const cards = Array.from(document.querySelectorAll("[class*='loadingCard']"));
    return {
      firstLines: lines.slice(0, 4).map(rect),
      firstCover: rect(cards[0]?.querySelector("[class*='cover']") ?? null),
      firstThumb: rect(cards[0]?.querySelector("[class*='thumb']") ?? null),
      divider: rect(cards[0]),
      secondFirstLine: rect(lines[4] ?? null),
      secondCover: rect(cards[1]?.querySelector("[class*='cover']") ?? null),
    };
  });
  console.log("JOURNAL_UK_LOADING", JSON.stringify(geometry));
  expect(geometry.firstLines.map(item => item && [Math.round(item.x), Math.round(item.y), Math.round(item.width), Math.round(item.height)])).toEqual([
    [16, 253, 178, 12], [16, 276, 282, 24], [16, 311, 352, 14], [16, 334, 234, 14],
  ]);
  expect(geometry.firstCover).toMatchObject({ x: 16, width: 241, height: 150 });
  expect(Math.abs(geometry.firstCover!.y - 366)).toBeLessThanOrEqual(1);
  expect(geometry.firstThumb).toMatchObject({ x: 273, width: 104, height: 150 });
  expect(Math.abs(geometry.firstThumb!.y - 366)).toBeLessThanOrEqual(1);
  expect(geometry.secondFirstLine && Math.round(geometry.secondFirstLine.y)).toBe(556);
  expect(Math.abs((geometry.secondCover?.y ?? -1) - 650)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/journal/rewind-journal-loading-uk-mobile-393.png" });
  releaseFeed();
  await expect(page.getByText("Опублікованих статей поки немає.", { exact: true })).toBeVisible();
});

test("English mobile Journal loading skeleton matches Figma geometry", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.route("**/api/journal/articles/archive?*", route => route.fulfill({ json: [] }));
  let releaseFeed!: () => void;
  let signalRequest!: () => void;
  const gate = new Promise<void>(resolve => { releaseFeed = resolve; });
  const requestStarted = new Promise<void>(resolve => { signalRequest = resolve; });
  await page.route("**/api/journal/articles?*", async route => {
    signalRequest();
    await gate;
    return route.fulfill({ json: emptyPage });
  });

  await page.goto("/en/journal");
  await requestStarted;
  const loading = page.locator("[class*='loadingGrid']");
  await expect(loading).toBeVisible();
  await expect(page.locator("select")).toHaveValue("");
  const firstCard = loading.locator("[class*='loadingCard']").first();
  const boxes = await firstCard.locator("[class*='skeletonLine']").evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return [Math.round(box.x), Math.round(box.y + window.scrollY), Math.round(box.width), Math.round(box.height)];
  }));
  expect(boxes.slice(0, 4)).toEqual([[16, 253, 178, 12], [16, 276, 282, 24], [16, 311, 352, 14], [16, 334, 234, 14]]);
  const covers = await firstCard.locator("[class*='cover'], [class*='thumb']").evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return [Math.round(box.x), Math.round(box.y + window.scrollY), Math.round(box.width), Math.round(box.height)];
  }));
  expect(covers).toEqual([[16, 366, 241, 150], [273, 366, 104, 150]]);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/journal/rewind-journal-loading-en-mobile-393.png" });
  releaseFeed();
  await expect(page.getByText("No published articles yet.", { exact: true })).toBeVisible();
});

test("mobile Journal populated feature and next card match UK and EN Figma drafts", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  const coverUrls = [1, 2, 3].map(index => `https://journal-fixture.invalid/cover-${index}.jpg`);
  await page.route("https://journal-fixture.invalid/**", route => route.fulfill({
    status: 200,
    contentType: "image/jpeg",
    body: Buffer.from("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/Aaf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/Aaf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Aqf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z", "base64"),
  }));
  await page.route("**/api/journal/articles/archive?*", route => route.fulfill({ json: [] }));

  for (const locale of ["en", "uk"] as const) {
    const english = locale === "en";
    const articles = [
      {
        id: 91001, slug: `christmas-adventures-${locale}`, language: locale, category: "COMMUNITY",
        title: english ? "Movies “Christmas Adventures”" : "Різдвяні пригоди",
        excerpt: english ? "A joyful holiday story brings familiar faces together for one unforgettable Christmas adventure." : "Тепла різдвяна історія збирає знайомі обличчя у незабутній святковій пригоді.",
        content: "Editorial fixture article.", coverUrl: coverUrls[0], coverImages: coverUrls,
        audioUrl: null, authorName: english ? "REWIND EDITORIAL" : "РЕДАКЦІЯ REWIND", publishedAt: "2025-12-22T12:00:00Z",
      },
      {
        id: 91002, slug: `best-films-2025-${locale}`, language: locale, category: "NEWS",
        title: english ? "Best Films 2025" : "Найкращі фільми 2025",
        excerpt: english ? "The Rewind team highlights the films that defined the year." : "Команда Rewind згадує фільми, які визначили цей рік.",
        content: "Editorial fixture article.", coverUrl: coverUrls[1], coverImages: null,
        audioUrl: null, authorName: english ? "REWIND EDITORIAL" : "РЕДАКЦІЯ REWIND", publishedAt: "2025-11-13T12:00:00Z",
      },
    ];
    await page.route("**/api/journal/articles?*", route => route.fulfill({ json: { content: articles, totalPages: 1, totalElements: 2 } }));
    await page.goto(`/${locale}/journal`);
    const title = english ? "Movies “Christmas Adventures”" : "Різдвяні пригоди";
    await expect(page.getByRole("heading", { level: 3, name: title })).toBeVisible();
    await expect(page.getByRole("link", { name: english ? "Read story" : "Читати статтю" })).toBeVisible();
    await expect(page.locator("article").first().locator("time")).toHaveText(english ? "Dec 22, 2025" : "22 грудня 2025");
    const geometry = await page.evaluate(() => {
      const rect = (element: Element | null) => {
        if (!element) return null;
        const box = element.getBoundingClientRect();
        return { x: box.x, y: box.y + window.scrollY, width: box.width, height: box.height };
      };
      const cards = Array.from(document.querySelectorAll("article"));
      const first = cards[0];
      const second = cards[1];
      return {
        featureMeta: rect(first?.querySelector("[class*='cardMeta']") ?? null),
        featureTitle: rect(first?.querySelector("h3") ?? null),
        featureExcerpt: rect(first?.querySelector("[class*='cardBody'] p") ?? null),
        featureFooter: rect(first?.querySelector("[class*='cardFooter']") ?? null),
        featureByline: rect(first?.querySelector("[class*='byline']") ?? null),
        featureButton: rect(first?.querySelector("[class*='readLink']") ?? null),
        collage: rect(first?.querySelector("[data-journal-cover]") ?? first?.querySelector("a[class*='cover']") ?? null),
        coverLink: rect(first?.querySelector("a[class*='cover']") ?? null),
        poster: rect(first?.querySelector("[class*='thumb']") ?? null),
        secondMeta: rect(second?.querySelector("[class*='cardMeta']") ?? null),
        secondTitle: rect(second?.querySelector("h3") ?? null),
        secondExcerpt: rect(second?.querySelector("[class*='cardBody'] p") ?? null),
        secondCover: rect(second?.querySelector("[class*='cover']") ?? null),
        secondPoster: rect(second?.querySelector("[class*='thumb']") ?? null),
      };
    });
    console.log(`JOURNAL_${locale.toUpperCase()}_POPULATED`, JSON.stringify(geometry));
    expect(geometry.featureMeta).toMatchObject({ x: 16, width: 361 });
    expect(Math.abs(geometry.featureMeta!.y - 253)).toBeLessThanOrEqual(1);
    expect(geometry.featureTitle).toMatchObject({ x: 16, width: 361, height: 24 });
    expect(Math.abs(geometry.featureTitle!.y - 274)).toBeLessThanOrEqual(1);
    expect(geometry.featureExcerpt && Math.abs(geometry.featureExcerpt.y - 326)).toBeLessThanOrEqual(1);
    expect(geometry.featureByline).toMatchObject({ x: 16 });
    expect(geometry.featureButton).toMatchObject({ x: 250, width: 127, height: 40 });
    expect(geometry.collage).toMatchObject({ x: 16, width: 241, height: 138 });
    expect(Math.abs(geometry.collage!.y - 423)).toBeLessThanOrEqual(1);
    expect(geometry.coverLink).toMatchObject({ x: 16, width: 241, height: 138 });
    expect(geometry.poster).toMatchObject({ x: 273, width: 104, height: 150 });
    expect(Math.abs(geometry.poster!.y - 423)).toBeLessThanOrEqual(1);
    expect(geometry.secondMeta).toMatchObject({ x: 16, width: 361 });
    expect(Math.abs(geometry.secondMeta!.y - 625)).toBeLessThanOrEqual(1);
    expect(geometry.secondTitle).toMatchObject({ x: 16, width: 361, height: 24 });
    expect(Math.abs(geometry.secondTitle!.y - 646)).toBeLessThanOrEqual(1);
    expect(geometry.secondExcerpt).toMatchObject({ x: 16, width: 361 });
    expect(Math.abs(geometry.secondExcerpt!.y - 679)).toBeLessThanOrEqual(1);
    expect(geometry.secondCover).toMatchObject({ x: 16, width: 241, height: 150 });
    expect(Math.abs(geometry.secondCover!.y - 720)).toBeLessThanOrEqual(1);
    expect(geometry.secondPoster).toMatchObject({ x: 273, width: 104, height: 150 });
    expect(Math.abs(geometry.secondPoster!.y - 720)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    await page.screenshot({ path: `../artifacts/visual-audit-20261124/journal/rewind-journal-populated-${locale}-mobile-393.png` });
  }
  await page.setViewportSize({ width: 320, height: 852 });
  await page.goto("/uk/journal");
  await expect(page.getByRole("heading", { level: 3, name: "Різдвяні пригоди" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});
