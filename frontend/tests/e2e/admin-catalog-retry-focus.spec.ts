import { expect, test, type Route } from "@playwright/test";

const admin = { id: 91011, username: "retry-admin", role: "ADMIN", displayName: "Retry Admin", email: "retry-admin@example.invalid", avatarUrl: null, isActive: true, isHq: false };
const emptyPage = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 50 };

async function exerciseRetry(page: import("@playwright/test").Page, view: "lists" | "logs", path: string, headingName: RegExp) {
  let attempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ json: admin });
    if (url.pathname === "/api/auth/csrf") return route.fulfill({ json: { token: `admin-${view}-retry` } });
    if (url.pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (url.pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (url.pathname === path) {
      attempts++;
      if (attempts < 3) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({ json: emptyPage });
    }
    return route.fulfill({ json: emptyPage });
  });

  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto(`/uk/admin?view=${view}`);
  const section = page.getByRole("region", { name: headingName });
  const retry = section.getByRole("button", { name: /спробувати ще/i });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(() => attempts).toBe(2);
  const repeatedRetry = section.getByRole("button", { name: /спробувати ще/i });
  await expect(repeatedRetry).toBeEnabled();
  await expect(repeatedRetry).toBeFocused();
  await repeatedRetry.press("Enter");
  await expect.poll(() => attempts).toBe(3);
  const heading = section.getByRole("heading").first();
  await expect(heading).toBeFocused();
  await expect(heading).toHaveCSS("outline-style", "solid");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
}

test("Admin Lists Retry returns focus on another failure and after recovery", async ({ page }) => {
  await exerciseRetry(page, "lists", "/api/admin/lists", /усі списки/i);
});

test("Admin Audit Logs Retry returns focus on another failure and after recovery", async ({ page }) => {
  await exerciseRetry(page, "logs", "/api/admin/audit-logs", /журнал модераторів/i);
});

test("Admin Audit Logs actor details Retry returns focus after repeated failure and recovery", async ({ page }) => {
  const actor = { id: 91012, username: "audit-actor", role: "ADMIN", displayName: "Audit Actor", email: "audit-actor@example.invalid", avatarUrl: null, isActive: true, isHq: false, createdAt: "2026-10-01T12:00:00Z" };
  let actorAttempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ json: admin });
    if (url.pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "audit-actor-retry" } });
    if (url.pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (url.pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (url.pathname === "/api/admin/audit-logs") return route.fulfill({ json: { content: [{ id: 91013, adminId: actor.id, action: "USER_UPDATE", targetType: "USER", targetId: 91014, metadata: null, createdAt: "2026-10-01T12:00:00Z" }], totalPages: 1, totalElements: 1, number: 0, size: 50 } });
    if (url.pathname === `/api/admin/users/${actor.id}`) {
      actorAttempts++;
      if (actorAttempts < 3) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({ json: actor });
    }
    return route.fulfill({ json: emptyPage });
  });

  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/admin?view=logs");
  const section = page.getByRole("region", { name: /журнал модераторів/i });
  const retry = section.getByRole("button", { name: /спробувати ще/i });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(() => actorAttempts).toBe(2);
  const repeatedRetry = section.getByRole("button", { name: /спробувати ще/i });
  await expect(repeatedRetry).toBeEnabled();
  await expect(repeatedRetry).toBeFocused();
  await repeatedRetry.press("Enter");
  await expect.poll(() => actorAttempts).toBe(3);
  await expect(section).toContainText(actor.email);
  const heading = section.getByRole("heading", { name: /журнал модераторів/i });
  await expect(heading).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
});

test("Admin personal metrics Retry returns focus on repeated failure and recovered metrics", async ({ page }) => {
  let overviewAttempts = 0;
  let profileAttempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ json: admin });
    if (url.pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "admin-metrics-retry" } });
    if (url.pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (url.pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (url.pathname === "/api/admin/dashboard") return route.fulfill({ json: { users: 1, activeUsers: 1, hqUsers: 0, movies: 0, reviews: 0, hiddenReviews: 0 } });
    if (url.pathname === `/api/admin/users/${admin.id}/overview`) {
      overviewAttempts++;
      if (overviewAttempts < 3) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({ json: { adminHistory: [], stats: { watched: 0, reviews: 0, likesReceived: 0, comments: 0, customLists: 0, watchlist: 0 } } });
    }
    if (url.pathname === `/api/users/${admin.id}/profile`) {
      profileAttempts++;
      if (profileAttempts < 3) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({ json: { id: admin.id, username: admin.username, displayName: admin.displayName, avatarUrl: null, hq: false, stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 }, ratingDistribution: [], socialLinks: [], lists: [], recentReviews: [] } });
    }
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/admin");
  const section = page.getByRole("region", { name: /особисті показники/i });
  const retry = section.getByRole("button", { name: /спробувати ще/i });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(() => overviewAttempts).toBe(2);
  await expect.poll(() => profileAttempts).toBe(2);
  const repeatedRetry = section.getByRole("button", { name: /спробувати ще/i });
  await expect(repeatedRetry).toBeEnabled();
  await expect(repeatedRetry).toBeFocused();
  await repeatedRetry.press("Enter");
  await expect.poll(() => overviewAttempts).toBe(3);
  await expect.poll(() => profileAttempts).toBe(3);
  const heading = section.getByRole("heading", { name: /особисті показники/i });
  await expect(heading).toBeFocused();
  await expect(heading).toHaveCSS("outline-style", "solid");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
});
