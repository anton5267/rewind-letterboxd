import { expect, test, type BrowserContext } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { installHostedAuthFixture } from "./fixtures/hosted-auth";

const poster = "https://images.example.invalid/oppenheimer-poster.svg";
const backdrop = "https://images.example.invalid/oppenheimer-backdrop.png";
const reviews = {
  content: [
    { id: 610, userId: 52, username: "Thespotxxx", content: "A ridiculous achievement in filmmaking. An absolutely immersive and heart-pounding experience. Cillian Murphy is a fucking stud and RDJ will be a front-runner for Best Supporting Actor. Ludwig Göransson put his entire musical intro into a story, coupled with a sound design that made me feel like I took a bomb to the chest.", rating: 4.5, createdAt: "2025-12-09T12:00:00Z" },
    { id: 611, userId: 53, username: "Carlotta", content: "Wow, wow, wow. Oppenheimer is the best movie I have seen this year. Christopher Nolan turns a real historical event into a compelling story that feels like a fictional journey. A remarkable achievement.", rating: 5, createdAt: "2025-12-08T12:00:00Z" },
  ],
  number: 0, size: 10, totalElements: 2, totalPages: 1,
};
// Preserve the visible left-to-right Figma order for this local source-data fixture.
const similarTitles = ["Tenet", "Dune: Part Two", "Top Gun: Maverick", "Barbie", "Gladiator", "Se7en"];

