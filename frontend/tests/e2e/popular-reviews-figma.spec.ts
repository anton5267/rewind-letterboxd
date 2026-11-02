import { expect, test } from "@playwright/test";

const reviews = Array.from({ length: 4 }, (_, index) => ({
  id: 982100 + index,
  movieId: 982200 + index,
  movieTitle: ["Superman", "Avatar: Fire and Ash", "The Hunt", "Wake Up Dead Man"][index],
  userId: 982300 + index,
  username: ["CineMindset", "MovieMoon", "ReelRaven", "MoonlitCritic"][index],
  content: "A complete review fixture with enough text to keep the card copy representative of the Figma layout.",
  rating: 4,
  createdAt: "2026-10-20T12:00:00Z",
  moviePhotoUrl: null,
}));

test("popular reviews follows the measured desktop Figma rail and card geometry", async ({ page }) => {
  await page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/users/me") return route.fulfill({ json: { id: 982400, username: "review-reader", role: "USER" } });
    if (url.pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "popular-reviews-csrf" } });
    if (url.pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (url.pathname === "/api/users/popular-reviewers") return route.fulfill({ json: Array.from({ length: 6 }, (_, index) => ({ id: 982500 + index, username: `reviewer-${index}`, displayName: `Reviewer ${index}`, avatarUrl: null, likes: 12 })) });
    if (url.pathname === "/api/reviews/popular") return route.fulfill({ json: { content: reviews, totalPages: 1, totalElements: reviews.length, number: 0, size: 6 } });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 0 } });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/reviews");

  const hero = page.locator("main > section").first();
  await expect(hero).toHaveCSS("min-height", "486px");
  const shell = page.locator('main > div[class*="shell"]');
  const shellBox = await shell.boundingBox();
  expect(shellBox?.x).toBeCloseTo(120, 0);
  expect(shellBox?.width).toBe(1200);

  const reviewers = page.getByRole("region", { name: "Popular reviewers" });
  const reviewerBox = await reviewers.boundingBox();
  expect(reviewerBox?.x).toBeCloseTo(120, 0);
  expect(reviewerBox?.y).toBeCloseTo(280, 0);
  expect(reviewerBox?.width).toBe(1200);
  expect(reviewerBox?.height).toBe(180);
  expect(await reviewers.locator('a[href="/en/users/982500"]').boundingBox()).toMatchObject({ width: 80, height: 80 });

  const reviewsRegion = page.getByRole("region", { name: "Popular reviews" }).last();
  const reviewsBox = await reviewsRegion.boundingBox();
  expect(reviewsBox?.x).toBeCloseTo(120, 0);
  expect(reviewsBox?.y).toBeCloseTo(634, 0);
  expect(reviewsBox?.width).toBe(1200);
  const cards = reviewsRegion.locator("article");
  await expect(cards).toHaveCount(4);
  const cardBox = await cards.first().boundingBox();
  expect(cardBox?.y).toBeCloseTo(733, 0);
  expect(cardBox?.width).toBe(1200);
  expect(cardBox?.height).toBe(315);
  const posterBox = await cards.first().locator("a").first().boundingBox();
  expect(posterBox?.width).toBe(175);
  expect(posterBox?.height).toBe(262);
});

test("popular reviews phone content, fallbacks, focus and More navigation work in UK and EN", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ json: { id: 982400, username: "review-reader", role: "USER" } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "popular-reviews-csrf" } }));
  await page.route("**/api/users/popular-reviewers**", route => route.fulfill({ json: Array.from({ length: 6 }, (_, index) => ({ id: 982500 + index, username: `reviewer-${index}`, displayName: `Reviewer ${index}`, avatarUrl: null, likes: 12 })) }));
  await page.route("**/api/reviews/popular**", route => route.fulfill({ json: { content: reviews, totalPages: 1, totalElements: reviews.length, number: 0, size: 4 } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));

  for (const scenario of [
    { lang: "uk", width: 320, moreName: "Більше Популярні рецензенти", destination: "/uk/community/reviewers", destinationHeading: "Популярні рецензенти" },
    { lang: "en", width: 393, moreName: "More Popular reviewers", destination: "/en/community/reviewers", destinationHeading: "Popular reviewers" },
  ]) {
    await page.setViewportSize({ width: scenario.width, height: 844 });
    await page.goto(`/${scenario.lang}/reviews`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const reviewersGroup = page.getByRole("group", { name: scenario.lang === "uk" ? "Популярні рецензенти" : "Popular reviewers" });
    await expect(reviewersGroup.getByRole("link")).toHaveCount(6);
    const reviewsRegion = page.getByRole("region", { name: scenario.lang === "uk" ? "Популярні огляди" : "Popular reviews" }).last();
    const cards = reviewsRegion.locator("article");
    await expect(cards).toHaveCount(4);
    await expect(cards.first().getByRole("link", { name: /reviewer-0|CineMindset/i })).toBeVisible();
    await expect(cards.first().locator("a").first().locator("span")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(scenario.width);

    const more = page.getByRole("link", { name: scenario.moreName, exact: true });
    await more.focus();
    await expect(more).toBeFocused();
    await expect(more).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(scenario.destination);
    await expect(page.getByRole("heading", { level: 1, name: scenario.destinationHeading })).toBeVisible();
  }
});
