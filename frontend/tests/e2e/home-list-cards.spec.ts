import { expect, test } from "@playwright/test";

// Controlled API responses exercise the carousel independently of shared dev data.
const movies = [1, 2, 3].map(id => ({ id, title: `Preview film ${id}`, photoUrl: null, releaseDate: null, rating: null }));
const lists = [1, 2, 3].map(id => ({
  id: 900_000 + id,
  name: `Public list ${id}`,
  description: `List description ${id}`,
  ownerId: 800_000 + id,
  ownerUsername: `list-owner-${id}`,
  tags: [],
  itemCount: id === 1 ? 3 : id === 2 ? 1 : 0,
  likeCount: 0,
  previewMovies: id === 1 ? movies : id === 2 ? movies.slice(0, 1) : [],
}));

test("Home lists remain reachable by keyboard across the scrollable poster cards", async ({ page }) => {
  await page.route("**/api/lists/public/popular?**", route => route.fulfill({ json: { content: lists, totalElements: 3, totalPages: 1, number: 0, size: 4 } }));
  await page.route(`**/api/lists/public/${lists[1].id}`, route => route.fulfill({ json: { ...lists[1], ownerAvatarUrl: null, movies: movies.slice(0, 1) } }));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/home");
  const hero = page.locator("main > section").first();
  expect((await hero.boundingBox())!.height).toBeGreaterThanOrEqual(844);
  await expect.poll(() => hero.boundingBox()).toEqual(expect.objectContaining({ x: 0, y: 0, width: 1440 }));
  await expect(page.getByRole("heading", { level: 1, name: "Track films you’ve watched. Save those you want to see. Tell your friends what’s good." })).toHaveCSS("font-size", "58px");
  expect(await hero.evaluate(element => getComputedStyle(element, "::before").backgroundImage)).toContain("home-hero-guest.jpg");

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/home");
  await expect(hero).toHaveCSS("min-height", "320px");
  await expect.poll(() => hero.boundingBox()).toEqual(expect.objectContaining({ x: 0, y: 0, width: 393, height: 320 }));
  await expect(page.getByRole("heading", { level: 1, name: "Track films you’ve watched. Save those you want to see. Tell your friends what’s good." })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Track films you’ve watched. Save those you want to see. Tell your friends what’s good." })).toHaveCSS("font-size", "24px");
  const mobileCta = hero.getByRole("link", { name: "Get Started", exact: true });
  await expect(mobileCta).toHaveAttribute("href", "/en/register");
  expect((await mobileCta.boundingBox())!.width).toBeGreaterThanOrEqual(44);
  await expect(page.locator("main > section").nth(1).locator("article:visible")).toHaveCount(4);

  for (const width of [320, 393, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/en/home");
    const panel = page.getByRole("region", { name: "Popular Lists", exact: true });
    await expect(panel).toHaveAttribute("aria-busy", "false");
    const cards = panel.locator("article");
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0).getByRole("img")).toHaveText(movies.map(movie => movie.title).join(""));
    await expect(cards.nth(1).getByRole("img")).toHaveText(movies[0].title);
    await expect(cards.nth(2).getByRole("img")).toHaveText(lists[2].name);

    await cards.nth(0).getByRole("link", { name: lists[0].name, exact: true }).first().focus();
    await page.keyboard.press("Tab"); // Title of the first list.
    await page.keyboard.press("Tab"); // Owner of the first list.
    await page.keyboard.press("Tab"); // Poster of the next list scrolls into view.
    const nextPoster = cards.nth(1).getByRole("link", { name: lists[1].name, exact: true }).first();
    await expect(nextPoster).toBeFocused();
    await expect.poll(() => nextPoster.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const group = element.closest('[role="group"]')!.getBoundingClientRect();
      return rect.left >= group.left && rect.right <= group.right;
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    await expect(panel.getByRole("link", { name: "More", exact: true })).toHaveAttribute("href", "/en/lists/discover?feed=popular");
  }

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`/en/lists/public/${lists[1].id}`);
  await expect(page.getByRole("heading", { level: 1, name: lists[1].name, exact: true })).toBeVisible();
});