async function installOppenheimerFixture(context: BrowserContext) {
  await installHostedAuthFixture(context);
  const sourcePoster = await readFile(resolve(import.meta.dirname, "fixtures/figma/public-list/oppenheimer.png"));
  const sourceBackdrop = await readFile(resolve(import.meta.dirname, "fixtures/figma/movie-similar/oppenheimer-backdrop.png"));
  const sourceSimilarPosters = await Promise.all([
    "tenet.png",
    "dune-part-two.png",
    "top-gun-maverick.png",
    "barbie.png",
    "gladiator.png",
    "se7en.png",
  ].map(name => readFile(resolve(import.meta.dirname, `fixtures/figma/movie-similar/${name}`))));
  const sourceCrewPortraits = await Promise.all([
    "christopher-nolan.png",
    "cillian-murphy.png",
    "emily-blunt.png",
    "robert-downey-jr.png",
    "matt-damon.png",
    "scott-grimes.png",
    "jason-clarke.png",
  ].map(name => readFile(resolve(import.meta.dirname, `fixtures/figma/movie-similar/${name}`))));
  await context.route("https://images.example.invalid/**", route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.includes("oppenheimer-poster")) return route.fulfill({ contentType: "image/png", body: sourcePoster });
    if (pathname.includes("oppenheimer-backdrop")) return route.fulfill({ contentType: "image/png", body: sourceBackdrop });
    const similarMatch = pathname.match(/similar-(\d+)\.png$/);
    if (similarMatch) {
      const image = sourceSimilarPosters[Number(similarMatch[1])];
      if (image) return route.fulfill({ contentType: "image/png", body: image });
    }
    const crewMatch = pathname.match(/crew-(\d+)\.png$/);
    if (crewMatch) {
      const image = sourceCrewPortraits[Number(crewMatch[1])];
      if (image) return route.fulfill({ contentType: "image/png", body: image });
    }
    const isBackdrop = pathname.includes("backdrop");
    const similarIndex = Number(pathname.match(/similar-(\d+)/)?.[1] ?? 0);
    const label = isBackdrop ? "Oppenheimer backdrop" : similarTitles[similarIndex] ?? "Similar film";
    const width = isBackdrop ? 1200 : 600;
    const height = isBackdrop ? 700 : 900;
    return route.fulfill({ contentType: "image/svg+xml", body: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${isBackdrop ? "#363638" : "#242426"}"/><text x="${width/2}" y="${height/2}" fill="white" font-family="Arial" font-size="${isBackdrop ? 60 : 34}" text-anchor="middle">${label}</text></svg>` });
  });
  await context.route(url => new URL(url).pathname.startsWith("/api/"), route => {
    const url = new URL(route.request().url());
    const { pathname } = url;
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: { message: "Unauthenticated" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: { message: "Unauthenticated" } });
    if (pathname === "/api/movies/85/details") return route.fulfill({ json: {
      id: 85, title: "Oppenheimer", imdbId: "tt15398776", shortPlot: "The story of J. Robert Oppenheimer and his role in the development of the atomic bomb. As the director of the Los Alamos Laboratory, he changed the course of history forever.",
      photoUrl: poster, backdropUrl: backdrop, releaseDate: "2023-07-21", durationMinutes: 180, ageRating: "R", rating: 4.2,
      trailerUrl: "https://example.invalid/oppenheimer-trailer", genres: [{ id: 1, name: "Drama" }, { id: 2, name: "History" }, { id: 3, name: "Period Drama" }],
      actors: [
        ["Cillian Murphy", "Robert Oppenheimer"],
        ["Emily Blunt", "Kitty Oppenheimer"],
        ["Robert Downey Jr.", "Lewis Strauss"],
        ["Matt Damon", "Leslie Groves"],
        ["Scott Grimes", "Counsel"],
        ["Jason Clarke", "Roger Robb"],
      ].map(([name, characterName], index) => ({ id: index + 1, name, photoUrl: `https://images.example.invalid/crew-${index + 1}.png`, characterName })),
      directors: [{ id: 1, name: "Christopher Nolan", photoUrl: "https://images.example.invalid/crew-0.png" }], producers: [],
      externalRatings: [{ source: "IMDb", rating: 8.3 }, { source: "RT", rating: 93 }, { source: "MC", rating: 90 }],
      similarMovies: similarTitles.map((title, index) => ({ id: 100 + index, title, releaseDate: `${2024 - index}-01-01`, rating: 4.2, photoUrl: `https://images.example.invalid/similar-${index}.png` })),
      myFlags: { watched: false, watchlist: false, favorites: false },
    } });
    if (pathname === "/api/movies/85/reviews") return route.fulfill({ json: reviews });
    if (pathname === "/api/movies/85/rating/me") return route.fulfill({ json: { rating: 0 } });
    if (pathname === "/api/lists/my") return route.fulfill({ json: [] });
    if (pathname === "/api/reviews/610/likes") return route.fulfill({ json: 331 });
    if (pathname === "/api/reviews/611/likes") return route.fulfill({ json: 217 });
    if (pathname === "/api/reviews/610/like-status") return route.fulfill({ json: { liked: false, likes: 331 } });
    if (pathname === "/api/reviews/611/like-status") return route.fulfill({ json: { liked: false, likes: 217 } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: { content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 } });
  });
}

