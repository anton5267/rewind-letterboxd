import { expect, test } from "@playwright/test";

const interviewFeed = [
  ["Imperial Wasteland", "As acclaimed British filmmaker Steve McQueen prepares his next historical epic, Brandon Streussnig discusses cinema as a tool against empire and the politics of scale.", "Sulyma Bohdan", "2026-01-09T12:00:00Z"],
  ["Funny Papers", "American writer-director Greta Gerwig talks to Mia Lee Vicino about balancing comedy and melancholy, crafting emotionally layered female characters, and drawing inspiration from classic Hollywood physical comedy. From screwball rhythms to quiet moments of reflection, Gerwig discusses how humor can coexist with sincerity and emotional weight.", "Anna Petrova", "2026-01-06T12:00:00Z"],
  ["I’m With the Band", "With his new memoir now on shelves, Cameron Crowe invites Brian Formo into a wide-ranging conversation about a life shaped by music and movies. From the cultural afterlife of his most quoted films to the power of perfectly timed needle drops, the writer-director reflects on how soundtracks, fandom, and personal memory continue to define his work.", "Rewind Crew", "2025-12-29T12:00:00Z"],
  ["To Build A Home", "Norwegian filmmaker Joachim Trier speaks with Ella Kemp about the emotional architecture of his latest film, exploring family, intimacy, and the quiet tensions that define domestic life. Trier opens up about collaboration across art forms and how literature, music, and visual art inform his search for emotional clarity and honesty on screen.", "Alex Goncharenko", "2025-12-26T12:00:00Z"],
  ["Narrative Justice", "French-Tunisian director Kaouther Ben Hania talks to Mia Lee Vicino about audience engagement, ethical storytelling, and the responsibility of filmmakers working with real-world trauma. She reflects on how cinema can transform feelings of powerlessness into collective attention, and why form and empathy matter as much as message.", "Anna Petrova", "2025-12-19T12:00:00Z"],
] as const;

const podcastFeed = [
  ["International Feature Spotlight with Juliette Binoche", "Bonjour! The Best in Show team turns to the International Feature conversation with Brian, Juliette Binoche and Trần Anh Hùng on their collaboration The Taste of Things.", "Sulyma Bohdan", "2024-02-09T12:00:00Z"],
  ["Sundance highlights and period detail with Oscar nominee Jacqueline West", "This week, the Best in Show crew is joined by Rewind’s East Coast correspondent Adesola Thomas to break down standout titles from the Park City festival, including the explosive Irish-language rap musical Kneecap, the intimate family drama In the Summers, and the tender coming-of-age story Dìdi.", "Anna Petrova", "2024-02-02T12:00:00Z"],
  ["2024 Oscar nominations and an animation deep dive with the Spider-Verse directors", "The 96th Academy Award nominations have landed, and the Best in Show team has plenty to debate and celebrate. From overlooked performances to well-earned recognitions, the conversation is lively and opinionated.", "Rewind Crew", "2024-01-26T12:00:00Z"],
  ["Soundscapes from frozen landscapes, war zones, and unsettling interiors", "As major awards nominations roll in, Mia and Gemma are joined by London Editor Ella Kemp to vent, analyze, and question some surprising omissions. The episode then dives into the often-unseen craft of sound design, featuring conversations with Johnnie Burn of The Zone of Interest and Poor Things.", "Alex Goncharenko", "2024-01-19T12:00:00Z"],
  ["The 2023 cinema wrap-up spectacular", "The Rewind team raises a glass and looks back on the films that defined 2023. From community ratings and standout titles across genres and regions to personal viewing habits and unexpected trends, this roundtable celebrates a year of moviegoing before turning its gaze toward 2024 and the filmmakers and performances poised to shape the months ahead.", "Anna Petrova", "2024-01-12T12:00:00Z"],
] as const;

const communityFeed = [
  ["First Time’s the Charm", "First Time’s the Charm. Rwind contributors revisit the thrill of cinematic discovery, sharing American and European classics they experienced for the first time in 2025.", "Sulyma Bohdan", "2025-12-20T12:00:00Z"],
  ["’Tis The Season", "To mark the approach of winter break, the Rwind community turns to well-known American and European films that capture the many moods of the season.", "Anna Petrova", "2025-12-02T12:00:00Z"],
  ["Unconditional Power", "This feature looks back at towering screen performances from American and European cinema, celebrating actors whose presence alone commands attention.", "Rewind Crew", "2025-11-18T12:00:00Z"],
  ["Cruise Control", "Few modern movie stars have navigated genre, image, and longevity as successfully as Tom Cruise. The Rwind community revisits his most celebrated performances.", "Alex Goncharenko", "2025-11-14T12:00:00Z"],
  ["Divine Diane", "This piece explores the many personas of Diane Keaton, one of American cinema’s most distinctive and influential performers.", "Anna Petrova", "2025-10-17T12:00:00Z"],
] as const;

