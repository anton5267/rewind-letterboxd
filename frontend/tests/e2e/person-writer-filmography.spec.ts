import { expect, test } from "@playwright/test";

test("writer filmography exposes writing credits in accessible film links without narrow-screen overflow", async ({ page }) => {
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/writers/1293082") {
      return route.fulfill({ json: {
        id: 1293082,
        name: "Kim Byung-woo",
        photoUrl: null,
        type: "WRITER",
        tmdbId: 1293082,
        careerJobs: ["Writer"],
        films: [{
          id: 3601,
          title: "The Great Flood",
          releaseDate: "2025-12-07",
          rating: 4.5,
          photoUrl: null,
          characterName: null,
          crewCredits: [{ department: "Writing", job: "Screenplay" }],
        }],
      } });
    }
    if (pathname === "/api/genres") return route.fulfill({ json: [] });
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0 } });
  });

  for (const locale of ["uk", "en"] as const) {
    await page.goto(`/${locale}/people/writer/1293082`);
    await expect(page.getByRole("heading", { level: 1, name: "Kim Byung-woo" })).toBeVisible();
    await expect(page.getByRole("heading", {
      level: 2,
      name: locale === "uk" ? "Сценарні роботи" : "Writing Credits",
    })).toBeVisible();
    const roleSummary = locale === "uk" ? "Сценарист" : "Writer";
    const summary = page.getByTestId("person-role-summary");
    await expect(summary).toHaveText(roleSummary);
    expect(await summary.ariaSnapshot()).toContain(roleSummary);
    await expect(page.getByLabel(locale === "uk" ? "Ролі" : "Credits", { exact: true })).toHaveCount(0);
    const filmLink = page.getByRole("link", { name: /The Great Flood/ });
    await expect(filmLink).toBeVisible();
    await expect(filmLink).toHaveAccessibleName(
      locale === "uk" ? /Screenplay.*Рейтинг: 4,5/ : /Screenplay.*Rating: 4.5/,
    );

    for (const width of [320, 393, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      )).toBeLessThanOrEqual(1);
      if (width < 768) await expect(page.locator("header").first()).toBeHidden();
      else await expect(page.locator("header").first()).toBeVisible();
    }
  }
});

test("movie details links writer credits to the localized writer filmography route", async ({ page }) => {
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/movies/3601/details") {
      return route.fulfill({ json: {
        id: 3601,
        title: "The Great Flood",
        imdbId: null,
        originalLanguage: "ko",
        shortPlot: null,
        photoUrl: null,
        backdropUrl: null,
        releaseDate: "2025-12-07",
        durationMinutes: 115,
        ageRating: null,
        rating: 4.5,
        trailerUrl: null,
        genres: [],
        actors: [],
        directors: [],
        producers: [],
        writers: [{ tmdbId: 1293082, name: "Kim Byung-woo", photoUrl: null }],
        externalRatings: [],
        similarMovies: [],
        myFlags: null,
      } });
    }
    if (pathname === "/api/writers/1293082") {
      return route.fulfill({ json: {
        id: 1293082, name: "Kim Byung-woo", photoUrl: null, type: "WRITER", tmdbId: 1293082,
        careerJobs: ["Writer"],
        films: [{ id: 3601, title: "The Great Flood", releaseDate: "2025-12-07", rating: 4.5, photoUrl: null, characterName: null }],
      } });
    }
    if (pathname === "/api/genres") return route.fulfill({ json: [] });
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0 } });
  });

  await page.goto("/en/films/3601");
  const writer = page.getByRole("link", { name: "Kim Byung-woo", exact: true });
  await expect(writer).toBeVisible();
  await expect(writer).toHaveAttribute("href", "/en/people/writer/1293082");
  await writer.click();
  await expect(page).toHaveURL(/\/en\/people\/writer\/1293082\/?$/);
  await expect(page.getByRole("heading", { level: 1, name: "Kim Byung-woo" })).toBeVisible();
});
