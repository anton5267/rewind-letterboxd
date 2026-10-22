import { expect, test, type Page } from "@playwright/test";

const movies = Array.from({ length: 12 }, (_, index) => ({
  id: 985100 + index,
  title: `List film ${index + 1}`,
  releaseDate: "2021-01-01",
  rating: null,
  photoUrl: null,
}));

async function mockList(page: Page) {
  await page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/lists/public/985000") return route.fulfill({ json: {
      id: 985000,
      name: "Christopher Nolan Best Films",
      description: "A collection of mind-bending, time-twisting films.",
      ownerId: 985001,
      ownerUsername: "FilmOracle",
      ownerAvatarUrl: null,
      tags: ["Science Fiction", "Thrillers"],
      likeCount: 554,
      movies,
    } });
    return route.fulfill({ json: {} });
  });
}

test("public list detail follows the raw desktop poster grid", async ({ page }) => {
  await mockList(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/lists/public/985000");
  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  const hero = main.locator("section").first();
  await expect(hero).toHaveCSS("min-height", "818px");
  const heading = main.getByRole("heading", { level: 1, name: "Christopher Nolan Best Films" });
  const headingBox = await heading.boundingBox();
  expect(headingBox?.x).toBeCloseTo(120, 0);
  expect(headingBox?.y).toBeCloseTo(583, 0);
  const posters = main.locator('a[class*="movieMedia"]');
  await expect(posters).toHaveCount(12);
  const first = await posters.first().boundingBox();
  expect(first?.x).toBeCloseTo(120, 0);
  expect(first?.y).toBeCloseTo(1038, 0);
  expect(first?.width).toBeCloseTo(174, 0);
  expect(first?.height).toBeCloseTo(260, 0);
});

test("public list detail follows the raw phone four-poster rows", async ({ page }) => {
  await mockList(page);
  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/uk/lists/public/985000");
  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  const heading = main.getByRole("heading", { level: 1, name: "Christopher Nolan Best Films" });
  const headingBox = await heading.boundingBox();
  expect(headingBox?.x).toBeCloseTo(16, 0);
  expect(headingBox?.y).toBeCloseTo(190, 0);
  const posters = main.locator('a[class*="movieMedia"]');
  const first = await posters.first().boundingBox();
  expect(first?.x).toBeCloseTo(16, 0);
  expect(first?.y).toBeCloseTo(417, 0);
  expect(first?.width).toBeCloseTo(79, 0);
  expect(first?.height).toBeCloseTo(116, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
});
