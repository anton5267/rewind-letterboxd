import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

test("READY own list Edit entries mobile frame matches its four-film layout", async ({ page }) => {
  const owner = { id: 98001, username: "emma-cerys", displayName: "Emma Cerys", role: "USER" };
  const list = { id: 98021, name: "My Top", description: "A personal collection of favourite films.", listType: "CUSTOM", isPublic: true, isRanked: false, tags: ["mytop", "favorites"] };
  const films = [
    { id: 98101, title: "Babylon", releaseDate: "2022-01-01", rating: null, photoUrl: "https://fixture.invalid/list-edit/poster-01.png" },
    { id: 98102, title: "The Holiday", releaseDate: "2006-01-01", rating: null, photoUrl: "https://fixture.invalid/list-edit/poster-02.png" },
    { id: 98103, title: "Whiplash", releaseDate: "2014-01-01", rating: null, photoUrl: "https://fixture.invalid/list-edit/poster-03.png" },
    { id: 98104, title: "Dead Poets Society", releaseDate: "1989-01-01", rating: null, photoUrl: "https://fixture.invalid/list-edit/poster-04.png" },
  ];
  const items = films.map((movie, index) => ({ id: 98201 + index, position: index, movie }));

  await page.route("https://fixture.invalid/list-edit/**", async route => {
    const file = new URL(route.request().url()).pathname.split("/").at(-1)!;
    const body = await readFile(join(testDir, "fixtures", "own-list-edit-entries-figma", file));
    return route.fulfill({ contentType: "image/png", body });
  });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/users/me") return route.fulfill({ json: owner });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "list-edit-figma" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/lists/my") return route.fulfill({ json: [list] });
    if (pathname === "/api/lists/my/page") return route.fulfill({ json: { content: [list], number: 0, size: 12, totalPages: 1, totalElements: 1 } });
    if (pathname === "/api/lists/98021/items") return route.fulfill({ json: items });
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/lists?list=98021&mode=edit");
  await page.getByRole("button", { name: /^Edit entries/ }).click();
  const rows = page.locator("[data-list-item-id]");
  await expect(rows).toHaveCount(4);
  const search = page.getByRole("search", { name: "Add a film" });
  await expect(search.getByRole("searchbox", { name: "Add a film" })).toBeVisible();
  for (const img of await rows.locator("img").all()) {
    await expect(img).toHaveJSProperty("complete", true);
    expect(await img.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }

  const geometry = await page.evaluate(() => {
    const rect = (element: Element | null) => { if (!element) return null; const box = element.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height }; };
    return {
      heading: rect(document.querySelector("[class*='entriesToolbar'] h2")),
      search: rect(document.querySelector("[role='search'] form")),
      posters: Array.from(document.querySelectorAll("[data-list-item-id] [class*='itemPosterLink']")).map(rect),
      titles: Array.from(document.querySelectorAll("[data-list-item-id] [class*='itemTitle']")).map(rect),
      actions: Array.from(document.querySelectorAll("[data-list-item-id] [class*='itemActions'] button")).slice(0, 2).map(rect),
      width: document.documentElement.scrollWidth,
    };
  });
  console.log("OWN_LIST_EDIT_ENTRIES_FIGMA_GEOMETRY", JSON.stringify(geometry));
  expect(geometry.width).toBe(393);
  expect(geometry.heading?.x).toBe(56);
  expect(geometry.heading?.y).toBeCloseTo(110, 0);
  expect(geometry.search).toMatchObject({ x: 34, y: 148, width: 325, height: 37 });
  expect(geometry.posters).toHaveLength(4);
  expect(geometry.posters[0].x).toBe(34);
  expect(geometry.posters[0].width).toBe(79);
  expect(geometry.posters[0].height).toBe(116);
  for (let row = 0; row < 4; row++) expect(geometry.posters[row].y).toBe(217 + row * 161);
  expect(geometry.titles[0].y).toBeGreaterThan(256);
  expect(geometry.titles[0].y).toBeLessThan(258);
  expect(geometry.actions[0]).toMatchObject({ x: 300, width: 35, height: 35 });
  expect(geometry.actions[1]).toMatchObject({ x: 340, width: 35, height: 35 });
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/lists/rewind-own-list-edit-entries-en-mobile-393x852.png", animations: "disabled" });
});

