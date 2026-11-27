import { expect, test, type BrowserContext, type Locator } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

const posterUrl = (filename: string) => `https://home-poster-fixture.invalid/${filename}`;
const newestMovies = ["Marty Supreme", "No Other Choice", "The Housemaid", "Now You See Me: Now You Don't", "Avatar: Fire and Ash", "One Battle After Another"].map((title, index) => ({
  id: 993_000 + index,
  title,
  photoUrl: posterUrl(`newest-0${index + 1}.png`),
  releaseDate: "2026-01-01",
  rating: 4,
}));
const popularMovies = ["The Silence of the Lambs", "Interstellar", "The Housemaid", "Fight Club", "Avatar: Fire and Ash", "Babylon"].map((title, index) => ({
  id: 993_010 + index,
  title,
  photoUrl: posterUrl(`popular-0${index + 1}.png`),
  releaseDate: "2026-01-01",
  rating: 4,
}));

const reviewMovies = [
  { title: "Superman", filename: "review-01.png" },
  { title: "Avatar: Fire and Ash", filename: "review-02.png" },
  { title: "The Hunt", filename: "review-03.png" },
  { title: "Wake Up Dead Man", filename: "review-04.png" },
];
const reviews = reviewMovies.map((movie, index) => ({
  id: 993_100 + index,
  movieId: 993_700 + index,
  movieTitle: movie.title,
  userId: 993_200 + index,
  username: `home-reviewer-${index + 1}`,
  content: "A home page review used for the Figma layout comparison.",
  rating: 4,
  createdAt: "2026-11-20T12:00:00Z",
  moviePhotoUrl: posterUrl(movie.filename),
  userAvatarUrl: null,
}));

const lists = Array.from({ length: 3 }, (_, index) => ({
  id: 993_300 + index,
  name: `Home fixture list ${index + 1}`,
  description: "A fixture list for the home page layout comparison.",
  ownerId: 993_400 + index,
  ownerUsername: `home-curator-${index + 1}`,
  tags: [],
  itemCount: 4,
  likeCount: 0,
  ownerAvatarUrl: posterUrl(`list-avatar-0${index + 1}.png`),
  previewMovies: Array.from({ length: 4 }, (_, posterIndex) => ({
    ...newestMovies[(index + posterIndex) % newestMovies.length],
    photoUrl: posterUrl(`list-0${index + 1}-0${posterIndex + 1}.png`),
  })),
}));

const journalTitles = ["Second Chances", "Funny Papers", "Coming Home"];
const journal = Array.from({ length: 3 }, (_, index) => ({
  id: 993_500 + index,
  slug: `home-fixture-news-${index + 1}`,
  category: "NEWS",
  title: journalTitles[index],
  excerpt: index === 0 ? "Katie Rife picks our January restoration, repertory and re-release highlights." : "A fixture article used for the home page layout comparison.",
  coverUrl: posterUrl(index === 0 ? "latest-news-cover.png" : `recent-0${index + 1}.png`),
  publishedAt: "2026-11-20T12:00:00Z",
}));

async function installHomeFixture(context: BrowserContext) {
  await installHostedAuthFixture(context);
  await context.route("https://home-poster-fixture.invalid/**", async route => {
    const filename = basename(new URL(route.request().url()).pathname);
    const image = await readFile(resolve(process.cwd(), "tests/e2e/fixtures/home-member-ready-figma", filename));
    await route.fulfill({ contentType: "image/png", body: image });
  });
  await context.route(url => new URL(url).pathname.startsWith("/api/"), route => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: 993_600, username: "home-member", role: "USER" } });
    if (pathname === "/api/movies/search") {
      const result = url.searchParams.get("sort") === "rating_desc" ? popularMovies : newestMovies;
      return route.fulfill({ json: { content: result, number: 0, size: 6, totalElements: result.length, totalPages: 1 } });
    }
    if (pathname === "/api/reviews/popular") return route.fulfill({ json: { content: reviews, number: 0, size: 4, totalElements: reviews.length, totalPages: 1 } });
    if (pathname === "/api/lists/public/popular") return route.fulfill({ json: { content: lists, number: 0, size: 3, totalElements: lists.length, totalPages: 1 } });
    if (pathname === "/api/journal/articles") return route.fulfill({ json: { content: journal, number: 0, size: 3, totalElements: journal.length, totalPages: 1 } });
    if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/users/popular-reviewers" || pathname === "/api/tags/popular") return route.fulfill({ json: [] });
    return route.fulfill({ json: { content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 } });
  });
}

