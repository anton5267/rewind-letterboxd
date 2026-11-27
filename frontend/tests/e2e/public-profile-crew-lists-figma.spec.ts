import { expect, test } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const profileId = 978001;
const emptyPage = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 12 };
const lists = [
  { id: 978101, name: "The 2026 Popcorn List", description: "Introducing the 2026 Popcorn List, an annual survey of acclaimed feature films without US wide release as recommended by festival programmers across the country.\n\nGet more details on The Popcorn List via their Instagram and Substack.", itemCount: 25, likeCount: 54, tags: ["top2025", "cinema"], movieStart: 978200, previews: [{ title: "Been Here Stay Here", image: "popcorn-01.png" }, { title: "Burt", image: "popcorn-02.png" }, { title: "Creede, USA", image: "popcorn-03.png" }, { title: "Crystal Cross", image: "popcorn-04.png" }, { title: "Adult Children", image: "popcorn-05.png" }] },
  { id: 978102, name: "Remembering Rob Reiner", description: "Rob Reiner was always due for a reevaluation. As a director, he created works beloved by audiences for decades, while delivering one of the most memorable runs of classic films out of post-war Hollywood.", itemCount: 10, likeCount: 213, tags: ["top", "drama"], movieStart: 978210, previews: [{ title: "When Harry Met Sally…", image: "reiner-01.png" }, { title: "Misery", image: "reiner-02.png" }, { title: "The Princess Bride", image: "reiner-03.png" }, { title: "Stand by Me", image: "reiner-04.png" }, { title: "A Few Good Men", image: "reiner-05.png" }] },
  { id: 978103, name: "Love Triangles Starter Pack", description: "The only thing more enjoyable than watching a love story play out on screen is seeing a love triangle come to life. All the tension, excitement, anticipation and yearning, with the additional chaos of a third prospect in the mix.", itemCount: 20, likeCount: 154, tags: ["list", "comedy", "christmas", "watchlist", "marvel", "2025", "best", "trends", "pixar", "oscars"], movieStart: 978220, previews: [{ title: "Design for Living", image: "triangles-01.png" }, { title: "The Philadelphia Story", image: "triangles-02.png" }, { title: "Jules and Jim", image: "triangles-03.png" }, { title: "Sunday Bloody Sunday", image: "triangles-04.png" }, { title: "She's Gotta Have It", image: "triangles-05.png" }] },
].map(list => ({
  ...list,
  ownerId: profileId,
  ownerUsername: "rewind",
  previewMovies: list.previews.map(({ title, image }, index) => ({
    id: list.movieStart + index,
    title,
    releaseDate: "2026-01-01",
    rating: null,
    photoUrl: `https://profile-lists-figma.invalid/${image}`,
  })),
}));

