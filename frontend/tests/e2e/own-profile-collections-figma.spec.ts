import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

const testDir = dirname(fileURLToPath(import.meta.url));

const owner = { id: 94110, username: "emma-cerys", displayName: "Emma Cerys", role: "USER", email: "emma@example.invalid" };
const movies = Array.from({ length: 24 }, (_, index) => ({
  id: 95000 + index, title: `Collection film ${index + 1}`, releaseDate: `202${index % 5}-01-01`, photoUrl: null, rating: index % 4 === 0 ? 4.5 : null,
}));
const likedMovies = movies.map((movie, index) => ({
  ...movie,
  photoUrl: index < 22 ? `https://fixture.invalid/own-likes/poster-${String(index + 1).padStart(2, "0")}.png` : null,
}));
const watchlistMovies = movies.map((movie, index) => ({
  ...movie,
  photoUrl: `https://fixture.invalid/own-watchlist/poster-${String(index + 1).padStart(2, "0")}.png`,
}));
const profile = {
  ...owner, avatarUrl: "https://fixture.invalid/own-likes/profile-avatar.png", bannerUrl: null, bio: "Obsessed with great directing, bold storytelling, and films that stick with you long after the credits roll.", location: "USA",
  stats: { ratings: 212, reviews: 17, watched: 834, watchlist: 32, favorites: 24 }, lists: [{ id: 94111, name: "Watchlist", listType: "WATCHLIST", isPublic: true }], recentRatings: [], recentReviews: [],
};