const otherEditorialFeeds = [
  { name: "platform", category: "Platform", titles: ["Richard Linklater Curates (December 2025)", "Physical Media Isn’t Going Anywhere", "Lost and Found", "Unreleased Gems", "There’s a List for That!"] },
  { name: "awards", category: "Awards", titles: ["Best in Show: Streaming Giants", "Voices of Animation", "Documentary Dreams", "Best in Show: British & American Cinema", "Best in Show: Musical Moments"] },
  { name: "mixed", category: "Cinemascope", titles: ['Movies "Christmas Adventures"', "Best Films 2025", "Remembering Robert Reiner", "2025 Year in Review FAQ", "The Rise of Sci‑Fi in 2025"] },
] as const;

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
        content: interviewFeed.map(([title, excerpt, authorName, publishedAt], index) => ({
          id: 910001 + index,
          slug: index === 0 ? "design-journal-fixture" : `design-journal-fixture-${index}`,
          language: "en",
          category: "INTERVIEW",
          title,
          excerpt,
          content: excerpt,
          coverUrl: "https://cdn.example.invalid/rewind-cover.jpg",
          audioUrl: null,
          authorName,
          publishedAt,
        })),
        totalPages: 1,
        totalElements: 5,
      }),
    });
  });
  await page.route("**/api/journal/articles/archive?*", async route => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  await page.goto("/en/journal");

  await expect(page.getByRole("heading", { name: "Journal", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Imperial Wasteland", level: 3 })).toBeVisible();
  await expect(page.getByText("Sulyma Bohdan", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Read" }).first()).toHaveAttribute("href", "/en/journal/design-journal-fixture");
  await expect(page.locator('a[href="/en/journal/design-journal-fixture"] img').first()).toHaveAttribute("src", "https://cdn.example.invalid/rewind-cover.jpg");
  await expect(page.locator("main")).toHaveCSS("background-color", "rgb(31, 31, 31)");

  const feature = page.locator("article").first();
  const cover = feature.locator('a[href="/en/journal/design-journal-fixture"]').first();
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
  expect(await feature.locator("h3").boundingBox()).toMatchObject({ x: 748 });
  const secondCover = await page.locator("article").nth(1).locator('[class*="cover"]').boundingBox();
  expect(secondCover?.x).toBeCloseTo(120, 0);
  expect(secondCover?.y).toBeCloseTo(995, 0);
  expect(secondCover?.width).toBe(444);
  expect(secondCover?.height).toBe(408);
  const thirdCover = await page.locator("article").nth(2).locator('[class*="cover"]').boundingBox();
  expect(thirdCover?.y).toBeGreaterThanOrEqual(1570);
  expect(thirdCover?.y).toBeLessThanOrEqual(1573);
  await expect(page.getByRole("heading", { name: "Archive", level: 2 })).toHaveCount(0);
  const footer = await page.locator("footer").boundingBox();
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log("journal-interview-frame", { footer, pageHeight });
  expect(footer?.y).toBeCloseTo(3296, 0);
  expect(pageHeight).toBeCloseTo(3561, 0);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/journal/rewind-interview-feed-en-desktop-1440x3561.png", fullPage: true });

  await page.setViewportSize({ width: 393, height: 852 });
  await expect(cover).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test("READY Journal podcast feed matches the desktop Figma frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("https://cdn.example.invalid/rewind-cover.jpg", route => route.fulfill({
    status: 200,
    contentType: "image/jpeg",
    body: Buffer.from("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/Aaf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/Aaf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Aqf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z", "base64"),
  }));
  await page.route("**/api/journal/articles?*", route => route.fulfill({ json: {
    content: podcastFeed.map(([title, excerpt, authorName, publishedAt], index) => ({
      id: 920001 + index, slug: `podcast-figma-${index + 1}`, language: "en", category: "PODCAST",
      title, excerpt, content: excerpt,
      coverUrl: "https://cdn.example.invalid/rewind-cover.jpg", audioUrl: null, authorName, publishedAt,
    })),
    totalPages: 1, totalElements: podcastFeed.length,
  } }));
  await page.route("**/api/journal/articles/archive?*", route => route.fulfill({ json: [] }));
  await page.goto("/en/journal");
  await expect(page.getByRole("heading", { name: "International Feature Spotlight with Juliette Binoche", level: 3 })).toBeVisible();
  await expect(page.locator("article")).toHaveCount(5);
  const leadCover = await page.locator("article").first().locator('[class*="cover"]').boundingBox();
  const nextCover = await page.locator("article").nth(1).locator('[class*="cover"]').boundingBox();
  const footer = await page.locator("footer").boundingBox();
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(leadCover).toMatchObject({ x: 120, y: 212, width: 513, height: 612 });
  expect(nextCover?.y).toBeCloseTo(995, 0);
  expect(Math.abs((footer?.y ?? -1) - 3300)).toBeLessThanOrEqual(4);
  expect(Math.abs(pageHeight - 3565)).toBeLessThanOrEqual(4);
  await expect(page.getByRole("heading", { name: "Archive", level: 2 })).toHaveCount(0);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/journal/rewind-podcast-feed-en-desktop-1440x3561.png", fullPage: true });
});

test("READY Journal community feed matches its desktop Figma frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("https://cdn.example.invalid/rewind-cover.jpg", route => route.fulfill({
    status: 200,
    contentType: "image/jpeg",
    body: Buffer.from("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/Aaf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/Aaf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Aqf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z", "base64"),
  }));
  await page.route("**/api/journal/articles?*", route => route.fulfill({ json: {
    content: communityFeed.map(([title, excerpt, authorName, publishedAt], index) => ({
      id: 930001 + index, slug: `community-figma-${index + 1}`, language: "en", category: "COMMUNITY",
      title, excerpt, content: excerpt,
      coverUrl: "https://cdn.example.invalid/rewind-cover.jpg", audioUrl: null, authorName, publishedAt,
    })),
    totalPages: 1, totalElements: communityFeed.length,
  } }));
  await page.route("**/api/journal/articles/archive?*", route => route.fulfill({ json: [] }));
  await page.goto("/en/journal");
  await expect(page.getByRole("heading", { name: "First Time’s the Charm", level: 3 })).toBeVisible();
  await expect(page.locator("article").first()).toContainText("Community");
  await expect(page.locator("article").first().locator("time")).toHaveAttribute("datetime", "2025-12-20T12:00:00Z");
  await expect(page.getByRole("heading", { name: "Divine Diane", level: 3 })).toBeVisible();
  await expect(page.locator("article")).toHaveCount(5);
  const leadCover = await page.locator("article").first().locator('[class*="cover"]').boundingBox();
  const nextCover = await page.locator("article").nth(1).locator('[class*="cover"]').boundingBox();
  const footer = await page.locator("footer").boundingBox();
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(leadCover).toMatchObject({ x: 120, y: 212, width: 513, height: 612 });
  expect(nextCover).toMatchObject({ x: 120, y: 995, width: 444, height: 408 });
  expect(footer?.y).toBeCloseTo(3296, 0);
  expect(pageHeight).toBeCloseTo(3561, 0);
  await expect(page.getByRole("heading", { name: "Archive", level: 2 })).toHaveCount(0);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/journal/rewind-community-feed-en-desktop-1440x3561.png", fullPage: true });
});

