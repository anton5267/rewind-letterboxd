import { expect, test } from "@playwright/test";

const profileId = 95161;
const people = Array.from({ length: 10 }, (_, index) => ({
  id: 95300 + index,
  username: `network-person-${index + 1}`,
  displayName: index === 0 ? "Alex Turner" : null,
  avatarUrl: null,
  followerCount: 12 + index,
  followingCount: 40 + index,
}));
const emptyPage = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 12 };

test("READY mobile public Followers and Following screens match the compact member rows", async ({ page }) => {
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === `/api/users/${profileId}/profile`) return route.fulfill({ json: {
      id: profileId, username: "jeremy-b", displayName: "Jeremy B.", avatarUrl: null, hq: false,
      location: "Germany", bio: "I watch movies and overthink them.",
      stats: { ratings: 834, reviews: 32, watched: 834, watchlist: 32, favorites: 24 },
      ratingDistribution: [], socialLinks: [], lists: [], recentReviews: [],
    } });
    if (pathname === `/api/users/${profileId}/followers` || pathname === `/api/users/${profileId}/following`) {
      return route.fulfill({ json: { content: people, totalPages: 1, totalElements: people.length, number: 0, size: 10 } });
    }
    if (pathname === "/api/users/me" || pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname.endsWith("/follow-status")) return route.fulfill({ json: { following: false, followers: 12, followingCount: 40 } });
    return route.fulfill({ json: emptyPage });
  });

  for (const [view, heading, artifact] of [
    ["followers", "Followers", "followers"],
    ["following", "Following", "following"],
  ] as const) {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(`/en/users/${profileId}?view=${view}`);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    const rows = page.locator(`#public-profile-${view} ul > li`);
    await expect(rows).toHaveCount(10);
    const first = await rows.nth(0).boundingBox();
    const second = await rows.nth(1).boundingBox();
    const avatar = await rows.nth(0).locator("img, [class*='avatarFallback']").first().boundingBox();
    expect(avatar?.width).toBe(40);
    expect(avatar?.height).toBe(40);
    expect(second!.y - first!.y).toBe(65);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
    await page.screenshot({ path: `../artifacts/visual-audit-20261124/profile/rewind-public-${artifact}-en-mobile-393.png` });
  }
});

test("READY member action sheet exposes the existing follow, block and member actions", async ({ page }) => {
  const actor = { id: 95200, username: "reader", displayName: "Reader", avatarUrl: null, role: "USER" };
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/users/me") return route.fulfill({ json: actor });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 204 });
    if (pathname === `/api/users/${profileId}/profile`) return route.fulfill({ json: {
      id: profileId, username: "jeremy-b", displayName: "Jeremy B.", avatarUrl: null, hq: false,
      stats: { ratings: 834, reviews: 32, watched: 834, watchlist: 32, favorites: 24 },
      ratingDistribution: [], socialLinks: [], lists: [], recentReviews: [],
    } });
    if (pathname === `/api/users/${profileId}/followers`) return route.fulfill({ json: {
      content: [people[0]], totalPages: 1, totalElements: 1, number: 0, size: 10,
    } });
    if (pathname === `/api/users/${people[0].id}/follow-status`) return route.fulfill({ json: { following: true, followers: 12, followingCount: 40 } });
    if (pathname === `/api/users/${people[0].id}/block-status`) return route.fulfill({ json: { blocked: false } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: emptyPage });
  });
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto(`/en/users/${profileId}?view=followers`);
  await page.getByRole("button", { name: "More actions: Alex Turner" }).click();
  const dialog = page.getByRole("dialog", { name: "Alex Turner" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Unfollow" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Block" })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Go to member" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Done" })).toBeFocused();
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-member-actions-en-mobile-393.png" });
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
