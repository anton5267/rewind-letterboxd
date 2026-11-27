import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const profileId = 978619;
const fixtureDir = resolve(import.meta.dirname, "fixtures/public-profile-lists-figma");
const assetUrl = (name: string) => `https://profile-lists-figma.invalid/${name}`;
const tags = ["nolan", "director", "scifi", "thriller", "list", "time", "topfilms", "popular", "classics", "mustwatch", "rewatch", "movies"];
const movie = (id: number, title: string, poster: string) => ({
  id, title, releaseDate: "2024-01-01", photoUrl: assetUrl(poster), rating: null,
});
const lists = [
  {
    id: 978620, name: "Christopher Nolan Best Films", itemCount: 12, likeCount: null,
    description: "A collection of Christopher Nolan’s mind-bending, time-twisting, reality-shifting films from grounded psychological thrillers to epic cosmic blockbusters. Stories that challenge perception, reward rewatching, and redefine modern cinema.",
    tags: tags.slice(0, 6), previewMovies: [
      movie(978630, "Oppenheimer", "nolan-01.png"), movie(978631, "Oppenheimer", "nolan-02.png"), movie(978632, "Oppenheimer", "nolan-03.png"), movie(978633, "Oppenheimer", "nolan-04.png"),
    ],
  },
  {
    id: 978621, name: "Popular Films", itemCount: 34, likeCount: null,
    description: "A curated collection of the most popular and universally loved films the ones that defined generations, shaped pop culture, and continue to attract new fans year after year. From timeless classics to modern blockbusters, these are the movies everyone has seen, debated, quoted, and revisited countless times.",
    tags: tags.slice(6, 12), previewMovies: [
      movie(978640, "Top Gun: Maverick", "popular-01.png"), movie(978641, "Barbie", "popular-02.png"), movie(978642, "Seven", "popular-03.png"), movie(978643, "Dune", "popular-04.png"),
    ],
  },
].map(list => ({ ...list, ownerId: profileId, ownerUsername: "simchuk" }));
const emptyPage = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 12 };

