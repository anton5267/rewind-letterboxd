import { expect, test, type Page, type Route } from "@playwright/test";

const owner = { id: 97410, username: "notification-owner", role: "USER", displayName: "Notification Owner", avatarUrl: null };

async function openFeedState(page: Page, lang: "uk" | "en", state: "error" | "loading" | "empty") {
  await page.route("**/api/notifications/stream", route => route.abort());
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ json: owner });
    if (url.pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "notification-feed-figma" } });
    if (url.pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (url.pathname === "/api/notifications/preferences") return route.fulfill({ json: { followsEnabled: true, reviewLikesEnabled: true } });
    if (url.pathname === "/api/notifications") {
      if (state === "loading") await new Promise(resolve => setTimeout(resolve, 10000));
      if (state === "error") return route.fulfill({ status: 503, json: {} });
      return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 20 } });
    }
    return route.fulfill({ json: [] });
  });
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto(`/${lang}/notifications`);
  await expect(page.getByRole("region", { name: lang === "uk" ? "Налаштування сповіщень" : "Notification settings" }).getByRole("checkbox")).toHaveCount(2);
}

for (const lang of ["uk", "en"] as const) {
  for (const state of ["error", "loading", "empty"] as const) {
    test(`Notifications feed ${state} matches Figma ${lang.toUpperCase()} mobile frame`, async ({ page }) => {
      await openFeedState(page, lang, state);
      const feed = page.locator('[data-notification-retry="feed"]');
      if (state === "error") await expect(feed.getByRole("alert")).toBeVisible();
      if (state === "loading") await expect(feed).toHaveAttribute("aria-busy", "true");
      if (state === "empty") await expect(feed.getByText(lang === "uk" ? "Нових сповіщень немає." : "No notifications yet.")).toBeVisible();

      const geometry = await feed.evaluate(element => {
        const rect = (selector: string) => {
          const child = element.querySelector<HTMLElement>(selector);
          if (!child) return null;
          const { x, y, width, height } = child.getBoundingClientRect();
          return { x, y, width, height };
        };
        const { x, y, width, height } = element.getBoundingClientRect();
        return {
          card: { x, y, width, height },
          notice: rect("p"),
          error: rect("p[role=alert]"),
          message: rect("p[role=alert] span"),
          retry: rect("button"),
        };
      });
      const pageGeometry = await page.evaluate(() => {
        const rect = (selector: string) => {
          const element = document.querySelector<HTMLElement>(selector);
          if (!element) return null;
          const { x, y, width, height } = element.getBoundingClientRect();
          return { x, y, width, height };
        };
        const logo = document.querySelector<HTMLImageElement>("header img");
        const logoStyle = logo ? getComputedStyle(logo) : null;
        return { scrollY: window.scrollY, header: rect("header"), headerLogo: rect("header img"), logoLoaded: logo?.naturalWidth, logoDisplay: logoStyle?.display, logoOpacity: logoStyle?.opacity, hero: rect("main > div > section:first-of-type"), preferenceCard: rect('[aria-labelledby="notification-preferences"]'), row: rect('[aria-labelledby="notification-preferences"] label'), checkbox: rect('[aria-labelledby="notification-preferences"] input') };
      });
      console.log(`NOTIFICATION_FEED_${lang}_${state}`, JSON.stringify({ ...geometry, page: pageGeometry }));
      expect(geometry.card).toMatchObject({ x: 12, y: 562, width: 369, height: state === "error" ? (lang === "uk" ? 132 : 88) : 122 });
      expect(pageGeometry.header).not.toBeNull();
      expect(pageGeometry.hero).toMatchObject({ x: 12, y: 96, width: 369, height: 250 });
      expect(pageGeometry.row).toMatchObject({ x: 28, y: 416, width: 337, height: 48 });
      expect(pageGeometry.checkbox).toMatchObject({ x: 310, y: 430, width: 20, height: 20 });
      if (state === "error") {
        expect(geometry.error).toMatchObject({ x: 28, y: 570, width: 337, height: lang === "uk" ? 116 : 72 });
        expect(geometry.message).toMatchObject({ x: 44, y: lang === "uk" ? 584 : 596, width: lang === "uk" ? 305 : 210 });
        expect(geometry.retry).toMatchObject({ x: lang === "uk" ? 44 : 268, y: lang === "uk" ? 628 : 584, width: lang === "uk" ? 132 : 81, height: 44 });
      } else {
        expect(geometry.notice).toMatchObject({ x: 28, y: 594, width: 337, height: 54 });
      }
      await page.screenshot({ path: `../artifacts/visual-audit-20261124/notifications/feed-${lang}-${state}-393.png` });
    });
  }
}
