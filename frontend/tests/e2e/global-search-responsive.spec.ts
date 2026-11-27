import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { GlobalSearchResponse } from "../../src/api/search.api";

const widths = [320, 393, 600, 720, 768, 1024, 1100, 1101, 1440] as const;
const desktopWidths = [1024, 1100, 1101, 1440] as const;
const locales = ["uk", "en"] as const;

function response(locale: typeof locales[number], empty: boolean, compact = false): GlobalSearchResponse {
  const title = compact ? "Dune (2021)" : locale === "uk"
    ? "Дуже довга назва історії про кінематограф, режисерів та несподівані відкриття глядачів. "
    : "A long story about cinema, filmmakers and the unexpected discoveries made by audiences. ";
  const copy = locale === "uk"
    ? "Цей докладний опис зберігає зміст і читабельність, коли результати містять багато тексту. "
    : "This detailed description preserves meaning and readability when results contain plenty of text. ";
  const compactCopy = "Denis Villeneuve’s “Dune” is less a complete story and more an atmospheric introduction to a vast universe. The film moves slowly, but every frame feels intentional — from the brutal landscapes of Arrakis to the haunting score by Hans Zimmer. It prioritizes mood...";
  const films = empty ? [] : Array.from({ length: 6 }, (_, index) => ({
    id: 987100 + index, title: compact ? title : `${index + 1}. ${title.repeat(3)}`.trim(), releaseDate: "2024-01-01", rating: 4, photoUrl: null,
  }));
  return {
    films: { content: films, number: 0, totalElements: films.length, totalPages: films.length ? 1 : 0 },
    users: { content: empty || !compact ? [] : Array.from({ length: 4 }, (_, index) => ({
      id: 987300 + index, username: "DunaX", displayName: null, avatarUrl: null,
    })), totalElements: empty || !compact ? 0 : 4 },
    tags: empty || !compact ? [] : ["Dune", "DuneMovie", "DuneSaga", "Dune2021", "DuneReview", "DuneEpic", "DuneCinematography", "DuneCast", "Dune2024", "DunePartOne", "DuneAdventure", "DuneUniverse", "DuneSoundtrack"].map((name, index) => ({ id: 987600 + index, name, slug: name.toLowerCase() })),
    people: empty || !compact ? [] : ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Denis Villeneuve"].map((name, index) => ({
      id: 987700 + index, name, photoUrl: null, type: index === 3 ? "DIRECTOR" as const : "ACTOR" as const,
    })),
    reviews: { content: empty ? [] : Array.from({ length: compact ? 4 : 1 }, (_, index) => ({
      id: 987200 + index, movieId: films[0].id, movieTitle: films[0].title, userId: 987300,
      username: compact ? "CineMindset" : "cinema-reader", content: compact ? compactCopy : copy.repeat(20), rating: 4, createdAt: "2025-12-10T12:00:00Z",
      moviePhotoUrl: null, userAvatarUrl: null,
    })), totalElements: empty ? 0 : compact ? 4 : 1 },
    lists: { content: empty ? [] : Array.from({ length: compact ? 2 : 1 }, (_, index) => ({
      id: 987400 + index, name: compact ? "Dune: Influences and Spiritual Successors" : title.repeat(4).trim(), description: compact ? "A collection of films connected to the world and ideas of Dune." : copy.repeat(20), ownerId: 987300,
      ownerUsername: "cinema-reader", tags: compact ? ["Sci-Fi"] : [], itemCount: compact ? 25 : 6, previewMovies: films.slice(0, 5),
    })), totalElements: empty ? 0 : compact ? 2 : 1 },
    journal: { content: empty ? [] : Array.from({ length: 3 }, (_, index) => ({
      id: 987500 + index, slug: `responsive-story-${index}`, category: "NEWS", title: compact ? ["Dune 2021: First Reviews Are In", "Dune 2024 Sequel Arrives", "Dune 2024: Battles for Arrakis Begin"][index] : `${index + 1}. ${title.repeat(4)}`.trim(),
      excerpt: compact ? ["Critics praise the visuals and immersive world-building of this sci-fi adaptation.", "Fans return to Arrakis as the saga continues with new conflicts and revelations.", "New alliances and rivalries shape the fate of the desert planet."][index] : copy.repeat(20), coverUrl: null, publishedAt: "2026-10-20T12:00:00Z",
    })), totalElements: empty ? 0 : 3 },
  };
}

