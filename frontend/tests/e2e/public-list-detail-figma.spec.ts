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

async function mockList(page: Page, isRanked?: boolean, options: {
  name?: string;
  description?: string;
  ownerUsername?: string;
  tags?: string[];
  likeCount?: number;
  backdropFixture?: "ranked-wallpaper.jpeg" | "unranked-wallpaper.png";
  posterFixturePrefix?: "ranked" | "nolan";
  movies?: typeof movies;
} = {}) {
  await page.route("https://list-owner.example.invalid/avatar.svg", route => route.fulfill({
    contentType: "image/svg+xml",
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><circle cx="15" cy="15" r="15" fill="#5a8a90"/></svg>',
  }));
  await page.route("https://list-detail-figma.invalid/**", route => {
    const file = new URL(route.request().url()).pathname.split("/").at(-1);
    if (file !== "ranked-wallpaper.jpeg" && file !== "unranked-wallpaper.png" && !/^(ranked|nolan)-\d{2}\.png$/.test(file ?? "")) return route.fulfill({ status: 404 });
    return route.fulfill({ path: path.resolve(process.cwd(), "tests/e2e/fixtures/public-list-detail-figma", file) });
  });
  await page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/lists/public/985000") return route.fulfill({ json: {
      id: 985000,
      name: options.name ?? "Christopher Nolan Best Films",
      description: options.description ?? "A collection of mind-bending, time-twisting films.",
      ownerId: 985001,
      ownerUsername: options.ownerUsername ?? "FilmOracle",
      ownerAvatarUrl: "https://list-owner.example.invalid/avatar.svg",
      tags: options.tags ?? ["Science Fiction", "Thrillers"],
      likeCount: options.likeCount ?? 554,
      ...(isRanked === undefined ? {} : { isRanked }),
      movies: (options.movies ?? movies).map((movie, index) => index === 0 && options.backdropFixture ? {
        ...movie, backdropUrl: `https://list-detail-figma.invalid/${options.backdropFixture}`,
      } : options.posterFixturePrefix ? {
        ...movie, photoUrl: `https://list-detail-figma.invalid/${options.posterFixturePrefix}-${String(index + 1).padStart(2, "0")}.png`,
      } : movie),
    } });
    return route.fulfill({ json: {} });
  });
}

