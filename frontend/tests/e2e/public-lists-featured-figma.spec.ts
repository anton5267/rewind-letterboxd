import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const artifactDir = resolve(process.cwd(), "../artifacts/visual-audit-20261125/featured-lists");

const featuredCategories = ["REWIND_COMMUNITY", "OTHER_TOP_FILM_LISTS", "FILMMAKER_RECOMMENDATIONS"] as const;
const featuredCategoryFor = (index: number) => index < 8 ? featuredCategories[0] : index < 14 ? featuredCategories[1] : featuredCategories[2];
const sourceTitles = [
  "Top 250 Narrative Feature Films", "Most Fans on Rewind", "Top 250 Documentary Films", "Top 250 Sci-Fi Films",
  "Top 250 Short Films", "Top 250 Horror Films", "Top 100 Silent Films", "Top 100 Western Films",
  "IMDb Top 250", "All Time Worldwide Box Office", "AFI Top 100 (2007 Edition)", "They Shoot Pictures, Don’t They?",
  "Movies You Must See", "Sight and Sound Greatest Films",
  "Wes Anderson—favorites", "Ari Aster—contemporary favorites", "Bong Joon-ho—favorites", "Ingmar Bergman—favorites",
  "Spike Lee—essential films", "Quentin Tarantino—favorites",
];
const lists = Array.from({ length: 20 }, (_, index) => ({
  id: 983100 + index,
  name: sourceTitles[index],
  description: "A compact featured collection.",
  ownerId: 983200 + index,
  ownerUsername: "MoonlitCritic",
  ownerAvatarUrl: "https://fixtures.rewind/creator-avatar.jpeg",
  itemCount: 4,
  likeCount: 3,
  featuredCategory: featuredCategoryFor(index),
  tags: [],
  previewMovies: Array.from({ length: 4 }, (_, movieIndex) => ({
    id: 983300 + index * 10 + movieIndex,
    title: `Featured film ${movieIndex + 1}`,
    photoUrl: `https://fixtures.rewind/poster-${String(4 - movieIndex).padStart(2, "0")}.jpeg`,
    releaseDate: null,
    rating: null,
  })),
}));
const desktopLists = [
  ...lists.slice(0, 8),
  { ...lists[0], id: 983199, name: "Top 250 Films by Women Directors" },
  ...lists.slice(8, 14).map((list, index) => index === 4 ? { ...list, name: "Movies You Must See Before You Die" } : list),
  lists[14], lists[15], lists[17], lists[16], lists[18], lists[19],
];
const desktopPosterCard = (index: number) => index === 8 ? 21 : index < 8 ? index + 1 : index <= 12 ? index : index === 13 ? 19 : index === 14 ? 20 : [13, 14, 16, 15, 17, 18][index - 15];
const desktopCreatorNames = ["MoonlitCritic", "CinemaPro", "CineScope"] as const;
const figmaDesktopLists = desktopLists.map((list, listIndex) => ({
  ...list,
  ownerId: 983200 + listIndex,
  ownerUsername: desktopCreatorNames[listIndex % 3],
  ownerAvatarUrl: `https://fixtures.rewind/creator-desktop-${(listIndex % 3) + 1}.png`,
  previewMovies: list.previewMovies.map((movie, movieIndex) => ({
    ...movie,
    photoUrl: `https://fixtures.rewind/featured-source/card-${String(desktopPosterCard(listIndex)).padStart(2, "0")}-${String(movieIndex + 1).padStart(2, "0")}.png`,
  })),
}));
const figmaMobileLists = lists.map((list, listIndex) => ({
  ...list,
  ownerAvatarUrl: "https://fixtures.rewind/creator-avatar.png",
  previewMovies: list.previewMovies.map((movie, movieIndex) => ({
    ...movie,
    photoUrl: `https://fixtures.rewind/featured-source/card-${String(listIndex < 12 ? listIndex + 1 : listIndex < 14 ? listIndex + 7 : listIndex - 1).padStart(2, "0")}-${String(movieIndex + 1).padStart(2, "0")}.png`,
  })),
}));

