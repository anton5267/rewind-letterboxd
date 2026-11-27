import { expect, test, type Locator, type Page, type Route } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import path from "node:path";

const owner = { id: 98001, username: "list-draft-owner", role: "USER" };
const film = { id: 98011, title: "Arrival", releaseDate: "2016-11-11", rating: 7.9, photoUrl: null };
const readyFilms = ["Babylon", "The Holiday", "Whiplash", "Dead Poets Society", "Kill Bill: Vol. 1", "The Gentlemen", "Kill Bill: Vol. 2", "The Shining"].map((title, index) => ({ id: 98100 + index, title, releaseDate: `${[2022, 2006, 2014, 1989, 2003, 2019, 2004, 1980][index]}-01-01`, rating: null, photoUrl: `https://list-poster-fixture.invalid/poster-0${index + 1}.png` }));

async function activate(locator: Locator, projectName: string) {
  if (projectName.includes("emulation")) await locator.tap();
  else await locator.click();
}

async function captureDraft(page: Page, testName: string, projectName: string) {
  const output = path.resolve(process.cwd(), "../artifacts/visual-audit-20261102/list-create-draft");
  mkdirSync(output, { recursive: true });
  const platform = projectName.includes("iOS") ? "ios-webkit" : projectName.includes("Android") ? "android-chromium" : "desktop-chromium";
  await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo(0, 0); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(output, `${testName}-${platform}.png`), fullPage: true });
}

async function mockListDraft(page: Page, failCreate = false, useReadyFilms = false) {
  const mutations: string[] = [];
  let created: Record<string, unknown> | null = null;
  const items: Array<{ id: number; position: number; movie: typeof film }> = [];

  await page.route("https://list-poster-fixture.invalid/**", async (route: Route) => {
    const filename = path.basename(new URL(route.request().url()).pathname);
    const image = await readFile(path.resolve(process.cwd(), "tests/e2e/fixtures/create-list-figma", filename));
    await route.fulfill({ contentType: "image/png", body: image });
  });
  await page.route(url => url.pathname.startsWith("/api/"), async (route: Route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    if (pathname === "/api/users/me") return route.fulfill({ json: owner });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "list-draft-test" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/genres") return route.fulfill({ json: [] });
    if (pathname === "/api/lists/my") return route.fulfill({ json: created ? [created] : [] });
    if (pathname === "/api/lists/my/page") return route.fulfill({ json: { content: [], totalPages: 1, totalElements: 0, number: 0, size: 12 } });
    if (pathname === "/api/movies/search") {
      const content = useReadyFilms ? readyFilms.filter(item => item.title.toLowerCase().includes((new URL(request.url()).searchParams.get("q") ?? "").toLowerCase())) : [film];
      return route.fulfill({ json: { content, totalPages: 1, totalElements: content.length, number: 0, size: 8 } });
    }
    if (pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/lists" && request.method() === "POST") {
      mutations.push("create");
      if (failCreate) return route.fulfill({ status: 503, json: { message: "Temporary failure" } });
      const body = request.postDataJSON() as Record<string, unknown>;
      if (Array.isArray(body.movieIds) && body.movieIds.includes(film.id)) {
        items.push({ id: 98031, position: 1, movie: film });
      }
      created = { id: 98021, description: null, listType: "CUSTOM", isPublic: false, tags: [], ...body };
      return route.fulfill({ json: created });
    }
    if (pathname === "/api/lists/98021/items") return route.fulfill({ json: items });
    return route.fulfill({ json: [] });
  });
  return { mutations, items };
}