for (const feed of otherEditorialFeeds) {
  test(`READY Journal ${feed.name} feed matches its desktop Figma frame`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route("**/api/journal/articles?*", route => route.fulfill({ json: {
      content: feed.titles.map((title, index) => ({
        id: 940000 + index, slug: `${feed.name}-figma-${index + 1}`, language: "en", category: feed.category,
        title, excerpt: `Editorial preview for ${title}.`, content: `Editorial content for ${title}.`,
        coverUrl: null, audioUrl: null, authorName: ["Sulyma Bohdan", "Anna Petrova", "Rewind Crew", "Alex Goncharenko", "Anna Petrova"][index],
        publishedAt: `2025-12-${String(28 - index * 5).padStart(2, "0")}T12:00:00Z`,
      })),
      totalPages: 1, totalElements: feed.titles.length,
    } }));
    await page.route("**/api/journal/articles/archive?*", route => route.fulfill({ json: [] }));
    await page.goto("/en/journal");
    await expect(page.getByRole("heading", { name: feed.titles[0], level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: feed.titles[4], level: 3 })).toBeVisible();
    await expect(page.locator("article")).toHaveCount(5);
    const leadCover = await page.locator("article").first().locator('[class*="cover"]').boundingBox();
    const nextCover = await page.locator("article").nth(1).locator('[class*="cover"]').boundingBox();
    const footer = await page.locator("footer").boundingBox();
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(leadCover).toMatchObject({ x: 120, y: 212, width: 513, height: 612 });
    expect(nextCover).toMatchObject({ x: 120, y: 995, width: 444, height: 408 });
    expect(Math.abs((footer?.y ?? -1) - 3300)).toBeLessThanOrEqual(4);
    expect(Math.abs(pageHeight - 3565)).toBeLessThanOrEqual(4);
    await expect(page.getByRole("heading", { name: "Archive", level: 2 })).toHaveCount(0);
    await page.screenshot({ path: `../artifacts/visual-audit-20261124/journal/rewind-${feed.name}-feed-en-desktop-1440x3561.png`, fullPage: true });
  });
}

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
    authorName: "Sulima Bohdan",
    publishedAt: "2025-12-22T12:00:00Z",
  } }));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/journal/editorial-frame-fixture");

  await expect(page.getByRole("heading", { level: 1, name: 'Movies "Christmas Adventures"' })).toBeVisible();
  await expect(page.getByText("Sulima Bohdan", { exact: true })).toBeVisible();
  const metadata = page.locator('[class*="eyebrow"]');
  await expect(metadata).toContainText("Cinemascope");
  await expect(metadata.locator("time")).toHaveText("Dec 22, 2025");
  await expect(page.locator('[class*="meta"] time')).toHaveCount(0);
  expect(await metadata.evaluate(element => Boolean(element.compareDocumentPosition(document.querySelector("h1")!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  const frame = page.locator('[class*="articleHeader"]');
  const frameBox = await frame.boundingBox();
  expect(frameBox?.x).toBeCloseTo(120, 0);
  expect(frameBox?.y).toBe(0);
  expect(frameBox?.width).toBe(1200);
  const breadcrumb = frame.getByRole("link", { name: "Journal", exact: true });
  await expect(breadcrumb).toHaveAttribute("href", "/en/journal");
  const pill = await breadcrumb.locator("span").boundingBox();
  const header = await page.getByRole("banner").boundingBox();
  expect(pill!.y).toBeGreaterThanOrEqual(header!.height);
  await expect(breadcrumb.locator("img")).toHaveJSProperty("naturalWidth", 11);
  await expect(breadcrumb.locator("img")).toHaveJSProperty("complete", true);
  await expect(frame.locator('[class*="byline"]')).toHaveCSS("font-size", "20px");
  await expect(frame.locator('[class*="byline"]')).toHaveCSS("text-transform", "uppercase");
  const divider = frame.locator('img[src$="article-divider.svg"]');
  await expect(divider).toHaveJSProperty("complete", true);
  expect((await divider.boundingBox())?.width).toBe(1200);
  expect(frameBox!.height).toBeGreaterThanOrEqual(909);

  const hero = page.locator('[class*="coverHero"]');
  await expect(hero).toHaveCSS("border-radius", "30px");
  const heroBox = await hero.boundingBox();
  expect(heroBox?.x).toBeCloseTo(120, 0);
  expect(heroBox!.y).toBeCloseTo(433, 0);
  expect(heroBox?.width).toBe(1126);
  expect(heroBox?.height).toBe(642);
  expect(heroBox?.y).toBeGreaterThan(400);

  const content = await page.locator('[class*="articleContent"]').boundingBox();
  expect(content!.y).toBeGreaterThanOrEqual(heroBox!.y + heroBox!.height - 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await page.setViewportSize({ width: 393, height: 852 });
  await expect(page.getByText("Sulima Bohdan", { exact: true })).toBeVisible();
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
    await page.setViewportSize({ width, height: width === 393 ? 852 : 900 });
    await page.goto(`/${locale}/journal`);
    const main = page.locator("main");
    await expect(main).toHaveAttribute("aria-busy", "false");
    await expect(main.getByRole("heading", { level: 1, name: expectedTitle })).toBeVisible();
    await expect(main.getByText(expectedEmpty, { exact: true })).toBeVisible();
    await expect(main.getByRole("link", { name: expectedAction })).toHaveAttribute("href", `/${locale}/films/discover`);
    if (width === 393) {
      const title = main.getByRole("heading", { level: 1, name: expectedTitle });
      const card = main.locator("[class*='emptyState']");
      const action = card.getByRole("link", { name: expectedAction });
      const box = async (locator: typeof title) => locator.boundingBox();
      expect(await box(title)).toMatchObject({ x: 16, y: 148, width: 150, height: 38 });
      expect(await box(card)).toMatchObject({ x: 16, y: 202, width: 361, height: 112 });
      expect(await box(action)).toMatchObject({ x: 34, y: 254, width: 207, height: 44 });
      expect(await page.locator("footer").boundingBox()).toMatchObject({ y: 354 });
      const mobileNavigation = page.locator("header nav[class*='mobileNav']");
      await expect(mobileNavigation).toBeVisible();
      expect(await mobileNavigation.boundingBox()).toMatchObject({ y: 760 });
      await page.screenshot({ path: `../artifacts/visual-audit-20261125/journal/journal-empty-${locale}-393.png` });
    }
    await expect(main.getByRole("combobox")).toHaveCount(0);
    await expect(main.getByRole("heading", { name: /Архів|Archive/ })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    expect((await main.boundingBox())?.height).toBeLessThan(600);
  }
  await page.setViewportSize({ width: 320, height: 852 });
  await page.goto("/en/journal");
  await expect(page.getByText("No published articles yet.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});