async function mockSearch(page: Page, sourceDesktop = false, sourceMobile = false, sourceMobileUsers = false, sourceDesktopUsers = false) {
  const mutations: string[] = [];
  const sourceAssets = {
    posters: Array.from({ length: 6 }, (_, index) => `https://search-figma.invalid/poster-${String(index + 1).padStart(2, "0")}.png`),
    reviewers: Array.from({ length: 3 }, (_, index) => `https://search-figma.invalid/reviewer-${String(index + 1).padStart(2, "0")}.png`),
    journal: Array.from({ length: 3 }, (_, index) => `https://search-figma.invalid/journal-${String(index + 1).padStart(2, "0")}.png`),
    mobileListPosters: Array.from({ length: 10 }, (_, index) => `https://search-figma.invalid/list-${index + 1}.png`),
    mobileUserAvatar: "https://search-figma.invalid/user-avatar.png",
    desktopUserAvatars: ["user-01.png", "user-02.png", "user-03.png", "user-01.png"].map(name => `https://search-figma.invalid/${name}`),
  };
  if (sourceDesktop || sourceMobile || sourceMobileUsers || sourceDesktopUsers) {
    await page.route("https://search-figma.invalid/**", route => {
      const asset = new URL(route.request().url()).pathname.slice(1);
      const fixtureFamily = sourceMobileUsers ? "global-search-mobile-users-figma" : sourceMobile ? "global-search-expanded-mobile-figma" : "global-search-desktop-figma";
      return route.fulfill({ path: path.resolve(process.cwd(), `tests/e2e/fixtures/${fixtureFamily}/${asset}`) });
    });
  }
  await page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== "GET") {
      mutations.push(`${request.method()} ${url.pathname}`);
      return route.abort();
    }
    if (url.pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/search/global") {
      const query = url.searchParams.get("q");
      const locale = url.searchParams.get("language") === "uk" ? "uk" : "en";
      const data = response(locale, query === "missing", query === "dune");
      if (sourceDesktop && query === "dune") {
        data.films.content[1].title = "Dune: Part Two (2024)";
        data.films.content.forEach((film, index) => { film.photoUrl = sourceAssets.posters[index]; });
        const reviewFilms = [0, 0, 1, 1];
        const reviewCopy = [
          "Denis Villeneuve’s “Dune” is less a complete story and more an atmospheric introduction to a vast universe. The film moves slowly, but every frame feels intentional — from the brutal landscapes of Arrakis to the haunting score by Hans Zimmer. It prioritizes mood and world-building over action, which may frustrate some viewers, but for those willing to sink into its rhythm, it’s a mesmerizing cinematic experience.",
          "“Dune” (2021) feels like the opening chapter of an epic written in images and sound rather than dialogue. The performances are restrained, almost distant, mirroring the film’s cold and unforgiving world. While the narrative ends abruptly, it successfully establishes the themes of power, destiny, and sacrifice, making the wait for the continuation feel both inevitable and exciting.",
          "“Dune: Part Two” delivers the emotional and narrative payoff that the first film carefully set up. The scale is massive, the action more intense, and the character arcs finally reach their breaking points. Villeneuve balances spectacle with philosophical depth, turning Paul Atreides’ journey into a chilling exploration of prophecy, control, and moral ambiguity.",
          "Unlike its predecessor, “Dune: Part Two” feels urgent and relentless, pushing its characters and audience into uncomfortable territory. Visually stunning and thematically darker, it refuses to present its hero as purely righteous, making the conclusion both powerful and unsettling.",
        ];
        data.reviews.content.forEach((review, index) => {
          const film = data.films.content[reviewFilms[index]];
          review.movieId = film.id;
          review.movieTitle = film.title;
          review.moviePhotoUrl = sourceAssets.posters[reviewFilms[index]];
          review.content = reviewCopy[index];
          review.username = "ReelRaven";
          review.createdAt = "2025-12-10T12:00:00Z";
        });
        data.users.content = data.users.content.slice(0, 3).map((user, index) => ({ ...user, username: ["DunaX", "DunaFlux", "Duna_8"][index] }));
        data.users.content = data.users.content.map(user => Object.assign(user, { followerCount: 38, followingCount: 15 }));
        data.users.content.forEach((user, index) => { user.avatarUrl = sourceAssets.reviewers[index]; });
        data.users.totalElements = 3;
        data.tags = data.tags.slice(0, 7);
        data.people = [];
        data.lists.content = data.lists.content.map((list, index) => ({
          ...list,
          name: ["Dune: Adaptations and Direct Reinterpretations", "Dune: Influences and Spiritual Successors"][index],
          description: [
            "This list includes films and TV series that directly adapt Frank Herbert’s Dune or attempt to reinterpret it for the screen.",
            "A list of films inspired by Dune’s ideas, atmosphere and world-building, including political intrigue, environmental storytelling and mythic science fiction.",
          ][index],
          itemCount: 25,
          previewMovies: list.previewMovies.map((movie, movieIndex) => ({ ...movie, photoUrl: sourceAssets.posters[movieIndex] })),
        }));
        data.journal.content.forEach((article, index) => { article.coverUrl = sourceAssets.journal[index]; });
      }
      if (sourceMobile && query === "dune") {
        data.films.content.forEach((film, index) => { film.photoUrl = sourceAssets.posters[index]; });
        data.reviews.content.forEach((review, index) => {
          review.moviePhotoUrl = index < 2 ? "https://search-figma.invalid/review-dune-2021.png" : "https://search-figma.invalid/review-dune-part-two.png";
          review.movieTitle = index < 2 ? "Dune (2021)" : "Dune: Part Two (2024)";
          review.userAvatarUrl = "https://search-figma.invalid/reviewer.png";
        });
        data.users.content = data.users.content.slice(0, 3).map(user => ({ ...user, username: "DunaX", avatarUrl: "https://search-figma.invalid/reviewer.png", followerCount: 38, followingCount: 15 }));
        data.users.totalElements = 3;
        data.people = [];
        data.tags = data.tags.slice(0, 7);
        data.lists.content = data.lists.content.map((list, index) => ({
          ...list,
          name: "Dune: Influences and Spiritual Successors",
          itemCount: 25,
          previewMovies: list.previewMovies.map((movie, movieIndex) => ({ ...movie, photoUrl: sourceAssets.mobileListPosters[index * 5 + movieIndex] })),
        }));
        data.journal.content.forEach((article, index) => { article.coverUrl = sourceAssets.journal[index]; });
      }
      if (sourceMobileUsers && query === "dune") {
        data.users.content = data.users.content.map(user => Object.assign(user, { avatarUrl: sourceAssets.mobileUserAvatar, followerCount: 38, followingCount: 15 }));
        data.users.totalElements = data.users.content.length;
      }
      if (sourceDesktopUsers && query === "dune") {
        const names = ["DunaX", "DunaFlux", "Duna_8", "DunaX"];
        data.users.content = data.users.content.map((user, index) => Object.assign(user, {
          username: names[index],
          avatarUrl: sourceAssets.desktopUserAvatars[index],
          followerCount: 38,
          followingCount: 15,
        }));
        data.users.totalElements = data.users.content.length;
      }
      return route.fulfill({ json: data });
    }
    if (url.pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ status: 404, json: {} });
  });
  return mutations;
}

async function expectNoPageOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}

// Measure the rendered text containers, allowing deliberate line clamps on
// excerpts while detecting a whole title/body hidden by a fixed-height card.
async function expectContentsWithin(cards: Locator, selector: string) {
  const failures = await cards.evaluateAll((elements, childSelector) => elements.flatMap((card, index) => {
    const outer = card.getBoundingClientRect();
    return [...card.querySelectorAll(childSelector)].flatMap(child => {
      const box = child.getBoundingClientRect();
      if (!box.width || !box.height) return [];
      const escaped = box.left < outer.left - 1 || box.right > outer.right + 1 || box.top < outer.top - 1 || box.bottom > outer.bottom + 1;
      return escaped ? [`card ${index}: ${child.tagName} escapes its card`] : [];
    });
  }), selector);
  expect(failures).toEqual([]);
}

async function expectTextWithinViewport(text: Locator, width: number) {
  const outside = await text.evaluateAll(elements => elements.flatMap(element => {
    const box = element.getBoundingClientRect();
    return box.width && box.height && (box.left < 0 || box.right > window.innerWidth)
      ? [`${element.tagName} extends beyond the viewport`]
      : [];
  }));
  expect(outside, `text at ${width}px stays inside the viewport`).toEqual([]);
}