async function installPosterFixtures(page: import("@playwright/test").Page) {
  await page.route("https://fixtures.rewind/**", route => {
    const filename = new URL(route.request().url()).pathname.split("/").at(-1);
    if (filename === "creator-avatar.png") return route.fulfill({ path: resolve(process.cwd(), "tests/e2e/fixtures/featured-lists-source/source-14.png"), contentType: "image/png" });
    if (filename && /^creator-desktop-[123]\.png$/.test(filename)) return route.fulfill({ path: resolve(process.cwd(), "tests/e2e/fixtures/featured-lists-source", filename.replace("creator-desktop-", "desktop-avatar-")), contentType: "image/png" });
    if (filename && /^card-\d{2}-\d{2}\.png$/.test(filename)) return route.fulfill({ path: resolve(process.cwd(), "tests/e2e/fixtures/featured-lists-source", filename), contentType: "image/png" });
    const fixtures = new Set(["poster-01.jpeg", "poster-02.jpeg", "poster-03.jpeg", "poster-04.jpeg", "creator-avatar.jpeg"]);
    if (!filename || !fixtures.has(filename)) return route.fulfill({ status: 404, body: "Fixture not found" });
    return route.fulfill({ path: resolve(process.cwd(), "tests/e2e/fixtures/featured-lists", filename) });
  });
}

