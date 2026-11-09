import { expect, test, type Page, type Route } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261103", "profile-network-retry-focus");
mkdirSync(evidenceDir, { recursive: true });

const user = { id: 95210, username: "network-owner", role: "USER", displayName: "Network Owner", avatarUrl: null };
const profile = { ...user, email: "network-owner@example.invalid", stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 }, lists: [], recentRatings: [], recentReviews: [] };

async function installProfileApi(page: Page, failingEndpoint: "following" | "followers") {
  let attempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: user });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/profile/me/social-links") return route.fulfill({ json: [] });
    if (pathname === `/api/users/95210/${failingEndpoint}`) {
      attempts++;
      return attempts < 3
        ? route.fulfill({ status: 503, json: {} })
        : route.fulfill({ json: { content: [], number: 0, size: 8, totalElements: 0, totalPages: 0 } });
    }
    if (pathname === "/api/users/95210/activity") return route.fulfill({ json: { content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 } });
    if (pathname.includes("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname.endsWith("/following") || pathname.endsWith("/followers")) return route.fulfill({ json: { content: [], number: 0, size: 8, totalElements: 0, totalPages: 0 } });
    if (pathname.includes("/favorites") || pathname.endsWith("/ratings") || pathname.endsWith("/reviews")) return route.fulfill({ json: { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 } });
    return route.fulfill({ json: [] });
  });
  return () => attempts;
}

async function verifyRetry(page: Page, locale: "uk" | "en", view: "following" | "followers", heading: string, endpoint: "following" | "followers", suffix: string) {
  const attempts = await installProfileApi(page, endpoint);
  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto(`/${locale}/profile?view=${view}`);
  const section = page.locator(`#profile-${view}`);
  await expect(section.getByRole("heading", { name: heading })).toBeVisible();
  const retry = section.getByRole("button", { name: locale === "uk" ? "Спробувати ще" : "Retry" });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(attempts).toBe(2);
  await expect(section.getByRole("button", { name: locale === "uk" ? "Спробувати ще" : "Retry" })).toBeFocused();

  await section.getByRole("button", { name: locale === "uk" ? "Спробувати ще" : "Retry" }).press("Enter");
  await expect.poll(attempts).toBe(3);
  const toolbarHeading = page.locator("h2").filter({ hasText: heading }).first();
  await expect(toolbarHeading).toBeVisible();
  await expect(toolbarHeading).toBeFocused();
  await expect(toolbarHeading).toHaveCSS("outline-style", "solid");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: path.join(evidenceDir, `${suffix}-phone-${locale}.png`), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await page.screenshot({ path: path.join(evidenceDir, `${suffix}-desktop-${locale}.png`), fullPage: true });
}

test("following Retry focus recovers in Ukrainian", async ({ page }) => {
  await verifyRetry(page, "uk", "following", "Підписки", "following", "profile-following");
});

test("followers Retry focus recovers in English", async ({ page }) => {
  await verifyRetry(page, "en", "followers", "Followers", "followers", "profile-followers");
});