test("mobile search landing follows the READY phone frame", async ({ page }, testInfo) => {
  await mockSearch(page);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/search");

  const main = page.getByRole("main", { name: "Global search" });
  const shortcuts = main.getByRole("navigation", { name: "Search shortcuts" });
  await expect(main).toBeVisible();
  await expect(main.getByRole("textbox", { name: "Search Rewind", exact: true })).toBeVisible();
  await expect(shortcuts.getByRole("link")).toHaveCount(6);
  await expect(shortcuts.getByRole("link", { name: "Reviewers", exact: true })).toHaveAttribute("href", "/en/community/reviewers");
  const shortcutGeometry = await shortcuts.getByRole("link").evaluateAll(links => links.map(link => {
    const box = link.getBoundingClientRect();
    return { top: box.top, height: box.height };
  }));
  expect(shortcutGeometry[0].height).toBeGreaterThanOrEqual(31);
  expect(shortcutGeometry[0].height).toBeLessThanOrEqual(34);
  expect(shortcutGeometry[1].top - shortcutGeometry[0].top - shortcutGeometry[0].height).toBeGreaterThanOrEqual(3);
  expect(shortcutGeometry[1].top - shortcutGeometry[0].top - shortcutGeometry[0].height).toBeLessThanOrEqual(7);
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await expectNoPageOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("search-landing-393.png"), fullPage: true });
});

test("mobile search empty state matches the READY 393px composition", async ({ page }, testInfo) => {
  await mockSearch(page);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/search?q=missing");

  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  const empty = main.locator('section[class*="noMatches"]');
  const heading = empty.getByRole("heading", { name: "There were no matches for your search term", exact: true });
  const hint = empty.getByText("Check your spelling or search for something else", { exact: true });
  const home = empty.getByRole("link", { name: "Back to home", exact: true });
  await expect(heading).toBeVisible();
  await expect(hint).toBeVisible();
  await expect(home).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  const navigationLinks = navigation.getByRole("link");
  await expect(navigationLinks).toHaveCount(5);
  for (const link of await navigationLinks.all()) await expect(link).toBeVisible();

  const geometry = await Promise.all([heading, hint, home].map(element => element.evaluate(node => {
    const box = node.getBoundingClientRect();
    return { top: box.top, height: box.height };
  })));
  expect(geometry[0].top).toBeGreaterThanOrEqual(332);
  expect(geometry[0].top).toBeLessThanOrEqual(353);
  expect(geometry[1].top).toBeGreaterThanOrEqual(403);
  expect(geometry[1].top).toBeLessThanOrEqual(426);
  expect(geometry[2].top).toBeGreaterThanOrEqual(462);
  expect(geometry[2].top).toBeLessThanOrEqual(493);
  await expectNoPageOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("search-empty-393-852-figma.png"), fullPage: true });
});

test("mobile condensed search results match the READY 393x995 frame", async ({ page }, testInfo) => {
  await mockSearch(page);
  await page.setViewportSize({ width: 393, height: 995 });
  await page.goto("/en/search?q=dune");

  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  const filmRail = main.locator("#films [class*='filmRail']");
  await expect(filmRail.getByRole("link")).toHaveCount(6);
  const reviews = main.locator("#reviews article:visible");
  await expect(main.locator("#reviews article")).toHaveCount(4);
  await expect(reviews).toHaveCount(2);
  const more = main.getByRole("button", { name: "Show more results", exact: true });
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  const rect = async (locator: Locator) => locator.evaluate(element => {
    const box = element.getBoundingClientRect();
    return { top: box.top, height: box.height };
  });
  const posters = await rect(filmRail.getByRole("link").first());
  const firstReview = await rect(reviews.nth(0));
  const secondReview = await rect(reviews.nth(1));
  const showMore = await rect(more);
  const showMoreInset = await more.evaluate(element => Number.parseFloat(getComputedStyle(element, "::before").insetBlockStart));
  const navigation = await rect(nav);

  expect(posters.top).toBeCloseTo(267, 0);
  expect(posters.height).toBeCloseTo(149, 0);
  expect(firstReview.top).toBeCloseTo(440, 0);
  expect(firstReview.height).toBeCloseTo(168, 0);
  expect(secondReview.top).toBeCloseTo(633, 0);
  expect(secondReview.height).toBeCloseTo(168, 0);
  expect(showMore.top + showMoreInset).toBeCloseTo(836, 0);
  expect(navigation.top).toBeCloseTo(903, 0);
  await expectNoPageOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("search-condensed-393x995-figma.png"), fullPage: true });
});

test("mobile expanded search results expose every available category", async ({ page }, testInfo) => {
  await mockSearch(page);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/search?q=dune");

  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  const more = main.getByRole("button", { name: "Show more results", exact: true });
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await more.click();
  await expect(more).toHaveCount(0);
  await expect(main.locator("#films article")).toHaveCount(6);
  await expect(main.locator("#reviews article")).toHaveCount(4);
  await expect(main.locator("#users > div > a")).toHaveCount(4);
  await expect(main.locator("#people > div > a")).toHaveCount(4);
  await expect(main.locator("#tags > div > a")).toHaveCount(13);
  await expect(main.locator("#lists > div > a")).toHaveCount(2);
  await expect(main.locator('#journal a[href*="/journal/"]')).toHaveCount(3);
  await expectNoPageOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("search-expanded-393x852.png") });
});

