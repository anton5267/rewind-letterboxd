import { expect, test, type Route } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261103", "profile-overview-retry-focus");
mkdirSync(evidenceDir, { recursive: true });

test("own profile overview Activity, Favorites and Lists Retry recover keyboard focus", async ({ page }) => {
  const user = { id: 95110, username: "activity-owner", role: "USER", displayName: "Activity Owner", avatarUrl: null };
  const profile = {
    ...user,
    email: "activity-owner@example.invalid",
    stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
    lists: [], recentRatings: [], recentReviews: [],
  };
  let activityAttempts = 0;
  let favoriteAttempts = 0;
  let favoriteSettingsPhase = false;
  let favoriteSettingsAttempts = 0;
  let listMetadataAttempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: user });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/profile/me/social-links") return route.fulfill({ json: [] });
    if (pathname === "/api/profile/me/favorites") {
      if (favoriteSettingsPhase) {
        favoriteSettingsAttempts++;
        return favoriteSettingsAttempts < 3
          ? route.fulfill({ status: 503, json: {} })
          : route.fulfill({ json: { content: [], number: 0, size: 24, totalElements: 0, totalPages: 0 } });
      }
      favoriteAttempts++;
      return favoriteAttempts < 3
        ? route.fulfill({ status: 503, json: {} })
        : route.fulfill({ json: { content: [], number: 0, size: 24, totalElements: 0, totalPages: 0 } });
    }
    if (pathname === "/api/lists/my") {
      listMetadataAttempts++;
      return listMetadataAttempts < 3
        ? route.fulfill({ status: 503, json: {} })
        : route.fulfill({ json: [] });
    }
    if (pathname === "/api/users/95110/activity") {
      activityAttempts++;
      return activityAttempts < 3
        ? route.fulfill({ status: 503, json: {} })
        : route.fulfill({ json: { content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 } });
    }
    if (pathname.includes("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname.endsWith("/following") || pathname.endsWith("/followers")) return route.fulfill({ json: { content: [], number: 0, size: 8, totalElements: 0, totalPages: 0 } });
    if (pathname.includes("/favorites") || pathname.endsWith("/ratings") || pathname.endsWith("/reviews")) return route.fulfill({ json: { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 } });
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/uk/profile");
  const activity = page.locator("#profile-activity");
  const retry = activity.getByRole("button", { name: "Спробувати ще" });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(() => activityAttempts).toBe(2);
  await expect(activity.getByRole("button", { name: "Спробувати ще" })).toBeFocused();

  await activity.getByRole("button", { name: "Спробувати ще" }).press("Enter");
  await expect.poll(() => activityAttempts).toBe(3);
  await expect(activity.getByRole("heading", { name: "Остання активність" })).toBeFocused();

  const favorites = page.locator("#profile-overview");
  const retryFavorites = favorites.getByRole("button", { name: "Спробувати ще" });
  await expect(retryFavorites).toBeVisible();
  await retryFavorites.focus();
  await retryFavorites.press("Enter");
  await expect.poll(() => favoriteAttempts).toBe(2);
  await expect(favorites.getByRole("button", { name: "Спробувати ще" })).toBeFocused();
  await favorites.getByRole("button", { name: "Спробувати ще" }).press("Enter");
  await expect.poll(() => favoriteAttempts).toBe(3);
  await expect(favorites.getByRole("heading", { name: "Улюблені фільми" })).toBeFocused();

  const lists = page.locator("#profile-lists");
  const retryLists = lists.getByRole("button", { name: "Спробувати ще" });
  await expect(retryLists).toBeVisible();
  await retryLists.focus();
  await retryLists.press("Enter");
  await expect.poll(() => listMetadataAttempts).toBe(2);
  await expect(lists.getByRole("button", { name: "Спробувати ще" })).toBeFocused();
  await lists.getByRole("button", { name: "Спробувати ще" }).press("Enter");
  await expect.poll(() => listMetadataAttempts).toBe(3);
  await expect(lists.getByRole("heading", { name: "Списки" })).toBeFocused();

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: path.join(evidenceDir, "profile-overview-retry-mobile-uk.png"), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1100 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await page.screenshot({ path: path.join(evidenceDir, "profile-overview-retry-desktop-uk.png"), fullPage: true });

  favoriteSettingsPhase = true;
  await page.goto("/uk/profile?settings=profile");
  await page.reload();
  const settingsFavorites = page.locator("section[aria-labelledby='settings-favorites-title']");
  const retrySettingsFavorites = settingsFavorites.getByRole("button", { name: "Спробувати ще" });
  await expect(retrySettingsFavorites).toBeVisible();
  await retrySettingsFavorites.focus();
  await retrySettingsFavorites.press("Enter");
  await expect.poll(() => favoriteSettingsAttempts).toBe(2);
  await expect(settingsFavorites.getByRole("button", { name: "Спробувати ще" })).toBeFocused();
  await settingsFavorites.getByRole("button", { name: "Спробувати ще" }).press("Enter");
  await expect.poll(() => favoriteSettingsAttempts).toBe(3);
  await expect(settingsFavorites.getByRole("heading", { name: "Улюблені фільми" })).toBeFocused();
  await expect(settingsFavorites.getByRole("heading", { name: "Улюблені фільми" })).toHaveCSS("outline-style", "solid");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await page.screenshot({ path: path.join(evidenceDir, "profile-settings-favorites-retry-desktop-uk.png"), fullPage: true });
  await page.setViewportSize({ width: 393, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: path.join(evidenceDir, "profile-settings-favorites-retry-mobile-uk.png"), fullPage: true });
});
