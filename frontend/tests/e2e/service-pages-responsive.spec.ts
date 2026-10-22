import { expect, test } from "@playwright/test";

test("service pages use the Figma editorial hero and retain route navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const route of ["help", "contact", "rules", "privacy", "film-data", "delete-account"]) {
    await page.goto(`/uk/${route}`);
    const hero = page.locator('main > [class*="hero"]');
    await expect(hero).toHaveCSS("min-height", "818px");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('main > [class*="hero"] nav a')).toHaveCount(6);
    const details = await page.locator("main > article").boundingBox();
    expect(details?.width).toBeCloseTo(1200, 0);
  }
});

test("admin desktop hero follows the Figma dashboard frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900010, username: "admin-fixture", role: "ADMIN", displayName: "Admin Fixture",
    avatarUrl: null, isHq: true,
  } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/admin/dashboard", route => route.fulfill({ json: { users: 12, activeUsers: 9, hqUsers: 2, movies: 40, reviews: 18, hiddenReviews: 1 } }));
  await page.route("**/api/admin/users**", route => route.fulfill({ json: { content: [{
    id: 900011, username: "profile-fixture", displayName: "Profile Fixture", email: "profile@example.invalid",
    role: "USER", avatarUrl: null, isActive: true, isHq: false,
  }], totalPages: 1, totalElements: 1 } }));
  await page.route("**/api/admin/users/900011", route => route.fulfill({ json: {
    id: 900011, username: "profile-fixture", displayName: "Profile Fixture", email: "profile@example.invalid",
    role: "USER", avatarUrl: null, isActive: true, isHq: false, createdAt: "2026-01-01T00:00:00Z",
  } }));
  await page.route("**/api/admin/users/900011/overview", route => route.fulfill({ json: {
    adminHistory: [{ id: 1, action: "SITE_SETTING_UPDATED", targetType: "SITE_SETTING", targetId: null, createdAt: "2026-01-01T00:00:00Z" }],
    stats: { watched: 74, reviews: 37, likesReceived: 145, comments: 64, customLists: 15 },
  } }));
  await page.route("**/api/admin/settings", route => route.fulfill({ json: [
    { key: "site_name", value: "Rewind", updatedBy: null, updatedAt: null },
    { key: "default_locale", value: "uk", updatedBy: null, updatedAt: null },
    { key: "maintenance_mode", value: "false", updatedBy: null, updatedAt: null },
    { key: "journal_enabled", value: "true", updatedBy: null, updatedAt: null },
  ] }));
  await page.route("**/api/admin/reviews**", route => route.fulfill({ json: { content: [{
    id: 900021, movieId: 77, movieTitle: "Review fixture", userId: 900011, username: "profile-fixture",
    content: "A Figma aligned review fixture.", rating: 4, isHidden: false, moderatedReason: null,
    moderatedAt: null, createdAt: "2026-01-01T00:00:00Z",
  }], totalPages: 1, totalElements: 1 } }));
  await page.route("**/api/admin/comments**", route => route.fulfill({ json: { content: [{
    id: 900022, reviewId: 900021, userId: 900011, username: "profile-fixture", content: "A Figma aligned comment fixture.",
    isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2026-01-01T00:00:00Z",
  }], totalPages: 1, totalElements: 1 } }));
  await page.route("**/api/admin/lists**", route => route.fulfill({ json: { content: [{
    id: 900023, userId: 900011, username: "profile-fixture", name: "Lists fixture", description: null,
    listType: "CUSTOM", isPublic: true, itemCount: 6, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
  }], totalPages: 1, totalElements: 1 } }));
  await page.route("**/api/admin/moderation/queue**", route => route.fulfill({ json: { content: [{
    type: "REVIEW", id: 900021, parentId: null, movieId: 77, subject: "Review fixture", userId: 900011,
    username: "profile-fixture", content: "Moderation fixture.", createdAt: "2026-01-01T00:00:00Z",
  }], totalPages: 1, totalElements: 1 } }));
  await page.goto("/uk/admin");
  const hero = page.locator('main > [class*="hero"]');
  await expect(hero).toHaveCSS("min-height", "1020px");
  const avatar = await hero.locator('[class*="avatar"]').boundingBox();
  expect(avatar?.width).toBeCloseTo(272, 0);
  const summary = page.locator('main > [class*="summary"]');
  await expect(summary).toBeVisible();
  const summaryBox = await summary.boundingBox();
  expect(summaryBox?.x).toBeCloseTo(120, 0);
  expect(summaryBox?.width).toBe(1200);
  await expect(summary.locator('[class*="summaryCard"]')).toHaveCount(6);
  const cards = await summary.locator('[class*="summaryCard"]').evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height, top: rect.top };
  }));
  expect(cards.every(card => Math.abs(card.width - 368) < 1)).toBe(true);
  expect(cards.every(card => card.height >= 233)).toBe(true);
  expect(new Set(cards.map(card => card.top)).size).toBe(2);
  const users = page.getByRole("region", { name: "Користувачі" });
  await expect(users).toBeVisible();
  const usersBox = await users.boundingBox();
  expect(usersBox?.x).toBeCloseTo(120, 0);
  expect(usersBox?.width).toBe(1200);
  const userToolbar = users.locator('form').first();
  const userToolbarBox = await userToolbar.boundingBox();
  expect(userToolbarBox?.width).toBeCloseTo(402, 0);
  await expect(users.getByRole("listitem")).toHaveCount(1);
  await users.getByRole("button", { name: /профіл/i }).click();
  const detail = users.locator("#admin-user-profile");
  await expect(detail).toBeVisible();
  const detailBox = await detail.boundingBox();
  expect(detailBox?.x).toBeCloseTo(120, 0);
  expect(detailBox?.width).toBe(1200);
  expect(detailBox?.height).toBeGreaterThanOrEqual(829);
  await expect(detail.locator('[class*="detailSubsection"]')).toHaveCount(2);
  const detailCards = await detail.locator('[class*="detailSubsection"]').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
  expect(detailCards.every(height => height >= 501)).toBe(true);
  const settings = page.locator('section[aria-labelledby="admin-settings-title"]');
  await expect(settings).toBeVisible();
  const settingsBox = await settings.boundingBox();
  expect(settingsBox?.x).toBeCloseTo(120, 0);
  expect(settingsBox?.width).toBe(1200);
  expect(settingsBox?.height).toBeGreaterThanOrEqual(734);
  await expect(settings.locator('input')).toHaveCount(4);
  const reviews = page.getByRole("region", { name: "Огляди" });
  await expect(reviews).toBeVisible();
  const reviewRow = reviews.locator('ul[class*="list"] > li');
  await expect(reviewRow).toHaveCount(1);
  const reviewBox = await reviewRow.boundingBox();
  expect(reviewBox?.x).toBeCloseTo(120, 0);
  expect(reviewBox?.width).toBe(1200);
  expect(reviewBox?.height).toBeGreaterThanOrEqual(429);
  const comments = page.getByRole("region", { name: "Коментарі" });
  await expect(comments).toBeVisible();
  const commentRow = comments.locator('ul[class*="list"] > li');
  await expect(commentRow).toHaveCount(1);
  const commentBox = await commentRow.boundingBox();
  expect(commentBox?.x).toBeCloseTo(120, 0);
  expect(commentBox?.width).toBe(1200);
  expect(commentBox?.height).toBeGreaterThanOrEqual(249);
  const lists = page.getByRole("region", { name: "Списки" });
  await expect(lists).toBeVisible();
  const listRow = lists.locator('ul[class*="list"] > li');
  await expect(listRow).toHaveCount(1);
  const listBox = await listRow.boundingBox();
  expect(listBox?.x).toBeCloseTo(120, 0);
  expect(listBox?.width).toBe(1200);
  expect(listBox?.height).toBeGreaterThanOrEqual(393);
  const moderation = page.getByRole("region", { name: "Черга модерації" });
  await expect(moderation).toBeVisible();
  const moderationBox = await moderation.boundingBox();
  expect(moderationBox?.x).toBeCloseTo(120, 0);
  expect(moderationBox?.width).toBe(1200);
  expect(moderationBox?.height).toBeGreaterThanOrEqual(673);
});