test("READY mobile expanded Dune search renders source artwork", async ({ page }) => {
  await mockSearch(page, false, true);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/search?q=dune");
  await page.getByRole("button", { name: "Show more results" }).click();

  const main = page.getByRole("main");
  await expect(main.locator("#films article")).toHaveCount(6);
  await expect(main.locator("#reviews article")).toHaveCount(4);
  await expect(main.locator("#users > div > a")).toHaveCount(3);
  await expect(main.locator("#people")).toHaveCount(0);
  await expect(main.locator("#tags > div > a")).toHaveCount(7);
  await expect(main.locator("#lists > div > a")).toHaveCount(2);
  await expect(main.locator('#journal a[href*="/journal/"]')).toHaveCount(3);
  const artwork = [
    main.locator("#films img"),
    main.locator("#reviews [class*=reviewPoster] img"),
    main.locator("#reviews img[class*=reviewAvatar]"),
    main.locator("#users img"),
    main.locator("#lists img"),
    main.locator("#journal img"),
  ];
  const expectedCounts = [6, 4, 4, 3, 10, 3];
  for (let index = 0; index < artwork.length; index++) {
    await expect(artwork[index]).toHaveCount(expectedCounts[index]);
    await expect.poll(() => artwork[index].evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  }
  await expect(artwork[0].evaluateAll(images => images.map(image => new URL((image as HTMLImageElement).src).pathname))).resolves.toEqual(Array.from({ length: 6 }, (_, index) => `/poster-0${index + 1}.png`));
  const sourceAnchors = await page.evaluate(() => {
    const selectors = ["#films [class*=posterLink]", "#reviews article", "#users [class*=userCard]", "#tags [class*=tagGrid]", "#tags [class*=tagGrid] > a", "#lists [class*=listCard]", "#journal [class*=articleCard]"];
    return Object.fromEntries(selectors.map(selector => {
      const elements = [...document.querySelectorAll<HTMLElement>(selector)];
      return [selector, elements.map(element => {
        const box = element.getBoundingClientRect();
        return { x: box.x, y: box.y + window.scrollY, width: box.width, height: box.height };
      })];
    }));
  });
  const top = (selector: string, index = 0) => (sourceAnchors[selector] as { y: number }[])[index]?.y;
  const rect = (selector: string, index = 0) => (sourceAnchors[selector] as { width: number; height: number }[])[index];
  const expectTopNear = (selector: string, expected: number, index = 0) => expect(Math.abs(top(selector, index)! - expected)).toBeLessThanOrEqual(2);
  const expectSizeNear = (selector: string, width: number, height: number, index = 0) => {
    expect(Math.abs(rect(selector, index).width - width)).toBeLessThanOrEqual(1);
    expect(Math.abs(rect(selector, index).height - height)).toBeLessThanOrEqual(1);
  };
  const expectHeightNear = (selector: string, height: number, index = 0) =>
    expect(Math.abs(rect(selector, index).height - height)).toBeLessThanOrEqual(1);
  expectTopNear("#films [class*=posterLink]", 267);
  expectSizeNear("#films [class*=posterLink]", 100, 149);
  expectTopNear("#reviews article", 440);
  expectTopNear("#reviews article", 1017, 3);
  expectSizeNear("#reviews article", 361, 168);
  expectTopNear("#users [class*=userCard]", 1209);
  expectSizeNear("#users [class*=userCard]", 361, 52);
  expectTopNear("#tags [class*=tagGrid] > a", 1437);
  expectHeightNear("#tags [class*=tagGrid] > a", 31);
  expectTopNear("#lists [class*=listCard]", 1492);
  expectTopNear("#lists [class*=listCard]", 1705, 1);
  expectSizeNear("#lists [class*=listCard]", 361, 189);
  expectTopNear("#journal [class*=articleCard]", 1918);
  expectSizeNear("#journal [class*=articleCard]", 361, 236);
  expect(Math.abs(await page.evaluate(() => document.documentElement.scrollHeight) - 2801)).toBeLessThanOrEqual(2);
  await expectNoPageOverflow(page);
  await expect(artwork[1].evaluateAll(images => images.map(image => new URL((image as HTMLImageElement).src).pathname))).resolves.toEqual(["/review-dune-2021.png", "/review-dune-2021.png", "/review-dune-part-two.png", "/review-dune-part-two.png"]);
  await expect(main.locator("#reviews article").evaluateAll(cards => cards.map(card => card.querySelector('[class*=reviewMovie]')?.textContent?.trim()))).resolves.toEqual(["Dune (2021)", "Dune (2021)", "Dune: Part Two (2024)", "Dune: Part Two (2024)"]);
  await expect(artwork[2].evaluateAll(images => images.map(image => new URL((image as HTMLImageElement).src).pathname))).resolves.toEqual(Array(4).fill("/reviewer.png"));
  await expect(artwork[3].evaluateAll(images => images.map(image => new URL((image as HTMLImageElement).src).pathname))).resolves.toEqual(Array(3).fill("/reviewer.png"));
  await expect(artwork[4].evaluateAll(images => images.map(image => new URL((image as HTMLImageElement).src).pathname))).resolves.toEqual(Array.from({ length: 10 }, (_, index) => `/list-${index + 1}.png`));
  await expect(main.locator("#lists [class*=listCard]").evaluateAll(cards => cards.map(card => card.getAttribute("title")))).resolves.toEqual(Array(2).fill("Dune: Influences and Spiritual Successors"));
  await expect(main.locator("#users [class*=userCard]").first()).toContainText("38 followers, following 15");
  await expect(artwork[5].evaluateAll(images => images.map(image => new URL((image as HTMLImageElement).src).pathname))).resolves.toEqual(["/journal-01.png", "/journal-02.png", "/journal-03.png"]);
  const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261126", "search-expanded-mobile");
  mkdirSync(evidenceDir, { recursive: true });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.screenshot({ path: path.join(evidenceDir, "rewind-search-expanded-dune-en-mobile-393x2801.png"), fullPage: true });
});

test("READY expanded Dune search stays localized and overflow-free in Ukrainian", async ({ page }) => {
  await mockSearch(page, false, true);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/uk/search?q=dune");

  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  const more = main.getByRole("button", { name: "Показати більше результатів", exact: true });
  await more.click();
  await expect(more).toHaveCount(0);
  await expect(main.locator("#films article")).toHaveCount(6);
  await expect(main.locator("#reviews article")).toHaveCount(4);
  await expect(main.locator("#users > div > a")).toHaveCount(3);
  await expect(main.locator("#tags > div > a")).toHaveCount(7);
  await expect(main.locator('#journal a[href*="/journal/"]')).toHaveCount(3);
  await expect(page.locator("html")).toHaveAttribute("lang", "uk");
  await expect(main.locator("#global-search-films-heading")).toHaveText("Пошук фільмів");

  const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261126", "search-expanded-mobile");
  mkdirSync(evidenceDir, { recursive: true });
  await page.screenshot({ path: path.join(evidenceDir, "rewind-search-expanded-dune-uk-mobile-393x2801.png"), fullPage: true });

  for (const width of [320, 393, 768, 1024]) {
    await page.setViewportSize({ width, height: 852 });
    await expectNoPageOverflow(page);
  }
});

test("READY mobile review results match the source artwork and 393x1139 frame", async ({ page }) => {
  await mockSearch(page, false, true);
  await page.setViewportSize({ width: 393, height: 1139 });
  await page.goto("/en/search?q=dune&tab=reviews");

  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  const reviews = main.locator("#reviews article");
  await expect(reviews).toHaveCount(4);
  const topsAndHeights = await reviews.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { top: box.top, height: box.height };
  }));
  expect(topsAndHeights.map(box => Math.round(box.top))).toEqual([267, 460, 652, 844]);
  expect(topsAndHeights.map(box => Math.round(box.height))).toEqual([168, 168, 168, 168]);
  const navigation = await page.getByRole("navigation", { name: "Main navigation" }).evaluate(element => element.getBoundingClientRect().top);
  expect(navigation).toBe(1047);
  await expectNoPageOverflow(page);
  const reviewPosters = page.locator("#reviews [class*=reviewPoster] img");
  const reviewerAvatars = page.locator("#reviews img[class*=reviewAvatar]");
  await expect(reviewPosters).toHaveCount(4);
  await expect(reviewerAvatars).toHaveCount(4);
  for (const images of [reviewPosters, reviewerAvatars]) {
    await expect.poll(() => images.evaluateAll(nodes => nodes.every(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0))).toBe(true);
  }
  await expect(reviewPosters.evaluateAll(images => images.map(image => new URL((image as HTMLImageElement).src).pathname))).resolves.toEqual(["/review-dune-2021.png", "/review-dune-2021.png", "/review-dune-part-two.png", "/review-dune-part-two.png"]);
  await expect(reviewerAvatars.evaluateAll(images => images.map(image => new URL((image as HTMLImageElement).src).pathname))).resolves.toEqual(Array(4).fill("/reviewer.png"));
  const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261126", "search-results-mobile");
  mkdirSync(evidenceDir, { recursive: true });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.screenshot({ path: path.join(evidenceDir, "rewind-search-reviews-dune-en-mobile-393x1139.png"), fullPage: true });
});