test("READY own Likes and Watchlist collection frames render at mobile and desktop widths", async ({ context, page }) => {
  let watchlistIsPublic = true;
  let watchlistWasCleared = false;
  let clearRequests = 0;
  await installHostedAuthFixture(context);
  await page.route("https://fixture.invalid/own-likes/**", async route => {
    const file = new URL(route.request().url()).pathname.split("/").at(-1)!;
    const body = await readFile(join(testDir, "fixtures", "own-profile-likes-figma", file));
    return route.fulfill({ status: 200, contentType: "image/png", body });
  });
  await page.route("https://fixture.invalid/own-watchlist/**", async route => {
    const file = new URL(route.request().url()).pathname.split("/").at(-1)!;
    const body = await readFile(join(testDir, "fixtures", "own-profile-watchlist-figma", file));
    return route.fulfill({ status: 200, contentType: "image/png", body });
  });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/users/me") return route.fulfill({ json: owner });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 204 });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/profile/me/social-links") return route.fulfill({ json: [] });
    if (pathname === "/api/users/94110/following") return route.fulfill({ json: { content: [], totalPages: 2, totalElements: 32, number: 0, size: 16 } });
    if (pathname === "/api/users/94110/followers") return route.fulfill({ json: { content: [], totalPages: 18, totalElements: 287, number: 0, size: 16 } });
    if (pathname === "/api/profile/me/favorites") return route.fulfill({ json: { content: likedMovies.slice(0, 22), totalPages: 1, totalElements: 22, number: 0, size: 24 } });
    if (pathname === "/api/profile/me/watchlist" && route.request().method() === "GET") return route.fulfill({ json: { content: watchlistWasCleared ? [] : watchlistMovies, totalPages: watchlistWasCleared ? 0 : 1, totalElements: watchlistWasCleared ? 0 : 24, number: 0, size: 24 } });
    if (pathname === "/api/profile/me/watchlist/visibility" && route.request().method() === "PUT") {
      watchlistIsPublic = route.request().postDataJSON().isPublic;
      return route.fulfill({ json: { isPublic: watchlistIsPublic } });
    }
    if (pathname === "/api/profile/me/watchlist" && route.request().method() === "DELETE") {
      clearRequests += 1;
      watchlistWasCleared = true;
      return route.fulfill({ json: { removed: 24 } });
    }
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 12 } });
  });

  await signInHostedFixture(page, "en");

  for (const kind of ["favorites", "watchlist"] as const) {
    const mobileHeight = kind === "favorites" ? 1666 : 1564;
    await page.setViewportSize({ width: 393, height: mobileHeight });
    await page.goto(`/en/profile?view=collection&collection=${kind}`);
    await expect(page.locator("#profile-collections")).toHaveAttribute("aria-busy", "false");
    const grid = page.locator("#profile-collection-content [class*='collectionGrid']");
    await expect(grid.locator("[class*='collectionPosterLink']")).toHaveCount(kind === "favorites" ? 22 : 24);
    if (kind === "favorites") {
      await expect(grid.locator("[class*='collectionLikeMeta']")).toHaveCount(22);
      const loadedFigmaPosters = await grid.locator("img[class*='collectionPoster']").evaluateAll(images => images.slice(0, 22).every(image => (image as HTMLImageElement).naturalWidth > 0));
      expect(loadedFigmaPosters).toBe(true);
      await page.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-own-favorites-en-mobile-393.png" });
      const filter = page.getByRole("button", { name: "Filters" });
      await expect(filter).toHaveAttribute("aria-expanded", "false");
      await filter.click();
      await expect(page.getByRole("tablist", { name: "My films" })).toBeVisible();
      await filter.press("Escape");
      await expect(filter).toHaveAttribute("aria-expanded", "false");
      await expect(filter).toBeFocused();
      await filter.evaluate(element => element.blur());
      await page.mouse.move(390, 530);
    } else {
      const loadedFigmaPosters = await grid.locator("img[class*='collectionPoster']").evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0));
      expect(loadedFigmaPosters).toBe(true);
      await expect(page.locator("#profile-collections-title")).toHaveText("Wants to See");
    }
    await expect(page.locator("nav[aria-label='Profile'] a[aria-current='location']")).toContainText(kind === "favorites" ? "Likes" : "Watchlist");
    const mobileCards = await grid.locator("[class*='collectionPosterLink']").evaluateAll(elements => elements.slice(0, 5).map(element => {
      const box = element.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height };
    }));
    expect(mobileCards[0].width).toBeCloseTo(79, 0);
    expect(mobileCards[0].height).toBeCloseTo(116, 0);
    expect(mobileCards.slice(0, 4).every(box => Math.abs(box.y - mobileCards[0].y) < 1)).toBe(true);
    expect(mobileCards[4].y).toBeGreaterThan(mobileCards[0].y + mobileCards[0].height);
    const anchors = await page.evaluate(() => {
      const rect = (element: Element | null) => { if (!element) return null; const box = element.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height }; };
      return { hero: rect(document.querySelector("main section[class*='hero']")), avatar: rect(document.querySelector("main img[class*='avatar']")), metrics: rect(document.querySelector("main dl[class*='heroMetrics']")), nav: rect(document.querySelector("main nav[class*='profileNav']")), heading: rect(document.querySelector("#profile-collections-title")), firstPoster: rect(document.querySelector("#profile-collection-content [class*='collectionPosterLink']")) };
    });
    console.log(`OWN_${kind.toUpperCase()}_MOBILE_FIGMA_GEOMETRY`, JSON.stringify(anchors));
    expect(anchors.hero?.height).toBe(496);
    expect(anchors.avatar?.y).toBe(202);
    expect(anchors.nav?.y).toBe(531);
    expect(anchors.heading?.y).toBe(607);
    expect(anchors.firstPoster).toMatchObject({ x: 16, y: 647, width: 79, height: 116 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
    if (kind !== "favorites") await page.screenshot({ path: `../artifacts/visual-audit-20261124/profile/rewind-own-${kind}-en-mobile-393.png` });

    await page.setViewportSize({ width: 1440, height: kind === "favorites" ? 3256 : 3482 });
    await page.goto(`/en/profile?view=collection&collection=${kind}`);
    await expect(page.locator("#profile-collections")).toHaveAttribute("aria-busy", "false");
    await expect(grid.locator("[class*='collectionPosterLink']")).toHaveCount(kind === "favorites" ? 22 : 24);
    const desktop = await page.evaluate(() => {
      const rect = (element: Element | null) => { if (!element) return null; const box = element.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height }; };
      return { first: rect(document.querySelector("#profile-collection-content [class*='collectionPosterLink']")), section: rect(document.querySelector("#profile-collections")), footer: rect(document.querySelector("footer")), width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight };
    });
    expect(desktop.width).toBe(1440);
    expect(desktop.first?.width).toBeGreaterThan(150);
    console.log(`OWN_${kind.toUpperCase()}_FIGMA_GEOMETRY`, JSON.stringify(desktop));
    if (kind === "favorites") await page.screenshot({ path: `../artifacts/visual-audit-20261124/profile/rewind-own-${kind}-en-desktop-1440.png`, fullPage: true });
    if (kind === "watchlist") {
      const actions = page.getByRole("region", { name: "Watchlist actions" });
      await expect(actions.getByRole("heading", { name: "How To Add" })).toBeVisible();
      await expect(actions).toContainText("Add films you want to see to your Watchlist from the plus icon on each film poster, or choose Watchlist in the actions on a film or review page.");
      const actionAnchors = await page.evaluate(() => {
        const rect = (element: Element | null) => { if (!element) return null; const box = element.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height }; };
        return { title: rect(document.querySelector("[aria-label='Watchlist actions'] h2")), firstButton: rect(document.querySelector("[aria-label='Watchlist actions'] button")), footer: rect(document.querySelector("footer")), height: document.documentElement.scrollHeight };
      });
      expect(Math.abs((actionAnchors.title?.y ?? 0) - 2844)).toBeLessThan(2);
      expect(Math.abs((actionAnchors.firstButton?.y ?? 0) - 2978)).toBeLessThan(2);
      expect(actionAnchors.footer?.y).toBe(3217);
      expect(actionAnchors.height).toBe(3482);
      await page.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-own-watchlist-en-desktop-1440.png", fullPage: true });
      const privacyButton = actions.getByRole("button", { name: "Make this list private" });
      await privacyButton.click();
      await expect(actions.getByRole("button", { name: "Make this list public" })).toBeVisible();
      expect(watchlistIsPublic).toBe(false);
      await actions.getByRole("button", { name: "Make this list public" }).click();
      expect(watchlistIsPublic).toBe(true);

      const clearButton = actions.getByRole("button", { name: "Clear watchlist" });
      await clearButton.click();
      const dialog = page.getByRole("alertdialog", { name: "Clear watchlist?" });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "Cancel" }).click();
      await expect(dialog).toBeHidden();
      await expect(clearButton).toBeFocused();
      await expect(grid.locator("[class*='collectionPosterLink']")).toHaveCount(24);
      await clearButton.click();
      await page.getByRole("alertdialog", { name: "Clear watchlist?" }).getByRole("button", { name: "Clear watchlist" }).click();
      await expect(grid.locator("[class*='collectionPosterLink']")).toHaveCount(0);
      await expect(actions.getByRole("status")).toContainText("Watchlist cleared. 24 films removed.");
      expect(clearRequests).toBe(1);
      watchlistWasCleared = false;
    }
  }

  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: width === 320 ? 1666 : 900 });
    for (const kind of ["favorites", "watchlist"] as const) {
      await page.goto(`/en/profile?view=collection&collection=${kind}`);
      await expect(page.locator("#profile-collections")).toHaveAttribute("aria-busy", "false");
      await expect(page.locator("#profile-collection-content [class*='collectionPosterLink']")).toHaveCount(kind === "favorites" ? 22 : 24);
      const overflow = await page.evaluate(viewportWidth => ({
        scrollWidth: document.documentElement.scrollWidth,
        elements: Array.from(document.querySelectorAll("body *")).map(element => {
          const box = element.getBoundingClientRect(); return { tag: element.tagName, className: typeof element.className === "string" ? element.className : "", right: box.right, width: box.width };
        }).filter(element => element.width > 0 && element.right > viewportWidth + 0.5).slice(0, 8),
      }), width);
      expect(overflow.scrollWidth, JSON.stringify(overflow.elements)).toBe(width);
      await page.screenshot({ path: `../artifacts/visual-audit-20261124/profile/rewind-own-${kind}-en-responsive-${width}.png`, fullPage: width >= 768 });
    }
  }

  await page.setViewportSize({ width: 393, height: 1666 });
  await page.goto("/uk/profile?view=collection&collection=favorites");
  await expect(page.locator("#profile-collections")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("nav[aria-label='Профіль'] a[aria-current='location']")).toContainText("Вподобання");
  await expect(page.getByRole("button", { name: "Фільтри" })).toHaveAttribute("aria-expanded", "false");
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-own-favorites-uk-mobile-393.png" });

  await page.setViewportSize({ width: 393, height: 1564 });
  await page.goto("/uk/profile?view=collection&collection=watchlist");
  await expect(page.locator("#profile-collections")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("#profile-collections-title")).toHaveText("До перегляду");
  await expect(page.locator("nav[aria-label='Профіль'] a[aria-current='location']")).toContainText("До перегляду");
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-own-watchlist-uk-mobile-393.png" });
});