test("Rewind HQ mobile Lists tab follows the READY Figma composition", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  const profileFixtureRoot = resolve(process.cwd(), "tests/e2e/fixtures/public-profile-lists-figma");
  await page.route("https://profile-lists-figma.invalid/**", async route => {
    const name = new URL(route.request().url()).pathname.slice(1);
    if (!/^(hero|avatar|popcorn-0[1-5]|reiner-0[1-5]|triangles-0[1-5])\.png$/.test(name)) return route.fulfill({ status: 404 });
    return route.fulfill({ contentType: "image/png", body: await readFile(join(profileFixtureRoot, name)) });
  });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "crew-profile-lists" } });
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname === `/api/users/${profileId}/profile`) return route.fulfill({ json: {
      id: profileId,
      username: "rewind",
      displayName: "Rewind",
      avatarUrl: "https://profile-lists-figma.invalid/avatar.png",
      bannerUrl: "https://profile-lists-figma.invalid/hero.png",
      hq: true,
      location: "Ukraine",
      bio: "The official profile of the team behind the platform.",
      stats: { ratings: 956, reviews: 0, watched: 956, watchlist: 0, favorites: 0 },
      ratingDistribution: [],
      socialLinks: page.viewportSize()?.width === 393 ? [{ platform: "x", url: "https://x.com/rewind" }] : [],
      lists: [],
      recentReviews: [],
    } });
    if (pathname === `/api/users/${profileId}/lists`) {
      return route.fulfill({ json: { content: lists, totalPages: 12, totalElements: 144, number: Number(new URL(route.request().url()).searchParams.get("page") ?? 0), size: 12 } });
    }
    if (pathname === `/api/users/${profileId}/collections/favorites`) return route.fulfill({ json: emptyPage });
    if (pathname === `/api/users/${profileId}/following`) return route.fulfill({ json: { ...emptyPage, totalElements: 8, totalPages: 1, size: 8 } });
    if (pathname === `/api/users/${profileId}/followers`) return route.fulfill({ json: { ...emptyPage, totalElements: 12000, totalPages: 1, size: 8 } });
    if (pathname === `/api/users/${profileId}/activity` || pathname === `/api/users/${profileId}/liked-reviews`) return route.fulfill({ json: emptyPage });
    return route.fulfill({ json: emptyPage });
  });

  await page.setViewportSize({ width: 393, height: 1674 });
  await page.goto(`/en/users/${profileId}?view=lists`);
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  await expect(page.getByRole("heading", { level: 1, name: "Rewind" })).toBeVisible();
  await expect(page.locator("[class*='avatar'] img, img[class*='avatar']").last()).toHaveAttribute("src", "https://profile-lists-figma.invalid/avatar.png");
  await expect(page.locator("[class*='hero']").first()).toHaveCSS("background-image", /profile-lists-figma\.invalid\/hero\.png/);
  await expect(page.getByRole("heading", { level: 2, name: "Lists" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Lists", exact: true }).last()).toHaveAttribute("aria-current", "location");
  await expect(page.locator('[class*="publicListCard"]')).toHaveCount(3);
  await expect(page.locator('[class*="publicListTitle"]').allTextContents()).resolves.toEqual(["The 2026 Popcorn List", "Remembering Rob Reiner", "Love Triangles Starter Pack"]);
  await expect(page.locator('[class*="publicListPageNumbers"]')).toBeHidden();
  await expect(page.getByRole("heading", { level: 3, name: "Lists tags" })).toBeVisible();
  await expect(page.locator('[aria-labelledby="public-profile-list-tags-title"] a').filter({ visible: true })).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Previous" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Next" })).toBeEnabled();

  const near = (actual: number | undefined, expected: number, label: string) => {
    expect(actual, `${label}: measured geometry`).toBeDefined();
    expect(Math.abs(actual! - expected), `${label}: actual ${actual}, expected ${expected}`).toBeLessThan(1.6);
  };
  near((await page.locator('img[class*="avatar"]').boundingBox())?.y, 190, "avatar top");
  near((await page.getByRole("heading", { level: 1, name: "Rewind" }).boundingBox())?.y, 317, "profile title top");
  near((await page.locator('[class*="heroMetrics"]').boundingBox())?.y, 427, "profile metrics top");
  near((await page.locator('nav[class*="profileRail"]').boundingBox())?.y, 531, "profile tabs top");
  near((await page.locator('[class*="publicListCard"]').nth(0).boundingBox())?.y, 646, "first list card top");
  near((await page.locator('[class*="publicListCard"]').nth(1).boundingBox())?.y, 847, "second list card top");
  near((await page.locator('[class*="publicListCard"]').nth(2).boundingBox())?.y, 1048, "third list card top");
  near((await page.locator('[class*="publicListCard"]').nth(0).boundingBox())?.height, 164, "list card height");
  near((await page.getByRole("img", { name: "The 2026 Popcorn List" }).boundingBox())?.y, 684, "first poster rail top");
  near((await page.getByRole("img", { name: "The 2026 Popcorn List" }).boundingBox())?.height, 116, "first poster rail height");
  near((await page.getByRole("button", { name: "Next" }).boundingBox())?.y, 1272, "next page control top");
  near((await page.getByRole("heading", { level: 3, name: "Lists tags" }).boundingBox())?.y, 1347, "list tags heading top");
  const tagsCloud = await page.locator('[class*="profileListTagCloud"]').boundingBox();
  near(tagsCloud ? tagsCloud.y + Number.parseFloat(await page.locator('[class*="profileListTagCloud"]').evaluate(element => getComputedStyle(element, "::before").top)) : undefined, 1339, "list tags divider top");
  near((await page.getByRole("link", { name: "Top2025" }).boundingBox())?.y, 1388, "first tag chip top");
  near((await page.locator('header nav[class*="mobileNav"]').boundingBox())?.y, 1582, "fixed mobile navigation top");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  expect(pageErrors).toEqual([]);

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261127/crew-profile-lists-source-art");
  await mkdir(captureDirectory, { recursive: true });
  await page.screenshot({ path: resolve(captureDirectory, "rewind-hq-en-phone-393x1674.png"), fullPage: false });

  await page.setViewportSize({ width: 1440, height: 3236 });
  await page.goto(`/en/users/${profileId}?view=lists`);
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  await expect(page.getByRole("heading", { level: 1, name: "Rewind" })).toBeVisible();
  await expect(page.locator('[class*="publicListCard"]')).toHaveCount(3);
  await expect(page.locator('[class*="publicListTitle"]').allTextContents()).resolves.toEqual(["The 2026 Popcorn List", "Remembering Rob Reiner", "Love Triangles Starter Pack"]);
  const posterImages = page.locator('[class*="publicListCard"] a[class*="publicListPoster"] img');
  await expect(posterImages).toHaveCount(15);
  await expect.poll(() => posterImages.evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  const loadedPosterFiles = await posterImages.evaluateAll(images => images.map(image => new URL((image as HTMLImageElement).src).pathname.split("/").at(-1)));
  expect(loadedPosterFiles).toEqual([
    "popcorn-01.png", "popcorn-02.png", "popcorn-03.png", "popcorn-04.png", "popcorn-05.png",
    "reiner-01.png", "reiner-02.png", "reiner-03.png", "reiner-04.png", "reiner-05.png",
    "triangles-01.png", "triangles-02.png", "triangles-03.png", "triangles-04.png", "triangles-05.png",
  ]);
  await expect(page.getByRole("button", { name: "Page 1", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("button", { name: "Page 12" })).toBeVisible();
  await expect(page.locator('[aria-labelledby="public-profile-list-tags-title"] a').filter({ visible: true })).toHaveCount(9);
  near((await page.locator('img[class*="avatar"]').boundingBox())?.y, 274, "desktop avatar top");
  near((await page.getByRole("heading", { level: 1, name: "Rewind" }).boundingBox())?.y, 551, "desktop title top");
  near((await page.locator('[class*="heroMetrics"]').boundingBox())?.y, 768, "desktop metrics top");
  near((await page.locator('nav[class*="profileRail"]').boundingBox())?.y, 1105, "desktop profile tabs top");
  near((await page.locator("#public-profile-lists").boundingBox())?.y, 1269, "desktop list divider top");
  near((await page.locator('[class*="publicListCard"]').nth(0).boundingBox())?.y, 1369, "desktop first list card top");
  near((await page.locator('[class*="publicListCard"]').nth(0).boundingBox())?.width, 1200, "desktop list card width");
  near((await page.locator('[class*="publicListCard"]').nth(0).boundingBox())?.height, 339, "desktop list card height");
  near((await page.locator('[class*="publicListCard"]').nth(1).boundingBox())?.y, 1745, "desktop second list card top");
  near((await page.locator('[class*="publicListCard"]').nth(2).boundingBox())?.y, 2121, "desktop third list card top");
  near((await page.locator('[class*="publicListPageNumbers"]').boundingBox())?.y, 2540, "desktop page numbers top");
  near((await page.getByRole("heading", { level: 3, name: "Lists tags" }).boundingBox())?.y, 2680, "desktop tags title top");
  near((await page.getByRole("link", { name: "top2025" }).boundingBox())?.y, 2762, "desktop tag row top");
  near((await page.locator("footer").boundingBox())?.y, 2971, "desktop footer top");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await page.screenshot({ path: resolve(captureDirectory, "rewind-hq-en-desktop-1440x3236.png"), fullPage: false });
  await page.getByRole("button", { name: "More" }).click();
  await expect(page.locator('[aria-labelledby="public-profile-list-tags-title"] a').filter({ visible: true })).toHaveCount(14);
  await page.setViewportSize({ width: 1440, height: 3303 });
  await page.screenshot({ path: resolve(captureDirectory, "rewind-hq-en-desktop-tags-expanded-1440x3303.png"), fullPage: false });
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("heading", { level: 1, name: "Rewind" })).toBeVisible();
    await expect(page.locator('[class*="publicListCard"]')).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `horizontal overflow at ${width}px`).toBeLessThanOrEqual(width);
  }
});