test("mobile Search film results render six poster fixtures in the 393px grid", async ({ page }) => {
  await mockSearch(page, false, true);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/search?q=dune&tab=films");

  const posters = page.locator("#films article > a");
  await expect(posters).toHaveCount(6);
  const boxes = await posters.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }));
  expect(boxes.map(box => Math.round(box.x))).toEqual([16, 110, 204, 298, 16, 110]);
  expect(boxes.map(box => Math.round(box.y))).toEqual([267, 267, 267, 267, 402, 402]);
  expect(boxes.map(box => Math.round(box.width))).toEqual([79, 79, 79, 79, 79, 79]);
  expect(boxes.map(box => Math.round(box.height))).toEqual([116, 116, 116, 116, 116, 116]);
  await expectNoPageOverflow(page);
  const images = page.locator("#films img");
  await expect(images).toHaveCount(6);
  await expect.poll(() => images.evaluateAll(nodes => nodes.every(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(images.evaluateAll(nodes => nodes.map(node => new URL((node as HTMLImageElement).src).pathname))).resolves.toEqual(Array.from({ length: 6 }, (_, index) => `/poster-0${index + 1}.png`));
  const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261126", "search-results-mobile");
  mkdirSync(evidenceDir, { recursive: true });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.screenshot({ path: path.join(evidenceDir, "rewind-search-films-dune-en-mobile-393x852.png"), fullPage: true });
});

test("READY desktop film results match source posters and the 1440px poster grid", async ({ page }) => {
  await mockSearch(page, true);
  await page.setViewportSize({ width: 1440, height: 1062 });
  await page.goto("/en/search?q=dune&tab=films");

  const posters = page.locator("#films article > a");
  await expect(posters).toHaveCount(6);
  const boxes = await posters.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }));
  expect(boxes.map((box, index) => Math.abs(box.x - [121, 326, 531, 735, 941, 1146][index]))
    .every(delta => delta <= 1.5)).toBe(true);
  expect(boxes.every(box => Math.round(box.y) === 377)).toBe(true);
  expect(boxes.map(box => Math.round(box.width))).toEqual([174, 174, 174, 174, 174, 174]);
  expect(boxes.map(box => Math.round(box.height))).toEqual([260, 260, 260, 260, 260, 260]);
  await expectNoPageOverflow(page);
  const images = page.locator("#films img");
  await expect(images).toHaveCount(6);
  await expect.poll(() => images.evaluateAll(nodes => nodes.every(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(images.evaluateAll(nodes => nodes.map(node => new URL((node as HTMLImageElement).src).pathname))).resolves.toEqual(Array.from({ length: 6 }, (_, index) => `/poster-0${index + 1}.png`));
  const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261126", "search-results-desktop");
  mkdirSync(evidenceDir, { recursive: true });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.screenshot({ path: path.join(evidenceDir, "rewind-search-films-dune-en-desktop-1440x1062.png"), fullPage: true });
});

test("desktop condensed search results match the READY 1440px composition", async ({ page }, testInfo) => {
  await mockSearch(page);
  await page.setViewportSize({ width: 1440, height: 2281 });
  await page.goto("/en/search?q=dune");

  const posters = page.locator("#films article > a");
  const reviews = page.locator("#reviews article:visible");
  await expect(posters).toHaveCount(6);
  await expect(reviews).toHaveCount(3);
  const poster = await posters.first().boundingBox();
  expect(Math.round(poster?.x ?? 0)).toBe(120);
  expect(Math.round(poster?.y ?? 0)).toBe(377);
  const cards = await reviews.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }));
  expect(cards.map(box => Math.round(box.y))).toEqual([692, 1045, 1398]);
  expect(cards.map(box => Math.round(box.width))).toEqual([1200, 1200, 1200]);
  expect(cards.map(box => Math.round(box.height))).toEqual([315, 315, 315]);
  await expectNoPageOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("search-condensed-1440x2281.png") });
});

