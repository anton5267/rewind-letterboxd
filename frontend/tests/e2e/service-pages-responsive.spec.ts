import { expect, test } from "@playwright/test";

test("service pages use the Figma editorial hero and retain route navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const route of ["help", "faq", "contact", "rules", "privacy", "film-data", "important-data", "delete-account", "terms", "conditions", "safety-notice", "hq-accounts"]) {
    await page.goto(`/uk/${route}`);
    const hero = page.locator('main > [class*="hero"]');
    await expect(hero).toHaveCSS("min-height", "818px");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('main > [class*="hero"] nav a')).toHaveCount(10);
    const details = await page.locator("main > article").boundingBox();
    expect(details?.width).toBeCloseTo(1200, 0);
  }
});

test("service page sections preserve the Figma editorial rhythm across breakpoints", async ({ page }) => {
  const expectedSections = { help: 9, contact: 3, rules: 9, privacy: 5, "film-data": 2, "delete-account": 4, terms: 7, conditions: 6, "safety-notice": 5, "hq-accounts": 4 };

  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [route, count] of Object.entries(expectedSections)) {
    await page.goto(`/en/${route}`);
    const article = page.locator("main > article");
    await expect(article.locator("section")).toHaveCount(count);
    const firstRow = article.locator("section").first();
    const firstHeading = firstRow.getByRole("heading", { level: 3 });
    await expect(firstHeading).toBeVisible();
    const rowBox = await firstRow.boundingBox();
    expect(rowBox?.x).toBeCloseTo(120, 0);
    expect(rowBox?.width).toBe(1200);
  }

  await page.setViewportSize({ width: 393, height: 844 });
  for (const [route, count] of Object.entries(expectedSections)) {
    await page.goto(`/uk/${route}`);
    const article = page.locator("main > article");
    await expect(article.locator("section")).toHaveCount(count);
    await expect(article.locator("section").first().getByRole("heading", { level: 3 })).toBeVisible();
    await expect(article.locator("section").first().locator("p, ul, ol").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
  }
});

test("admin shares the compact shell and keeps personal and platform metrics separate", async ({ page }) => {
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
  await page.route("**/api/admin/audit-logs**", route => route.fulfill({ json: { content: [{
    id: 900024, adminId: 900010, action: "SITE_SETTING_UPDATED", targetType: "SITE_SETTING", targetId: null,
    metadata: null, createdAt: "2026-01-01T00:00:00Z",
  }], totalPages: 1, totalElements: 1 } }));
  await page.route("**/api/admin/users/900010/overview", route => route.fulfill({ json: { stats: { watched: 8, customLists: 3, reviews: 4, likesReceived: 5, watchlist: 6 } } }));
  await page.route("**/api/users/900010/profile", route => route.fulfill({ json: { id: 900010, ratingDistribution: [{ rating: 2, count: 1 }, { rating: 4, count: 1 }] } }));
  await page.goto("/uk/admin");
  const hero = page.locator('main > header');
  await expect(hero).toHaveCSS("min-height", "390px");
  const avatar = await hero.locator('[class*="avatar"]').boundingBox();
  expect(avatar?.width).toBe(80);
  const heroBox = await hero.boundingBox();
  expect(heroBox!.height).toBeLessThanOrEqual(500);
  const navigation = hero.getByRole("navigation");
  await expect(navigation.getByRole("link")).toHaveCount(12);
  const personal = page.locator('section[aria-labelledby="admin-personal-metrics"]');
  await expect(personal.getByText("Створені списки", { exact: true })).toHaveCount(1);
  const platform = page.getByRole("region", { name: "Статистика платформи" });
  await expect(platform.locator('[class*="summaryCard"]')).toHaveCount(6);
  expect((await platform.boundingBox())?.width).toBe(1200);
  for (const view of ["users", "reviews", "comments", "lists", "moderation", "logs", "settings"]) {
    const link = navigation.locator(`a[href="/uk/admin?view=${view}"]`);
    const label = await link.getAttribute("aria-label");
    await link.click();
    await expect(link).toHaveAttribute("aria-current", "page");
    await expect(page.locator('main > h2')).toHaveText(label!);
    await expect(page.locator('main > section').first()).toBeVisible();
    const section = await page.locator('main > section').first().boundingBox();
    expect(section?.x).toBeCloseTo(120, 0);
    expect(section?.width).toBe(1200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  }
  const settings = page.locator('section[aria-labelledby="admin-settings-title"]');
  await expect(settings.locator('input, select')).toHaveCount(4);
});