test("READY Oppenheimer public film details match desktop Figma composition", async ({ context, page }) => {
  await installOppenheimerFixture(context);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/uk/films/85");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  await expect(page.getByRole("heading", { level: 1, name: "Oppenheimer" })).toBeVisible();
  const posterImage = page.locator("main [class*=posterFrame] img");
  await expect(posterImage).toBeVisible();
  await expect.poll(() => posterImage.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const backdropImage = page.locator("main [class*=heroBackdrop]");
  await expect.poll(() => backdropImage.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(1440);
  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return null;
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      pageHeight: document.documentElement.scrollHeight,
      poster: rect("main [class*=posterFrame] img"),
      title: rect("#movie-title"),
      trailer: rect("main [class*=posterTrailer]") ,
      actions: rect("main section[aria-label*=дії]"),
      rating: rect('section[aria-labelledby="mobile-rating-title"] h2'),
      ratingSection: rect('section[aria-labelledby="mobile-rating-title"]'),
      crew: rect('section[aria-labelledby="mobile-crew-title"] h2'),
      crewSection: rect('section[aria-labelledby="mobile-crew-title"]'),
      crewRail: rect('section[aria-labelledby="mobile-crew-title"] [class*=crewRail]'),
      crewCardCount: document.querySelectorAll('section[aria-labelledby="mobile-crew-title"] [class*=crewCard]').length,
      crewPortraitDimensions: Array.from(document.querySelectorAll<HTMLImageElement>('section[aria-labelledby="mobile-crew-title"] img'), image => ({ width: image.naturalWidth, height: image.naturalHeight })),
      reviewSection: rect('section[aria-labelledby="reviews-title"]'),
      reviews: rect('section[aria-labelledby="reviews-title"] h2'),
      reviewCards: Array.from(document.querySelectorAll<HTMLElement>('section[aria-labelledby="reviews-title"] article[class*=review]')).map(item => {
        const { x, y, width, height } = item.getBoundingClientRect();
        return { x, y, width, height };
      }),
      similar: rect('section[aria-labelledby="similar-title"]'),
      similarGrid: rect("main [class*=similarGrid]"),
      storyline: rect('section[aria-labelledby="storyline-title"]'),
      storylineCard: rect("main [class*=storylineCard]"),
      footer: rect("footer"),
      overflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
  await expect(page.locator('section[aria-labelledby="similar-title"] [class*=similarTitle]')).toHaveText(similarTitles);
  const similarPosterDimensions = await page.locator('section[aria-labelledby="similar-title"] img').evaluateAll(images =>
    images.map(image => ({ width: (image as HTMLImageElement).naturalWidth, height: (image as HTMLImageElement).naturalHeight })),
  );
  expect(similarPosterDimensions).toEqual(Array.from({ length: 6 }, () => ({ width: 174, height: 260 })));
  expect(geometry.overflow).toBe(0);
  expect(geometry.pageHeight).toBe(3579);
  expect(geometry.crewCardCount).toBe(7);
  expect(geometry.crewPortraitDimensions).toEqual(Array.from({ length: 7 }, () => ({ width: 135, height: 135 })));
  expect(geometry.reviewCards).toHaveLength(2);
  for (const [index, card] of geometry.reviewCards.entries()) {
    expect(card.x).toBe(index === 0 ? 120 : 736);
    expect(card.y).toBeCloseTo(1853, 0);
    expect(card.width).toBe(584);
    expect(card.height).toBe(315);
  }
  expect(geometry.similarGrid?.x).toBe(120);
  expect(geometry.similarGrid?.y).toBeCloseTo(2353, 0);
  expect(geometry.similarGrid?.width).toBe(1200);
  expect(geometry.storylineCard?.x).toBe(120);
  expect(geometry.storylineCard?.y).toBeCloseTo(2798, 0);
  expect(geometry.storylineCard?.width).toBe(1200);
  expect(geometry.storylineCard?.height).toBe(356);
  expect(geometry.footer?.y).toBeCloseTo(3314, 0);
  expect(geometry.footer?.height).toBe(265);
  await mkdir(resolve(process.cwd(), "../artifacts/visual-audit-20261125/films"), { recursive: true });
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261125/films/oppenheimer-uk-desktop-1440.png"), fullPage: true });
});

test("READY Oppenheimer film details stay responsive in UK and EN", async ({ context, page }) => {
  await installOppenheimerFixture(context);
  for (const locale of ["uk", "en"] as const) {
    for (const width of [320, 360, 393, 600, 720, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width >= 1024 ? 900 : 852 });
      await page.goto(`/${locale}/films/85`);
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
      await expect(page.getByRole("heading", { level: 1, name: "Oppenheimer" })).toBeVisible();
      await expect(page.locator('section[aria-labelledby="similar-title"] img')).toHaveCount(6);

      const metrics = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(metrics.scrollWidth, `${locale} Oppenheimer ${width}px horizontal overflow`).toBeLessThanOrEqual(metrics.width);

      if (width === 393) {
        const posterImage = page.locator("main [class*=posterFrame] img");
        await expect.poll(() => posterImage.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
        await mkdir(resolve(process.cwd(), "../artifacts/visual-audit-20261126/films"), { recursive: true });
        await page.screenshot({ path: resolve(process.cwd(), `../artifacts/visual-audit-20261126/films/oppenheimer-${locale}-mobile-393.png`), fullPage: true });
      }
    }
  }
});