test("READY desktop people results match source portraits and 1440px user-card geometry", async ({ page }) => {
  await mockSearch(page, false, false, false, true);
  await page.setViewportSize({ width: 1440, height: 1392 });
  await page.goto("/en/search?q=dune&tab=users");

  const logo = await page.locator('header a[class*="logo"] img').boundingBox();
  expect(logo?.x).toBeCloseTo(385, 0);
  await expect(page.getByRole("link", { name: "Global search", exact: true })).toHaveCount(0);

  const cards = page.locator("#users a");
  await expect(cards).toHaveCount(4);
  const boxes = await cards.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }));
  expect(boxes.map(box => Math.round(box.x))).toEqual([120, 120, 120, 120]);
  expect(boxes.map(box => Math.round(box.y))).toEqual([377, 534, 691, 848]);
  expect(boxes.map(box => Math.round(box.width))).toEqual([1200, 1200, 1200, 1200]);
  expect(boxes.map(box => Math.round(box.height))).toEqual([119, 119, 119, 119]);
  await expectNoPageOverflow(page);
  const avatars = page.locator("#users img");
  await expect(avatars).toHaveCount(4);
  await expect.poll(() => avatars.evaluateAll(nodes => nodes.every(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(avatars.evaluateAll(nodes => nodes.map(node => new URL((node as HTMLImageElement).src).pathname))).resolves.toEqual(["/user-01.png", "/user-02.png", "/user-03.png", "/user-01.png"]);
  await expect(cards.nth(0)).toContainText("DunaX");
  await expect(cards.nth(1)).toContainText("DunaFlux");
  await expect(cards.nth(2)).toContainText("Duna_8");
  await expect(cards.nth(0)).toContainText("38 followers, following 15");
  await expect(page.getByText('Showing matches for “dune”', { exact: true })).toBeVisible();
  await expect(page.locator("footer")).toContainText(`© ${new Date().getFullYear()} Rewind.`);
  await expect(page.locator("footer")).toContainText("Film data from TMDB.");
  const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261126", "search-results-desktop");
  mkdirSync(evidenceDir, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(evidenceDir, "rewind-search-users-dune-en-desktop-1440x1392.png"), fullPage: true });
});

test("READY desktop lists results match source poster collages and 1440px cards", async ({ page }) => {
  await mockSearch(page, true);
  await page.setViewportSize({ width: 1440, height: 1518 });
  await page.goto("/en/search?q=dune&tab=lists");

  const cards = page.locator('#lists a[href*="/lists/public/"]');
  await expect(cards).toHaveCount(2);
  const boxes = await cards.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }));
  expect(boxes.map(box => Math.round(box.x))).toEqual([120, 120]);
  expect(boxes.map(box => Math.round(box.y))).toEqual([377, 754]);
  expect(boxes.map(box => Math.round(box.width))).toEqual([1200, 1200]);
  expect(boxes.map(box => Math.round(box.height))).toEqual([339, 339]);
  await expectNoPageOverflow(page);
  const images = page.locator('#lists a[href*="/lists/public/"] img');
  await expect(images).toHaveCount(10);
  await expect.poll(() => images.evaluateAll(nodes => nodes.every(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0))).toBe(true);
  const posters = Array.from({ length: 5 }, (_, index) => `/poster-0${index + 1}.png`);
  await expect(images.evaluateAll(nodes => nodes.map(node => new URL((node as HTMLImageElement).src).pathname))).resolves.toEqual([...posters, ...posters]);
  const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261126", "search-results-desktop");
  mkdirSync(evidenceDir, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(evidenceDir, "rewind-search-lists-dune-en-desktop-1440x1518.png"), fullPage: true });
});

test("READY desktop journal results match source covers and 1440px editorial cards", async ({ page }) => {
  await mockSearch(page, true);
  await page.setViewportSize({ width: 1440, height: 1149 });
  await page.goto("/en/search?q=dune&tab=journal");

  const cards = page.locator('#journal a[href*="/journal/"]');
  await expect(cards).toHaveCount(3);
  const boxes = await cards.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }));
  expect(boxes.map(box => Math.round(box.y))).toEqual([377, 377, 377]);
  expect(boxes.map(box => Math.round(box.height))).toEqual([347, 347, 347]);
  for (let index = 0; index < boxes.length; index += 1) {
    expect(Math.abs(boxes[index].x - [116, 522.64, 929.29][index])).toBeLessThanOrEqual(1.5);
    expect(Math.abs(boxes[index].width - 385.64)).toBeLessThanOrEqual(1.5);
  }
  await expectNoPageOverflow(page);
  const images = page.locator('#journal a[href*="/journal/"] img');
  await expect(images).toHaveCount(3);
  await expect.poll(() => images.evaluateAll(nodes => nodes.every(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(images.evaluateAll(nodes => nodes.map(node => new URL((node as HTMLImageElement).src).pathname))).resolves.toEqual(["/journal-01.png", "/journal-02.png", "/journal-03.png"]);
  const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261126", "search-results-desktop");
  mkdirSync(evidenceDir, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(evidenceDir, "rewind-search-journal-dune-en-desktop-1440x1149.png"), fullPage: true });
});

test("desktop tags match the READY 1440px two-row chip layout", async ({ page }, testInfo) => {
  await mockSearch(page);
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto("/en/search?q=dune&tab=tags");

  const tags = page.locator("#tags a");
  await expect(tags).toHaveCount(13);
  const boxes = await tags.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height, text: element.textContent?.trim() };
  }));
  expect(boxes.map(box => box.y)).toEqual(Array(7).fill(377).concat(Array(6).fill(443)));
  expect(boxes.map(box => box.height)).toEqual(Array(13).fill(49));
  const expectedX = [119, 237, 407, 569, 731, 911, 1066, 120, 278, 443, 631, 838, 1032];
  const expectedWidths = [111, 163, 155, 155, 173, 148, 255, 151, 158, 181, 200, 187, 210];
  expect(boxes.every((box, index) => Math.abs(box.x - expectedX[index]) <= 2.5)).toBe(true);
  expect(boxes.every((box, index) => Math.abs(box.width - expectedWidths[index]) <= 3)).toBe(true);
  expect(boxes.map(box => box.text)).toEqual(["Dune", "DuneMovie", "DuneSaga", "Dune2021", "DuneReview", "DuneEpic", "DuneCinematography", "DuneCast", "Dune2024", "DunePartOne", "DuneAdventure", "DuneUniverse", "DuneSoundtrack"]);
  await expectNoPageOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("search-tags-1440x1024.png") });
});