test("featured lists follows the raw desktop Figma card rhythm", async ({ page }) => {
  await installPosterFixtures(page);
  await page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/users/popular-reviewers") return route.fulfill({ json: [] });
    if (url.pathname === "/api/tags/popular") return route.fulfill({ json: [] });
    if (url.pathname === "/api/lists/public/featured") return route.fulfill({ json: { content: figmaDesktopLists, totalPages: 1, totalElements: figmaDesktopLists.length, number: 0, size: 12 } });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 0 } });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/lists/discover?feed=featured");
  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  const desktopTitle = main.locator('section[class*="feedHero"] h1');
  await expect(desktopTitle).toHaveText("Featured Lists — a starter pack from the community and beyond");
  const desktopTitleBox = await desktopTitle.boundingBox();
  expect(Math.abs((desktopTitleBox?.x ?? 0) - 415)).toBeLessThanOrEqual(1);
  expect(Math.abs((desktopTitleBox?.y ?? 0) - 280)).toBeLessThanOrEqual(1);
  expect(Math.abs((desktopTitleBox?.width ?? 0) - 610)).toBeLessThanOrEqual(1);
  expect(Math.abs((desktopTitleBox?.height ?? 0) - 80)).toBeLessThanOrEqual(1);
  const hero = main.locator('section[class*="feedHero"]');
  await expect(hero).toHaveCSS("min-height", "572px");
  const groups = main.locator('section[class*="featuredCategorySection"]');
  await expect(groups).toHaveCount(3);
  const desktopGeometry = await page.evaluate(() => ({
    pageHeight: document.documentElement.scrollHeight,
    hero: document.querySelector('section[class*="feedHero"]')!.getBoundingClientRect().toJSON(),
    heroMinHeight: getComputedStyle(document.querySelector('section[class*="feedHero"]')!).minHeight,
    footer: document.querySelector("footer")?.getBoundingClientRect().toJSON(),
    sections: [...document.querySelectorAll('section[class*="featuredCategorySection"]')].map(section => ({
      headingY: section.querySelector('[class*="sectionHeading"]')!.getBoundingClientRect().top,
      cardRows: [...section.querySelectorAll("article")].filter((_, index) => index % 3 === 0).map(card => card.getBoundingClientRect().top),
    })),
  }));
  expect(desktopGeometry.pageHeight, JSON.stringify(desktopGeometry)).toBe(3565);
  expect(Math.abs((desktopGeometry.footer?.top ?? 0) - 3285)).toBeLessThanOrEqual(1);
  expect(Math.abs((desktopGeometry.footer?.height ?? 0) - 280)).toBeLessThanOrEqual(1);
  const footerLogo = page.locator('footer img[alt="REWIND"]');
  await expect(footerLogo).toBeVisible();
  await expect.poll(() => footerLogo.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  [675, 1732, 2480].forEach((expected, index) => expect(Math.abs(desktopGeometry.sections[index].headingY - expected)).toBeLessThanOrEqual(1));
  [[762, 1071, 1380], [1819, 2128], [2567, 2876]].forEach((rows, index) => rows.forEach((expected, row) => expect(Math.abs(desktopGeometry.sections[index].cardRows[row] - expected)).toBeLessThanOrEqual(1)));
  await expect(groups.locator('[class*="sectionHeading"] h2')).toHaveText(["Rewind community", "Other Top Film Lists", "Filmmaker Recommendations"]);
  await expect(groups.nth(0).locator("article")).toHaveCount(9);
  await expect(groups.nth(1).locator("article")).toHaveCount(6);
  await expect(groups.nth(2).locator("article")).toHaveCount(6);
  await expect(groups.nth(2).locator("article h2 a")).toHaveText([
    "Wes Anderson—favorites", "Ari Aster—contemporary favorites", "Ingmar Bergman—favorites",
    "Bong Joon-ho—favorites", "Spike Lee—essential films", "Quentin Tarantino—favorites",
  ]);
  await expect(groups.nth(0).locator("article h2 a").last()).toHaveText("Top 250 Films by Women Directors");
  await expect(groups.nth(1).locator("article h2 a")).toHaveText([
    "IMDb Top 250", "All Time Worldwide Box Office", "AFI Top 100 (2007 Edition)",
    "They Shoot Pictures, Don’t They?", "Movies You Must See Before You Die", "Sight and Sound Greatest Films",
  ]);
  expect(new Set(await groups.locator('article [class*="featuredAvatar"] img').evaluateAll(images => images.map(image => (image as HTMLImageElement).src))).size).toBe(3);
  await expect.poll(() => groups.locator('article [class*="featuredAvatar"] img').evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  const desktopPosterUrls = await groups.locator('article [role="img"] img').evaluateAll(images => images.map(image => (image as HTMLImageElement).src));
  expect(new Set(desktopPosterUrls).size, "all desktop cards must use unique Figma poster fixtures").toBe(84);
  await expect.poll(() => groups.locator('article [role="img"] img').evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  const cards = groups.first().locator("article");
  await expect(cards).toHaveCount(9);
  const cardBoxes = await cards.evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, width: rect.width, height: rect.height };
  }));
  expect(cardBoxes.every(card => Math.abs(card.width - 326) < 1 && Math.abs(card.height - 249) < 1)).toBe(true);
  const firstCreator = await cards.first().locator('[class*="featuredCreator"]').boundingBox();
  expect(Math.abs((firstCreator?.y ?? 0) - ((await cards.first().boundingBox())?.y ?? 0) - 219)).toBeLessThanOrEqual(1);
  expect(Math.abs(cardBoxes[1].x - cardBoxes[0].x - 438)).toBeLessThanOrEqual(1);
  expect(Math.abs(cardBoxes[2].x - cardBoxes[1].x - 438)).toBeLessThanOrEqual(1);
  const poster = await cards.first().locator('a[class*="posterLink"]').boundingBox();
  expect(Math.abs((poster?.width ?? 0) - 325)).toBeLessThanOrEqual(1);
  expect(poster?.height).toBe(180);
  await mkdir(artifactDir, { recursive: true });
  await page.screenshot({ path: resolve(artifactDir, "featured-lists-en-desktop-1440.png"), fullPage: true });
});

