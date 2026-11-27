import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const popularTitles = ["Top 250 Narrative Feature Films", "Definition of girly classics", "Feeling lost in your 20’s", "Classic movies for beginners."];
const mobilePopularTitles = ["Christopher Nolan Best Films", "The 2026 Popcorn List", "Remembering Rob Reiner", "Love Triangles Starter Pack"];
const popularDescriptions = [
  "Top 250 movies, based on the average weighted rating of all users. I removed all stand-up specials, stage plays, concert films, documentaries, shorts, 'collection listings', re-edits and other 'rarities', so only feature length narrative movies are listed here.\nFilms should have a minimum of 15,000 ratings to be eligible to enter the list.",
  "Just films that *i think* a lot of girls (including me) love\nincludes some filmbro movies but i hope u will understand\nthank you for all the nice comments :)\n\nPartially inspired by my beloved mutuals grace and mar 🩶",
  "This is a list of \"coming-of-age\" type films but for those in their mid 20's something not knowing where their lives are going. feeling lost, no hope that things will change, feeling so so many things, afraid and also lost and so alone.. this is for you. and i hope things will change for you.",
  "Old hollywood & classic films (1920s — 1960s) for you who want to start watching— only my personal recommendations ♡\n\nEasiest to hardest to watch. based on length, genre, their cultural importance & how well they aged.",
];
const popularOwners = ["MoonlitCritic", "Liza", "MovieMoon", "ReelWatcher"];
const popularCounts = [250, 283, 209, 119];
const mobilePopularCounts = [12, 25, 10, 20];
const popularLikes = [296000, 176000, 158000, 192000];
const lists = Array.from({ length: 4 }, (_, index) => ({
  id: 984100 + index,
  name: popularTitles[index],
  description: popularDescriptions[index],
  ownerId: 984200 + index,
  ownerUsername: popularOwners[index],
  itemCount: popularCounts[index],
  likeCount: popularLikes[index],
  tags: [],
  previewMovies: Array.from({ length: 5 }, (_, movieIndex) => ({ id: 984300 + index * 10 + movieIndex, title: `Film ${movieIndex + 1}`, photoUrl: null, releaseDate: null, rating: null })),
}));

function mockPublicLists(page: Page) {
  const fixtureRoot = path.resolve(process.cwd(), "tests/e2e/fixtures/popular-lists-figma");
  page.route(/^https:\/\/fixtures\.rewind\.invalid\/popular\//, route => {
    const url = new URL(route.request().url());
    const file = url.pathname.split("/").at(-1)!;
    const variant = url.searchParams.get("variant") === "desktop" ? "desktop" : "mobile";
    return route.fulfill({ path: path.join(fixtureRoot, ...(variant === "desktop" ? ["desktop"] : []), file), contentType: "image/jpeg" });
  });
  return page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/users/popular-reviewers") return route.fulfill({ json: [] });
    if (url.pathname === "/api/tags/popular") return route.fulfill({ json: [] });
    if (url.pathname === "/api/lists/public/popular") {
      const variant = (page.viewportSize()?.width ?? 0) >= 768 ? "desktop" : "mobile";
      const content = lists.map((list, listIndex) => ({
        ...list,
        name: variant === "desktop" ? list.name : mobilePopularTitles[listIndex],
        itemCount: variant === "desktop" ? list.itemCount : mobilePopularCounts[listIndex],
        previewMovies: list.previewMovies.map((movie, movieIndex) => ({
          ...movie,
          photoUrl: `https://fixtures.rewind.invalid/popular/${String(listIndex * 5 + movieIndex + 1).padStart(2, "0")}.jpg?variant=${variant}`,
        })),
      }));
      return route.fulfill({ json: { content, totalPages: 89, totalElements: 356, number: 0, size: 4 } });
    }
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 0 } });
  });
}

