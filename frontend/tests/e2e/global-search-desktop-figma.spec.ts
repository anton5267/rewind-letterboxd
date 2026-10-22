import { expect, test, type Page } from "@playwright/test";

const films = Array.from({ length: 6 }, (_, index) => ({ id: 986100 + index, title: `Search film ${index + 1}`, releaseDate: "2024-01-01", rating: 4, photoUrl: null }));

async function mockSearch(page: Page) {
  await page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/search/global") return route.fulfill({ json: {
      films: { content: films, number: 0, size: 6, totalElements: films.length, totalPages: 1 },
      users: { content: [{ id: 986200, username: "reader", displayName: "Search Reader", avatarUrl: null }], totalElements: 1 },
      lists: { content: [], totalElements: 0 },
      tags: [],
      people: [],
      reviews: { content: Array.from({ length: 3 }, (_, index) => ({ id: 986300 + index, movieId: films[index].id, movieTitle: films[index].title, userId: 986200, username: "reader", content: "A review result with enough copy for the editorial card.", rating: 4, createdAt: "2026-10-20T12:00:00Z", moviePhotoUrl: null, userAvatarUrl: null })), totalElements: 3 },
      journal: { content: [], totalElements: 0 },
    } });
    return route.fulfill({ json: { count: 0 } });
  });
}

test("global search all variant keeps the raw desktop rails", async ({ page }) => {
  await mockSearch(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/search?q=search");
  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("aria-busy", "false");
  const matches = main.locator('[class*="matchesHeading"]');
  const matchesBox = await matches.boundingBox();
  expect(matchesBox?.x).toBeCloseTo(120, 0);
  expect(matchesBox?.y).toBeCloseTo(280, 0);
  const posters = main.locator("#films article > a");
  await expect(posters).toHaveCount(6);
  const firstPoster = await posters.first().boundingBox();
  expect(firstPoster?.x).toBeCloseTo(120, 0);
  expect(firstPoster?.y).toBeCloseTo(377, 0);
  expect(firstPoster?.width).toBeCloseTo(174, 0);
  expect(firstPoster?.height).toBeCloseTo(260, 0);
  const review = await main.locator("#reviews article").first().boundingBox();
  expect(review?.x).toBeCloseTo(120, 0);
  expect(review?.y).toBeCloseTo(692, 0);
  expect(review?.width).toBeCloseTo(1200, 0);
  expect(review?.height).toBeCloseTo(315, 0);
});