test("Home list feed keeps retry and honest empty states", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/lists/public/popular?**", route => {
    attempts += 1;
    return attempts < 3 ? route.fulfill({ status: 503, json: {} })
      : route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 4 } });
  });
  await page.goto("/en/home");
  const panel = page.getByRole("region", { name: "Popular Lists", exact: true });
  await expect(panel.locator("p").filter({ hasText: "Could not load the home page." })).toBeVisible();
  const retry = panel.getByRole("button", { name: "Retry", exact: true });
  await retry.focus();
  await retry.press("Enter");
  await expect(panel).toHaveAttribute("aria-busy", "false");
  const repeatedRetry = panel.getByRole("button", { name: "Retry", exact: true });
  await expect(repeatedRetry).toBeFocused();
  await repeatedRetry.press("Enter");
  await expect(panel).toHaveAttribute("aria-busy", "false");
  await expect(panel.locator("article")).toHaveCount(0);
  await expect(panel.locator("p").filter({ hasText: "Could not load the home page." })).toHaveCount(0);
  await expect(panel.getByText("No public lists yet.", { exact: true })).toBeVisible();
  expect(attempts).toBe(3);
});

test("Home does not keep empty feeds as blank modules", async ({ page }) => {
  const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 };
  for (const route of [
    "**/api/movies/search?**",
    "**/api/reviews/popular?**",
    "**/api/reviews/recent?**",
    "**/api/lists/public/popular?**",
    "**/api/journal/articles?**",
    "**/api/activity/recent-watched?**",
  ]) {
    await page.route(route, handler => handler.fulfill({ json: emptyPage }));
  }
  for (const route of ["**/api/users/popular-reviewers?**", "**/api/tags/popular?**"]) {
    await page.route(route, handler => handler.fulfill({ json: [] }));
  }

  await page.goto("/en/home");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  for (const id of [
    "home-newest",
    "home-guest-reviews",
    "home-popular",
    "home-journal",
    "home-reviews",
    "home-lists",
    "home-reviewers",
    "home-tags",
    "home-recent-watched",
  ]) {
    await expect(page.locator(`#${id}`), `Empty Home module #${id} should be omitted`).toHaveCount(0);
  }
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("Member Home renders the authenticated following activity feed", async ({ page }) => {
  const activity = [
    { id: 991_001, type: "WATCHED", createdAt: "2026-11-11T10:00:00Z", actor: { id: 991_101, username: "movie-fan", displayName: "Movie Fan", avatarUrl: null }, movie: { id: 991_201, title: "Arrival" }, relatedUser: null, list: null },
    { id: 991_002, type: "RATING", createdAt: "2026-11-11T09:00:00Z", actor: { id: 991_102, username: "film-critic", displayName: "Film Critic", avatarUrl: null }, movie: { id: 991_202, title: "Moonlight" }, relatedUser: null, list: null },
    { id: 991_003, type: "REVIEW", createdAt: "2026-11-11T08:00:00Z", actor: { id: 991_103, username: "reviewer", displayName: "Reviewer", avatarUrl: null }, movie: { id: 991_203, title: "Portrait of a Lady on Fire" }, relatedUser: null, list: null },
    { id: 991_004, type: "LIST", createdAt: "2026-11-11T07:00:00Z", actor: { id: 991_104, username: "curator", displayName: "Curator", avatarUrl: null }, movie: null, relatedUser: null, list: { id: 991_204, name: "Quiet evenings" } },
    { id: 991_005, type: "FOLLOW", createdAt: "2026-11-11T06:00:00Z", actor: { id: 991_105, username: "new-member", displayName: "New Member", avatarUrl: null }, movie: null, relatedUser: { id: 991_205, username: "cinephile", displayName: "Cinephile" }, list: null },
  ];
  const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 };

  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "fixture-csrf" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: { message: "Unauthorized" } }));
  await page.route("**/api/users/me", route => route.fulfill({ json: { id: 991_100, username: "home-member", role: "USER" } }));
  await page.route("**/api/activity/following**", route => route.fulfill({ json: { content: activity, totalElements: activity.length, totalPages: 1, number: 0, size: 10 } }));
  await page.route("**/api/movies/search**", route => route.fulfill({ json: emptyPage }));
  await page.route("**/api/reviews/popular**", route => route.fulfill({ json: emptyPage }));
  await page.route("**/api/lists/public/popular**", route => route.fulfill({ json: emptyPage }));
  await page.route("**/api/journal/articles**", route => route.fulfill({ json: emptyPage }));
  await page.route("**/api/activity/recent-watched**", route => route.fulfill({ json: emptyPage }));
  await page.route("**/api/conversations/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/notifications/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/users/popular-reviewers**", route => route.fulfill({ json: [] }));
  await page.route("**/api/tags/popular**", route => route.fulfill({ json: [] }));

  for (const locale of ["uk", "en"] as const) {
    await page.setViewportSize({ width: locale === "uk" ? 1440 : 393, height: 852 });
    await page.goto(`/${locale}/home`);
    const section = page.locator("#home-following-activity");
    await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
    await expect(section).toBeVisible();
    await expect(section.getByRole("heading", { name: locale === "uk" ? "Активність тих, на кого ви підписані" : "Activity from people you follow" })).toBeVisible();
    await expect(section.getByRole("link", { name: "Arrival" })).toHaveAttribute("href", `/${locale}/films/991201`);
    await expect(section.getByRole("link", { name: "Moonlight" })).toHaveAttribute("href", `/${locale}/films/991202`);
    await expect(section.getByRole("link", { name: "Quiet evenings" })).toHaveAttribute("href", `/${locale}/lists/public/991204`);
    await expect(section.getByRole("link", { name: "Cinephile" })).toHaveAttribute("href", `/${locale}/users/991205`);
    for (const action of locale === "uk"
      ? ["переглянув(-ла)", "оцінив(-ла)", "написав(-ла) огляд до", "створив(-ла) список", "підписався(-лася) на"]
      : ["watched", "rated", "reviewed", "created a list", "followed"]) {
      await expect(section).toContainText(action);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  }
});