async function expectSourcePosters(page: Page, prefix: "ranked" | "nolan", count: number) {
  const images = page.locator('a[class*="movieMedia"] img');
  await expect(images).toHaveCount(count);
  for (let index = 0; index < count; index++) {
    await expect(images.nth(index)).toHaveAttribute("src", `https://list-detail-figma.invalid/${prefix}-${String(index + 1).padStart(2, "0")}.png`);
    await expect.poll(() => images.nth(index).evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
}

test("ranked public list follows the READY desktop poster sequence", async ({ page }) => {
  const rankedMovies = ["Babylon", "The Holiday", "Whiplash", "Dead Poets Society", "Kill Bill: Vol. 1", "The Gentlemen", "Kill Bill: Vol. 2", "The Shining"].map((title, index) => ({
    id: 986000 + index,
    title,
    releaseDate: "2022-01-01",
    rating: null,
    photoUrl: null,
  }));
  await mockList(page, true, {
    name: "My Top",
    ownerUsername: "Emma Cerys",
    description: "A personal collection of films that shaped my taste and defined my rewatches.\n\nThese are the movies I come back to again and again.",
    tags: ["my top", "favorites", "best", "cinema", "rewatch", "list"],
    likeCount: 10,
    movies: rankedMovies,
    posterFixturePrefix: "ranked",
  });
  await page.setViewportSize({ width: 1440, height: 2033 });
  await page.goto("/en/lists/public/985000");
  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  await expect(main).toHaveAttribute("data-list-ranked", "true");
  const heading = main.getByRole("heading", { level: 1, name: "My Top" });
  const headingBox = await heading.boundingBox();
  expect(headingBox?.x).toBeCloseTo(120, 0);
  expect(headingBox?.y).toBeCloseTo(583, 0);
  const posters = main.locator('a[class*="movieMedia"]');
  await expect(posters).toHaveCount(8);
  await expectSourcePosters(page, "ranked", 8);
  await expect(main.locator("[data-list-rank]")).toHaveText(["1", "2", "3", "4", "5", "6", "7", "8"]);
  const first = await posters.first().boundingBox();
  expect(first?.x).toBeCloseTo(120, 0);
  expect(first?.y).toBeCloseTo(1038, 0);
  expect(first?.width).toBeCloseTo(174, 0);
  expect(first?.height).toBeCloseTo(260, 0);
  const sixth = await posters.nth(5).boundingBox();
  expect(sixth?.y).toBeCloseTo(1038, 0);
  const seventh = await posters.nth(6).boundingBox();
  const eighth = await posters.nth(7).boundingBox();
  expect(seventh?.x).toBeCloseTo(120, 0);
  expect(seventh?.y).toBeCloseTo(1348, 0);
  expect(eighth?.x).toBeCloseTo(325, 0);
  expect(eighth?.y).toBeCloseTo(1348, 0);
  const rank = await posters.first().locator("[data-list-rank]").boundingBox();
  expect(rank?.x).toBeCloseTo(128, 0);
  expect(rank?.y).toBeGreaterThan(1200);
  expect(rank?.y).toBeLessThan(1240);
  expect(Math.abs(Number((await page.locator("footer").boundingBox())?.y) - 1760)).toBeLessThan(1);
  const captureDir = path.resolve(process.cwd(), "../artifacts/visual-audit-20261124/public-list-ranked");
  mkdirSync(captureDir, { recursive: true });
  await page.screenshot({ path: path.join(captureDir, "rewind-my-top-en-desktop-1440x2033.png"), fullPage: false });
});

test("unranked public list follows the READY desktop poster sequence", async ({ page }) => {
  await mockList(page, false, {
    name: "Christopher Nolan Best Films",
    description: "A collection of Christopher Nolan’s mind-bending, time-twisting, reality-shifting films from grounded psychological thrillers to epic cosmic blockbusters.\n\nStories that challenge perception, reward rewatching, and redefine modern cinema.",
    ownerUsername: "FilmOracle",
    tags: ["christopher-nolan", "director", "best", "cinema", "films", "list"],
    likeCount: 554,
    posterFixturePrefix: "nolan",
  });
  await page.setViewportSize({ width: 1440, height: 2033 });
  await page.goto("/en/lists/public/985000");
  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  await expect(main).toHaveAttribute("data-list-ranked", "false");
  const heading = main.getByRole("heading", { level: 1, name: "Christopher Nolan Best Films" });
  const headingBox = await heading.boundingBox();
  expect(headingBox?.x).toBeCloseTo(120, 0);
  expect(headingBox?.y).toBeCloseTo(583, 0);
  const posters = main.locator('a[class*="movieMedia"]');
  await expect(posters).toHaveCount(12);
  await expectSourcePosters(page, "nolan", 12);
  await expect(main.locator("[data-list-rank]")).toHaveCount(0);
  const first = await posters.first().boundingBox();
  expect(first?.x).toBeCloseTo(120, 0);
  expect(first?.y).toBeCloseTo(1038, 0);
  expect(first?.width).toBeCloseTo(174, 0);
  expect(first?.height).toBeCloseTo(260, 0);
  expect((await posters.nth(6).boundingBox())?.y).toBeCloseTo(1348, 0);
  expect(Math.abs(Number((await page.locator("footer").boundingBox())?.y) - 1760)).toBeLessThan(1);
  const captureDir = path.resolve(process.cwd(), "../artifacts/visual-audit-20261124/public-list-ranked");
  mkdirSync(captureDir, { recursive: true });
  await page.screenshot({ path: path.join(captureDir, "rewind-christopher-nolan-en-desktop-1440x2033.png"), fullPage: false });
});

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

test("public list detail and My Top information sheet match the phone frame", async ({ page }, testInfo) => {
  await mockList(page, true, { name: "My Top", ownerUsername: "Emma Cerys", tags: ["favorites", "mytop", "best", "rewatch", "cinema", "list"], likeCount: 10, backdropFixture: "ranked-wallpaper.jpeg" });
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/lists/public/985000");
  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  await expect(main.locator('img[class*="heroBackdrop"]')).toHaveAttribute("src", "https://list-detail-figma.invalid/ranked-wallpaper.jpeg");
  await expect.poll(() => main.locator('img[class*="heroBackdrop"]').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(main.locator('img[class*="ownerAvatar"]')).toHaveCSS("width", "20px");
  const heading = main.getByRole("heading", { level: 1, name: "My Top" });
  const headingBox = await heading.boundingBox();
  expect(headingBox?.x).toBeCloseTo(16, 0);
  expect(headingBox?.y).toBeCloseTo(190.5, 0);
  const posters = main.locator('a[class*="movieMedia"]');
  const first = await posters.first().boundingBox();
  expect(first?.x).toBeCloseTo(16, 0);
  expect(first?.y).toBeCloseTo(393.25, 0);
  expect(first?.width).toBeCloseTo(79, 0);
  expect(first?.height).toBeCloseTo(116, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);

  const captureDir = path.resolve(process.cwd(), "../artifacts/visual-audit-20261102/public-list-detail-runtime");
  mkdirSync(captureDir, { recursive: true });
  const engine = testInfo.project.name.startsWith("iPhone") ? "ios-webkit" : "android-chromium";
  await page.screenshot({ path: path.join(captureDir, `${engine}-uk-393.png`), fullPage: true });

  const more = page.locator('button[aria-haspopup="dialog"]');
  await activate(more, testInfo.project.name);
  const dialog = page.getByRole("dialog", { name: "My Top" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/10/)).toBeVisible();
  await expect(dialog.getByRole("link", { name: "favorites", exact: true })).toBeVisible();
  const sheetTitle = await dialog.getByRole("heading", { level: 2, name: "My Top" }).boundingBox();
  const sheetCard = await dialog.locator('[class*="informationCard"]').boundingBox();
  const doneButton = await dialog.getByRole("button", { name: "Done" }).boundingBox();
  expect(Math.abs((sheetTitle?.y ?? Number.POSITIVE_INFINITY) - 488.62)).toBeLessThan(2);
  expect(sheetCard?.x).toBeCloseTo(16, 0);
  expect(Math.abs((sheetCard?.y ?? Number.POSITIVE_INFINITY) - 535.62)).toBeLessThan(2);
  expect(sheetCard?.width).toBeCloseTo(361, 0);
  expect(Math.abs((sheetCard?.height ?? Number.POSITIVE_INFINITY) - 206.38)).toBeLessThan(1);
  expect(doneButton?.y).toBeCloseTo(761, 0);
  await page.screenshot({ path: path.join(captureDir, `${engine}-en-my-top-information-393x852.png`), fullPage: false });
  await activate(dialog.getByRole("button", { name: "Done" }), testInfo.project.name);
  await expect(dialog).toBeHidden();
  await expect(more).toBeFocused();

  await mockList(page, false, { name: "Christopher Nolan Best Films", ownerUsername: "FilmOracle", tags: ["christopher-nolan", "director", "best", "films", "cinema", "list"], likeCount: 554, backdropFixture: "unranked-wallpaper.png" });
  await page.goto("/en/lists/public/985000");
  await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
  await expect(page.getByRole("main").locator('img[class*="heroBackdrop"]')).toHaveAttribute("src", "https://list-detail-figma.invalid/unranked-wallpaper.png");
  await activate(page.locator('button[aria-haspopup="dialog"]'), testInfo.project.name);
  const nolanDialog = page.getByRole("dialog", { name: "Christopher Nolan Best Films" });
  await expect(nolanDialog.getByText(/554/)).toBeVisible();
  await expect(nolanDialog.getByRole("link", { name: "christopher-nolan", exact: true })).toBeVisible();
  const nolanCard = await nolanDialog.locator('[class*="informationCard"]').boundingBox();
  expect(Math.abs((nolanCard?.y ?? Number.POSITIVE_INFINITY) - 535.62)).toBeLessThan(2);
  await page.screenshot({ path: path.join(captureDir, `${engine}-en-christopher-nolan-information-393x852.png`), fullPage: false });
});

test("ranked My Top phone detail matches Figma frame 1480:9353", async ({ page }) => {
  const phoneMovies = ["Babylon", "The Holiday", "Whiplash", "Dead Poets Society", "Kill Bill: Vol. 1", "The Gentlemen", "Kill Bill: Vol. 2", "The Shining"].map((title, index) => ({
    id: 987000 + index, title, releaseDate: "2022-01-01", rating: null, photoUrl: null,
  }));
  await mockList(page, true, {
    name: "My Top",
    ownerUsername: "Emma Cerys",
    description: "A personal collection of films that shaped my taste and defined my rewatches.\n\nThese are the movies I come back to again and again.",
    tags: ["my top", "favorites", "best", "cinema", "rewatch", "list"],
    likeCount: 10,
    movies: phoneMovies,
    posterFixturePrefix: "ranked",
  });
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/lists/public/985000");
  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  const heading = main.getByRole("heading", { level: 1, name: "My Top" });
  await expect(heading).toBeVisible();
  await expect(main.getByText(/A personal collection of films/)).toBeVisible();
  const posters = main.locator('a[class*="movieMedia"]');
  await expectSourcePosters(page, "ranked", 8);
  await expect(posters).toHaveCount(8);
  await expect(main.locator("[data-list-rank]")).toHaveText(["1", "2", "3", "4", "5", "6", "7", "8"]);
  await expect(page.getByRole("navigation", { name: "Main navigation", exact: true }).getByText("Home", { exact: true })).toBeVisible();
  const geometry = await page.evaluate(() => {
    const rect = (element: Element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    const cards = [...document.querySelectorAll<HTMLElement>('a[class*="movieMedia"]')];
    const backdrop = document.querySelector<HTMLElement>("main img");
    const description = document.querySelector<HTMLElement>('[class*="_description_"]');
    const owner = document.querySelector<HTMLElement>('[class*="_ownerLine_"]');
    const actions = document.querySelector<HTMLElement>("[data-public-list-actions]");
    const nav = document.querySelector<HTMLElement>('header nav[class*="_mobileNav_"]');
    const rank = document.querySelector<HTMLElement>("[data-list-rank]");
    if (!cards[0] || !cards[4] || !description || !owner || !actions || !nav || !rank || !backdrop) throw new Error("Missing My Top Figma anchor");
    return { heading: rect(document.querySelector("#public-list-heading")!), owner: rect(owner), description: rect(description), actions: rect(actions), first: rect(cards[0]), secondRow: rect(cards[4]), rank: rect(rank), navigation: rect(nav) };
  });
  console.log("MY_TOP_PHONE_GEOMETRY", JSON.stringify(geometry));
  expect(geometry.heading.y).toBeCloseTo(190.5, 0);
  expect(geometry.owner.y).toBeCloseTo(237.5, 0);
  expect(geometry.description).toMatchObject({ x: 16, width: 343 });
  expect(geometry.description.y).toBeCloseTo(265.5, 0);
  expect(geometry.first).toMatchObject({ x: 16, y: 393.25, width: 79, height: 116 });
  expect(geometry.secondRow.y).toBeCloseTo(528.25, 0);
  expect(geometry.rank.y).toBeCloseTo(472.31, 0);
  expect(geometry.navigation).toMatchObject({ x: 0, y: 760, width: 393, height: 92 });
  const captureDir = path.resolve(process.cwd(), "../artifacts/visual-audit-20261124/my-top-phone");
  mkdirSync(captureDir, { recursive: true });
  await page.screenshot({ path: path.join(captureDir, "rewind-my-top-en-phone-393x852.png"), fullPage: false });
});

test("unranked Christopher Nolan phone detail matches Figma frame 1480:9302", async ({ page }) => {
  await mockList(page, false, {
    name: "Christopher Nolan Best Films",
    ownerUsername: "FilmOracle",
    description: "A collection of Christopher Nolan’s mind-bending, time-twisting, reality-shifting films from grounded psychological thrillers to epic cosmic blockbusters.\n\nStories that challenge perception, reward rewatching, and redefine modern cinema.",
    tags: ["christopher-nolan", "director", "best", "films", "cinema", "list"],
    likeCount: 554,
    posterFixturePrefix: "nolan",
  });
  await page.setViewportSize({ width: 393, height: 929 });
  await page.goto("/en/lists/public/985000");
  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  await expect(main.getByRole("heading", { level: 1, name: "Christopher Nolan Best Films" })).toBeVisible();
  const posters = main.locator('a[class*="movieMedia"]');
  await expect(posters).toHaveCount(12);
  await expectSourcePosters(page, "nolan", 12);
  await expect(main.locator("[data-list-rank]")).toHaveCount(0);
  const geometry = await page.evaluate(() => {
    const rect = (element: Element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    const cards = [...document.querySelectorAll<HTMLElement>('a[class*="movieMedia"]')];
    const navigation = document.querySelector<HTMLElement>('header nav[class*="_mobileNav_"]');
    if (!cards[0] || !cards[4] || !cards[8] || !navigation) throw new Error("Missing unranked Figma list anchors");
    return { first: rect(cards[0]), secondRow: rect(cards[4]), thirdRow: rect(cards[8]), navigation: rect(navigation) };
  });
  expect(geometry.first).toMatchObject({ x: 16, width: 79, height: 116 });
  expect(geometry.first.y).toBeCloseTo(416.5, 0);
  expect(geometry.secondRow.y).toBeCloseTo(551.5, 0);
  expect(geometry.thirdRow.y).toBeCloseTo(686.5, 0);
  expect(geometry.navigation).toMatchObject({ x: 0, y: 837, width: 393, height: 92 });
  console.log("NOLAN_LIST_PHONE_GEOMETRY", JSON.stringify(geometry));
  const captureDir = path.resolve(process.cwd(), "../artifacts/visual-audit-20261124/nolan-list-phone");
  mkdirSync(captureDir, { recursive: true });
  await page.screenshot({ path: path.join(captureDir, "rewind-christopher-nolan-en-phone-393x929.png"), fullPage: false });
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
