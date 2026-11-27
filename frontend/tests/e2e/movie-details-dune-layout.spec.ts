import { expect, test } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

const plot = "It begins.\n\nA mythic and emotionally charged hero's journey, Dune follows Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, who must travel to the most dangerous planet in the universe to ensure the future of his family and his people.";
const details = {
  id: 35, title: "Dune", imdbId: null, shortPlot: plot, photoUrl: "https://dune-movie-fixture.invalid/poster.png", backdropUrl: "https://dune-movie-fixture.invalid/backdrop.png",
  releaseDate: "2021-10-22", durationMinutes: 155, ageRating: "12+", rating: 3.9,
  trailerUrl: "https://example.invalid/dune-trailer", genres: [{ id: 1, name: "Action" }],
  actors: [
    { id: 2, name: "Timothée Chalamet", characterName: "Paul Atreides", photoUrl: "https://dune-movie-fixture.invalid/cast-02.png" },
    { id: 3, name: "Rebecca Ferguson", characterName: "Lady Jessica Atreides", photoUrl: "https://dune-movie-fixture.invalid/cast-03.png" },
    { id: 4, name: "Zendaya", characterName: "Chani", photoUrl: "https://dune-movie-fixture.invalid/cast-04.png" },
    { id: 5, name: "Oscar Isaac", characterName: "Duke Leto Atreides", photoUrl: "https://dune-movie-fixture.invalid/cast-05.png" },
    { id: 6, name: "Jason Momoa", characterName: "Duncan Idaho", photoUrl: "https://dune-movie-fixture.invalid/cast-06.png" },
    { id: 7, name: "Stellan Skarsgård", characterName: "Baron Vladimir Harkonnen", photoUrl: "https://dune-movie-fixture.invalid/cast-07.png" },
  ],
  directors: [{ id: 1, name: "Denis Villeneuve", photoUrl: "https://dune-movie-fixture.invalid/cast-01.png" }], producers: [],
  externalRatings: [{ source: "IMDb", rating: 8.0 }, { source: "RT", rating: 83 }, { source: "MC", rating: 74 }],
  similarMovies: [
    { id: 36, title: "Dune: Part Two", releaseDate: "2024-02-27", rating: null, photoUrl: "https://dune-movie-fixture.invalid/similar-film-01.png" },
    { id: 37, title: "Star Wars: Episode I — The Phantom Menace", releaseDate: "1999-05-19", rating: null, photoUrl: "https://dune-movie-fixture.invalid/similar-film-02.png" },
    { id: 38, title: "Rogue One: A Star Wars Story", releaseDate: "2016-12-16", rating: null, photoUrl: "https://dune-movie-fixture.invalid/similar-film-03.png" },
    { id: 39, title: "Blade Runner 2049", releaseDate: "2017-10-04", rating: null, photoUrl: "https://dune-movie-fixture.invalid/similar-film-04.png" },
    { id: 40, title: "Avatar: The Way of Water", releaseDate: "2022-12-16", rating: null, photoUrl: "https://dune-movie-fixture.invalid/similar-film-05.png" },
    { id: 41, title: "The Matrix", releaseDate: "1999-03-31", rating: null, photoUrl: "https://dune-movie-fixture.invalid/similar-film-06.png" },
  ],
  myFlags: null,
};
const duneFigmaSimilarArtwork: Array<[string, string]> = [
  ["Dune: Part Two", "similar-film-01.png"],
  ["Star Wars: Episode I — The Phantom Menace", "similar-film-02.png"],
  ["Rogue One: A Star Wars Story", "similar-film-03.png"],
  ["Blade Runner 2049", "similar-film-04.png"],
  ["Avatar: The Way of Water", "similar-film-05.png"],
  ["The Matrix", "similar-film-06.png"],
];
const reviewPage = {
  content: [
    { id: 610, userId: 21, username: "Matt Singer", content: "A thoughtful science fiction epic gives its characters and world room to breathe. The patient pace makes Arrakis feel immense, while the images and performances keep the story grounded in Paul’s difficult choices and the people around him.", rating: 4.5, createdAt: "2025-12-09T12:00:00Z" },
    { id: 611, userId: 22, username: "James Schaffrillas", content: "The story has room to breathe, and the images make the world feel immense. Villeneuve builds a convincing future society with patient direction, sharp production design, and a strong central performance; each scene adds another layer to the film’s strange, compelling world.", rating: 4.5, createdAt: "2025-12-09T12:00:00Z" },
  ], number: 0, size: 10, totalElements: 2, totalPages: 1,
};

