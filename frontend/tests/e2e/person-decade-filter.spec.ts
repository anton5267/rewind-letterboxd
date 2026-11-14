import { expect, test } from "@playwright/test";

const films = [
  ...Array.from(
    { length: 13 },
    (_, index) => ({
      id: index + 1,
      title: `Recent ${index + 1}`,
      releaseDate: `202${index % 3}-06-01`,
      genreId: 1,
    }),
  ),
  { id: 14, title: "Decade before", releaseDate: "1999-12-31", genreId: 2 },
  { id: 15, title: "Decade first", releaseDate: "2000-01-01", genreId: 1 },
  { id: 16, title: "Decade last", releaseDate: "2009-12-31", genreId: 2 },
  { id: 17, title: "Decade after", releaseDate: "2010-01-01", genreId: 1 },
  { id: 18, title: "Unknown date", releaseDate: null, genreId: 1 },
];

for (const lang of ["uk", "en"] as const) {
  test(
    `person decade filters compose with genre, sort and expanded films in ${lang}`,
    async ({ page }, testInfo) => {
      let personRequests = 0;
      await page.route(
        (url) => url.pathname.startsWith("/api/"),
        async (route) => {
          const url = new URL(route.request().url());
          if (url.pathname === "/api/users/me") {
            return route.fulfill({ status: 401, json: {} });
          }
          if (url.pathname === "/api/genres") {
            return route.fulfill({
              json: [{ id: 1, name: "Drama" }, { id: 2, name: "Comedy" }],
            });
          }
          if (url.pathname === "/api/actors/85") {
            personRequests += 1;
            const genreId = url.searchParams.get("genreId");
            const result = films.filter((film) =>
              !genreId || film.genreId === Number(genreId)
            );
            const direction = url.searchParams.get("sort") === "oldest"
              ? 1
              : -1;
            result.sort((left, right) => {
              if (left.releaseDate === null) {
                return 1;
              }
              if (right.releaseDate === null) return -1;
              return direction *
                  left.releaseDate.localeCompare(right.releaseDate) ||
                left.id - right.id;
            });
            return route.fulfill({
              json: {
                id: 85,
                name: "Filmography fixture",
                photoUrl: null,
                type: "ACTOR",
                films: result.map((film) => ({
                  ...film,
                  photoUrl: null,
                  rating: null,
                  characterName: null,
                })),
              },
            });
          }
          return route.fulfill({
            json: { content: [], totalPages: 0, totalElements: 0 },
          });
        },
      );

      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`/${lang}/people/actor/85`);
      const section = page.locator(
        'section[aria-labelledby="filmography-title"]',
      );
      await expect(section).toHaveAttribute("aria-busy", "false");
      const decade = page.getByRole("combobox", {
        name: lang === "uk" ? "Десятиліття" : "Decade",
        exact: true,
      });
      const genre = page.getByRole("combobox", {
        name: lang === "uk" ? "Жанр" : "Genre",
        exact: true,
      });
      const sort = page.getByRole("combobox", {
        name: lang === "uk" ? "Сортувати" : "Sort by",
        exact: true,
      });
      const grid = page.locator("#person-films");
      const initialRequests = personRequests;
      await decade.selectOption("2000");
      await expect(grid.locator("article")).toHaveCount(2);
      await expect(grid.getByRole("link", { name: /Decade first/ }))
        .toBeVisible();
      await expect(grid.getByRole("link", { name: /Decade last/ }))
        .toBeVisible();
      expect(personRequests).toBe(initialRequests);
      await sort.selectOption("oldest");
      await expect(section).toHaveAttribute("aria-busy", "false");
      await expect(grid.getByRole("link").first()).toHaveAttribute(
        "href",
        new RegExp(`/films/15/?$`),
      );
      await genre.selectOption("1");
      await expect(grid.locator("article")).toHaveCount(1);
      await expect(decade).toHaveValue("2000");
      await genre.selectOption("");
      await expect(grid.locator("article")).toHaveCount(2);
      await decade.selectOption("1990");
      await expect(grid.getByRole("link", { name: /Decade before/ }))
        .toBeVisible();
      await genre.selectOption("1");
      await expect(
        page.getByText(
          lang === "uk" ? "Фільмів не знайдено." : "No films found.",
          { exact: true },
        ),
      ).toBeVisible();
      await expect(decade).toHaveValue("1990");
      await page.getByRole("button", {
        name: lang === "uk" ? "Скинути фільтри" : "Reset filters",
        exact: true,
      }).click();
      await expect(decade).toHaveValue("");
      await expect(genre).toHaveValue("");
      await expect(grid.locator("article")).toHaveCount(12);
      await expect(page.locator("#filmography-title")).toBeFocused();

      await page.setViewportSize({ width: 393, height: 844 });
      const filterButton = page.getByRole("button", {
        name: lang === "uk" ? "Фільтри" : "Filters",
        exact: true,
      });
      await filterButton.click();
      await expect(decade).toBeVisible();
      await decade.selectOption("2020");
      await expect(grid.locator("article")).toHaveCount(12);
      const allFilms = page.getByRole("button", {
        name: lang === "uk" ? "Усі фільми" : "All films",
        exact: true,
      });
      await allFilms.click();
      await expect(grid.locator("article")).toHaveCount(13);
      await decade.selectOption("2000");
      await expect(grid.locator("article")).toHaveCount(2);
      await page.screenshot({
        path: testInfo.outputPath(`person-decade-${lang}-393.png`),
        fullPage: true,
      });
      await decade.press("Escape");
      await expect(filterButton).toBeFocused();
      await expect(decade).toBeHidden();
      await page.setViewportSize({ width: 320, height: 844 });
      await filterButton.click();
      await expect(decade).toHaveValue("2000");
      await expect.poll(() =>
        page.evaluate(() =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
        )
      ).toBeLessThanOrEqual(1);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await expect(decade).toBeVisible();
      await expect(decade).toHaveValue("2000");
      await page.screenshot({
        path: testInfo.outputPath(`person-decade-${lang}-1440.png`),
        fullPage: true,
      });
      await decade.selectOption("");
      await allFilms.click();
      await expect(grid.locator("article")).toHaveCount(18);
      await expect(grid.getByRole("link", { name: /Unknown date/ }))
        .toBeVisible();
    },
  );
}