test("Create List keeps film selection local until Save, then opens the returned list", async ({ page }, testInfo) => {
  const { mutations } = await mockListDraft(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en/lists");
  await expect(page.locator('main[data-list-editor="create"]')).toHaveAttribute("aria-busy", "false");
  const ranked = page.getByRole("checkbox", { name: "Ranked list", exact: true });
  await expect(ranked).not.toBeChecked();
  await ranked.check();

  await page.locator("#new-list-name").fill("Films to revisit");
  await page.locator("#new-list-description").fill("A private draft with a selected film.");
  await page.locator("#new-list-tags").fill("arrival, science fiction");
  const addFilm = page.getByRole("button", { name: "Add a film", exact: true });
  await expect(addFilm).toHaveAttribute("aria-expanded", "false");
  await activate(addFilm, testInfo.project.name);
  await expect(addFilm).toHaveAttribute("aria-expanded", "true");
  const query = page.locator("#draft-film-query");
  await expect(query).toBeFocused();
  const queryBox = await query.boundingBox();
  expect(queryBox?.width).toBeCloseTo(351, 0);
  await query.fill("Arrival");
  await activate(page.getByRole("button", { name: /Arrival/ }), testInfo.project.name);
  await expect(page.getByText("Arrival", { exact: true })).toBeVisible();
  await expect(page.locator("[data-list-rank]")).toHaveText(["1"]);
  await expect(page.locator("[data-list-rank]")).toBeVisible();
  expect(mutations).toEqual([]);
  await captureDraft(page, "desktop-en-1440", testInfo.project.name);

  await activate(page.getByRole("button", { name: "Save", exact: true }), testInfo.project.name);
  await expect(page).toHaveURL("/en/lists?list=98021&mode=view");
  await expect(page.getByRole("status").filter({ hasText: "List created." })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Films to revisit" })).toBeVisible();
  await expect(page.locator("[data-list-rank]")).toHaveText(["1"]);
  await expect(page.locator("[data-list-rank]")).toBeVisible();
  await expect(page.getByRole("link", { name: "List settings" })).toHaveAttribute("href", "/en/lists?list=98021&mode=edit");
  expect(mutations).toEqual(["create"]);
  expect((await page.evaluate(() => fetch("/api/lists/98021/items").then(response => response.json()))).length).toBe(1);
  await activate(page.getByRole("link", { name: "List settings" }), testInfo.project.name);
  await expect(ranked).toBeChecked();
  const rankingBox = await ranked.boundingBox();
  const saveBox = await page.getByRole("button", { name: "Save", exact: true }).boundingBox();
  expect(rankingBox!.y).toBeLessThan(saveBox!.y);
  await page.screenshot({ path: testInfo.outputPath("ranked-desktop-editor.png"), fullPage: true });
});

test("Create List cannot be saved without a selected film", async ({ page }) => {
  const { mutations } = await mockListDraft(page);
  await page.goto("/en/lists");
  await expect(page.locator('main[data-list-editor="create"]')).toHaveAttribute("aria-busy", "false");
  const save = page.getByRole("button", { name: "Save", exact: true });
  await expect(save).toBeDisabled();
  await page.locator("#new-list-name").fill("   ");
  await expect(save).toBeDisabled();
  await page.locator("#new-list-name").fill("Films to revisit");
  await expect(save).toBeDisabled();
  await expect(page.getByText("Add your first film to start building this list.")).toBeVisible();
  expect(mutations).toEqual([]);
});

test("Create List mobile empty form matches the READY frame and keeps Save disabled", async ({ page }) => {
  const { mutations } = await mockListDraft(page);
  await page.setViewportSize({ width: 393, height: 894 });
  await page.goto("/en/lists");
  const main = page.locator('main[data-list-editor="create"]');
  await expect(main).toHaveAttribute("aria-busy", "false");
  await expect(main.locator(':scope > [class*="createMobileHeader"]')).toBeVisible();
  await page.locator("#new-list-name").fill("My Top");
  await page.locator("#new-list-description").fill("A personal collection of films that shaped my taste and defined my rewatches. These are the movies I come back to again and again.");
  await page.locator("#new-list-tags").fill("mytop, favorites, rewatch");
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await expect(page.locator("#new-list-tags")).toBeHidden();
  const save = page.getByRole("button", { name: "Save", exact: true });
  await expect(save).toBeDisabled();
  await expect(page.getByText("No films yet", { exact: true })).toBeVisible();
  await expect(page.getByText("Add your first film to start building this list.")).toBeVisible();
  const nameBox = await page.locator("#new-list-name").boundingBox();
  const descriptionBox = await page.locator("#new-list-description").boundingBox();
  const settingsBox = await main.locator('[class*="createSettings"]').boundingBox();
  const rankedBox = await main.locator('[class*="rankedSetting"]').boundingBox();
  const addFilmBox = await page.getByRole("button", { name: "Add a film" }).boundingBox();
  const emptyBox = await main.locator('[class*="draftEmpty"]').boundingBox();
  const firstTagBox = await main.locator('[class*="draftTags"] > span').first().boundingBox();
  expect(nameBox?.width).toBeCloseTo(321, 0);
  expect(descriptionBox?.width).toBeCloseTo(321, 0);
  expect(descriptionBox?.height).toBeCloseTo(120, 0);
  expect(settingsBox?.width).toBeCloseTo(321, 0);
  expect(rankedBox?.height).toBeCloseTo(56, 0);
  await expect(main.getByText("Ranked", { exact: true })).toBeVisible();
  expect(firstTagBox?.height).toBeCloseTo(32, 0);
  expect(addFilmBox?.width).toBeCloseTo(321, 0);
  expect(emptyBox?.width).toBeCloseTo(321, 0);
  expect(addFilmBox?.y).toBeCloseTo(529, 0);
  expect(emptyBox?.y).toBeCloseTo(591, 0);
  const captureDir = path.resolve(process.cwd(), "../artifacts/visual-audit-20261126/create-list-mobile");
  mkdirSync(captureDir, { recursive: true });
  await page.screenshot({ path: path.join(captureDir, "rewind-create-list-empty-en-mobile-393x894.png"), fullPage: true });
  for (const width of [320, 393, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 894 });
    const overflow = await page.evaluate(() => Array.from(document.querySelectorAll("body *")).map(element => {
      const rect = element.getBoundingClientRect();
      return { tag: element.tagName, id: element.id, className: typeof element.className === "string" ? element.className : "", right: Math.round(rect.right), width: Math.round(rect.width) };
    }).filter(element => element.right > window.innerWidth + 1).sort((a, b) => b.right - a.right).slice(0, 8));
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const layout = await page.evaluate(() => {
      const element = document.querySelector('[class*="draftEmpty"]');
      const chain = [];
      for (let current = element; current && chain.length < 5; current = current.parentElement) {
        const rect = current.getBoundingClientRect();
        const style = getComputedStyle(current);
        chain.push({ tag: current.tagName, className: typeof current.className === "string" ? current.className : "", x: Math.round(rect.x), width: Math.round(rect.width), scrollWidth: current.scrollWidth, gridColumns: style.gridTemplateColumns, gridColumn: style.gridColumn });
      }
      return chain;
    });
    expect(documentWidth, `horizontal overflow at ${width}px: ${JSON.stringify({ overflow, layout })}`).toBeLessThanOrEqual(width);
  }
  expect(mutations).toEqual([]);
});

test("Create List mobile film selection matches READY posters and row geometry", async ({ page }, testInfo) => {
  await mockListDraft(page, false, true);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/lists");
  await expect(page.locator('main[data-list-editor="create"]')).toHaveAttribute("aria-busy", "false");
  await activate(page.getByRole("button", { name: "Add a film", exact: true }), testInfo.project.name);
  const query = page.locator("#draft-film-query-mobile");
  for (const title of readyFilms.slice(0, 4).map(item => item.title)) {
    await query.fill(title);
    await activate(page.locator('[class*="mobileFilmResults"] button').filter({ hasText: title }), testInfo.project.name);
  }
  await query.fill("");
  await query.evaluate(element => (element as HTMLElement).blur());
  const rows = page.locator('[class*="mobileDraftFilms"] > li');
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(0)).toContainText("Babylon");
  await expect(rows.nth(0)).toContainText("2022");
  await expect(rows.nth(1)).toContainText("The Holiday");
  await expect(rows.nth(1)).toContainText("2006");
  await expect(rows.nth(2)).toContainText("Whiplash");
  await expect(rows.nth(2)).toContainText("2014");
  await expect(rows.nth(3)).toContainText("Dead Poets Society");
  await expect(rows.nth(3)).toContainText("1989");
  const firstPoster = rows.nth(0).locator("img");
  await expect(firstPoster).toBeVisible();
  await expect.poll(() => firstPoster.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const posterBoxes = await rows.locator("img").evaluateAll(images => images.map(image => {
    const { x, y, width, height } = image.getBoundingClientRect();
    return { x, y, width, height };
  }));
  expect(posterBoxes).toHaveLength(4);
  for (const [index, box] of posterBoxes.entries()) {
    expect(box.x).toBeCloseTo(34, 0);
    expect(box.width).toBeCloseTo(79, 0);
    expect(box.height).toBeCloseTo(116, 0);
    expect(Math.abs(box.y - (217 + 160 * index))).toBeLessThanOrEqual(2);
  }
  const fixturePosterUrls = await rows.locator("img").evaluateAll(images => images.map(image => new URL((image as HTMLImageElement).src).pathname));
  expect(fixturePosterUrls).toEqual(readyFilms.slice(0, 4).map((_, index) => `/poster-0${index + 1}.png`));
  const captureDir = path.resolve(process.cwd(), "../artifacts/visual-audit-20261126/create-list-mobile");
  mkdirSync(captureDir, { recursive: true });
  await page.screenshot({ path: path.join(captureDir, "rewind-create-list-film-selection-en-mobile-393x852.png"), fullPage: true });
});

test("Create List empty desktop layout matches the READY form and View list opens a draft preview", async ({ page }, testInfo) => {
  const { mutations } = await mockListDraft(page);
  await page.setViewportSize({ width: 1440, height: 2033 });
  await page.goto("/en/lists");
  const main = page.locator('main[data-list-editor="create"]');
  await expect(main).toHaveAttribute("aria-busy", "false");
  await page.locator("#new-list-name").fill("My Top");
  await page.locator("#new-list-description").fill("A personal collection of films that shaped my taste and defined my rewatches.\n\nThese are the movies I come back to again and again.");
  await page.locator("#new-list-tags").fill("mytop, favorites");
  const hero = main.locator(":scope > header");
  const heroBox = await hero.boundingBox();
  const titleBox = await main.getByRole("heading", { level: 1, name: "New list" }).boundingBox();
  const nameBox = await page.locator("#new-list-name").boundingBox();
  const descriptionBox = await page.locator("#new-list-description").boundingBox();
  const tagsBox = await page.locator("#new-list-tags").boundingBox();
  const settingsBox = await main.locator('[class*="createSettings"]').boundingBox();
  const actionsBox = await page.getByRole("button", { name: "Add a film" }).boundingBox();
  const emptyBox = await main.locator('[class*="draftEmpty"]').boundingBox();
  expect(heroBox?.height).toBeCloseTo(818, 0);
  expect(titleBox?.y).toBeCloseTo(280, 0);
  expect(nameBox?.x).toBeCloseTo(120, 0);
  expect(nameBox?.y).toBeCloseTo(755, 0);
  expect(nameBox?.width).toBeCloseTo(588, 0);
  expect(descriptionBox?.x).toBeCloseTo(732, 0);
  expect(descriptionBox?.y).toBeCloseTo(755, 0);
  expect(descriptionBox?.height).toBeCloseTo(429, 0);
  expect(emptyBox?.y).toBeCloseTo(1539, 0);
  expect(emptyBox?.height).toBeCloseTo(195, 0);
  const previewButton = page.getByRole("button", { name: "View list", exact: true });
  await expect(previewButton).toBeVisible();
  await activate(previewButton, testInfo.project.name);
  const preview = page.locator("#list-draft-preview");
  await expect(preview).toBeVisible();
  await expect(preview).toContainText("My Top");
  expect(mutations).toEqual([]);
  await activate(preview.getByRole("button", { name: "Done" }), testInfo.project.name);
  await expect(preview).toBeHidden();
  const captureDir = path.resolve(process.cwd(), "../artifacts/visual-audit-20261124/create-list-desktop");
  mkdirSync(captureDir, { recursive: true });
  await page.screenshot({ path: path.join(captureDir, "rewind-create-list-empty-en-desktop-1440x2033.png"), fullPage: true });
});

test("Create List populated desktop state matches the READY poster rows", async ({ page }, testInfo) => {
  await mockListDraft(page, false, true);
  await page.setViewportSize({ width: 1440, height: 3856 });
  await page.goto("/en/lists");
  await expect(page.locator('main[data-list-editor="create"]')).toHaveAttribute("aria-busy", "false");
  await page.locator("#new-list-name").fill("My Top");
  await page.locator("#new-list-description").fill("Some films I love. Some I hate. All deserve a list.");
  await page.locator("#new-list-tags").fill("mytop, cinema, favorites, rewatch");
  const addFilm = page.getByRole("button", { name: "Add a film", exact: true });
  await activate(addFilm, testInfo.project.name);
  const query = page.locator("#draft-film-query");
  for (const item of readyFilms) {
    await query.fill(item.title);
    await activate(page.getByRole("button", { name: new RegExp(item.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }), testInfo.project.name);
  }
  await query.fill("");
  await expect(page.locator('ul[class*="draftResults"]')).toHaveCount(0);
  const rows = page.locator('ul[class*="draftSelection"] > li');
  await expect(rows).toHaveCount(8);
  await expect(rows.first()).toContainText("Babylon");
  await expect(rows.last()).toContainText("The Shining");
  await expect(page.locator('ul[class*="draftSelection"] img')).toHaveCount(24);
  const firstCard = await rows.first().boundingBox();
  expect(firstCard?.x).toBeCloseTo(120, 0);
  expect(firstCard?.y).toBeCloseTo(1626, 0);
  expect(firstCard?.width).toBeCloseTo(1200, 0);
  expect(firstCard?.height).toBeCloseTo(195, 0);
  const sourcePosters = rows.locator("span[class*=draftFilmPoster] img");
  await expect(sourcePosters).toHaveCount(8);
  await expect.poll(() => sourcePosters.evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(sourcePosters.evaluateAll(images => images.map(image => new URL((image as HTMLImageElement).src).pathname))).resolves.toEqual(Array.from({ length: 8 }, (_, index) => `/poster-0${index + 1}.png`));
  const captureDir = path.resolve(process.cwd(), "../artifacts/visual-audit-20261124/create-list-desktop");
  mkdirSync(captureDir, { recursive: true });
  await page.screenshot({ path: path.join(captureDir, "rewind-create-list-populated-en-desktop-1440x3856.png"), fullPage: true });
});

test("Create List keeps the form and film draft after Save fails on a phone viewport", async ({ page }, testInfo) => {
  const { mutations } = await mockListDraft(page, true);
  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/uk/lists");
  await expect(page.locator('main[data-list-editor="create"]')).toHaveAttribute("aria-busy", "false");

  await page.locator("#new-list-name").fill("Список на потім");
  await page.locator("#new-list-description").fill("Чернетка збережеться після помилки.");
  await page.locator("#new-list-tags").fill("драма, космос");
  const addFilm = page.getByRole("button", { name: "Додати фільм", exact: true });
  await expect(addFilm).toHaveAttribute("aria-expanded", "false");
  await activate(addFilm, testInfo.project.name);
  await expect(page.locator('main[data-film-picker="true"]')).toBeVisible();
  const query = page.locator("#draft-film-query-mobile");
  await expect(page.locator('main[data-film-picker="true"]')).toBeVisible();
  await expect(query).toBeFocused();
  await query.fill("Arrival");
  await activate(page.locator('ul[class*="mobileFilmResults"] button').filter({ hasText: "Arrival" }), testInfo.project.name);
  await expect(page.locator('ul[class*="mobileDraftFilms"] li')).toHaveCount(1);
  await expect(page.locator('ul[class*="mobileDraftFilms"]')).toContainText("Arrival");
  expect(mutations).toEqual([]);
  await captureDraft(page, "phone-film-picker-393", testInfo.project.name);
  await activate(page.locator('main[data-film-picker="true"] header button'), testInfo.project.name);
  await expect(page.locator('main[data-film-picker="true"]')).toHaveCount(0);
  const addFilmsBox = await page.getByRole("button", { name: "Додати фільм", exact: true }).boundingBox();
  expect(addFilmsBox?.width).toBeCloseTo(321, 0);
  await expect(page.getByText("Arrival", { exact: true })).toBeVisible();
  await captureDraft(page, "phone-uk-393", testInfo.project.name);

  await activate(page.getByRole("button", { name: "Зберегти", exact: true }), testInfo.project.name);
  await expect(page.getByRole("alert")).toContainText("Не вдалося створити список.");
  await expect(page.locator('main[data-list-editor="create"]')).toBeVisible();
  await expect(page.locator("#new-list-name")).toHaveValue("Список на потім");
  await expect(page.locator("#new-list-description")).toHaveValue("Чернетка збережеться після помилки.");
  await expect(page.locator("#new-list-tags")).toHaveValue("драма, космос");
  await expect(page.getByText("Arrival", { exact: true })).toBeVisible();
  const selectionList = page.locator('ul[class*="draftSelection"]');
  for (const width of [320, 393, 600, 720]) {
    await page.setViewportSize({ width, height: 844 });
    const [addBox, selection] = await Promise.all([page.getByRole("button", { name: "Додати фільм", exact: true }).boundingBox(), selectionList.boundingBox()]);
    expect(addBox?.width, `add-films width at ${width}px`).toBeGreaterThan(0);
    expect(selection?.width, `selected-film row width at ${width}px`).toBeCloseTo(addBox?.width ?? 0, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `document width at ${width}px`).toBeLessThanOrEqual(width);
  }
  expect(mutations).toEqual(["create"]);
});