test("Dune phone composition grows with plot and storyline content", async ({ page }) => {
  await page.route("https://dune-movie-fixture.invalid/**", async route => {
    const filename = new URL(route.request().url()).pathname.slice(1);
    const body = await readFile(resolve(process.cwd(), "tests/e2e/fixtures/movie-dune-figma", filename));
    return route.fulfill({ contentType: "image/png", body });
  });
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "dune-layout-fixture" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/movies/35/details", route => route.fulfill({ json: details }));
  await page.route("**/api/movies/35/reviews**", route => route.fulfill({ json: reviewPage }));
  await page.route("**/api/reviews/610/likes", route => route.fulfill({ json: 12 }));
  await page.route("**/api/reviews/611/likes", route => route.fulfill({ json: 3 }));

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261126/dune-film-detail");
  await mkdir(captureDirectory, { recursive: true });
  for (const locale of ["uk", "en"] as const) {
    for (const width of [320, 393, 600, 720, 768, 1024, 1440]) {
      const height = locale === "uk" && width === 393 ? 2245 : 900;
      await page.setViewportSize({ width, height });
      await page.goto(`/${locale}/films/35`);
      await expect(page.getByRole("heading", { level: 1, name: "Dune" })).toBeVisible();
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
      await expect.poll(() => page.locator('img[src="https://dune-movie-fixture.invalid/poster.png"]').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      if (locale === "uk" && width === 393) {
        const crewCards = page.locator('section[aria-labelledby="mobile-crew-title"] a');
        await expect(crewCards).toHaveCount(7);
        await expect(crewCards.nth(0)).toContainText("Denis Villeneuve");
        await expect(crewCards.nth(1)).toContainText("Timothée Chalamet");
        await expect(crewCards.nth(1)).toContainText("Paul Atreides");
        await expect(crewCards.nth(6)).toContainText("Stellan Skarsgård");
        await expect.poll(() => crewCards.locator("img").evaluateAll(images => images.filter(image => (image as HTMLImageElement).naturalWidth > 0).length)).toBe(7);
        const similarImages = page.locator('section[aria-labelledby="similar-title"] img[src*="dune-movie-fixture"]');
        await similarImages.last().scrollIntoViewIfNeeded();
        await expect.poll(() => similarImages.evaluateAll(images => images.filter(image => (image as HTMLImageElement).naturalWidth > 0).length)).toBe(6);
      }
      const metrics = await page.evaluate(() => {
        const main = document.querySelector("main")!;
        const hero = main.querySelector("section[class*='hero']")!;
        const copy = hero.querySelector("div[class*='heroCopy']")!;
        const plotNode = copy.querySelector("p[class*='plot']")!;
        const poster = hero.querySelector("div[class*='posterFrame']")!;
        const storyline = main.querySelector("section[aria-labelledby='storyline-title'] p")!;
        const rect = (element: Element | null) => {
          if (!element) return null;
          const { x, y, width, height, bottom } = element.getBoundingClientRect();
          return { x, y, width, height, bottom };
        };
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          hero: rect(hero), copy: rect(copy), plot: rect(plotNode), poster: rect(poster),
          title: rect(copy.querySelector("h1")!),
          trailer: rect(hero.querySelector("[class*='posterTrailer'] [class*='textLink']")),
          genres: rect(copy.querySelector("div[class*='genres']")!),
          ratings: rect(main.querySelector("section[aria-labelledby='mobile-rating-title'] h2")!),
          crew: rect(main.querySelector("section[aria-labelledby='mobile-crew-title'] h2")!),
          crewCards: Array.from(main.querySelectorAll<HTMLElement>("section[aria-labelledby='mobile-crew-title'] a"), item => rect(item)),
          reviews: rect(main.querySelector("section[aria-labelledby='reviews-title'] h2")!),
          similar: rect(main.querySelector("section[aria-labelledby='similar-title'] h2")!),
          storylineHeading: rect(main.querySelector("section[aria-labelledby='storyline-title'] h2")!),
          reviewCard: rect(main.querySelector("section[aria-labelledby='reviews-title'] article[class*='review']")),
          reviewCards: Array.from(main.querySelectorAll<HTMLElement>("section[aria-labelledby='reviews-title'] article[class*='review']"), item => rect(item)),
          similarRail: rect(main.querySelector("div[class*='similarGrid']")),
          storylineCard: rect(main.querySelector("div[class*='storylineCard']")),
          storylineTitleRow: rect(main.querySelector("div[class*='storylineTitleRow']")),
          storylineCategory: rect(main.querySelector("h4[class*='storylineDesktopCategory']")),
          storylineMobileCategory: rect(main.querySelector("h4[class*='storylineMobileCategory']")),
          footer: rect(document.querySelector("footer")),
          plotMaxHeight: getComputedStyle(plotNode).maxHeight,
          plotLineClamp: getComputedStyle(plotNode).webkitLineClamp,
          storyline: rect(storyline), storylineScrollHeight: storyline.scrollHeight,
          storylineLineClamp: getComputedStyle(storyline).webkitLineClamp,
          sectionOrder: Array.from(main.querySelectorAll("section[aria-labelledby]"))
            .map(section => section.getAttribute("aria-labelledby")),
        };
      });
      expect(metrics.overflow, `${locale} Dune ${width}px overflow`).toBeLessThanOrEqual(0);
      expect(metrics.plot.height, `${locale} Dune ${width}px plot must grow`).toBeGreaterThan(40);
      expect(metrics.plotMaxHeight).toBe("none");
      expect(metrics.plotLineClamp).toBe("none");
      expect(metrics.storylineLineClamp).toBe("none");
      expect(metrics.storylineScrollHeight).toBeLessThanOrEqual(metrics.storyline.height + 1);
      if (width <= 767) expect(metrics.poster.y).toBeGreaterThan(metrics.plot.bottom);
      if (locale === "en" && width === 393) {
        const sections = metrics.sectionOrder;
        expect(sections.indexOf("mobile-rating-title")).toBeLessThan(sections.indexOf("mobile-crew-title"));
        expect(sections.indexOf("mobile-crew-title")).toBeLessThan(sections.indexOf("reviews-title"));
        expect(sections.indexOf("reviews-title")).toBeLessThan(sections.indexOf("similar-title"));
        expect(sections.indexOf("similar-title")).toBeLessThan(sections.indexOf("storyline-title"));
      }
      if (locale === "uk" && width === 393) {
        const storylineCard = page.locator("div[class*='storylineCard']");
        await expect(storylineCard.locator("h4[class*='storylineMobileCategory']")).toHaveText("ACTION EPIC");
        await expect(storylineCard.locator("h4[class*='storylineMobileCategory']")).toBeVisible();
        await expect(storylineCard.locator("h4[class*='storylineDesktopCategory']")).toBeHidden();
        expect(metrics.title.y).toBeCloseTo(96, 0);
        expect(metrics.hero.height).toBeCloseTo(691, 0);
        expect(metrics.poster.y).toBeCloseTo(471, 0);
        expect(metrics.ratings.y).toBeCloseTo(724, 0);
        expect(metrics.crew.y).toBeCloseTo(849, 0);
        expect(metrics.reviews.y).toBeGreaterThanOrEqual(1077);
        expect(metrics.reviews.y).toBeLessThanOrEqual(1085);
        expect(metrics.reviewCard?.y).toBeCloseTo(1118, 0);
        expect(metrics.reviewCard?.height).toBeGreaterThanOrEqual(194);
        expect(metrics.reviewCard?.height).toBeLessThanOrEqual(200);
        expect(metrics.similar.y).toBeGreaterThanOrEqual(1588);
        expect(metrics.similar.y).toBeLessThanOrEqual(1596);
        expect(metrics.similarRail?.y).toBeGreaterThanOrEqual(1620);
        expect(metrics.similarRail?.y).toBeLessThanOrEqual(1628);
        expect(metrics.similarRail?.height).toBeGreaterThanOrEqual(147);
        expect(metrics.similarRail?.height).toBeLessThanOrEqual(152);
        expect(metrics.storylineHeading.y).toBeGreaterThanOrEqual(1834);
        expect(metrics.storylineHeading.y).toBeLessThanOrEqual(1842);
        expect(metrics.storylineTitleRow?.y).toBeCloseTo(1889.695, 0);
        expect(metrics.storylineMobileCategory?.x).toBeCloseTo(287, 0);
        expect(metrics.storylineMobileCategory?.y).toBeCloseTo(1891.195, 0);
        expect(metrics.storyline?.y).toBeCloseTo(1921.695, 0);
      }
      if (locale === "en" && width === 1440) {
        const similarArtwork = await page.locator('section[aria-labelledby="similar-title"] a[class*="similarCard"]').evaluateAll(cards => cards.map(card => ({
          title: card.getAttribute("aria-label"),
          image: card.querySelector("img")?.getAttribute("src")?.split("/").at(-1),
        })));
        expect(similarArtwork).toEqual(duneFigmaSimilarArtwork.map(([title, image]) => ({ title, image })));
        expect(metrics.title.y).toBeCloseTo(601, 0);
        expect(metrics.poster).toMatchObject({ x: 120, y: 538, width: 275 });
        expect(metrics.poster.height).toBeGreaterThanOrEqual(493);
        expect(metrics.poster.height).toBeLessThanOrEqual(498);
        expect(metrics.plot.y).toBeCloseTo(745, 0);
        expect(metrics.trailer).toMatchObject({ x: 120, width: 275, height: 59 });
        expect(metrics.trailer?.y).toBeGreaterThanOrEqual(971);
        expect(metrics.trailer?.y).toBeLessThanOrEqual(979);
        expect(metrics.genres.y).toBeCloseTo(974, 0);
        expect(metrics.ratings.y).toBeCloseTo(1203, 0);
        expect(metrics.crew.y).toBeGreaterThanOrEqual(1386);
        expect(metrics.crew.y).toBeLessThanOrEqual(1393);
        expect(metrics.crewCards).toHaveLength(7);
        expect(metrics.crewCards[0]?.x).toBeCloseTo(120, 0);
        expect(metrics.crewCards[0]?.y).toBeCloseTo(1471, 0);
        expect(metrics.crewCards[0]?.width).toBeCloseTo(160, 0);
        expect(metrics.crewCards[6]?.x).toBeCloseTo(1158, 0);
        expect(metrics.crewCards[6]?.y).toBeCloseTo(1471, 0);
        expect(metrics.crewCards[6]?.width).toBeCloseTo(160, 0);
        expect(metrics.storylineCard?.x).toBeCloseTo(120, 0);
        expect(metrics.storylineCard?.y).toBeCloseTo(2798, 0);
        expect(metrics.storylineCard?.width).toBeCloseTo(1200, 0);
        expect(metrics.storylineCard?.height).toBeCloseTo(283, 0);
        expect(metrics.storylineCategory?.x).toBeCloseTo(175, 0);
        expect(metrics.storylineCategory?.y).toBeCloseTo(2865, 0);
        expect(metrics.storyline?.x).toBeCloseTo(175, 0);
        expect(metrics.storyline?.y).toBeCloseTo(2918, 0);
        expect(metrics.storyline?.width).toBeCloseTo(1081, 0);
        expect(metrics.footer?.x).toBeCloseTo(0, 0);
        expect(metrics.footer?.y).toBeCloseTo(3241, 0);
        expect(metrics.footer?.width).toBeCloseTo(1440, 0);
        expect(metrics.footer?.height).toBeCloseTo(265, 0);
        expect(metrics.reviews.y).toBeCloseTo(1753, 0);
        expect(metrics.reviewCard?.x).toBe(120);
        expect(metrics.reviewCard?.y).toBeCloseTo(1853, 0);
        expect(metrics.reviewCard?.width).toBe(590);
        expect(metrics.reviewCard?.height).toBe(315);
        expect(metrics.reviewCards[1]?.x).toBe(730);
        expect(metrics.similar.y).toBeGreaterThanOrEqual(2270);
        expect(metrics.similar.y).toBeLessThanOrEqual(2273);
        expect(metrics.similarRail?.y).toBeGreaterThanOrEqual(2350);
        expect(metrics.similarRail?.y).toBeLessThanOrEqual(2356);
        expect(metrics.similarRail?.height).toBeCloseTo(260, 0);
        expect(metrics.storylineHeading.y).toBeGreaterThanOrEqual(2715);
        expect(metrics.storylineHeading.y).toBeLessThanOrEqual(2718);
      }
      if ((locale === "uk" && width === 393) || (locale === "en" && width === 1440)) {
        await page.screenshot({ path: resolve(captureDirectory, `movie-dune-${locale}-${width}-fixture.png`) });
      }
    }
  }
});