test("READY mobile people results match source avatars and the 393px user rows", async ({ page }) => {
  await mockSearch(page, false, false, true);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/search?q=dune&tab=users");

  const cards = page.locator("#users a");
  await expect(cards).toHaveCount(4);
  const boxes = await cards.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }));
  expect(boxes.map(box => Math.round(box.x))).toEqual([16, 16, 16, 16]);
  expect(boxes.map(box => Math.round(box.y))).toEqual([267, 343, 419, 495]);
  expect(boxes.map(box => Math.round(box.width))).toEqual([361, 361, 361, 361]);
  expect(boxes.map(box => Math.round(box.height))).toEqual([52, 52, 52, 52]);
  await expectNoPageOverflow(page);
  const avatars = page.locator("#users img");
  await expect(avatars).toHaveCount(4);
  await expect.poll(() => avatars.evaluateAll(nodes => nodes.every(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(avatars.evaluateAll(nodes => nodes.map(node => new URL((node as HTMLImageElement).src).pathname))).resolves.toEqual(Array(4).fill("/user-avatar.png"));
  await expect(cards.nth(0)).toContainText("38 followers, following 15");
  const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261126", "search-results-mobile");
  mkdirSync(evidenceDir, { recursive: true });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.screenshot({ path: path.join(evidenceDir, "rewind-search-users-dune-en-mobile-393x852.png"), fullPage: true });
});

test("READY mobile lists results match source artwork and the 393px collection cards", async ({ page }) => {
  await mockSearch(page, false, true);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/search?q=dune&tab=lists");

  const cards = page.locator('#lists a[href*="/lists/public/"]');
  await expect(cards).toHaveCount(2);
  const boxes = await cards.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }));
  expect(boxes.map(box => Math.round(box.x))).toEqual([16, 16]);
  expect(boxes.map(box => Math.round(box.y))).toEqual([267, 480]);
  expect(boxes.map(box => Math.round(box.width))).toEqual([361, 361]);
  expect(boxes.map(box => Math.round(box.height))).toEqual([189, 189]);
  const previews = await page.locator('#lists a[href*="/lists/public/"] > div:nth-child(2)').evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }));
  expect(previews.map(box => Math.round(box.x))).toEqual([34, 34]);
  expect(previews.map(box => Math.round(box.y))).toEqual([316, 529]);
  expect(previews.map(box => Math.round(box.width))).toEqual([322, 322]);
  expect(previews.map(box => Math.round(box.height))).toEqual([116, 116]);
  await expectNoPageOverflow(page);
  const images = page.locator('#lists a[href*="/lists/public/"] img');
  await expect(images).toHaveCount(10);
  await expect.poll(() => images.evaluateAll(nodes => nodes.every(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(images.evaluateAll(nodes => nodes.map(node => new URL((node as HTMLImageElement).src).pathname))).resolves.toEqual(Array.from({ length: 10 }, (_, index) => `/list-${index + 1}.png`));
  const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261126", "search-results-mobile");
  mkdirSync(evidenceDir, { recursive: true });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.screenshot({ path: path.join(evidenceDir, "rewind-search-lists-dune-en-mobile-393x852.png"), fullPage: true });
});

test("READY mobile journal results match source artwork and the 393px editorial cards", async ({ page }) => {
  await mockSearch(page, false, true);
  await page.setViewportSize({ width: 393, height: 1150 });
  await page.goto("/en/search?q=dune&tab=journal");

  const cards = page.locator('#journal a[href*="/journal/"]');
  await expect(cards).toHaveCount(3);
  const boxes = await cards.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }));
  expect(boxes.map(box => Math.round(box.x))).toEqual([16, 16, 16]);
  expect(boxes.map(box => Math.round(box.y))).toEqual([267, 527, 787]);
  expect(boxes.every(box => Math.abs(box.width - 361.507) < 1)).toBe(true);
  expect(boxes.map(box => Math.round(box.height))).toEqual([236, 236, 236]);
  const navigation = await page.getByRole("navigation", { name: "Main navigation" }).evaluate(element => element.getBoundingClientRect().top);
  expect(navigation).toBe(1058);
  await expectNoPageOverflow(page);
  const images = page.locator('#journal a[href*="/journal/"] img');
  await expect(images).toHaveCount(3);
  await expect.poll(() => images.evaluateAll(nodes => nodes.every(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(images.evaluateAll(nodes => nodes.map(node => new URL((node as HTMLImageElement).src).pathname))).resolves.toEqual(["/journal-01.png", "/journal-02.png", "/journal-03.png"]);
  const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261126", "search-results-mobile");
  mkdirSync(evidenceDir, { recursive: true });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.screenshot({ path: path.join(evidenceDir, "rewind-search-journal-dune-en-mobile-393x1150.png"), fullPage: true });
});

test("desktop expanded search exposes all result categories", async ({ page }, testInfo) => {
  await mockSearch(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/search?q=dune");

  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  await page.getByRole("button", { name: "Show more results" }).click();
  for (const category of ["films", "reviews", "users", "people", "tags", "lists", "journal"]) {
    await expect(main.locator(`#${category}`)).toBeVisible();
  }
  await expectNoPageOverflow(page);
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.screenshot({ path: testInfo.outputPath("search-expanded-desktop-1440.png"), fullPage: true });
});

test("READY expanded search desktop follows the Figma Dune result composition", async ({ page }) => {
  const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261124", "search-expanded-desktop");
  mkdirSync(evidenceDir, { recursive: true });
  await mockSearch(page, true);
  await page.setViewportSize({ width: 1440, height: 4188 });
  await page.goto("/en/search?q=dune");
  await page.getByRole("button", { name: "Show more results" }).click();

  for (const [category, count] of [["films", 6], ["reviews", 4], ["users", 3], ["tags", 7], ["lists", 2], ["journal", 3]] as const) {
    const section = page.locator(`#${category}`);
    await expect(section).toBeVisible();
    const selector = category === "films" ? '[class*=filmGrid] > article'
      : category === "reviews" ? '[class*=reviewGrid] > article'
        : category === "tags" ? '[class*=tagGrid] > a'
          : category === "users" ? '[class*=userGrid] > a'
            : category === "lists" ? '[class*=listGrid] > a' : '[class*=articleGrid] > a';
    await expect(section.locator(selector)).toHaveCount(count);
  }
  for (const selector of ["#films img", "#reviews img", "#users img", "#lists img", "#journal img"]) {
    const images = page.locator(selector);
    await expect.poll(() => images.evaluateAll(nodes => nodes.length > 0 && nodes.every(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0))).toBe(true);
  }
  await expect(page.locator("#people")).toHaveCount(0);
  await expect(page.locator("#users a").first()).toContainText("38 followers, following 15");
  const anchors = await page.evaluate(() => {
    const box = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y: y + window.scrollY, width, height };
    };
    return {
      firstPoster: box("#films article a"),
      firstReview: box("#reviews article"),
      firstUser: box("#users a"),
      tags: box('#tags [class*=tagGrid]'),
      firstList: box('#lists [class*=listGrid] > a'),
      firstArticle: box("#journal a"),
      footer: box("footer"),
      pageHeight: document.documentElement.scrollHeight,
    };
  });
  expect(anchors.firstPoster?.y).toBe(377);
  expect(anchors.firstReview?.y).toBeCloseTo(692, 0);
  expect(anchors.firstUser?.y).toBeCloseTo(2104, 0);
  expect(anchors.tags?.y).toBeCloseTo(2575, 0);
  expect(anchors.firstList?.y).toBeCloseTo(2662, 0);
  expect(anchors.firstArticle?.y).toBeCloseTo(3416, 0);
  expect(anchors.footer?.y).toBe(3923);
  expect(anchors.pageHeight).toBe(4188);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(evidenceDir, "rewind-search-expanded-dune-en-desktop-1440x4188.png"), fullPage: true });
});

