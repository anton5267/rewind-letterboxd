import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

const testDir = dirname(fileURLToPath(import.meta.url));
const titles = ["Babylon", "The Holiday", "Whiplash", "Dead Poets Society", "Kill Bill: Vol. 1", "The Gentlemen", "Kill Bill: Vol. 2", "The Shining"];

for (const ranked of [false, true]) test(`READY desktop own list editor ${ranked ? "ranked" : "unranked"} matches Figma frame`, async ({ context, page }) => {
  const owner = { id: 98001, username: "emma-cerys", displayName: "Emma Cerys", role: "USER" };
  const list = { id: 98021, name: "My Top", description: "A personal collection of films that shaped my taste and defined my rewatches. These are the movies I come back to again and again.", listType: "CUSTOM", isPublic: true, isRanked: ranked, tags: ["mytop", "favorites", "rewatch"] };
  const items = titles.map((title, index) => ({ id: 98201 + index, position: index, movie: {
    id: 98101 + index, title, releaseDate: "2014-01-01", rating: null,
    photoUrl: `https://fixture.invalid/list-settings/poster-${String(index + 1).padStart(2, "0")}.png`,
  } }));
  const addedMovieIds: number[] = [];

  await installHostedAuthFixture(context);
  await page.route("https://fixture.invalid/list-settings/**", async route => {
    const file = new URL(route.request().url()).pathname.split("/").at(-1)!;
    const body = await readFile(join(testDir, "fixtures", "own-list-settings-figma", file));
    return route.fulfill({ contentType: "image/png", body });
  });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/users/me") return route.fulfill({ json: owner });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "list-edit-desktop-figma" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/lists/my") return route.fulfill({ json: [list] });
    if (pathname === "/api/lists/my/page") return route.fulfill({ json: { content: [list], number: 0, size: 12, totalPages: 1, totalElements: 1 } });
    if (pathname === "/api/lists/98021/items") return route.fulfill({ json: items });
    if (pathname === "/api/movies/search") return route.fulfill({ json: { content: [{ id: 98999, title: "Spirited Away", releaseDate: "2001-07-20", rating: 8.6, photoUrl: null }], number: 0, size: 8, totalPages: 1, totalElements: 1 } });
    if (pathname === "/api/lists/98021/movies" && route.request().method() === "POST") {
      addedMovieIds.push((route.request().postDataJSON() as { movieId: number }).movieId);
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await signInHostedFixture(page, "en");
  await page.goto("/en/lists?list=98021&mode=edit");
  const settings = page.locator("form").filter({ has: page.locator("[data-list-field='name']") });
  await expect(settings.locator("[data-list-field='name']")).toHaveValue("My Top");
  await expect(page.locator("[data-list-item-id]")).toHaveCount(8);
  const geometry = await page.evaluate(() => {
    const rect = (element: Element | null) => element ? (() => { const box = element.getBoundingClientRect(); return { x: box.x + window.scrollX, y: box.y + window.scrollY, width: box.width, height: box.height }; })() : null;
    return {
      height: document.documentElement.scrollHeight,
      footer: rect(document.querySelector("footer")),
      title: rect(document.querySelector("main h1")),
      editorHeader: rect(document.querySelector("[data-figma-list-editor-header]")),
      form: rect(document.querySelector("form[aria-label='List Settings']")),
      name: rect(document.querySelector("[data-list-field='name']")),
      description: rect(document.querySelector("[data-list-field='description']")),
      tags: rect(document.querySelector("[data-list-field='tags']")),
      tagChips: rect(document.querySelector("[class*='editTagChips']")),
      visibility: rect(document.querySelector("#edit-list-visibility")),
      rankingLabel: rect(document.querySelector("[class*='rankingField']")),
      ranks: Array.from(document.querySelectorAll("[data-list-rank]" )).map(rect),
      titles: Array.from(document.querySelectorAll("[data-list-item-id] [class*='itemTitle']")).map(rect),
      posters: Array.from(document.querySelectorAll("[data-list-item-id] img[class*='itemPoster']")).map(rect),
      items: Array.from(document.querySelectorAll("[data-list-item-id]")).map(rect),
      ranking: rect(document.querySelector("[class*='rankingField']")),
      actions: rect(document.querySelector("[class*='editActions']")),
      desktopSearch: rect(document.querySelector("[data-list-editor-film-search]")),
    };
  });
  console.log(`OWN_LIST_EDIT_DESKTOP_${ranked ? "RANKED" : "UNRANKED"}`, JSON.stringify(geometry));
  await page.screenshot({ path: `../artifacts/visual-audit-20261125/lists/own-list-edit-${ranked ? "ranked" : "unranked"}-en-desktop-1440.png`, fullPage: true, animations: "disabled" });
  expect(geometry.height).toBe(3988);
  expect(geometry.footer?.y).toBeCloseTo(3723, 0);
  expect(geometry.title?.y).toBe(261);
  expect(geometry.name).toMatchObject({ x: 120, y: 907, width: 588, height: 79 });
  expect(geometry.description).toMatchObject({ x: 732, y: 907, width: 588, height: 510 });
  expect(geometry.tags).toMatchObject({ x: 120, y: 1082, width: 588, height: 79 });
  expect(geometry.tagChips?.y).toBeCloseTo(1193, 0);
  expect(geometry.visibility?.y).toBeCloseTo(1338, 0);
  expect(geometry.rankingLabel?.y).toBeCloseTo(1486, 0);
  expect(geometry.actions?.y).toBeCloseTo(1580, 0);
  expect(geometry.desktopSearch).toMatchObject({ x: 357, y: 1622, width: 351, height: 79 });
  await expect(page.getByRole("searchbox", { name: "Add a film" })).toHaveAttribute("placeholder", "Enter name of film...");
  await expect(settings.getByRole("button", { name: "Cancel changes", exact: true })).toBeHidden();
  const deleteAction = settings.getByRole("button", { name: "Delete", exact: true });
  await expect(deleteAction).toBeVisible();
  await expect(deleteAction).toHaveCSS("background-color", "rgb(40, 40, 40)");
  await expect(page.locator("[data-list-item-id]").first().getByRole("button", { name: /Reorder:/ })).toBeVisible();
  await expect(page.locator("[data-list-item-id]").first().getByRole("button", { name: "Move up" })).toBeHidden();
  expect(geometry.posters).toHaveLength(8);
  expect(geometry.posters[0]).toMatchObject({ x: ranked ? 238 : 168, y: 1789, width: 91, height: 134 });
  expect(geometry.titles[0]).toMatchObject({ x: ranked ? 350 : 280, y: 1805 });
  if (ranked) {
    expect(geometry.ranks[0]).toMatchObject({ x: 177, width: 20 });
    expect(geometry.ranks[0].y).toBeGreaterThanOrEqual(1833.5);
    expect(geometry.ranks[0].y).toBeLessThanOrEqual(1834.5);
  }
  expect(geometry.items[0].y).toBe(1758);
  for (let index = 0; index < 8; index++) expect(geometry.items[index].y).toBe(1758 + index * 230);
  const loaded = await page.locator("[data-list-item-id] img[class*='itemPoster']").evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0));
  expect(loaded).toBe(true);
  if (!ranked) {
    await page.getByRole("searchbox", { name: "Add a film" }).fill("Spirited Away");
    await page.getByRole("button", { name: "Add a film Spirited Away", exact: true }).click();
    await expect.poll(() => addedMovieIds).toEqual([98999]);
  }
});
