import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const owner = { id: 94110, username: "emma-cerys", displayName: "Emma Cerys", role: "USER", email: "emma@example.invalid" };
const definitions = [
  { id: 94111, name: "The Cillian Murphy Correction", count: 11, description: "Tom Cruise holds my Most Watched Actor spot for 2025, and I refuse to allow that. I need to watch FIVE more Cillian Murphy films before the end of the year to get him back to the top." },
  { id: 94112, name: "My Top", count: 8, description: "A personal collection of films that shaped my taste and defined my rewatchlist." },
  { id: 94113, name: "Late Night", count: 20, description: "Films best watched after midnight — slow burns, moody visuals, and stories that linger long after the credits roll." },
];
const lists = definitions.map(item => ({ ...item, description: item.description, listType: "CUSTOM", isPublic: true, isRanked: false, tags: ["mytop", "rewatch", "personal"] }));
const profile = {
  ...owner, avatarUrl: "https://fixture.invalid/own-lists/profile-avatar.png", bannerUrl: "https://fixture.invalid/own-lists/profile-banner.png", bio: "Obsessed with great directing, bold storytelling, and films that stick with you long after the credits roll.", location: "USA",
  stats: { ratings: 212, reviews: 17, watched: 834, watchlist: 32, favorites: 24 }, lists: lists.map(({ id, name, listType, isPublic }) => ({ id, name, listType, isPublic })),
  recentRatings: [], recentReviews: [],
};
const movie = (id: number, listId: number, index: number) => ({ id, title: `List preview film ${id}`, releaseDate: "2024-01-01", rating: null, photoUrl: `https://fixture.invalid/own-lists/poster-${String((listId - 94111) * 5 + index + 1).padStart(2, "0")}.png` });
const emptyPage = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 12 };
const popularTags = ["mytop", "tvshows", "rewatch", "personal", "cinema", "topfilms", "alltime", "essential"].map((name, id) => ({ id, name, slug: name }));