test("long localized search results stay within every responsive viewport and desktop card", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const mutations = await mockSearch(page);
  for (const locale of locales) {
    for (const width of widths) {
      await test.step(`${locale} at ${width}px`, async () => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}/search?q=cinema`);
        const main = page.getByRole("main");
        await expect(main).toHaveAttribute("aria-busy", "false");
        const films = main.locator("#films article");
        await expect(films).toHaveCount(6);
        await expect(main.locator('#journal a[href*="/journal/"]')).toHaveCount(3);
        await expect(main.locator('#lists a[href*="/lists/public/"]')).toHaveCount(1);
        const firstFilm = response(locale, false).films.content[0];
        await expect(films.first().locator(":scope > a")).toHaveAccessibleName(`${firstFilm.title} ${locale === "uk" ? "Постер" : "Poster"}`);
        const fallback = films.first().locator('[class*="posterFallback"] > span');
        await expect(fallback).toBeVisible();
        expect(await fallback.evaluate(element => {
          const text = element.getBoundingClientRect();
          const poster = element.closest('a')!.getBoundingClientRect();
          const heading = element.closest('article')!.querySelector('h3')!.getBoundingClientRect();
          return text.top >= poster.top && text.bottom <= poster.bottom && (!heading.height || text.bottom < heading.top);
        })).toBe(true);
        await expectNoPageOverflow(page);
        if (locale === "en" && (width === 393 || width === 1440)) await page.screenshot({ path: testInfo.outputPath(`search-${width}-fixture.png`), fullPage: true });
        if (width >= 1024) {
          await expectContentsWithin(films, "h3, p");
          await expectContentsWithin(main.locator("#reviews article"), '[class*="reviewBody"], [class*="reviewMeta"], p');
          await expectContentsWithin(main.locator('#lists a[href*="/lists/public/"]'), '[class*="listSummary"], h3, p, small');
          await expectContentsWithin(main.locator('#journal a[href*="/journal/"]'), ":scope > div, h3, p, small");
        }
      });
    }
  }
  expect(mutations).toEqual([]);
});

test("desktop categories remain visible and keyboard tabs reveal their focused control", async ({ page }) => {
  test.setTimeout(60_000);
  await mockSearch(page);
  for (const locale of locales) {
    for (const width of desktopWidths) {
      await test.step(`${locale} at ${width}px`, async () => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}/search?q=cinema`);
        await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
        const select = page.getByRole("combobox", { name: locale === "uk" ? "Показати результати" : "Show results for", exact: true });
        await expect(select).toBeVisible();
        await select.selectOption("journal");
        await expect(page).toHaveURL(/tab=journal/);
        await expect(page.locator("#journal")).toBeVisible();
        await expect(page.locator("#films")).toHaveCount(0);
        await select.focus();
        await page.keyboard.press("Tab");
        const journal = page.getByRole("tab", { name: locale === "uk" ? "Журнал" : "Journal", exact: true });
        const tabs = page.getByRole("tablist");
        await expect(journal).toBeFocused();
        await expect(tabs).toHaveCSS("clip-path", "none");
        expect(await journal.evaluate(element => {
          const box = element.getBoundingClientRect();
          return box.width > 20 && box.height > 20 && document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)?.closest('[role="tab"]') === element;
        })).toBe(true);
        await page.keyboard.press("ArrowLeft");
        const reviews = page.getByRole("tab", { name: locale === "uk" ? "Огляди" : "Reviews", exact: true });
        await expect(reviews).toBeFocused();
        await expect(page).toHaveURL(/tab=reviews/);
        await page.keyboard.press("Tab");
        await expect(page.getByRole("tabpanel")).toBeFocused();
        await expect(select).toBeVisible();
        await expectNoPageOverflow(page);
      });
    }
  }
});

test("localized responsive empty states return home with keyboard access", async ({ page }, testInfo) => {
  await mockSearch(page);
  for (const locale of locales) {
    for (const width of widths) {
      await test.step(`${locale} at ${width}px`, async () => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}/search?q=missing`);
        await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
        const empty = page.locator('main section[class*="noMatches"]');
        await expect(empty).toBeVisible();
        if (width >= 1024) await expectTextWithinViewport(empty.locator("h2, p"), width);
        else await expectContentsWithin(empty, ":scope > p, h2, a");
        const home = empty.getByRole("link", { name: locale === "uk" ? "На головну" : "Back to home", exact: true });
        await expect(home).toHaveAttribute("href", `/${locale}/home`);
        await home.focus();
        await expect(home).toBeFocused();
        if (locale === "en" && (width === 393 || width === 1440)) await page.screenshot({ path: testInfo.outputPath(`search-empty-${width}.png`), fullPage: true });
        if (locale === "en" && width === 1440) {
          const anchors = await page.evaluate(() => Object.fromEntries(['main [class*="matchesHeading"]', 'main section[class*="noMatches"] h2', 'main section[class*="noMatches"] > p:not([class*="sectionKicker"])', 'main a[class*="noMatchesAction"]'].map(selector => {
            const box = document.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
            return [selector, { x: box.x, y: box.y, width: box.width, height: box.height }];
          })));
          expect(anchors['main [class*="matchesHeading"]'].y).toBeCloseTo(280, 0);
          expect(anchors['main section[class*="noMatches"] h2'].y).toBeCloseTo(377, 0);
          expect(anchors['main section[class*="noMatches"] > p:not([class*="sectionKicker"])'].y).toBeCloseTo(515, 0);
          expect(anchors['main a[class*="noMatchesAction"]'].y).toBeCloseTo(610, 0);
        }
        expect(await home.evaluate(element => {
          const box = element.getBoundingClientRect();
          return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)?.closest("a") === element;
        })).toBe(true);
        await expectNoPageOverflow(page);
        await home.press("Enter");
        await expect(page).toHaveURL(new RegExp(`/${locale}/home$`));
      });
    }
  }
});