test("Guest Home does not request the private following activity feed", async ({ page }) => {
  let followingRequests = 0;
  const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 };

  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "fixture-csrf" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: { message: "Unauthorized" } }));
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: { message: "Unauthorized" } }));
  await page.route("**/api/activity/following**", route => {
    followingRequests += 1;
    return route.fulfill({ json: emptyPage });
  });
  await page.route("**/api/movies/search**", route => route.fulfill({ json: emptyPage }));
  await page.route("**/api/reviews/popular**", route => route.fulfill({ json: emptyPage }));
  await page.route("**/api/reviews/recent**", route => route.fulfill({ json: emptyPage }));
  await page.route("**/api/lists/public/popular**", route => route.fulfill({ json: emptyPage }));
  await page.route("**/api/journal/articles**", route => route.fulfill({ json: emptyPage }));
  await page.route("**/api/activity/recent-watched**", route => route.fulfill({ json: emptyPage }));
  await page.route("**/api/conversations/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/notifications/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/users/popular-reviewers**", route => route.fulfill({ json: [] }));
  await page.route("**/api/tags/popular**", route => route.fulfill({ json: [] }));

  await page.goto("/en/home");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("#home-following-activity")).toHaveCount(0);
  expect(followingRequests).toBe(0);
});

test("Guest Home keeps a short review card content-sized beside taller feed columns", async ({ page }) => {
  const review = {
    id: 970_001, movieId: 970_002, movieTitle: "A short review", userId: 970_003,
    username: "film-fan", content: "Worth watching.", rating: 4,
    createdAt: "2026-11-01T12:00:00Z", moviePhotoUrl: null, userAvatarUrl: null,
  };
  await page.route("**/api/reviews/popular?**", route => route.fulfill({
    json: { content: [review], totalElements: 1, totalPages: 1, number: 0, size: 4 },
  }));
  await page.route("**/api/lists/public/popular?**", route => route.fulfill({
    json: { content: lists, totalElements: lists.length, totalPages: 1, number: 0, size: 3 },
  }));
  await page.route("**/api/users/popular-reviewers?**", route => route.fulfill({ json: [
    { id: 970_004, username: "reviewer", displayName: "Reviewer", avatarUrl: null, likes: 12, reviewCount: 4 },
  ] }));

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en/home");
  const panel = page.locator("#home-reviews");
  await expect(panel).toHaveAttribute("aria-busy", "false");
  const card = panel.locator('[class*="reviewCard"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText("Worth watching.");
  expect((await card.boundingBox())!.height).toBeLessThan(220);
});

test("Member Home keeps the dedicated desktop and mobile hero", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ json: { id: 1, username: "member", role: "USER" } }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/home");

  const hero = page.locator("main > section").first();
  await expect(hero).toHaveCSS("min-height", "948px");
  expect(await hero.evaluate(element => getComputedStyle(element).backgroundImage)).toContain("home-hero-member.jpg");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("font-size", "58px");

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/home");
  await expect(hero).toHaveCSS("min-height", "320px");
  await expect(page.getByRole("heading", { level: 1, name: "Welcome back. Here’s what we’ve been watching…" })).toBeVisible();
  await expect(page.locator("main > section").nth(1).locator("article:visible")).toHaveCount(4);
});