async function loadVisibleImageFixtures(images: Locator) {
  await images.evaluateAll(elements => elements.forEach(image => { (image as HTMLImageElement).loading = "eager"; }));
  await expect.poll(() => images.evaluateAll(elements => elements.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
}

test("signed-in Home matches READY Figma composition on desktop and mobile", async ({ context, page }, testInfo) => {
  test.setTimeout(60_000);
  await installHomeFixture(context);
  await signInHostedFixture(page, "en");
  const artifactDir = resolve(process.cwd(), "../artifacts/visual-audit-20261125/home-member");
  mkdirSync(artifactDir, { recursive: true });

  for (const viewport of [{ width: 1440, height: 900 }, { width: 393, height: 852 }] as const) {
    await page.setViewportSize(viewport);
    await page.goto("/en/home");
    await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
    await expect(page.locator("main > section").first()).toBeVisible();
    await expect(page.locator("#home-following-activity")).toHaveCount(0);
    for (const id of ["home-newest", "home-popular", "home-journal", "home-reviews", "home-lists", "home-recent-news"]) {
      await expect(page.locator(`#${id}`), `${id} should be part of the signed-in design`).toBeVisible();
    }
    const artworkRows = [
      { selector: "#home-newest [class*=movieRow] img", prefix: "newest" },
      { selector: "#home-popular [class*=movieRow] img", prefix: "popular" },
    ];
    for (const { selector, prefix } of artworkRows) {
      const posters = page.locator(selector);
      await expect(posters).toHaveCount(6);
      await expect.poll(() => posters.evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
      await expect(posters.evaluateAll(images => images.map(image => new URL((image as HTMLImageElement).src).pathname))).resolves.toEqual(Array.from({ length: 6 }, (_, index) => `/${prefix}-0${index + 1}.png`));
    }
    const articleCover = page.locator("#home-journal img[class*=journalCover]");
    await expect(articleCover).toHaveCount(3);
    await loadVisibleImageFixtures(articleCover);
    await expect(articleCover.first()).toHaveAttribute("src", /latest-news-cover\.png$/);
    const reviewPosters = page.locator("#home-reviews [class*=reviewPoster] img");
    await expect(reviewPosters, "the four review cards should show their Figma poster artwork").toHaveCount(4);
    await loadVisibleImageFixtures(reviewPosters);
    await expect(reviewPosters.evaluateAll(images => images.map(image => new URL((image as HTMLImageElement).src).pathname))).resolves.toEqual(["/review-01.png", "/review-02.png", "/review-03.png", "/review-04.png"]);
    const listPosters = page.locator("#home-lists [class*=listPosterLink] img");
    await expect(listPosters, "the three list collages should show four Figma posters each").toHaveCount(12);
    await loadVisibleImageFixtures(listPosters);
    await expect(listPosters.evaluateAll(images => images.map(image => new URL((image as HTMLImageElement).src).pathname))).resolves.toEqual(Array.from({ length: 3 }, (_, listIndex) => Array.from({ length: 4 }, (_, posterIndex) => `/list-0${listIndex + 1}-0${posterIndex + 1}.png`)).flat());
    const listAvatars = page.locator("#home-lists [class*=listAuthor] img");
    await expect(listAvatars, "each list author should show the available Figma avatar").toHaveCount(3);
    await loadVisibleImageFixtures(listAvatars);
    const recentNewsCovers = page.locator("#home-recent-news [class*=memberRecentNewsCover] img");
    await expect(recentNewsCovers, "all three Recent News cards should show their Figma cover artwork").toHaveCount(3);
    await loadVisibleImageFixtures(recentNewsCovers);
    await expect(recentNewsCovers.evaluateAll(images => images.map(image => new URL((image as HTMLImageElement).src).pathname))).resolves.toEqual(["/latest-news-cover.png", "/recent-02.png", "/recent-03.png"]);
    if (viewport.width === 393) {
      const recentNewsCard = page.locator("#home-recent-news [class*=memberRecentNewsCard]").first();
      await expect(recentNewsCard.locator("h3")).toHaveText("Second Chances");
      await expect(recentNewsCard.locator("p")).toHaveText("Katie Rife picks our January restoration, repertory and re-release highlights.");
      const recentNewsGeometry = await page.locator("#home-recent-news [class*=memberRecentNewsCard]").first().evaluate(card => {
        const cardRect = card.getBoundingClientRect();
        const coverRect = card.querySelector("[class*=memberRecentNewsCover]")!.getBoundingClientRect();
        return { card: cardRect.height, cover: coverRect.height };
      });
      expect(recentNewsGeometry.card).toBeCloseTo(222, 0);
      expect(recentNewsGeometry.cover).toBeCloseTo(129, 0);
    }
    if (viewport.width === 1440) {
      const recentNewsCard = page.locator("#home-recent-news [class*=memberRecentNewsCard]").first();
      const recentNewsGeometry = await recentNewsCard.evaluate(card => {
        const cardRect = card.getBoundingClientRect();
        const coverRect = card.querySelector("[class*=memberRecentNewsCover]")!.getBoundingClientRect();
        const title = card.querySelector("h3")!;
        const excerpt = card.querySelector("p")!;
        return { card: cardRect.height, width: cardRect.width, cover: coverRect.height,
          titleFontSize: getComputedStyle(title).fontSize, excerptFontSize: getComputedStyle(excerpt).fontSize };
      });
      expect(recentNewsGeometry.width).toBeCloseTo(385.643, 0);
      expect(recentNewsGeometry.card).toBeCloseTo(347, 0);
      expect(recentNewsGeometry.cover).toBe(219);
      expect(recentNewsGeometry.titleFontSize).toBe("22px");
      expect(recentNewsGeometry.excerptFontSize).toBe("20px");
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    const bounds = await page.evaluate(() => Object.fromEntries(
      ["main > section:first-child", "#home-newest", "#home-popular", "#home-journal", "#home-reviews", "#home-lists", "#home-recent-news"]
        .map(selector => {
          const element = document.querySelector<HTMLElement>(selector);
          if (!element) return [selector, null];
          const { x, y, width, height } = element.getBoundingClientRect();
          const heading = element.querySelector<HTMLElement>("h2");
          return [selector, { x, y, width, height, headingY: heading?.getBoundingClientRect().y ?? null, display: getComputedStyle(element).display }];
        }),
    ));
    console.log(`SIGNED-IN HOME ${viewport.width}px`, bounds);
    if (viewport.width === 393) {
      console.log("SIGNED-IN HOME MOBILE DOCUMENT HEIGHT", await page.evaluate(() => document.documentElement.scrollHeight));
      const mobilePageMetrics = await page.evaluate(() => {
        const main = document.querySelector("main")!;
        const page = main.getBoundingClientRect();
        const news = document.querySelector("#home-recent-news")!.getBoundingClientRect();
        const footer = document.querySelector("footer")!.getBoundingClientRect();
        const navNode = document.querySelector('nav[class*="mobileNav"]');
        const nav = navNode?.getBoundingClientRect();
        return {
          document: document.documentElement.scrollHeight,
          body: document.body.getBoundingClientRect().height,
          main: { y: page.y, height: page.height, bottom: page.bottom },
          recentNews: { y: news.y, height: news.height, bottom: news.bottom },
          footer: { y: footer.y, height: footer.height, display: getComputedStyle(document.querySelector("footer")!).display },
          bottomNavigation: nav && navNode ? { y: nav.y, height: nav.height, bottom: nav.bottom, position: getComputedStyle(navNode).position } : null,
          bodyPaddingBottom: getComputedStyle(document.body).paddingBottom,
          pagePaddingBottom: getComputedStyle(main).paddingBottom,
        };
      });
      console.log("SIGNED-IN HOME MOBILE PAGE METRICS", mobilePageMetrics);
      expect(Math.abs(mobilePageMetrics.document - 2463)).toBeLessThanOrEqual(8);
      const sourceHeadingY = { "#home-newest": 328, "#home-popular": 527, "#home-journal": 726, "#home-reviews": 969, "#home-lists": 1760, "#home-recent-news": 2074 };
      for (const [selector, y] of Object.entries(sourceHeadingY)) {
        const heading = page.locator(`${selector} h2`).first();
        const box = await heading.boundingBox();
        expect(box?.y, `${selector} heading y should match live Figma`).toBeGreaterThanOrEqual(y - 5);
        expect(box?.y, `${selector} heading y should match live Figma`).toBeLessThanOrEqual(y + 5);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    await page.screenshot({ path: resolve(artifactDir, `home-member-en-${viewport.width}.png`), fullPage: true });
  }
  for (const language of ["en", "uk"] as const) {
    await signInHostedFixture(page, language);
    for (const width of [320, 393, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width < 768 ? 852 : 900 });
      await page.goto(`/${language}/home`);
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
      for (const id of ["home-newest", "home-popular", "home-journal", "home-reviews", "home-lists", "home-recent-news"]) {
        await expect(page.locator(`#${id}`), `${language} ${width}px: ${id} should be visible`).toBeVisible();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), `${language} ${width}px should not overflow horizontally`).toBeLessThanOrEqual(0);
      if (language === "en" && width === 768) await page.screenshot({ path: resolve(artifactDir, "home-member-en-768-responsive.png"), fullPage: true });
    }
  }
  await testInfo.attach("figma-nodes-reviewed", { body: "READY member Home: desktop 473:492; mobile 1327:3210", contentType: "text/plain" });
});