test("featured lists keeps the phone feed inside the viewport", async ({ page }) => {
  await installPosterFixtures(page);
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/users/popular-reviewers**", route => route.fulfill({ json: [] }));
  await page.route("**/api/tags/popular**", route => route.fulfill({ json: [] }));
  await page.route("**/api/lists/public/featured**", route => route.fulfill({ json: { content: figmaMobileLists, totalPages: 1, totalElements: figmaMobileLists.length, number: 0, size: 12 } }));
  await page.setViewportSize({ width: 393, height: 2019 });
  await page.goto("/en/lists/discover?feed=featured");
  await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator('section[class*="featuredCategorySection"]')).toHaveCount(3);
  const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, elements: [...document.querySelectorAll("body *")].filter(element => element.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(element => ({ tag: element.tagName, className: String(element.className), right: element.getBoundingClientRect().right, width: element.getBoundingClientRect().width })) }));
  expect(overflow.width, JSON.stringify(overflow.elements)).toBeLessThanOrEqual(393);
  const sourcePosterUrls = await page.locator('section[class*="featuredCategorySection"] article [role="img"] img').evaluateAll(images => images.map(image => (image as HTMLImageElement).src));
  expect(new Set(sourcePosterUrls).size, "each of the 20 Figma cards must use its own four source posters").toBe(80);
  const mobileTitle = page.locator('[class*="feedHeroCopy"] h1');
  await expect(mobileTitle).toHaveText("Featured Lists — a starter pack from the community and beyond");
  const mobileTitleBox = await mobileTitle.boundingBox();
  const mobileIntroBox = await mobileTitle.locator("span").boundingBox();
  expect(Math.abs((mobileTitleBox?.y ?? 0) - 120)).toBeLessThanOrEqual(1);
  expect(Math.abs((mobileIntroBox?.y ?? 0) - ((mobileTitleBox?.y ?? 0) + 20))).toBeLessThanOrEqual(1);
  await expect.poll(() => page.locator('section[class*="featuredCategorySection"] article [role="img"] img').evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  const geometry = await page.evaluate(() => ({ viewportHeight: innerHeight, mainRect: document.querySelector("main")!.getBoundingClientRect().toJSON(), titleY: document.querySelector('[class*="feedHeroCopy"] h1')!.getBoundingClientRect().top + scrollY, sections: [...document.querySelectorAll('section[class*="featuredCategorySection"]')].map(section => {
    const poster = section.querySelector("a[class*='posterLink']");
    return { headingY: section.querySelector('[class*="sectionHeading"]')!.getBoundingClientRect().top + scrollY, posterY: poster ? poster.getBoundingClientRect().top + scrollY : null, cardCount: section.querySelectorAll("article").length };
  }) }));
  expect(Math.abs(geometry.titleY - 120)).toBeLessThanOrEqual(1);
  expect(geometry.viewportHeight).toBe(2019);
  expect(geometry.mainRect.height).toBe(2019);
  expect(geometry.sections.map(section => section.cardCount)).toEqual([8, 6, 6]);
  [245, 904, 1417].forEach((expected, index) => expect(Math.abs(geometry.sections[index].headingY - expected)).toBeLessThanOrEqual(1));
  [293, 952, 1465].forEach((expected, index) => expect(Math.abs((geometry.sections[index].posterY ?? 0) - expected)).toBeLessThanOrEqual(3));
  const firstCard = page.locator('section[class*="featuredCategorySection"] article').first();
  const firstCardBox = await firstCard.boundingBox();
  const firstTitleBox = await firstCard.locator("h2").boundingBox();
  const firstCreatorBox = await firstCard.locator('[class*="featuredCreator"]').boundingBox();
  const firstAvatarBox = await firstCard.locator('[class*="featuredAvatar"]').boundingBox();
  expect(Math.abs((firstCardBox?.height ?? 0) - 129)).toBeLessThanOrEqual(1);
  expect(Math.abs((firstTitleBox?.y ?? 0) - 387)).toBeLessThanOrEqual(1);
  expect(Math.abs((firstCreatorBox?.y ?? 0) - 402)).toBeLessThanOrEqual(1);
  expect(firstAvatarBox?.width).toBe(20);
  await mkdir(artifactDir, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(artifactDir, "featured-lists-en-mobile-393.png") });
});
