import { expect, test, type Page, type Route } from "@playwright/test";

const admin = { id: 91050, username: "retry-admin", role: "ADMIN", displayName: "Retry Admin", email: "retry-admin@example.invalid", avatarUrl: null, isActive: true, isHq: false };
const subject = { id: 91051, username: "detail-target", role: "USER", displayName: "Detail Target", email: "detail-target@example.invalid", avatarUrl: null, isActive: true, isHq: false, createdAt: "2026-10-01T12:00:00Z" };
const overview = { stats: { watched: 0, reviews: 0, ratings: 0, watchlist: 0, favorites: 0, comments: 0, likesReceived: 0, customLists: 0 }, adminHistory: [] };

async function installFixture(page: Page, target: "identity" | "overview") {
  let attempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/users/me") return route.fulfill({ json: admin });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "admin-detail-retry-focus" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/admin/users/91051" || pathname === "/api/admin/users/91051/overview") {
      const thisTarget = pathname.endsWith("/overview") ? "overview" : "identity";
      if (thisTarget === target) {
        attempts++;
        if (attempts < 3) return route.fulfill({ status: 503, json: {} });
      }
      return route.fulfill({ json: thisTarget === "overview" ? overview : subject });
    }
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } });
  });
  return () => attempts;
}

for (const { target, lang, width } of [
  { target: "identity" as const, lang: "uk", width: 393 },
  { target: "overview" as const, lang: "en", width: 1440 },
]) {
  test(`Admin User ${target} Retry restores focus on repeated failure and recovery (${lang}/${width})`, async ({ page }) => {
    const attempts = await installFixture(page, target);
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await page.goto(`/${lang}/admin?view=user-profile&user=91051`);
    const section = page.locator(`section[aria-label="${lang === "uk" ? "Профіль користувача" : "User profile"}"]`);
    const retry = section.getByRole("button", { name: /retry|спробувати/i });
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(attempts).toBe(2);
    await expect(section).toHaveAttribute("aria-busy", "false");
    await expect(retry).toBeEnabled();
    await expect(retry).toBeFocused();
    await retry.press("Enter");
    await expect.poll(attempts).toBe(3);
    const heading = target === "identity" ? page.locator("#admin-user-profile-title") : page.locator("#admin-user-history");
    await expect(heading).toBeFocused();
    await expect(heading).toHaveCSS("outline-style", "solid");
  });
}
