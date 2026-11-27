import { expect, test, type Page, type Route } from "@playwright/test";

const owner = { id: 97400, username: "notification-owner", role: "USER", displayName: "Notification Owner", avatarUrl: null };

async function installPreferencesState(page: Page, state: "loading" | "load-error" | "saved" | "save-error", lang: "uk" | "en") {
  await page.route("**/api/notifications/stream", route => route.abort());
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ json: owner });
    if (url.pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "notification-preferences-figma" } });
    if (url.pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (url.pathname === "/api/notifications") return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } });
    if (url.pathname === "/api/notifications/preferences") {
      if (route.request().method() === "GET") {
        if (state === "loading") await new Promise(resolve => setTimeout(resolve, 10000));
        if (state === "load-error") return route.fulfill({ status: 503, json: {} });
        return route.fulfill({ json: { followsEnabled: true, reviewLikesEnabled: true } });
      }
      if (state === "save-error") return route.fulfill({ status: 503, json: {} });
      return route.fulfill({ json: route.request().postDataJSON() });
    }
    return route.fulfill({ json: [] });
  });
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto(`/${lang}/notifications`);
}

for (const lang of ["uk", "en"] as const) {
  for (const state of ["loading", "load-error", "saved", "save-error"] as const) {
    test(`Notifications preferences ${state} matches Figma ${lang.toUpperCase()} frame`, async ({ page }) => {
      await installPreferencesState(page, state, lang);
      const preferences = page.locator('[data-notification-retry="preferences"]');
      const expectedHeight = state === "loading" ? 136 : state === "load-error" ? (lang === "uk" ? 188 : 144) : state === "saved" ? 234 : 302;
      if (state === "loading") await expect(preferences.getByRole("status")).toBeVisible();
      if (state === "load-error") await expect(preferences.getByRole("alert")).toBeVisible();
      if (state === "saved" || state === "save-error") {
        await preferences.getByRole("checkbox").first().click();
        await expect(preferences.getByRole(state === "saved" ? "status" : "alert")).toBeVisible();
      }
      const geometry = await preferences.boundingBox();
      console.log(`NOTIFICATION_PREFERENCES_${lang}_${state}`, JSON.stringify(geometry));
      const childGeometry = await preferences.evaluate(element => {
        const rect = (selector: string) => {
          const child = element.querySelector<HTMLElement>(selector);
          if (!child) return null;
          const { x, y, width, height } = child.getBoundingClientRect();
          return { x, y, width, height };
        };
        return {
          heading: rect("h2"),
          row: rect("label"),
          checkbox: rect("input[type=checkbox]"),
          loading: rect("p[role=status]"),
          loadError: rect("p[role=alert]"),
          saveNotice: rect("[data-notification-preferences-save-retry]"),
          retry: rect("button"),
        };
      });
      console.log(`NOTIFICATION_PREFERENCES_CHILDREN_${lang}_${state}`, JSON.stringify(childGeometry));
      expect(childGeometry.heading).toMatchObject({ x: 27, y: 379, width: 337 });
      if (state === "saved" || state === "save-error") {
        expect(childGeometry.row).toMatchObject({ x: 27, y: 415, width: 337, height: 48 });
        expect(childGeometry.checkbox).toMatchObject({ x: 332, y: 429, width: 20, height: 20 });
      }
      if (state === "loading") expect(childGeometry.loading).toMatchObject({ x: 27, y: 417, width: 337, height: 48 });
      if (state === "load-error") {
        expect(childGeometry.loadError).toMatchObject({ x: 27, y: 417, width: 337, height: lang === "uk" ? 116 : 72 });
        expect(childGeometry.retry).toMatchObject({ x: lang === "uk" ? 43 : 267, y: lang === "uk" ? 475 : 431, width: lang === "uk" ? 132 : 81, height: 44 });
      }
      if (state === "saved" || state === "save-error") {
        expect(childGeometry.saveNotice).toMatchObject({ x: 27, y: 531, width: 337, height: state === "saved" ? 48 : 116 });
      }
      if (state === "save-error") expect(childGeometry.retry).toMatchObject({ x: 43, y: 589, width: lang === "uk" ? 132 : 81, height: 44 });
      await page.screenshot({ path: `../artifacts/visual-audit-20261124/notifications/preferences-${lang}-${state}-393.png` });
      expect(geometry?.x).toBe(12);
      expect(geometry?.width).toBe(369);
      expect(geometry?.height).toBe(expectedHeight);
    });
  }
}