test("Guest Home recent-review poster rail stays responsive, keyboard reachable, and resilient", async ({ page }) => {
  const recentReviews = Array.from({ length: 10 }, (_, index) => ({
    id: 940_000 + index,
    movieId: 950_000 + index,
    movieTitle: index === 0 ? "A very long film title used to exercise accessible poster names" : `Recent film ${index + 1}`,
    userId: 960_000 + index,
    username: `reviewer-${index + 1}`,
    content: `Review content ${index + 1}`,
    rating: index % 2 === 0 ? 4 : null,
    createdAt: "2026-10-31T12:00:00Z",
    moviePhotoUrl: null,
    userAvatarUrl: null,
  }));
  await page.route("**/api/reviews/recent?**", route => route.fulfill({
    json: { content: recentReviews, totalElements: 10, totalPages: 1, number: 0, size: 10 },
  }));

  for (const locale of ["uk", "en"] as const) {
    const heading = locale === "uk" ? "Щойно переглянули…" : "Just reviewed…";
    for (const width of [320, 393, 600, 720, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${locale}/home`);
      const section = page.locator("#home-guest-reviews");
      await expect(section).toHaveAttribute("aria-busy", "false");
      await expect(section.getByRole("heading", { level: 2, name: heading })).toBeVisible();
      const rail = section.getByRole("group", { name: heading });
      const cards = rail.getByRole("link");
      await expect(cards).toHaveCount(10);
      await expect(cards.nth(0)).toHaveAttribute("href", `/${locale}/reviews/${recentReviews[0].id}`);
      await expect(cards.nth(0)).toHaveAttribute("aria-label", `${recentReviews[0].movieTitle} — ${heading}`);
      await expect(cards.nth(0).getByText("A", { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);

      const lastCard = cards.last();
      await lastCard.focus();
      await expect(lastCard).toBeFocused();
      await expect.poll(() => lastCard.evaluate(element => {
        const card = element.getBoundingClientRect();
        const rail = element.parentElement!.getBoundingClientRect();
        return card.left >= rail.left && card.right <= rail.right;
      })).toBe(true);

      if (locale === "uk" && [393, 1440].includes(width)) {
        await section.screenshot({ path: `../artifacts/visual-audit-20261101/home-recent-reviews/recent-reviews-${locale}-${width}.png` });
      }
    }
  }
});

test("Guest Home recent reviews recover from an API error and show the empty state", async ({ page }) => {
  for (const [locale, heading, retry, empty] of [
    ["uk", "Щойно переглянули…", "Спробувати ще", "Оглядів поки немає."],
    ["en", "Just reviewed…", "Retry", "No reviews yet."],
  ] as const) {
    await page.unroute("**/api/reviews/recent?**");
    let attempts = 0;
    await page.route("**/api/reviews/recent?**", route => {
      attempts += 1;
      return attempts === 1 ? route.fulfill({ status: 503, json: {} })
        : route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 } });
    });
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(`/${locale}/home`);
    const section = page.locator("#home-guest-reviews");
    await expect(section.getByRole("heading", { level: 2, name: heading })).toBeVisible();
    const retryButton = section.getByRole("button", { name: retry, exact: true });
    await expect(retryButton).toBeVisible();
    await retryButton.click();
    await expect(section).toHaveAttribute("aria-busy", "false");
    await expect(section.getByRole("heading", { level: 2, name: heading })).toBeFocused();
    await expect(section.getByText(empty, { exact: true })).toBeVisible();
    await expect(section.getByRole("group", { name: heading })).toHaveCount(0);
    expect(attempts).toBe(2);
  }
});
