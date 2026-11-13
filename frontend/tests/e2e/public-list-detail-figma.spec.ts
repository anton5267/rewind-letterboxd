import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const movies = Array.from({ length: 12 }, (_, index) => ({
  id: 985100 + index,
  title: `List film ${index + 1}`,
  releaseDate: "2021-01-01",
  rating: null,
  photoUrl: null,
}));

async function activate(locator: Locator, projectName: string) {
  if (projectName.includes("emulation")) await locator.tap();
  else await locator.click();
}

async function mockList(page: Page, isRanked?: boolean) {
  await page.route("https://list-owner.example.invalid/avatar.svg", route => route.fulfill({
    contentType: "image/svg+xml",
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><circle cx="15" cy="15" r="15" fill="#5a8a90"/></svg>',
  }));
  await page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/lists/public/985000") return route.fulfill({ json: {
      id: 985000,
      name: "Christopher Nolan Best Films",
      description: "A collection of mind-bending, time-twisting films.",
      ownerId: 985001,
      ownerUsername: "FilmOracle",
      ownerAvatarUrl: "https://list-owner.example.invalid/avatar.svg",
      tags: ["Science Fiction", "Thrillers"],
      likeCount: 554,
      ...(isRanked === undefined ? {} : { isRanked }),
      movies,
    } });
    return route.fulfill({ json: {} });
  });
}

test("public list detail follows the raw desktop poster grid", async ({ page }, testInfo) => {
  await mockList(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/lists/public/985000");
  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  const hero = main.locator("section").first();
  await expect(hero).toHaveCSS("min-height", "818px");
  await expect(hero.locator('img[class*="ownerAvatar"]')).toHaveAttribute("src", "https://list-owner.example.invalid/avatar.svg");
  await expect(hero.locator('img[class*="ownerAvatar"]')).toHaveCSS("width", "30px");
  const heading = main.getByRole("heading", { level: 1, name: "Christopher Nolan Best Films" });
  const headingBox = await heading.boundingBox();
  expect(headingBox?.x).toBeCloseTo(120, 0);
  expect(headingBox?.y).toBeCloseTo(583, 0);
  const posters = main.locator('a[class*="movieMedia"]');
  await expect(posters).toHaveCount(12);
  const first = await posters.first().boundingBox();
  expect(first?.x).toBeCloseTo(120, 0);
  expect(first?.y).toBeCloseTo(1038, 0);
  expect(first?.width).toBeCloseTo(174, 0);
  expect(first?.height).toBeCloseTo(260, 0);

  const captureDir = path.resolve(process.cwd(), "../artifacts/visual-audit-20261102/public-list-detail-runtime");
  mkdirSync(captureDir, { recursive: true });
  const engine = testInfo.project.name.startsWith("iPhone") ? "ios-webkit" : "android-chromium";
  await page.screenshot({ path: path.join(captureDir, `${engine}-en-1440.png`), fullPage: true });
});

test("public list detail follows phone rows and its information sheet works with touch", async ({ page }, testInfo) => {
  await mockList(page);
  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/uk/lists/public/985000");
  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  await expect(main.locator('img[class*="ownerAvatar"]')).toHaveCSS("width", "20px");
  const heading = main.getByRole("heading", { level: 1, name: "Christopher Nolan Best Films" });
  const headingBox = await heading.boundingBox();
  expect(headingBox?.x).toBeCloseTo(16, 0);
  expect(headingBox?.y).toBeCloseTo(190, 0);
  const posters = main.locator('a[class*="movieMedia"]');
  const first = await posters.first().boundingBox();
  expect(first?.x).toBeCloseTo(16, 0);
  expect(first?.y).toBeCloseTo(417, 0);
  expect(first?.width).toBeCloseTo(79, 0);
  expect(first?.height).toBeCloseTo(116, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);

  const captureDir = path.resolve(process.cwd(), "../artifacts/visual-audit-20261102/public-list-detail-runtime");
  mkdirSync(captureDir, { recursive: true });
  const engine = testInfo.project.name.startsWith("iPhone") ? "ios-webkit" : "android-chromium";
  await page.screenshot({ path: path.join(captureDir, `${engine}-uk-393.png`), fullPage: true });

  const more = page.locator('button[aria-haspopup="dialog"]');
  await activate(more, testInfo.project.name);
  const dialog = page.getByRole("dialog", { name: "Christopher Nolan Best Films" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/554/)).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Science Fiction" })).toBeVisible();
  await activate(dialog.getByRole("button", { name: "Готово" }), testInfo.project.name);
  await expect(dialog).toBeHidden();
  await expect(more).toBeFocused();
});

for (const lang of ["uk", "en"] as const) {
  test(`public list ranked mode preserves film order on phone and desktop in ${lang}`, async ({ page }) => {
    for (const isRanked of [true, false]) {
      await mockList(page, isRanked);
      for (const width of [393, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${lang}/lists/public/985000`);
        const main = page.getByRole("main");
        await expect(main).toHaveAttribute("aria-busy", "false");
        const posters = main.locator('a[class*="movieMedia"]');
        await expect(posters).toHaveCount(movies.length);
        const targets = await posters.evaluateAll(links => links.map(link => link.getAttribute("href")));
        expect(targets).toEqual(movies.map(movie => expect.stringMatching(new RegExp(`/films/${movie.id}/?$`))));
        const ranks = main.locator("[data-list-rank]");
        if (isRanked) {
          await expect(ranks).toHaveText(movies.map((_, index) => String(index + 1)));
          for (const rank of await ranks.all()) await expect(rank).toBeVisible();
        } else {
          await expect(ranks).toHaveCount(0);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      }
    }
  });
}