test("Dune desktop Figma composition includes member actions when signed in", async ({ page, context }) => {
  await installHostedAuthFixture(context);
  await page.route("https://dune-movie-fixture.invalid/**", async route => {
    const filename = new URL(route.request().url()).pathname.slice(1);
    const body = await readFile(resolve(process.cwd(), "tests/e2e/fixtures/movie-dune-figma", filename));
    return route.fulfill({ contentType: "image/png", body });
  });
  await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: 99035, username: "dune-member", role: "USER" } });
    if (pathname === "/api/movies/35/details") return route.fulfill({ json: { ...details, myFlags: { watched: false, favorites: false, watchlist: false } } });
    if (pathname === "/api/movies/35/reviews") return route.fulfill({ json: reviewPage });
    if (pathname === "/api/movies/35/rating/me") return route.fulfill({ json: { rating: 0 } });
    if (pathname === "/api/lists/my") return route.fulfill({ json: [] });
    if (pathname.includes("/likes")) return route.fulfill({ json: 0 });
    return route.fulfill({ status: 204 });
  });
  await signInHostedFixture(page, "en");
  await page.setViewportSize({ width: 1440, height: 3506 });
  await page.goto("/en/films/35");

  const actions = page.getByRole("region", { name: "My actions" });
  await expect(page.getByRole("heading", { level: 1, name: "Dune" })).toBeVisible();
  await expect(actions).toBeVisible();
  await expect(actions.getByRole("button", { name: "Watched" })).toBeVisible();
  await expect(actions.getByRole("button", { name: "Favorite" })).toBeVisible();
  await expect(actions.getByRole("button", { name: "Watchlist" })).toBeVisible();
  await expect(actions.getByRole("button", { name: "Add to lists" })).toBeVisible();
  await expect(actions.getByRole("button", { name: "Review" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ratings & Reviews" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cast & Crew" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Similar films" })).toBeVisible();
  await expect.poll(() => page.locator('img[src="https://dune-movie-fixture.invalid/poster.png"]').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect.poll(() => page.locator('img[src*="dune-movie-fixture"]').evaluateAll(images => images.filter(image => (image as HTMLImageElement).naturalWidth > 0).length)).toBeGreaterThan(10);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261127/dune-film-detail/movie-dune-en-1440-member.png"), fullPage: true });
});
