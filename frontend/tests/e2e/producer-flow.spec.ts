import { expect, test } from "@playwright/test";

test("guest opens a producer filmography from movie details", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/movies/900001/details", route => route.fulfill({ json: {
    id: 900001,
    title: "Producer flow film",
    shortPlot: "A browser fixture for the producer flow.",
    photoUrl: null,
    releaseDate: "2026-10-18",
    durationMinutes: 110,
    rating: 8.1,
    trailerUrl: null,
    genres: [{ id: 1, name: "Drama" }],
    actors: [],
    directors: [],
    producers: [{ id: 900002, name: "Producer Fixture" }],
    externalRatings: [],
    similarMovies: [],
    myFlags: null,
  } }));
  await page.route("**/api/movies/900001/reviews**", route => route.fulfill({ json: {
    content: [], number: 0, totalPages: 0, totalElements: 0,
  } }));
  await page.route("**/api/genres", route => route.fulfill({ json: [{ id: 1, name: "Drama" }] }));
  await page.route("**/api/producers/900002**", route => route.fulfill({ json: {
    id: 900002,
    name: "Producer Fixture",
    photoUrl: null,
    type: "PRODUCER",
    films: [{
      id: 900001,
      title: "Producer flow film",
      releaseDate: "2026-10-18",
      rating: 8.1,
      photoUrl: null,
      characterName: null,
    }],
  } }));

  await page.goto("/uk/films/900001");
  await expect(page.getByRole("heading", { level: 1, name: "Producer flow film" })).toBeVisible();

  await page.getByRole("link", { name: "Producer Fixture" }).click();

  await expect(page).toHaveURL(/\/uk\/people\/producer\/900002$/);
  await expect(page.getByRole("heading", { level: 1, name: "Producer Fixture" })).toBeVisible();
  const hero = page.locator("main > section").first();
  await expect(hero).toHaveCSS("min-height", "907px");
  const avatar = await hero.locator('[class*="avatar"]').boundingBox();
  expect(avatar?.width).toBeCloseTo(265, 0);
  const filmography = await page.locator('section[aria-labelledby="filmography-title"]').boundingBox();
  expect(filmography?.width).toBeCloseTo(1200, 0);
  await expect(page.getByText("Продюсери", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Producer flow film" })).toBeVisible();
});

test("person mobile layout follows the actor Figma frame", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/genres", route => route.fulfill({ json: [] }));
  await page.route("**/api/actors/900003**", route => route.fulfill({ json: {
    id: 900003,
    name: "Actor Fixture",
    photoUrl: null,
    type: "ACTOR",
    films: [{ id: 900004, title: "Fixture film", releaseDate: "2026-01-01", rating: 7.4, photoUrl: null, characterName: null }],
  } }));

  await page.goto("/uk/people/actor/900003");
  await expect(page.getByRole("heading", { level: 1, name: "Actor Fixture" })).toBeVisible();
  const hero = page.locator("main > section").first();
  await expect(hero).toHaveCSS("min-height", "499px");
  const avatar = await hero.locator('[class*="avatar"]').boundingBox();
  expect(avatar?.width).toBeCloseTo(120, 0);
  await expect(page.locator('[aria-labelledby="filmography-title"] [class*="controls"]')).toBeHidden();
  const grid = await page.locator('[aria-labelledby="filmography-title"] [class*="grid"]').boundingBox();
  expect(grid?.width).toBeCloseTo(361, 0);
  await page.getByRole("button", { name: "Фільтри" }).click();
  await expect(page.locator('[aria-labelledby="filmography-title"] [class*="controls"]')).toBeVisible();
});
