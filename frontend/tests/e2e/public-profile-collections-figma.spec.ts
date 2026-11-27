import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const profileId = 981234;
const movies = Array.from({ length: 24 }, (_, index) => ({
  id: 982500 + index,
  title: `Figma collection film ${index + 1}`,
  releaseDate: "2024-01-01",
  photoUrl: null,
  rating: null,
}));
const watchedMovies = (variant: "mobile" | "desktop") => movies.map((movie, index) => ({
  ...movie,
  rating: 4.5,
  photoUrl: `https://fixture.invalid/public-films/${String(index + 1).padStart(2, "0")}.jpeg?variant=${variant}`,
}));
const collectionMoviesWithPosters = (collection: "likes" | "watchlist", variant: "mobile" | "desktop" = "mobile") => movies.map((movie, index) => ({
  ...movie,
  rating: collection === "likes" ? 4.5 : null,
  photoUrl: `https://fixture.invalid/public-${collection}/${String(index + 1).padStart(2, "0")}.jpeg?variant=${variant}`,
}));
const emptyPage = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 12 };

test("READY public Films, Likes and Watchlist collection frames render their Figma posters", async ({ page }) => {
  await page.route("https://fixture.invalid/public-**/**", async route => {
    const url = new URL(route.request().url());
    const file = url.pathname.split("/").at(-1)!;
    const collection = url.pathname.split("/")[1].replace("public-", "");
    const base = collection === "films" ? "public-profile-films-figma" : `public-profile-${collection}-figma`;
    const folder = url.searchParams.get("variant") === "desktop" ? "desktop" : null;
    const body = await readFile(join(testDir, "fixtures", base, ...(folder ? [folder] : []), file));
    return route.fulfill({ status: 200, contentType: "image/jpeg", body });
  });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === `/api/users/${profileId}/profile`) return route.fulfill({ json: {
      id: profileId, username: "jeremy-b", displayName: "Jeremy B.", avatarUrl: null, hq: false,
      location: "Germany", bio: "I watch movies and overthink them.",
      stats: { ratings: 834, reviews: 32, watched: 834, watchlist: 32, favorites: 24 },
      ratingDistribution: [], socialLinks: [], lists: [], recentReviews: [],
    } });
    if (pathname === `/api/users/${profileId}/collections/watched` || pathname === `/api/users/${profileId}/collections/favorites` || pathname === `/api/users/${profileId}/collections/watchlist`) {
      const variant = (page.viewportSize()?.width ?? 0) >= 768 ? "desktop" : "mobile";
      const collectionMovies = pathname.endsWith("/watched") ? watchedMovies(variant) : pathname.endsWith("/favorites") ? collectionMoviesWithPosters("likes", variant) : collectionMoviesWithPosters("watchlist", variant);
      return route.fulfill({ json: { content: collectionMovies, totalPages: 2, totalElements: movies.length, number: 0, size: 24 } });
    }
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: emptyPage });
  });

  for (const [kind, heading, artifact] of [
    ["watched", "Films", "films"],
    ["favorites", "Likes", "likes"],
    ["watchlist", "Watchlist", "watchlist"],
  ] as const) {
    await page.setViewportSize({ width: 393, height: kind === "watchlist" ? 1060 : 1162 });
    await page.goto(`/en/users/${profileId}?view=collection&collection=${kind}`);
    await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    const grid = page.locator("#public-profile-collection-content [class*='collectionGrid']");
    await expect(grid.locator("[class*='collectionPosterLink']")).toHaveCount(24);
    await expect.poll(() => grid.locator("img[class*='collectionPoster']").evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    if (kind === "watched") {
      await expect(grid.locator("[class*='collectionRating']")).toHaveCount(24);
      await expect(grid.locator("[class*='collectionRating']").first()).toHaveAttribute("aria-label", "Figma collection film 1: Rating: 4.5 / 5");
    } else if (kind === "favorites") {
      await expect(grid.locator("[class*='collectionRating']")).toHaveCount(24);
      await expect(grid.locator("[class*='collectionRating']").first()).toHaveAttribute("aria-label", "Figma collection film 1: Rating: 4.5 / 5");
    }
    await expect(page.locator("main[data-profile-view='collection'] [class*='pagination']")).toBeHidden();
    await expect(page.locator("footer")).toBeHidden();
    const boxes = await grid.locator("[class*='collectionPosterLink']").evaluateAll(elements => elements.slice(0, 5).map(element => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }));
    expect(boxes[0].width).toBeCloseTo(79, 0);
    expect(boxes[0].height).toBeCloseTo(116, 0);
    expect(boxes.slice(0, 4).every(box => Math.abs(box.y - boxes[0].y) < 1)).toBe(true);
    expect(boxes[4].y).toBeGreaterThan(boxes[0].y + boxes[0].height);
    if (kind === "watched") expect(boxes[4].y - boxes[0].y).toBeCloseTo(136, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
    await page.screenshot({ path: `../artifacts/visual-audit-20261124/profile/rewind-public-${artifact}-en-mobile-393.png` });

    for (const width of [320, 393, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${heading} overflow at ${width}px`).toBeLessThanOrEqual(width);
      if (width === 1440) {
        {
          await page.goto(`/en/users/${profileId}?view=collection&collection=${kind}`);
          await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
          await expect(grid.locator("[class*='collectionPosterLink']")).toHaveCount(24);
          await grid.locator("[class*='collectionPosterLink']").last().scrollIntoViewIfNeeded();
          await expect.poll(() => grid.locator("img[class*='collectionPoster']").evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
          await page.evaluate(() => window.scrollTo(0, 0));
        }
        const geometry = await page.evaluate(() => {
          const rect = (selector: string) => { const item = document.querySelector(selector); if (!item) return null; const box = item.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height }; };
          const hero = "main section[aria-labelledby='public-profile-title']";
          const heroElement = document.querySelector(hero);
          return { footerY: rect("footer")?.y, pageHeight: document.documentElement.scrollHeight, hero: rect(hero), rail: rect("main nav[aria-label='Profile']"), section: rect("#public-profile-collections"), heading: rect("#public-profile-collections-title"), grid: rect("#public-profile-collection-content [class*='collectionGrid']"), poster: rect("#public-profile-collection-content [class*='collectionPosterLink']"), rating: rect("#public-profile-collection-content [class*='collectionRating']") };
        });
        expect(geometry.hero?.height).toBe(1020);
        expect(geometry.rail?.y).toBe(1105);
        expect(geometry.heading?.y).toBe(1287);
        expect(geometry.grid?.y).toBeCloseTo(1373, 0);
        await page.screenshot({ path: `../artifacts/visual-audit-20261124/profile/rewind-public-${artifact}-en-desktop-1440.png`, fullPage: true });
        if (kind === "watched" || kind === "favorites") {
          expect(geometry.pageHeight).toBe(3256);
          expect(geometry.footerY).toBeCloseTo(2991, 0);
          expect(Math.abs((geometry.section?.y ?? 0) + (geometry.section?.height ?? 0) - 2763)).toBeLessThan(2);
          expect(Math.abs((geometry.poster?.x ?? 0) - 121)).toBeLessThan(1.5);
          expect(Math.abs((geometry.poster?.y ?? 0) - 1373)).toBeLessThan(1);
          expect(geometry.poster?.width).toBeCloseTo(174, 0);
          expect(geometry.poster?.height).toBeCloseTo(260, 0);
          expect(Math.abs((geometry.rating?.x ?? 0) - 124)).toBeLessThan(1.5);
          expect(geometry.rating?.y).toBeCloseTo(1639, 0);
          expect(geometry.rating?.height).toBe(18);
        }
        if (kind === "watchlist") {
          expect(geometry.pageHeight, JSON.stringify(geometry)).toBe(3120);
          expect(Math.abs((geometry.footerY ?? 0) - 2855)).toBeLessThan(2);
          expect(Math.abs((geometry.poster?.x ?? 0) - 121)).toBeLessThan(1.5);
          expect(Math.abs((geometry.poster?.y ?? 0) - 1373)).toBeLessThan(1);
          expect(geometry.poster?.width).toBeCloseTo(174, 0);
          expect(geometry.poster?.height).toBeCloseTo(260, 0);
        }
        if (kind !== "watched") await page.screenshot({ path: `../artifacts/visual-audit-20261124/profile/rewind-public-${artifact}-en-desktop-1440.png`, fullPage: true });
      }
    }
  }
});

test("READY mobile public profile Likes can show the two Figma liked-list cards", async ({ page }) => {
  await page.route("https://fixture.invalid/likedlists/**", async route => {
    const file = new URL(route.request().url()).pathname.split("/").at(-1)!;
    const body = await readFile(join(testDir, "fixtures", "public-profile-likes-figma", file));
    return route.fulfill({ status: 200, contentType: "image/jpeg", body });
  });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === `/api/users/${profileId}/profile`) return route.fulfill({ json: {
      id: profileId, username: "jeremy-b", displayName: "Jeremy B.", avatarUrl: null, hq: false,
      location: "Germany", bio: "I watch movies and overthink them.",
      stats: { ratings: 834, reviews: 32, watched: 834, watchlist: 32, favorites: 24 },
      ratingDistribution: [], socialLinks: [], lists: [], recentReviews: [],
    } });
    if (pathname === `/api/users/${profileId}/collections/liked-lists`) return route.fulfill({ json: {
      content: ["Christopher Nolan Best Films", "Popular Films"].map((name, listIndex) => ({
        id: 701 + listIndex, name, description: null, ownerId: profileId, ownerUsername: "jeremy-b", tags: [], itemCount: listIndex ? 34 : 12,
        previewMovies: Array.from({ length: 5 }, (_, index) => ({ id: 710 + listIndex * 5 + index, title: `Poster ${index + 1}`,
          releaseDate: null, rating: null, photoUrl: `https://fixture.invalid/likedlists/${String(index + 1).padStart(2, "0")}.jpeg` })),
      })), totalPages: 1, totalElements: 2, number: 0, size: 12,
    } });
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: emptyPage });
  });

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto(`/en/users/${profileId}?view=collection&collection=favorites`);
  await page.getByRole("button", { name: "Filters" }).click();
  await page.getByRole("tab", { name: "Lists" }).click();
  await expect(page).toHaveURL(/collection=liked-lists/);
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  await expect(page.getByRole("heading", { level: 1, name: "Likes" })).toBeVisible();
  const cards = page.locator("#public-profile-collection-content [class*='publicListCard']");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0).getByRole("heading", { name: "Christopher Nolan Best Films" })).toBeVisible();
  await expect(cards.nth(1).getByRole("heading", { name: "Popular Films" })).toBeVisible();
  await expect.poll(() => cards.locator("img").evaluateAll(images => images.length === 10 && images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  const boxes = await cards.evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }));
  expect(boxes[0].width).toBeCloseTo(361, 0);
  expect(boxes[0].height).toBeCloseTo(189, 0);
  expect(boxes[1].y - boxes[0].y).toBeCloseTo(214, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-public-liked-lists-en-mobile-393.png" });
  for (const width of [320, 393, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `Liked lists overflow at ${width}px`).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto(`/uk/users/${profileId}?view=collection&collection=favorites`);
  await page.getByRole("button", { name: "Фільтри" }).click();
  await page.getByRole("tab", { name: "Списки" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Вподобання" })).toBeVisible();
  await expect(page.locator("#public-profile-collection-content [class*='publicListCard']")).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
});