test("READY own Films desktop frame matches the 24-poster rated grid", async ({ page }) => {
  const ratings = [4.5, 4, 4.5, 5, 3.5, 4, 4, 4.5, 3.5, 4, 4, 5, 4, 4.5, 3, 4.5, 3.5, 4, 4, 3.5, 4, 2.5, 4, 4.5];
  const watchedMovies = ratings.map((rating, index) => ({
    id: 96000 + index, title: `Watched film ${index + 1}`, releaseDate: `202${index % 5}-01-01`,
    photoUrl: `https://fixture.invalid/own-films/poster-${String(index + 1).padStart(2, "0")}.png`, rating,
  }));
  const filmsProfile = {
    ...profile,
    stats: { ...profile.stats, watched: 212 },
    avatarUrl: "https://fixture.invalid/own-films/avatar.png",
    bannerUrl: "https://fixture.invalid/own-films/banner.png",
  };

  await page.route("https://fixture.invalid/own-films/**", async route => {
    const file = new URL(route.request().url()).pathname.split("/").at(-1)!;
    const body = await readFile(join(testDir, "fixtures", "own-profile-films-figma", file));
    return route.fulfill({ status: 200, contentType: "image/png", body });
  });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/users/me") return route.fulfill({ json: owner });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 204 });
    if (pathname === "/api/profile/me") return route.fulfill({ json: filmsProfile });
    if (pathname === "/api/profile/me/social-links") return route.fulfill({ json: [] });
    if (pathname === "/api/profile/me/watched") return route.fulfill({ json: { content: watchedMovies, totalPages: 8, totalElements: 192, number: 0, size: 24 } });
    if (pathname === "/api/users/94110/following") return route.fulfill({ json: { content: [], totalPages: 2, totalElements: 17, number: 0, size: 16 } });
    if (pathname === "/api/users/94110/followers") return route.fulfill({ json: { content: [], totalPages: 7, totalElements: 98, number: 0, size: 16 } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 12 } });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/profile?view=collection&collection=watched");
  await expect(page.locator("#profile-collections")).toHaveAttribute("aria-busy", "false");
  const grid = page.locator("#profile-collection-content [class*='collectionGrid']");
  const posters = grid.locator("[class*='collectionPosterLink']");
  await expect(posters).toHaveCount(24);
  await expect(grid.locator("[class*='collectionRating']")).toHaveCount(24);
  await expect(grid.locator("h3")).toHaveCount(0);
  await expect(page.locator("#profile-identity")).toHaveText("Emma Cerys");
  await expect(page.getByRole("button", { name: "Edit profile" })).toBeVisible();
  await expect(page.locator("[class*='heroMetrics'] dd").nth(0)).toHaveText("212");
  await expect(page.locator("[class*='heroMetrics'] dd").nth(1)).toHaveText("17");
  await expect(page.locator("[class*='heroMetrics'] dd").nth(2)).toHaveText("98");
  await expect.poll(() => page.locator("img[class*='avatar']").evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  for (let index = 0; index < 24; index++) {
    const poster = posters.nth(index);
    await poster.scrollIntoViewIfNeeded();
    await expect.poll(() => poster.locator("img").evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  await expect(page.locator("#profile-collection-content nav[aria-label]")).toContainText("Older");
  await expect(page.locator("#profile-collection-content nav button")).toHaveCount(5);
  const layout = await page.evaluate(() => {
    const rect = (element: Element | null) => { if (!element) return null; const box = element.getBoundingClientRect(); return { x: box.x, y: box.y + window.scrollY, width: box.width, height: box.height }; };
    return {
      posters: Array.from(document.querySelectorAll("#profile-collection-content [class*='collectionPosterLink']")).map(rect),
      heading: rect(document.querySelector("#profile-collections-title")),
      pagination: rect(document.querySelector("#profile-collection-content nav")),
      footer: rect(document.querySelector("footer")),
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    };
  });
  expect(layout.width).toBe(1440);
  expect(layout.posters[0].x).toBeCloseTo(121, 0);
  expect(layout.posters[0].y).toBeCloseTo(1373, 0);
  expect(layout.posters[0].width).toBeCloseTo(174, 0);
  expect(layout.posters[0].height).toBeCloseTo(260, 0);
  for (let row = 0; row < 4; row++) expect(layout.posters[row * 6].y).toBeCloseTo(1373 + row * 340, 0);
  expect(layout.heading?.y).toBeCloseTo(1287, 0);
  expect(layout.pagination?.y).toBeCloseTo(2796, 0);
  expect(layout.footer?.y).toBeCloseTo(2991, 0);
  expect(layout.height).toBe(3256);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-own-films-en-desktop-1440.png", fullPage: true });
  await page.locator("#profile-collection-content nav button").nth(1).click();
  await expect(page.locator("#profile-collection-content nav button[aria-current='page']")).toHaveText("2");
});
