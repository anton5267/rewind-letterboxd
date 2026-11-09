import { expect, test, type Route } from "@playwright/test";

test("profile list poster preview Retry restores focus on repeated failure and recovered list", async ({ page }) => {
  const user = { id: 95001, username: "list-retry-owner", role: "USER", displayName: "List Retry Owner", avatarUrl: null };
  const profile = {
    ...user,
    email: "list-retry@example.invalid",
    stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
    ratingDistribution: [], socialLinks: [],
    lists: [{ id: 95010, name: "Retry List", listType: "CUSTOM", isPublic: true }],
    recentRatings: [], recentReviews: [],
  };
  const emptyPage = { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 };
  let itemAttempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: user });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/profile/me/social-links") return route.fulfill({ json: [] });
    if (pathname === "/api/lists/my") return route.fulfill({ json: [{ id: 95010, name: "Retry List", description: null, listType: "CUSTOM", isPublic: true, tags: [] }] });
    if (pathname === "/api/lists/95010/items") {
      itemAttempts++;
      if (itemAttempts < 3) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({ json: [] });
    }
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "profile-list-retry" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname.endsWith("/activity") || pathname.endsWith("/following") || pathname.endsWith("/followers")) return route.fulfill({ json: emptyPage });
    if (pathname.startsWith("/api/profile/me/")) return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 12 } });
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/profile?view=lists");
  const card = page.locator('[data-profile-list-id="95010"]');
  const retry = card.getByRole("button", { name: /спробувати ще/i });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(() => itemAttempts).toBe(2);
  const repeatedRetry = card.getByRole("button", { name: /спробувати ще/i });
  await expect(repeatedRetry).toBeFocused();
  await repeatedRetry.press("Enter");
  await expect.poll(() => itemAttempts).toBe(3);
  const listLink = card.locator('[data-profile-list-posters="95010"]');
  await expect(listLink).toBeFocused();
  await expect(listLink).toHaveCSS("outline-style", "solid");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
});