test("READY Jeremy B. public Lists desktop frame follows the Figma design", async ({ page }) => {
  await page.route("https://profile-lists-figma.invalid/**", async route => {
    const name = new URL(route.request().url()).pathname.slice(1);
    const allowed = /^(hero|avatar|nolan-0[1-4]|popular-0[1-4])\.png$/;
    if (!allowed.test(name)) return route.fulfill({ status: 404 });
    const nolanSources: Record<string, string> = { "nolan-01.png": "poster-10.png", "nolan-02.png": "poster-12.png", "nolan-03.png": "poster-16.png", "nolan-04.png": "poster-14.png" };
    const source = name === "avatar.png" ? resolve(import.meta.dirname, "fixtures/public-profile-overview-figma/profile-avatar.png")
      : nolanSources[name] ? resolve(import.meta.dirname, "fixtures/public-profile-overview-figma", nolanSources[name])
      : name === "popular-04.png" ? resolve(import.meta.dirname, "fixtures/movie-dune-figma/poster.png")
      : resolve(fixtureDir, "reiner-01.png");
    return route.fulfill({ contentType: "image/png", body: await readFile(source) });
  });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === `/api/users/${profileId}/profile`) return route.fulfill({ json: {
      id: profileId, username: "simchuk", displayName: "Jeremy B.", avatarUrl: assetUrl("avatar.png"), bannerUrl: assetUrl("hero.png"), hq: false,
      location: "", bio: "I watch movies and overthink them. Probably more than I should.",
      stats: { ratings: 834, reviews: 0, watched: 834, watchlist: 0, favorites: 0 },
      ratingDistribution: [], socialLinks: [], lists: [], recentReviews: [],
    } });
    if (pathname === `/api/users/${profileId}/lists`) return route.fulfill({ json: { content: lists, totalPages: 1, totalElements: 2, number: 0, size: 12 } });
    if (pathname === `/api/users/${profileId}/following`) return route.fulfill({ json: { ...emptyPage, totalElements: 32 } });
    if (pathname === `/api/users/${profileId}/followers`) return route.fulfill({ json: { ...emptyPage, totalElements: 287 } });
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: emptyPage });
  });

  await page.setViewportSize({ width: 1440, height: 2805 });
  await page.goto(`/en/users/${profileId}?view=lists`);
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  const cards = page.locator("#public-profile-lists [class*='publicListCard']");
  await expect(cards).toHaveCount(2);
  await expect(page.locator("#public-profile-title")).toHaveText("Jeremy B.");
  await expect(page.locator("main section[aria-labelledby='public-profile-title'] dl div").nth(0).locator("dd")).toHaveText("834");
  await expect(page.locator("main section[aria-labelledby='public-profile-title'] dl div").nth(1).locator("dd")).toHaveText("32");
  await expect(page.locator("main section[aria-labelledby='public-profile-title'] dl div").nth(2).locator("dd")).toHaveText("287");
  for (const [index, title] of ["Christopher Nolan Best Films", "Popular Films"].entries()) {
    await expect(page.locator("#public-profile-lists [class*='publicListTitle']").nth(index)).toHaveText(title);
    await expect(cards.nth(index).locator("[class*='publicListCount']")).toBeVisible();
    await expect(cards.nth(index).locator("[class*='publicListCount']")).toContainText(["12 films", "34 films"][index]);
  }
  const posters = page.locator("#public-profile-lists a[class*='publicListPoster'] img");
  await expect(posters).toHaveCount(8);
  await expect.poll(() => posters.evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(page.locator("#public-profile-lists img[src='/images/profile-likes-heart.svg']")).toHaveCount(0);
  await expect(page.locator("main section[aria-labelledby='public-profile-title']")).toHaveCSS("background-image", /profile-lists-figma\.invalid\/hero\.png/);
  await expect(page.locator("main section[aria-labelledby='public-profile-title'] img[class*='avatar']")).toHaveAttribute("src", assetUrl("avatar.png"));
  await expect(page.locator("#public-profile-list-tags-title")).toHaveText("Lists tags");
  await expect(page.locator("#public-profile-list-tags a")).toHaveCount(12);
  await expect(page.locator("#public-profile-list-tags a").allTextContents()).resolves.toEqual(tags);
  await expect(page.locator("#public-profile-lists nav[aria-label]")).toHaveCount(0);

  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => { const element = document.querySelector<HTMLElement>(selector); if (!element) return null; const box = element.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height }; };
    return { hero: rect("main section[aria-labelledby='public-profile-title']"), rail: rect("main nav[aria-label='Profile']"), listSection: rect("#public-profile-lists"), firstCard: rect("#public-profile-lists [class*='publicListCard']"), secondCard: rect("#public-profile-lists [class*='publicListCard']:nth-child(2)"), tags: rect("#public-profile-lists [class*='profileListTagCloud']"), footer: rect("footer"), width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight };
  });
  console.log("PUBLIC_LISTS_FIGMA_GEOMETRY", JSON.stringify(geometry));
  expect(geometry.width).toBe(1440);
  expect(geometry.height).toBe(2805);
  expect(geometry.hero?.height).toBeCloseTo(1020, 0);
  expect(geometry.rail?.y).toBeCloseTo(1105, 0);
  expect(geometry.listSection?.y).toBeCloseTo(1269, 0);
  expect(geometry.firstCard?.y).toBeCloseTo(1369, 0);
  expect(geometry.secondCard?.y).toBeCloseTo(1745, 0);
  expect(geometry.footer?.y).toBeCloseTo(2540, 0);
  await page.screenshot({ path: "../artifacts/visual-audit-20261126/public-profile-lists/local-public-lists-en-desktop-1440x2805.png", fullPage: true });

  for (const locale of ["en", "uk"]) {
    for (const width of [320, 393, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width < 600 ? 852 : 900 });
      await page.goto(`/${locale}/users/${profileId}?view=lists`);
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
      await expect(cards).toHaveCount(2);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      if (width === 393) {
        await page.screenshot({ path: `../artifacts/visual-audit-20261126/public-profile-lists/local-public-lists-${locale}-mobile-393.png`, fullPage: true });
      }
    }
  }
});
