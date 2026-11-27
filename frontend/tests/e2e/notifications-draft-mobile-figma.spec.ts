import { expect, test, type Page } from "@playwright/test";

const owner = { id: 97300, username: "notification-owner", role: "USER", displayName: "Notification Owner", avatarUrl: null };

async function openNotificationState(page: Page, lang: "en" | "uk", read: boolean) {
  const item = {
    id: 97301,
    type: "FOLLOW",
    createdAt: "2026-11-18T11:40:00Z",
    readAt: read ? "2026-11-18T12:41:00Z" : null,
    actor: { id: 97302, username: "fixture-someone", displayName: lang === "uk" ? "Хтось" : "Someone", avatarUrl: null },
    relatedUserId: 97302,
    reviewId: null,
  };
  await page.route("**/api/users/me", route => route.fulfill({ json: owner }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "notification-figma-fixture" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/notifications/stream", route => route.abort());
  await page.route(/\/api\/notifications(?:\?.*)?$/, route => route.fulfill({ json: {
    content: [item], totalPages: 1, totalElements: 1, number: 0, size: 20,
  } }));
  await page.route("**/api/notifications/unread-count", route => route.fulfill({ json: { count: read ? 0 : 1 } }));
  await page.route("**/api/notifications/preferences", route => route.fulfill({ json: { followsEnabled: true, reviewLikesEnabled: true } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: read ? 0 : 1 } }));
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto(`/${lang}/notifications`);
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
}

for (const lang of ["en", "uk"] as const) {
  for (const read of [true, false]) {
    test(`DRAFT ${lang} notification ${read ? "read" : "unread"} state matches the 393px Figma layout`, async ({ page }) => {
      await openNotificationState(page, lang, read);
      const title = lang === "en" ? "Notifications" : "Сповіщення";
      const hero = page.locator("main > div > section").first();
      const settings = page.locator('[aria-labelledby="notification-preferences"]');
      const feed = page.locator('[aria-label="Notifications"], [aria-label="Сповіщення"]').last();
      await expect(page.locator("#notifications-title")).toHaveText(read ? title : `${title} (1)`);
      if (read) await expect(hero.locator("button")).toBeDisabled();
      else await expect(hero.locator("button")).toBeEnabled();
      await expect(feed.getByRole("listitem")).toHaveCount(1);
      await expect(feed.getByRole("button", { name: lang === "en" ? "Mark as read" : "Прочитано" })).toHaveCount(read ? 0 : 1);
      await expect(settings.getByRole("checkbox")).toHaveCount(2);
      const geometry = await page.evaluate(() => {
        const rect = (selector: string) => {
          const element = document.querySelector<HTMLElement>(selector);
          if (!element) throw new Error(`Missing ${selector}`);
          const { x, y, width, height } = element.getBoundingClientRect();
          return { x, y, width, height };
        };
        return {
          header: rect("header"),
          logo: rect("header img"),
          scrollY: window.scrollY,
          hero: rect("main > div > section"),
          settings: rect('[aria-labelledby="notification-preferences"]'),
          row: rect('[aria-labelledby="notification-preferences"] label'),
          checkbox: rect('[aria-labelledby="notification-preferences"] input'),
          feed: rect('[aria-label="Notifications"], [aria-label="Сповіщення"]'),
          item: rect('[aria-label="Notifications"] li, [aria-label="Сповіщення"] li'),
          actor: rect('[aria-label="Notifications"] [data-notification-actor], [aria-label="Сповіщення"] [data-notification-actor]'),
          action: rect('[aria-label="Notifications"] [data-notification-action], [aria-label="Сповіщення"] [data-notification-action]'),
          width: document.documentElement.scrollWidth,
        };
      });
      console.log(`NOTIFICATION_FIGMA_${lang}_${read ? "READ" : "UNREAD"}`, JSON.stringify(geometry));
      expect(geometry.width).toBe(393);
      expect(geometry.hero).toMatchObject({ x: 12, y: 96, width: 369, height: 250 });
      expect(geometry.settings.x).toBe(12);
      expect(geometry.settings.y).toBe(362);
      expect(geometry.row).toMatchObject({ x: 28, y: 416, width: 337, height: 48 });
      expect(geometry.checkbox).toMatchObject({ x: 310, y: 430, width: 20, height: 20 });
      expect(geometry.actor).toMatchObject({ x: 42, y: 593 });
      expect(Math.abs((geometry.action?.x ?? 0) - (read ? (lang === "uk" ? 94 : 104) : (lang === "uk" ? 94 : 108)))).toBeLessThan(1);
      expect(geometry.feed.y).toBe(562);
      await page.screenshot({ path: `../artifacts/visual-audit-20261124/notifications/rewind-notifications-${lang}-${read ? "read" : "unread"}-393.png` });
    });
  }
}