test("READY own Lists screen matches mobile and desktop list cards", async ({ page }) => {
  const imageNames = ["profile-avatar.png", "profile-banner.png", ...Array.from({ length: 15 }, (_, index) => `poster-${String(index + 1).padStart(2, "0")}.png`)];
  const fixtureImages = new Map(await Promise.all(imageNames.map(async name => [name, await readFile(join(testDir, "fixtures", "own-profile-lists-figma", name))] as const)));
  await page.route("https://fixture.invalid/own-lists/**", route => {
    const name = new URL(route.request().url()).pathname.split("/").at(-1)!;
    const body = fixtureImages.get(name);
    return body ? route.fulfill({ contentType: "image/png", body }) : route.abort();
  });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: owner });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 204 });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/profile/me/social-links") return route.fulfill({ json: [] });
    if (pathname === `/api/users/${owner.id}/following`) return route.fulfill({ json: { content: [], totalPages: 2, totalElements: 32, number: 0, size: 16 } });
    if (pathname === `/api/users/${owner.id}/followers`) return route.fulfill({ json: { content: [], totalPages: 18, totalElements: 287, number: 0, size: 16 } });
    if (pathname === "/api/lists/my") return route.fulfill({ json: lists });
    if (pathname === "/api/tags/popular") return route.fulfill({ json: popularTags });
    const itemMatch = pathname.match(/^\/api\/lists\/(\d+)\/items$/);
    if (itemMatch) {
      const listId = Number(itemMatch[1]);
      const list = definitions.find(value => value.id === listId);
      return route.fulfill({ json: Array.from({ length: list?.count ?? 0 }, (_, index) => ({ id: 94200 + (listId - 94111) * 30 + index, position: index + 1, movie: movie(94300 + (listId - 94111) * 30 + index, listId, index) })) });
    }
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname.startsWith("/api/profile/me/")) return route.fulfill({ json: emptyPage });
    return route.fulfill({ json: emptyPage });
  });

  await page.setViewportSize({ width: 393, height: 1666 });
  await page.goto("/en/profile?view=lists");
  await expect(page.getByRole("heading", { level: 1, name: /Lists/ })).toBeVisible();
  for (const list of lists) await expect(page.locator(`[data-profile-list-id="${list.id}"]`)).toBeVisible();
  await expect(page.locator("#profile-lists [data-profile-list-id]")).toHaveCount(3);
  await expect(page.locator("#profile-lists [data-profile-list-body]")).toHaveCount(3);
  await expect(page.locator("#profile-lists [data-profile-list-body]").first()).toBeHidden();
  await expect(page.locator("[class*='heroMetrics'] dt").first()).toHaveText("Films");
  await expect(page.locator("#profile-lists").getByRole("link", { name: "New list" })).toBeHidden();
  await expect(page.locator("#profile-lists [class*='posters'] img")).toHaveCount(15);
  await expect.poll(() => page.locator("#profile-lists [class*='posters'] img").evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(page.getByRole("button", { name: "Filters" })).toBeVisible();
  const mobile = await page.evaluate(() => {
    const list = document.querySelector<HTMLElement>("#profile-lists");
    const cards = Array.from(document.querySelectorAll<HTMLElement>("#profile-lists [data-profile-list-id]"));
    const nav = document.querySelector<HTMLElement>("nav[aria-label='Profile']");
    const rect = (element: HTMLElement | null) => { if (!element) return null; const b = element.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; };
    return { section: rect(list), cards: cards.map(rect), nav: rect(nav), width: document.documentElement.scrollWidth };
  });
  expect(mobile.width).toBe(393);
  expect(mobile.cards.map(card => [card?.x, card?.y, card?.width, card?.height])).toEqual([[16, 646, 361, 189], [16, 847, 361, 189], [16, 1048, 361, 189]]);
  expect(mobile.nav?.y).toBe(531);
  expect(mobile.cards[0]?.y).toBe(646);
  await expect.poll(() => page.locator("#profile-lists [class*='posters'] img").evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  const filterButton = page.getByRole("button", { name: "Filters" });
  await filterButton.click();
  const filter = page.getByRole("searchbox", { name: "Lists" });
  await filter.fill("Late Night");
  await expect(page.locator("#profile-lists [data-profile-list-id]")).toHaveCount(1);
  await expect(page.locator("#profile-lists [data-profile-list-id]")).toHaveAttribute("data-profile-list-id", "94113");
  await filter.press("Escape");
  await expect(filterButton).toBeFocused();
  await filterButton.click();
  await page.getByRole("searchbox", { name: "Lists" }).fill("");
  await page.getByRole("searchbox", { name: "Lists" }).press("Escape");
  await expect(page.locator("#profile-lists [data-profile-list-id]")).toHaveCount(3);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-own-lists-en-mobile-393.png" });

  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await expect(page.locator("#profile-lists [data-profile-list-id]")).toHaveCount(3);
    await page.screenshot({ path: `../artifacts/visual-audit-20261124/profile/rewind-own-lists-en-responsive-${width}.png` });
  }

  await page.setViewportSize({ width: 393, height: 1666 });
  await page.goto("/uk/profile?view=lists");
  await expect(page.locator("#profile-lists-title")).toHaveText("Списки");
  await expect(page.locator("#profile-lists [data-profile-list-id]")).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-own-lists-uk-mobile-393.png" });

  await page.setViewportSize({ width: 1440, height: 3338 });
  await page.goto("/en/profile?view=lists");
  await expect(page.locator("#profile-lists [data-profile-list-id]")).toHaveCount(3);
  await expect(page.locator("#profile-lists [data-profile-list-body]")).toHaveCount(3);
  await expect(page.locator("#profile-lists [data-profile-list-body]").first()).toBeVisible();
  await expect(page.locator("#profile-lists").getByRole("link", { name: "New list" })).toBeVisible();
  await expect(page.locator("#profile-list-tags-title")).toHaveText("List tags");
  await expect(page.locator("#profile-list-tags-title + div a")).toHaveCount(8);
  const desktop = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>("#profile-lists [data-profile-list-id]"));
    const footer = document.querySelector<HTMLElement>("footer");
    const rect = (element: HTMLElement | null) => { if (!element) return null; const b = element.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; };
    return { cards: cards.map(rect), footer: rect(footer), width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight };
  });
  expect(desktop.width).toBe(1440);
  console.log("OWN_LISTS_FIGMA_GEOMETRY", JSON.stringify({ mobile, desktop }));
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-own-lists-en-desktop-1440.png", fullPage: true });
});
