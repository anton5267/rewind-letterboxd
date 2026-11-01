import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const plot = "It begins.\n\nA mythic and emotionally charged hero's journey, Dune follows Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, who must travel to the most dangerous planet in the universe to ensure the future of his family and his people.";
const details = {
  id: 35, title: "Dune", imdbId: null, shortPlot: plot, photoUrl: null, backdropUrl: null,
  releaseDate: "2021-10-22", durationMinutes: 155, ageRating: "12+", rating: 3.9,
  trailerUrl: "https://example.invalid/dune-trailer", genres: [{ id: 1, name: "Action" }],
  actors: [
    { id: 1, name: "Denis Villeneuve", characterName: null },
    { id: 2, name: "Timothée Chalamet", characterName: "Paul Atreides" },
    { id: 3, name: "Rebecca Ferguson", characterName: "Lady Jessica Atreides" },
    { id: 4, name: "Zendaya", characterName: "Chani" },
  ],
  directors: [{ id: 1, name: "Denis Villeneuve" }], producers: [],
  externalRatings: [{ source: "IMDb", rating: 8.0 }, { source: "RT", rating: 83 }, { source: "MC", rating: 74 }],
  similarMovies: [
    { id: 36, title: "Dune: Part Two", releaseDate: "2024-02-27", rating: 8.5, photoUrl: null },
    { id: 37, title: "Arrival", releaseDate: "2016-11-10", rating: 7.9, photoUrl: null },
    { id: 38, title: "Blade Runner 2049", releaseDate: "2017-10-04", rating: 8.0, photoUrl: null },
    { id: 39, title: "Interstellar", releaseDate: "2014-11-05", rating: 8.7, photoUrl: null },
  ],
  myFlags: null,
};
const reviewPage = {
  content: [
    { id: 610, userId: 21, username: "Matt Singer", content: "A thoughtful science fiction epic with room for its characters and world to breathe.", rating: 4.5, createdAt: "2025-12-09T12:00:00Z" },
    { id: 611, userId: 22, username: "James Schaffrillas", content: "The story has room to breathe, and the images make the world feel immense.", rating: 4.5, createdAt: "2025-12-09T12:00:00Z" },
  ], number: 0, size: 10, totalElements: 2, totalPages: 1,
};

test("Dune phone composition grows with plot and storyline content", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "dune-layout-fixture" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/movies/35/details", route => route.fulfill({ json: details }));
  await page.route("**/api/movies/35/reviews**", route => route.fulfill({ json: reviewPage }));
  await page.route("**/api/reviews/610/likes", route => route.fulfill({ json: 12 }));
  await page.route("**/api/reviews/611/likes", route => route.fulfill({ json: 3 }));

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261101/dune-mobile-refresh");
  await mkdir(captureDirectory, { recursive: true });
  for (const locale of ["uk", "en"] as const) {
    for (const width of [320, 393, 600, 720, 768, 1024, 1440]) {
      const height = locale === "uk" && width === 393 ? 2245 : locale === "en" && width === 1440 ? 3506 : 900;
      await page.setViewportSize({ width, height });
      await page.goto(`/${locale}/films/35`);
      await expect(page.getByRole("heading", { level: 1, name: "Dune" })).toBeVisible();
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
      const metrics = await page.evaluate(() => {
        const main = document.querySelector("main")!;
        const hero = main.querySelector("section[class*='hero']")!;
        const copy = hero.querySelector("div[class*='heroCopy']")!;
        const plotNode = copy.querySelector("p[class*='plot']")!;
        const poster = hero.querySelector("div[class*='posterFrame']")!;
        const storyline = main.querySelector("section[aria-labelledby='storyline-title'] p")!;
        const rect = (element: Element) => {
          const { x, y, width, height, bottom } = element.getBoundingClientRect();
          return { x, y, width, height, bottom };
        };
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          hero: rect(hero), copy: rect(copy), plot: rect(plotNode), poster: rect(poster),
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
      if ((locale === "uk" && width === 393) || (locale === "en" && width === 1440)) {
        await page.screenshot({ path: resolve(captureDirectory, `movie-dune-${locale}-${width}-fixture.png`) });
      }
    }
  }
});