async function expectPopularPosterSequence(page: Page, variant: "desktop" | "mobile") {
  const posters = page.locator('section[aria-labelledby="lists-grid-heading"] [role="img"] img');
  const expected = Array.from({ length: 20 }, (_, index) =>
    `https://fixtures.rewind.invalid/popular/${String(index + 1).padStart(2, "0")}.jpg?variant=${variant}`,
  );
  await expect.poll(() => posters.evaluateAll(images => images.map(image => image.getAttribute("src")))).toEqual(expected);
  await expect.poll(() => posters.evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
}

test("popular lists follows the raw desktop row geometry", async ({ page }) => {
  await mockPublicLists(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/lists/discover?feed=popular");
  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  const hero = main.locator('section[class*="feedHero"]');
  await expect(hero).toHaveCSS("min-height", "628px");
  await expect(hero).toContainText("Explore the most popular lists from our members. Every mood, every genre, every era.");
  const cards = main.locator('section[aria-labelledby="lists-grid-heading"] article');
  await expect(cards).toHaveCount(4);
  const posters = cards.locator('[role="img"] img');
  await expect(posters).toHaveCount(20);
  await expectPopularPosterSequence(page, "desktop");
  const firstTitle = cards.first().locator("h2 > a");
  const firstMeta = cards.first().locator('p[class*="popularMeta"]');
  await expect(firstTitle).toHaveText("Top 250 Narrative Feature Films");
  await expect(firstMeta).toContainText("MoonlitCritic");
  await expect(firstMeta).toContainText("250 films");
  await expect(firstMeta).toContainText("296k");
  const first = await cards.first().boundingBox();
  expect(first?.x).toBeCloseTo(120, 0);
  expect(first?.width).toBeCloseTo(1200, 0);
  expect(first?.height).toBeCloseTo(339, 0);
  expect(first?.y).toBeCloseTo(813, 0);
  const cardRows = await cards.evaluateAll(items => items.map(item => item.getBoundingClientRect().y));
  for (const [index, target] of [813, 1189, 1566, 1943].entries()) expect(Math.abs(cardRows[index] - target)).toBeLessThan(1);
  const pagination = main.getByRole("navigation", { name: "Public list pages" });
  for (const label of ["Page 1", "Page 2", "Page 3", "Page 89"]) await expect(pagination.getByRole("button", { name: label, exact: true })).toBeVisible();
  const anchors = await page.evaluate(() => {
    const rect = (selector: string) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      hero: rect('main section[class*="feedHero"]'),
      title: rect('main [class*="feedHeroCopy_"] h1'),
      heading: rect('main section[aria-labelledby="lists-grid-heading"] div[class*="sectionHeading_"]'),
      sort: rect('main details[class*="popularSort_"] summary'),
      poster: rect('main section[aria-labelledby="lists-grid-heading"] article:first-child a[class*="featuredPosterLink"]'),
      cardTitle: rect('main section[aria-labelledby="lists-grid-heading"] article:first-child h2 > a'),
      meta: rect('main section[aria-labelledby="lists-grid-heading"] article:first-child p[class*="popularMeta_"]'),
      description: rect('main section[aria-labelledby="lists-grid-heading"] article:first-child p[class*="description_"]'),
      pagination: rect('main nav[aria-label="Public list pages"]'),
      footer: rect("footer"),
    };
  });
  console.log(`POPULAR_LISTS_DESKTOP_ANCHORS ${JSON.stringify(anchors)}`);
  expect(anchors.hero?.x).toBe(0);
  expect(anchors.hero?.width).toBe(1440);
  expect(anchors.title?.y).toBe(280);
  expect(anchors.heading?.y).toBe(713);
  expect(anchors.sort?.y).toBe(713);
  expect(anchors.poster?.x).toBe(154);
  expect(anchors.poster?.y).toBeCloseTo(857, 0);
  expect(anchors.poster?.width).toBe(446);
  expect(anchors.poster?.height).toBe(260);
  expect(anchors.pagination?.y).toBeCloseTo(2367, 0);
  expect(anchors.footer?.y).toBeCloseTo(2556, 0);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(2821);
  const captureDir = path.resolve(process.cwd(), "../artifacts/visual-audit-20261124/popular-lists-desktop");
  mkdirSync(captureDir, { recursive: true });
  await page.screenshot({ path: path.join(captureDir, "rewind-popular-lists-en-desktop-1440x2821.png"), fullPage: true });
  const sort = main.locator('details[class*="popularSort_"]');
  const sortTrigger = sort.locator("summary");
  await expect(sortTrigger).toContainText("Sort by popularity");
  await sortTrigger.focus();
  await page.keyboard.press("Space");
  await expect(sort).toHaveAttribute("open", "");
  await expect(sort.getByRole("link", { name: "Recent lists", exact: true })).toHaveAttribute("href", "/en/lists/discover?feed=recent");
  await expect(sort.getByRole("link", { name: "Recently liked lists", exact: true })).toHaveAttribute("href", "/en/lists/discover?feed=recently-liked");
});

test("popular lists keeps the measured phone poster rail inside the viewport", async ({ page }) => {
  await mockPublicLists(page);
  await page.setViewportSize({ width: 393, height: 1301 });
  await page.goto("/en/lists/discover?feed=popular");
  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  const hero = main.locator('section[class*="feedHero"]');
  await expect(hero).toContainText("Explore the most popular lists from our members. Every mood, every genre, every era.");
  expect((await hero.boundingBox())?.height).toBeCloseTo(233, 0);
  expect((await hero.locator("h1").boundingBox())?.y).toBeCloseTo(120, 0);
  expect((await hero.locator('div[class*="feedHeroCopy"] > p:last-child').boundingBox())?.height).toBeCloseTo(29, 0);
  const card = main.locator('section[aria-labelledby="lists-grid-heading"] article').first();
  const cards = main.locator('section[aria-labelledby="lists-grid-heading"] article');
  for (const [index, title] of mobilePopularTitles.entries()) {
    await expect(cards.nth(index).locator("h2")).toContainText(title);
    await expect(cards.nth(index).locator("h2")).toContainText(`${mobilePopularCounts[index]} films`);
    await expect(cards.nth(index).locator('[class*="feedCount"]')).toHaveCSS("text-transform", "capitalize");
  }
  const posters = main.locator('section[aria-labelledby="lists-grid-heading"] [role="img"] img');
  await expect(posters).toHaveCount(20);
  await expectPopularPosterSequence(page, "mobile");
  await expect(card).toHaveCSS("width", "361px");
  const cardBox = await card.boundingBox();
  expect(cardBox?.y).toBeCloseTo(315, 0);
  expect(cardBox?.height).toBeCloseTo(189, 0);
  expect((await main.locator('section[aria-labelledby="lists-grid-heading"] div[class*="sectionHeading"]').boundingBox())?.y).toBeCloseTo(267, 0);
  const poster = await card.locator('a[class*="featuredPosterLink"]').boundingBox();
  expect(poster?.width).toBeCloseTo(323, 0);
  expect(poster?.height).toBeCloseTo(116, 0);
  expect(poster?.y).toBeCloseTo(364, 0);
  const cardPositions = await main.locator('section[aria-labelledby="lists-grid-heading"] article').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().y));
  expect(cardPositions.map(y => Math.round(y))).toEqual([315, 516, 717, 918]);
  const pagination = main.getByRole("navigation", { name: "Public list pages" });
  const previous = pagination.getByRole("button", { name: "Previous", exact: true });
  const next = pagination.getByRole("button", { name: "Next", exact: true });
  await expect(previous).toBeVisible();
  await expect(previous).toBeDisabled();
  await expect(next).toBeVisible();
  await expect(pagination.getByRole("button", { name: "Page 1", exact: true })).toBeHidden();
  const controls = await pagination.boundingBox();
  expect(controls?.y).toBeCloseTo(1142, 0);
  expect(controls?.height).toBeCloseTo(32, 0);
  const captureDir = path.resolve(process.cwd(), "../artifacts/visual-audit-20261124/popular-lists-phone");
  mkdirSync(captureDir, { recursive: true });
  await page.screenshot({ path: path.join(captureDir, "rewind-popular-lists-en-phone-393x1301.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
  await next.click();
  await expect(pagination.getByRole("status")).toContainText("Page 2 of 89");
  await expect(previous).toBeEnabled();
  await previous.click();
  await expect(pagination.getByRole("status")).toContainText("Page 1 of 89");
});