test("READY own list settings mobile frame matches its eight-film layout", async ({ page }) => {
  const owner = { id: 98001, username: "emma-cerys", displayName: "Emma Cerys", role: "USER" };
  const list = { id: 98021, name: "My Top", description: "A personal collection of films that shaped my taste and defined my rewatches. These are the movies I come back to again and again.", listType: "CUSTOM", isPublic: true, isRanked: true, tags: ["mytop", "favorites", "rewatch"] };
  const films = Array.from({ length: 8 }, (_, index) => ({
    id: 98101 + index,
    title: ["Babylon", "The Holiday", "Whiplash", "Dead Poets Society", "La La Land", "Little Women", "The Grand Budapest Hotel", "Pride & Prejudice"][index],
    releaseDate: "2014-01-01",
    rating: null,
    photoUrl: `https://fixture.invalid/list-settings/poster-${String(index + 1).padStart(2, "0")}.png`,
  }));
  const items = films.map((movie, index) => ({ id: 98201 + index, position: index, movie }));

  await page.route("https://fixture.invalid/list-settings/**", async route => {
    const file = new URL(route.request().url()).pathname.split("/").at(-1)!;
    const body = await readFile(join(testDir, "fixtures", "own-list-settings-figma", file));
    return route.fulfill({ contentType: "image/png", body });
  });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/users/me") return route.fulfill({ json: owner });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "list-settings-figma" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/lists/my") return route.fulfill({ json: [list] });
    if (pathname === "/api/lists/my/page") return route.fulfill({ json: { content: [list], number: 0, size: 12, totalPages: 1, totalElements: 1 } });
    if (pathname === "/api/lists/98021/items") return route.fulfill({ json: items });
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/lists?list=98021&mode=edit");
  const settings = page.getByRole("form", { name: "List Settings", exact: true });
  await expect(settings.getByRole("textbox", { name: "List name" })).toHaveValue("My Top");
  await expect(settings.getByRole("checkbox", { name: "Public list" })).toBeChecked();
  await expect(settings.getByRole("checkbox", { name: "Ranked list" })).toBeChecked();
  await expect(settings.getByRole("button", { name: /^Edit entries/ })).toContainText("8");
  await expect(settings.getByRole("listitem")).toHaveCount(8);
  for (const image of await settings.locator("img").all()) {
    await expect(image).toHaveJSProperty("complete", true);
    expect(await image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }

  const geometry = await page.evaluate(() => {
    const rect = (element: Element | null) => { if (!element) return null; const box = element.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height }; };
    return {
      form: rect(document.querySelector("form[aria-label='List Settings']")),
      nameLabel: rect(document.querySelector("[class*='name']")),
      name: rect(document.querySelector("[data-list-field='name']")),
      description: rect(document.querySelector("[data-list-field='description']")),
      entries: rect(document.querySelector("button[class*='entries']")),
      entriesText: rect(document.querySelector("button[class*='entries'] span")),
      posters: Array.from(document.querySelectorAll("[class*='posters'] li img")).map(rect),
      tags: rect(document.querySelector("[class*='tags']")),
      actions: rect(document.querySelector("[class*='actions']")),
      save: rect(document.querySelector("[class*='actions'] button[type='submit']")),
      width: document.documentElement.scrollWidth,
    };
  });
  console.log("OWN_LIST_SETTINGS_FIGMA_GEOMETRY", JSON.stringify(geometry));
  expect(geometry.width).toBe(393);
  expect(geometry.nameLabel?.y).toBeCloseTo(107.7, 0);
  expect(geometry.name?.y).toBeCloseTo(127.3, 0);
  expect(geometry.description?.y).toBeCloseTo(205, 0);
  expect(geometry.entriesText?.y).toBeCloseTo(309, 0);
  expect(geometry.posters).toHaveLength(8);
  expect(geometry.posters[0].y).toBeCloseTo(360, 0);
  expect(geometry.posters[4].y).toBeCloseTo(482, 0);
  expect(geometry.tags?.y).toBeCloseTo(617, 0);
  expect(geometry.actions?.y).toBeCloseTo(740.7, 0);
  expect(geometry.save?.y).toBeCloseTo(760.7, 0);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/lists/rewind-own-list-settings-en-mobile-393x852.png", animations: "disabled" });
});
