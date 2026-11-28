import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

test("guest home hero matches the Figma headline and call to action", async ({ page }) => {
  const assetUrl = (filename: string) => `https://home-guest-fixture.invalid/${filename}`;
  const films = [
    { title: "Marty Supreme", poster: "guest-release-01-marty.png" },
    { title: "No Other Choice", poster: "guest-release-04-no-other-choice.png" },
    { title: "The Housemaid", poster: "guest-release-02-housemaid.png" },
    { title: "28 Years Later", poster: "guest-release-04-28-years-later.png" },
    { title: "Avatar: Fire and Ash", poster: "guest-release-03-avatar-fire-ash.png" },
    { title: "Mickey 17", poster: "guest-release-06-mickey-17.png" },
  ].map(({ title, poster }, index) => ({ id: index + 1, title, photoUrl: assetUrl(poster), releaseDate: `2026-01-0${index + 1}`, rating: 4.2 }));
  const mobileFilms = [films[0], films[2], films[4], films[1]];
  const sourceRecentFilms = [
    { title: "Requiem for a Dream", poster: "guest-recent-01-requiem.jpeg" },
    { title: "The Silence of the Lambs", poster: "popular-01.png" },
    { title: "Babylon", poster: "popular-06.png" },
    { title: "Dune", poster: "guest-recent-04-dune.jpeg" },
  ];
  const reviews = Array.from({ length: 10 }, (_, index) => ({ id: index + 1, movieId: index + 1, movieTitle: sourceRecentFilms[index]?.title ?? films[index % films.length].title, userId: index + 20, username: `reviewer-${index + 1}`, content: "A local fixture review for the Figma layout check.", rating: 4.5, createdAt: "2025-12-10T12:00:00Z", moviePhotoUrl: assetUrl(sourceRecentFilms[index]?.poster ?? `newest-0${index % films.length + 1}.png`), userAvatarUrl: null }));
  const popularReviews = ["Superman", "Avatar: Fire and Ash", "The Hunt", "Wake Up Dead Man"].map((movieTitle, index) => ({ ...reviews[index], id: 101 + index, movieTitle, moviePhotoUrl: assetUrl(`review-0${index + 1}.png`), rating: [4, 4.9, 4, 4][index], content: [
    "This version of Superman is more human than mythic. He doubts, listens, and reacts to the consequences of his presence rather than blindly embracing the symbol he represents. The film leans into emotional restraint, allowing quiet moments to carry as much weight as the action set pieces — which, when they arrive, are clean, purposeful, and never empty noise.",
    "James Cameron is in no hurry. This guy has been working on Avatar in some shape or form since at least 1994, and the two Avatar sequels for the last 16 years. Avatar: Fire and Ash’s 197-minute runtime is like a drop in the ocean where Payakan (The Mighty Tulkun) roams. If spending three hours and 15 minutes in a theater intimidates you, stay home and look at social media on your phone.",
    "Look, I KNEW what this film was about, I knew this was going to be difficult to watch, but nothing could have prepared me for the amount of frustration, anxiety, and just plain sadness I felt watching The Hunt. Mikkelsen's performance is particularly powerful and heartbreaking, even though everyone in this film is great. But yea, I'm pretty much emotionally exhausted now.",
    "Wake Up Dead Man leans into a darker, more somber tone than previous Knives Out films, trading playful chaos for quiet tension. The mystery unfolds patiently, letting atmosphere and character suspicion do the heavy lifting. Benoit Blanc feels more restrained here, which suits the film’s mood and moral weight. It’s less flashy, more introspective — and while not as immediately fun.",
  ][index] }));
  Object.assign(popularReviews[0], {
    username: "Cine Mendset",
    userAvatarUrl: null,
    createdAt: "2025-12-10T12:00:00Z",
  });
  const mobilePopularReviews = popularReviews.map(review => ({ ...review }));
  mobilePopularReviews[0] = { ...mobilePopularReviews[0], movieTitle: "The Superman", content: "This version of Superman is more human than mythic. He doubts, listens, and reacts to the consequences of his presence rather than blindly embracing the symbol he represents. The film leans into emotional..." };
  const lists = ["Most Fans on Rewind", "Movies everyone should watch", "The Criterion Challenge 2026"].map((name, index) => ({ id: 201 + index, name, description: `A featured collection of films.`, ownerId: 301 + index, ownerUsername: ["CinemaPro", "NoirFrame", "FilmOracle"][index], ownerAvatarUrl: assetUrl(index === 0 ? "guest-list-author.png" : `list-avatar-0${index + 1}.png`), tags: [], likeCount: 18_000, itemCount: 4, previewMovies: films.slice(0, 4).map((film, posterIndex) => ({ ...film, photoUrl: index === 0 ? assetUrl(`card-02-0${posterIndex + 1}.png`) : assetUrl(`list-0${index + 1}-0${posterIndex + 1}.png`) })) }));
  const desktopLists = lists.map(list => ({ ...list }));
  const desktopListMovie = (id: number, title: string, poster: string) => ({
    id, title, photoUrl: assetUrl(poster), releaseDate: null, rating: null,
  });
  desktopLists[0] = {
    ...desktopLists[0],
    name: "Classic movies for beginners",
    ownerUsername: "ReelWatcher",
    ownerAvatarUrl: assetUrl("guest-desktop-list-avatar-01.png"),
    itemCount: 119,
    likeCount: 18_000,
    previewMovies: [
      desktopListMovie(801, "The Wizard of Oz", "guest-desktop-list-01-asset-02.jpeg"),
      desktopListMovie(802, "Mary Poppins", "guest-desktop-list-01-asset-08.jpeg"),
      desktopListMovie(803, "It's a Wonderful Life", "guest-desktop-list-01-asset-05.jpeg"),
      desktopListMovie(804, "Casablanca", "guest-desktop-list-01-asset-07.jpeg"),
      desktopListMovie(805, "Roman Holiday", "guest-desktop-list-01-asset-09.jpeg"),
    ],
  };
  desktopLists[1] = {
    ...desktopLists[1],
    name: "Movies everyone should watch",
    ownerUsername: "NoirFrame",
    ownerAvatarUrl: assetUrl("guest-desktop-list-avatar-02.png"),
    itemCount: 800,
    likeCount: 326_000,
    previewMovies: [
      desktopListMovie(811, "2001: A Space Odyssey", "guest-desktop-list-02-asset-10.jpeg"),
      desktopListMovie(812, "Schindler's List", "guest-desktop-list-02-asset-09.jpeg"),
      desktopListMovie(813, "Goodfellas", "guest-desktop-list-02-asset-05.jpeg"),
      desktopListMovie(814, "Back to the Future", "guest-desktop-list-02-asset-06.jpeg"),
      desktopListMovie(815, "Lawrence of Arabia", "guest-desktop-list-02-asset-02.jpeg"),
    ],
  };
  desktopLists[2] = {
    ...desktopLists[2],
    itemCount: 52,
    likeCount: 2_000,
    ownerAvatarUrl: assetUrl("guest-desktop-list-avatar-03.png"),
    previewMovies: [
      desktopListMovie(821, "The Virgin Spring", "guest-desktop-list-03-asset-10.jpeg"),
      desktopListMovie(822, "Clean, Shaven", "guest-desktop-list-03-asset-05.jpeg"),
      desktopListMovie(823, "Blue Is the Warmest Color", "guest-desktop-list-03-asset-03.jpeg"),
      desktopListMovie(824, "Flow", "guest-desktop-list-03-asset-08.jpeg"),
      desktopListMovie(825, "Holiday", "guest-desktop-list-03-asset-09.jpeg"),
    ],
  };
  const reviewers = [
    { username: "Karsten", watchedCount: 1380, reviewCount: 1621, avatar: "guest-reviewer-karsten.png" },
    { username: "jamesbryant", watchedCount: 2343, reviewCount: 1120, avatar: "guest-reviewer-jamesbryant.png" },
    { username: "zoe fujii", watchedCount: 5323, reviewCount: 2545, avatar: "guest-reviewer-zoe-fujii.png" },
  ].map(({ avatar, ...reviewer }, index) => ({ id: 401 + index, ...reviewer, displayName: reviewer.username, avatarUrl: assetUrl(avatar), likes: 0 }));
  const articles = [
    { title: "Second Chances", excerpt: "Katie Rife picks our January restoration, repertory and re-release highlights." },
    { title: "Funny Papers", excerpt: "Park Chan-wook on how Looney Tunes influenced the cartoonish of No Other Choice." },
    { title: "Coming Home", excerpt: "athe independent theaters keeping The Rocky Horror Picture Show alive, 50 years on." },
  ].map(({ title, excerpt }, index) => ({ id: 501 + index, slug: `fixture-news-${index + 1}`, language: "en", category: "NEWS", title, excerpt, content: "Fixture article.", coverUrl: assetUrl(index === 0 ? "latest-news-cover.png" : `recent-0${index + 1}.png`), audioUrl: null, publishedAt: "2025-12-10T12:00:00Z" }));
  await page.route("https://home-guest-fixture.invalid/**", async route => {
    const filename = basename(new URL(route.request().url()).pathname);
    const fixtureRoot = filename.startsWith("reviewer-")
      ? "popular-reviewers-mobile-figma"
      : filename.startsWith("card-02-")
        ? "featured-lists-source"
      : filename.startsWith("guest-")
          ? "home-guest-source"
        : "home-member-ready-figma";
    const body = await readFile(resolve(process.cwd(), "tests/e2e/fixtures", fixtureRoot, filename));
    return route.fulfill({ contentType: filename.endsWith(".jpeg") ? "image/jpeg" : "image/png", body });
  });
  await page.route(url => new URL(url).pathname.startsWith("/api/"), route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/users/me" || path === "/api/auth/refresh") return route.fulfill({ status: 401, json: { message: "Unauthenticated" } });
    if (path === "/api/auth/csrf") return route.fulfill({ json: { token: "guest-home-figma" } });
    if (path === "/api/movies/search") {
      const movies = page.viewportSize()?.width && page.viewportSize()!.width < 768 ? mobileFilms : films;
      return route.fulfill({ json: { content: movies, totalElements: movies.length, totalPages: 1, number: 0, size: 6 } });
    }
    if (path === "/api/reviews/recent") return route.fulfill({ json: { content: reviews, totalElements: reviews.length, totalPages: 1, number: 0, size: 10 } });
    if (path === "/api/reviews/popular") {
      const content = page.viewportSize()?.width && page.viewportSize()!.width < 768 ? mobilePopularReviews : popularReviews;
      return route.fulfill({ json: { content, totalElements: content.length, totalPages: 1, number: 0, size: 4 } });
    }
    if (path === "/api/lists/public/popular") {
      const content = page.viewportSize()?.width && page.viewportSize()!.width < 768 ? lists : desktopLists;
      return route.fulfill({ json: { content, totalElements: content.length, totalPages: 1, number: 0, size: 3 } });
    }
    if (path === "/api/users/popular-reviewers") return route.fulfill({ json: reviewers });
    if (path === "/api/tags/popular") return route.fulfill({ json: [] });
    if (path === "/api/stats/watched-films") return route.fulfill({ json: { count: 3_219_674_063 } });
    if (path === "/api/journal/articles") return route.fulfill({ json: { content: articles, totalElements: articles.length, totalPages: 1, number: 0, size: 20 } });
    if (path === "/api/activity/recent-watched") return route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 } });
    return route.fulfill({ json: {} });
  });
  await page.setViewportSize({ width: 1440, height: 4934 });
  await page.goto("en/home");

  const hero = page.locator('main > [class*="hero"]');
  const heading = hero.locator("h1");
  const startLink = hero.getByRole("link", { name: "Get Started", exact: true });

  await expect(heading).toBeVisible();

  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("#home-retry-summary")).toHaveCount(0);
  await expect.poll(() => hero.evaluate(element => getComputedStyle(element, "::before").backgroundImage)).toMatch(/home-hero-guest\.jpg/);
  const heroArt = await page.request.get("/images/home-hero-guest.jpg");
  expect(heroArt.ok()).toBe(true);
  const box = async (selector: string) => page.locator(selector).first().boundingBox();
  expect(await hero.boundingBox()).toMatchObject({ x: 0, y: 0, width: 1440, height: 844 });
  const headingBox = await heading.boundingBox();
  expect(headingBox?.y).toBeCloseTo(706, 0);
  await expect(startLink).toBeVisible();
  expect(await startLink.boundingBox()).toMatchObject({ y: 929, width: 150, height: 59 });
  const newest = await box("#home-newest [class*='movieCard']");
  expect(newest?.x).toBeCloseTo(116, 0);
  expect(newest?.y).toBeCloseTo(1073, 0);
  expect(newest?.height).toBeCloseTo(260, 0);
  expect((await box("main > [class*='guestExplainer']"))?.y).toBeCloseTo(1418, 0);
  expect((await box("#home-guest-reviews"))?.y).toBeCloseTo(1875, 0);
  await expect(page.locator("#home-newest img")).toHaveCount(6);
  expect(await page.locator("#home-newest img").evaluateAll(images => images.map(image => (image as HTMLImageElement).getAttribute("src")))).toEqual([
    assetUrl("guest-release-01-marty.png"),
    assetUrl("guest-release-04-no-other-choice.png"),
    assetUrl("guest-release-02-housemaid.png"),
    assetUrl("guest-release-04-28-years-later.png"),
    assetUrl("guest-release-03-avatar-fire-ash.png"),
    assetUrl("guest-release-06-mickey-17.png"),
  ]);
  await expect.poll(() => page.locator("#home-newest img").evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(page.locator("#home-guest-reviews img")).toHaveCount(10);
  await expect(page.locator("#home-guest-reviews")).toContainText("3,219,674,063 films watched");
  expect(await page.locator("#home-guest-reviews img").evaluateAll(images => images.slice(0, 4).map(image => (image as HTMLImageElement).getAttribute("src")))).toEqual([
    assetUrl("guest-recent-01-requiem.jpeg"),
    assetUrl("popular-01.png"),
    assetUrl("popular-06.png"),
    assetUrl("guest-recent-04-dune.jpeg"),
  ]);
  await expect.poll(() => page.locator("#home-guest-reviews img").evaluateAll(images => images.slice(0, 4).every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(page.locator("#home-reviews [class*=reviewPoster] img")).toHaveCount(4);
  await expect(page.locator("#home-reviews")).toContainText("Cine Mendset");
  await expect(page.locator("#home-reviews")).toContainText("This version of Superman is more human than mythic.");
  await expect(page.locator("#home-reviews [class*=reviewRating]").first()).toContainText("4.0");
  await expect(page.locator("#home-reviews")).toContainText("Avatar: Fire and Ash’s 197-minute runtime");
  await expect(page.locator("#home-reviews")).toContainText("Mikkelsen's performance is particularly powerful and heartbreaking");
  await expect(page.locator("#home-reviews")).toContainText("Wake Up Dead Man leans into a darker, more somber tone");
  await expect(page.locator("#home-reviews")).not.toContainText("A local fixture review");
  await expect(page.locator("#home-lists")).toContainText("119 films");
  await expect(page.locator("#home-lists")).toContainText("18k");
  await expect(page.locator("#home-lists [class*=guestListAuthorPrefix]")).toHaveCount(3);
  await expect(page.locator("#home-lists [class*=guestListAuthorPrefix]").first()).toBeHidden();
  await expect(page.locator("#home-lists")).toContainText("Classic movies for beginners");
  await expect(page.locator("#home-lists")).toContainText("Movies everyone should watch");
  await expect(page.locator("#home-lists")).toContainText("The Criterion Challenge 2026");
  await expect(page.locator("#home-lists")).toContainText("326k");
  await expect(page.locator("#home-lists")).toContainText("52 films");
  await expect(page.locator("#home-lists")).toContainText("2k");
  for (let index = 0; index < desktopLists.length; index++) {
    const card = page.locator("#home-lists article").nth(index);
    await expect(card.locator("[class*=listPosterLink] img")).toHaveCount(5);
    await expect.poll(() => card.locator("[class*=listPosterLink] img").evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    expect(await card.locator("[class*=listPosterLink] img").evaluateAll(images => images.map(image => (image as HTMLImageElement).getAttribute("src")))).toEqual(
      desktopLists[index].previewMovies.map(movie => movie.photoUrl),
    );
  }
  const firstList = page.locator("#home-lists article").nth(0);
  const firstPosterBounds = await firstList.locator("[class*=listPosterLink]").boundingBox();
  expect(firstPosterBounds?.x).toBeCloseTo(931, 0);
  expect(firstPosterBounds?.y).toBeCloseTo(2470, 0);
  expect(firstPosterBounds?.width).toBeCloseTo(385, 0);
  expect(firstPosterBounds?.height).toBeCloseTo(260, 0);
  expect((await firstList.locator("h3").boundingBox())?.y).toBeCloseTo(2748, 0);
  expect((await firstList.locator("small").boundingBox())?.y).toBeCloseTo(2777, 0);
  expect((await page.locator("#home-lists article").nth(1).locator("[class*=listPosterLink]").boundingBox())?.y).toBeCloseTo(2862, 0);
  const thirdPosterY = (await page.locator("#home-lists article").nth(2).locator("[class*=listPosterLink]").boundingBox())?.y ?? Number.NaN;
  expect(Math.abs(thirdPosterY - 3254)).toBeLessThanOrEqual(1);
  await expect(page.locator("#home-reviewers")).toContainText("2,343 films, 1,120 reviews");
  await expect(page.locator("#home-reviewers")).toContainText("5,323 films, 2,545 reviews");
  await expect(page.locator("#home-reviewers")).toContainText("zoe fujii");
  await expect(page.locator("#home-reviewers [class*=homeReviewerLikes]").first()).toBeHidden();
  await expect.poll(() => page.locator("#home-reviewers [class*=homeReviewerLikes]").evaluateAll(nodes => nodes.every(node => getComputedStyle(node).display === "none"))).toBe(true);
  const reviewerRows = page.locator("#home-reviewers [class*=stack] > article");
  await expect(reviewerRows).toHaveCount(3);
  const firstReviewerRow = await reviewerRows.nth(0).boundingBox();
  expect(firstReviewerRow?.x).toBeCloseTo(931, 0);
  expect(Math.abs((firstReviewerRow?.y ?? Number.NaN) - 3715)).toBeLessThanOrEqual(1);
  expect(firstReviewerRow?.width).toBeCloseTo(385, 0);
  expect(firstReviewerRow?.height).toBeCloseTo(75, 0);
  expect(Math.abs(((await reviewerRows.nth(1).boundingBox())?.y ?? Number.NaN) - 3811)).toBeLessThanOrEqual(1);
  expect(Math.abs(((await reviewerRows.nth(2).boundingBox())?.y ?? Number.NaN) - 3907)).toBeLessThanOrEqual(1);
  const firstNewsTitle = await page.locator("#home-journal [class*=journalCard]").nth(0).locator("h3").boundingBox();
  const firstNewsCard = await page.locator("#home-journal [class*=journalCard]").first().boundingBox();
  expect(firstNewsCard?.x).toBeCloseTo(118, 0);
  expect(firstNewsCard?.y).toBeCloseTo(4162, 0);
  expect(firstNewsCard?.width).toBeCloseTo(384, 0);
  expect(firstNewsCard?.height).toBeCloseTo(347, 0);
  expect(firstNewsTitle?.x).toBeCloseTo(135, 0);
  expect(Math.abs((firstNewsTitle?.y ?? Number.NaN) - 4397)).toBeLessThanOrEqual(1);
  expect(await page.locator("#home-journal [class*=journalCard]").nth(0).locator("p").innerText()).toBe("Katie Rife picks our January restoration, repertory and re-release highlights.");
  const firstNewsCopy = await page.locator("#home-journal [class*=journalCard]").nth(0).locator("[class*=journalCopy]").boundingBox();
  expect(firstNewsCopy?.height).toBeCloseTo(128, 0);
  await expect(page.locator("#home-journal [class*=journalCard]").nth(1)).toContainText("Park Chan-wook on how Looney Tunes influenced the cartoonish of No Other Choice.");
  await expect(page.locator("#home-journal [class*=journalCard]").nth(2)).toContainText("athe independent theaters keeping The Rocky Horror Picture Show alive, 50 years on.");
  await expect(page.locator("#home-journal [class*=journalCard] small").first()).toBeHidden();
  await expect(page.locator("#home-journal [class*=journalReadMore]").first()).toBeHidden();
  await expect(page.locator("#home-journal")).toContainText("Katie Rife picks our January restoration, repertory and re-release highlights.");
  await expect(page.locator("#home-reviewers img")).toHaveCount(3);
  expect(await page.locator("#home-reviewers img").evaluateAll(images => images.map(image => (image as HTMLImageElement).getAttribute("src")))).toEqual(
    ["guest-reviewer-karsten.png", "guest-reviewer-jamesbryant.png", "guest-reviewer-zoe-fujii.png"].map(assetUrl),
  );
  await expect(page.locator("[class*=journalCard] img")).toHaveCount(3);
  expect(await page.locator("#home-journal [class*=journalCard] img").evaluateAll(images => images.map(image => (image as HTMLImageElement).getAttribute("src")))).toEqual([
    assetUrl("latest-news-cover.png"),
    assetUrl("recent-02.png"),
    assetUrl("recent-03.png"),
  ]);
  await expect.poll(() => page.locator("#home-reviewers img").evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  const artifactDir = resolve(process.cwd(), "../artifacts/visual-audit-20261126/home-guest");
  mkdirSync(artifactDir, { recursive: true });
  await page.locator("#home-lists").screenshot({ path: resolve(artifactDir, "guest-desktop-lists-source-order.png") });
  await page.screenshot({ path: resolve(artifactDir, "rewind-home-guest-en-desktop-1440x4934.png"), fullPage: true });

  await page.setViewportSize({ width: 393, height: 2265 });
  await page.goto("en/home");
  await expect(page.locator("#home-lists")).toContainText("Created by CinemaPro");
  await expect(page.locator("#home-journal [class*=journalCard]:visible")).toHaveCount(1);
  const mobileHero = page.locator('main > [class*="hero"]');
  await expect(mobileHero.locator("h1")).toBeVisible();
  await expect(mobileHero.getByRole("link", { name: "Get Started", exact: true })).toBeVisible();
  expect(await page.locator("#home-newest img:visible").evaluateAll(images => images.map(image => (image as HTMLImageElement).getAttribute("src")))).toEqual([
    assetUrl("guest-release-01-marty.png"),
    assetUrl("guest-release-02-housemaid.png"),
    assetUrl("guest-release-03-avatar-fire-ash.png"),
    assetUrl("guest-release-04-no-other-choice.png"),
  ]);
  const mobileRecentPoster = await page.locator("#home-guest-reviews img").first().boundingBox();
  expect(mobileRecentPoster?.x).toBeCloseTo(16, 0);
  expect(mobileRecentPoster?.y).toBeCloseTo(766, 0);
  expect(mobileRecentPoster?.width).toBeCloseTo(79, 0);
  expect(mobileRecentPoster?.height).toBeCloseTo(116, 0);
  const mobileReviewCard = await page.locator("#home-reviews [class*=reviewCard]").first().boundingBox();
  expect(mobileReviewCard?.x).toBeCloseTo(16, 0);
  expect(mobileReviewCard?.y).toBeCloseTo(1033, 0);
  expect(mobileReviewCard?.width).toBeCloseTo(361, 0);
  expect(mobileReviewCard?.height).toBeCloseTo(168, 0);
  const mobileReviewers = await page.locator("#home-reviewers").boundingBox();
  expect(mobileReviewers?.y).toBeCloseTo(1551, 0);
  await expect(page.locator("#home-reviewers article")).toHaveCount(3);
  await expect(page.locator("#home-reviewers")).toContainText("Karsten");
  await expect(page.locator("#home-reviewers")).toContainText("jamesbryant");
  await expect(page.locator("#home-reviewers")).toContainText("zoe fujii");
  expect(await page.locator("#home-reviewers img").evaluateAll(images => images.map(image => (image as HTMLImageElement).getAttribute("src")))).toEqual(
    ["guest-reviewer-karsten.png", "guest-reviewer-jamesbryant.png", "guest-reviewer-zoe-fujii.png"].map(assetUrl),
  );
  const mobileNewsCard = await page.locator("#home-journal [class*=journalCard]").first().boundingBox();
  expect(mobileNewsCard?.x).toBeCloseTo(16, 0);
  expect(mobileNewsCard?.y).toBeCloseTo(1916, 0);
  expect(mobileNewsCard?.width).toBeCloseTo(361, 0);
  expect(mobileNewsCard?.height).toBeCloseTo(222, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await page.screenshot({ path: resolve(artifactDir, "rewind-home-guest-en-mobile-393x2265.png") });

  for (const locale of ["uk", "en"]) {
    for (const width of [320, 393, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${locale}/home`);
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
      await expect(page.locator('main > [class*="hero"] h1')).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
        `${locale} guest Home at ${width}px must not overflow horizontally`,
      ).toBe(0);
      if (width === 320) {
        const contrastAudit = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
        expect(contrastAudit.violations, `${locale} guest Home at ${width}px has color contrast violations`).toEqual([]);
      }
    }
  }
});
