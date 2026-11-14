import { expect, type Page, test } from "@playwright/test";

const primaryFilms = [{
  id: 1,
  title: "Acted film",
  releaseDate: "2025-01-01",
  rating: null,
  photoUrl: null,
  characterName: "A role",
}];
const producedFilms = Array.from({ length: 13 }, (_, index) => ({
  id: index + 20,
  title: `Produced ${index + 1}`,
  releaseDate: "2005-01-01",
  rating: null,
  photoUrl: null,
  characterName: null,
}));
const directedFilms = [{
  ...primaryFilms[0],
  id: 50,
  title: "Directed earlier",
  releaseDate: "1999-01-01",
  characterName: null,
}, {
  ...primaryFilms[0],
  id: 51,
  title: "Directed later",
  releaseDate: "2010-01-01",
  characterName: null,
}];

async function fixture(page: Page, holdProducer = false) {
  const state = {
    failProducer: false,
    producerRequests: 0,
    actorRequests: 0,
    holdProducer,
  };
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route((url) => url.pathname.startsWith("/api/"), async (route) => {
    const url = new URL(route.request().url());
    if (
      url.pathname === "/api/users/me" || url.pathname === "/api/auth/refresh"
    ) return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/genres") {
      return route.fulfill({
        json: [{ id: 1, name: "Drama" }, { id: 2, name: "Comedy" }],
      });
    }
    if (url.pathname === "/api/actors/85") {
      state.actorRequests += 1;
      return route.fulfill({
        json: {
          id: 85,
          name: "Person fixture",
          photoUrl: null,
          type: "ACTOR",
          films: primaryFilms,
          relatedPeople: [{ id: 19, type: "DIRECTOR" }, {
            id: 7,
            type: "PRODUCER",
          }],
        },
      });
    }
    if (url.pathname === "/api/actors/86") {
      return route.fulfill({
        json: {
          id: 86,
          name: "Another person",
          photoUrl: null,
          type: "ACTOR",
          films: [],
          relatedPeople: [],
        },
      });
    }
    if (url.pathname === "/api/directors/19") {
      return route.fulfill({
        json: {
          id: 19,
          name: "Person fixture",
          photoUrl: null,
          type: "DIRECTOR",
          films: directedFilms,
        },
      });
    }
    if (url.pathname === "/api/producers/7") {
      state.producerRequests += 1;
      if (state.holdProducer) await gate;
      if (state.failProducer) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({
        json: {
          id: 7,
          name: "Person fixture",
          photoUrl: null,
          type: "PRODUCER",
          films: url.searchParams.has("genreId") ? [] : producedFilms,
        },
      });
    }
    return route.fulfill({
      json: { content: [], totalElements: 0, totalPages: 0, number: 0 },
    });
  });
  return { state, release };
}

for (const lang of ["uk", "en"] as const) {
  test(
    `verified person roles render independently filtered filmographies in ${lang}`,
    async ({ page }, testInfo) => {
      const { state } = await fixture(page);
      state.failProducer = true;
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`/${lang}/people/actor/85`);
      const primary = page.getByRole("region", {
        name: lang === "uk" ? "Фільми за участі" : "Films Starring",
        exact: true,
      });
      const producer = page.getByRole("region", {
        name: lang === "uk" ? "Продюсерські роботи" : "Films Produced",
        exact: true,
      });
      const director = page.getByRole("region", {
        name: lang === "uk" ? "Режисерські роботи" : "Films Directed",
        exact: true,
      });
      await expect(primary.getByRole("link", { name: /Acted film/ }))
        .toBeVisible();
      await expect(director.locator("article")).toHaveCount(2);
      const retry = producer.getByRole("button", {
        name: lang === "uk" ? "Спробувати ще" : "Retry",
        exact: true,
      });
      await expect(retry).toBeVisible();
      state.failProducer = false;
      await retry.click();
      await expect(producer.getByRole("heading", { level: 2 })).toBeFocused();
      await expect(producer.locator("article")).toHaveCount(12);
      await producer.getByRole("button", {
        name: lang === "uk" ? "Усі фільми" : "All films",
        exact: true,
      }).click();
      await expect(producer.locator("article")).toHaveCount(13);
      const producerDecade = producer.getByRole("combobox", {
        name: lang === "uk" ? "Десятиліття" : "Decade",
        exact: true,
      });
      await producerDecade.selectOption("2000");
      await expect(producer.locator("article")).toHaveCount(12);
      const actorRequests = state.actorRequests;
      await producer.getByRole("combobox", {
        name: lang === "uk" ? "Жанр" : "Genre",
        exact: true,
      }).selectOption("2");
      await expect(
        producer.getByText(
          lang === "uk" ? "Фільмів не знайдено." : "No films found.",
          { exact: true },
        ),
      ).toBeVisible();
      expect(state.actorRequests).toBe(actorRequests);
      await expect(primary.locator("article")).toHaveCount(1);
      await producer.getByRole("button", {
        name: lang === "uk" ? "Скинути фільтри" : "Reset filters",
        exact: true,
      }).click();
      await expect(producer.locator("article")).toHaveCount(12);
      await producerDecade.selectOption("2000");
      const producerRequests = state.producerRequests;
      await primary.getByRole("combobox", {
        name: lang === "uk" ? "Жанр" : "Genre",
        exact: true,
      }).selectOption("1");
      await expect(primary).toHaveAttribute("aria-busy", "false");
      await expect(producerDecade).toHaveValue("2000");
      expect(state.producerRequests).toBe(producerRequests);
      const ids = await page.locator('[id^="person-"]').evaluateAll(
        (elements) => elements.map((element) => element.id),
      );
      expect(new Set(ids).size).toBe(ids.length);
      await page.screenshot({
        path: testInfo.outputPath(`related-person-${lang}-1440.png`),
        fullPage: true,
      });

      await page.setViewportSize({ width: 393, height: 844 });
      const filters = page.getByRole("button", {
        name: lang === "uk" ? "Фільтри" : "Filters",
        exact: true,
      });
      await filters.click();
      await expect(filters).toHaveAttribute(
        "aria-controls",
        "person-filters person-director-19-filters person-producer-7-filters",
      );
      const directorDecade = director.getByRole("combobox", {
        name: lang === "uk" ? "Десятиліття" : "Decade",
        exact: true,
      });
      await directorDecade.selectOption("1990");
      await expect(director.locator("article")).toHaveCount(1);
      await expect(primary.locator("article")).toHaveCount(1);
      await directorDecade.press("Escape");
      await expect(filters).toBeFocused();
      await expect(directorDecade).toBeHidden();
      await page.setViewportSize({ width: 320, height: 844 });
      await expect.poll(() =>
        page.evaluate(() =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
        )
      ).toBeLessThanOrEqual(1);
      await page.screenshot({
        path: testInfo.outputPath(`related-person-${lang}-320.png`),
        fullPage: true,
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await expect(directorDecade).toHaveValue("1990");
      await expect(producerDecade).toHaveValue("2000");
    },
  );
}

test("a delayed related filmography is discarded when the person changes", async ({ page }) => {
  const { state, release } = await fixture(page, true);
  await page.goto("/en/people/actor/85");
  await expect.poll(() => state.producerRequests).toBe(1);
  await page.evaluate(() => {
    window.history.pushState({}, "", "/en/people/actor/86");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(
    page.getByRole("heading", { name: "Another person", exact: true }),
  ).toBeVisible();
  state.holdProducer = false;
  release();
  await expect(
    page.getByRole("region", { name: "Films Produced", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Produced/ })).toHaveCount(0);
});
