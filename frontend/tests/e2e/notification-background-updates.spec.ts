import { type BrowserContext, expect, type Page, test } from "@playwright/test";
import type { NotificationItem } from "../../src/api/notifications.api";

type PollingWindow = Window & {
  tickNotificationPolling(): void;
  setNotificationVisibility(value: DocumentVisibilityState): void;
};

function notification(id: number, name: string): NotificationItem {
  return {
    id,
    type: "FOLLOW",
    createdAt: "2026-11-14T00:00:00Z",
    readAt: null,
    actor: {
      id: id + 100,
      username: name.toLowerCase(),
      displayName: name,
      avatarUrl: null,
    },
    relatedUserId: id + 100,
    reviewId: null,
  };
}

async function fixture(context: BrowserContext) {
  const state = {
    items: [notification(1, "Alice")],
    unread: 1,
    feedRequests: 0,
    countRequests: 0,
    failFeed: false,
    failCount: false,
    hold: false,
    holdMark: false,
    actor: 7,
  };
  let release = () => {};
  let releaseMark = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const markGate = new Promise<void>((resolve) => {
    releaseMark = resolve;
  });
  await context.addInitScript(() => {
    let visibility: DocumentVisibilityState = "visible";
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => visibility,
    });
    const nativeInterval = window.setInterval.bind(window);
    const nativeClear = window.clearInterval.bind(window);
    const timers = new Map<number, () => void>();
    let nextTimer = 800000;
    window.setInterval =
      ((callback: TimerHandler, delay?: number, ...args: unknown[]) => {
        if (delay !== 15000 || typeof callback !== "function") {
          return nativeInterval(callback, delay, ...args);
        }
        const id = nextTimer++;
        timers.set(id, callback as () => void);
        return id;
      }) as typeof window.setInterval;
    window.clearInterval = (id) => {
      timers.delete(id ?? 0);
      nativeClear(id);
    };
    Object.assign(window, {
      tickNotificationPolling: () => timers.forEach((callback) => callback()),
      setNotificationVisibility: (value: DocumentVisibilityState) => {
        visibility = value;
        document.dispatchEvent(new Event("visibilitychange"));
      },
    });
  });
  await context.route(
    "**/auth/v1/**",
    (route) => route.fulfill({ status: 404, json: {} }),
  );
  await context.route(
    "**/auth/v1/logout**",
    (route) => route.fulfill({ status: 204, body: "" }),
  );
  await context.route("**/auth/v1/token**", (route) => {
    state.actor = route.request().postDataJSON().email?.startsWith("next")
      ? 6
      : 7;
    return route.fulfill({
      json: {
        access_token: `fixture-access-${state.actor}`,
        refresh_token: `fixture-refresh-${state.actor}`,
        token_type: "bearer",
        expires_in: 3600,
        user: {
          id: `b1f5872a-148b-4878-8581-06b809b2992${state.actor}`,
          email: state.actor === 7
            ? "fixture@example.invalid"
            : "next@example.invalid",
          aud: "authenticated",
          role: "authenticated",
          app_metadata: {},
          user_metadata: {},
          created_at: "2026-11-14T00:00:00Z",
        },
      },
    });
  });
  await context.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/api/users/me") {
        return route.fulfill({
          json: {
            id: state.actor,
            username: `reader-${state.actor}`,
            role: "USER",
          },
        });
      }
      if (url.pathname === "/api/notifications/preferences") {
        return route.fulfill({
          json: { followsEnabled: true, reviewLikesEnabled: true },
        });
      }
      if (url.pathname === "/api/notifications/unread-count") {
        state.countRequests += 1;
        const count = state.actor === 7 ? state.unread : 0;
        if (state.hold) await gate;
        return state.failCount
          ? route.fulfill({ status: 503, json: {} })
          : route.fulfill({ json: { count } });
      }
      if (url.pathname.endsWith("unread-count")) {
        return route.fulfill({
          json: { count: 0 },
        });
      }
      if (url.pathname === "/api/notifications") {
        state.feedRequests += 1;
        const content = structuredClone(state.actor === 7 ? state.items : []);
        if (state.hold) await gate;
        return state.failFeed
          ? route.fulfill({ status: 503, json: {} })
          : route.fulfill({
            json: {
              content,
              totalPages: content.length ? 1 : 0,
              totalElements: content.length,
              number: 0,
            },
          });
      }
      if (url.pathname === "/api/notifications/read-all") {
        if (state.holdMark) await markGate;
        state.items = state.items.map((item) => ({
          ...item,
          readAt: "2026-11-14T00:01:00Z",
        }));
        state.unread = 0;
        return route.fulfill({ status: 204, body: "" });
      }
      return route.fulfill({
        json: { content: [], totalPages: 0, totalElements: 0, number: 0 },
      });
    },
  );
  return { state, release, releaseMark };
}

async function openNotifications(page: Page, lang: "uk" | "en") {
  await page.goto(`/${lang}/login`);
  await page.getByLabel(lang === "uk" ? "Електронна пошта" : "Email", {
    exact: true,
  }).fill("fixture@example.invalid");
  await page.getByLabel(lang === "uk" ? "Пароль" : "Password", { exact: true })
    .fill("fixture-password-only");
  await page.getByRole("button", {
    name: lang === "uk" ? "Увійти" : "Log in",
    exact: true,
  }).click();
  await expect(page).toHaveURL(new RegExp(`/${lang}/films/?$`));
  await page.goto(`/${lang}/notifications`);
  await expect(page.locator("#notifications-title")).toHaveText(
    `${lang === "uk" ? "Сповіщення" : "Notifications"} (1)`,
  );
  await expect(page.getByRole("link", { name: "Alice", exact: true }))
    .toBeVisible();
}

const tick = (page: Page) =>
  page.evaluate(() => (window as PollingWindow).tickNotificationPolling());

for (const lang of ["uk", "en"] as const) {
  test(`incoming notifications update the feed and unread heading in ${lang}`, async ({ context, page }) => {
    const { state } = await fixture(context);
    await openNotifications(page, lang);
    const preference = page.getByRole("checkbox").first();
    await preference.focus();
    state.items.unshift(notification(2, "Bob"));
    state.unread = 2;
    await tick(page);
    await expect(page.getByRole("link", { name: "Bob", exact: true }))
      .toBeVisible();
    await expect(page.locator("#notifications-title")).toHaveText(
      `${lang === "uk" ? "Сповіщення" : "Notifications"} (2)`,
    );
    await expect(preference).toBeFocused();
    state.items = [notification(3, "Carol"), {
      ...notification(1, "Alice"),
      readAt: "2026-11-14T00:01:00Z",
    }];
    state.unread = 1;
    await tick(page);
    await expect(page.getByRole("link", { name: "Carol", exact: true }))
      .toBeVisible();
    state.items = [notification(4, "Dave")];
    await tick(page);
    await expect(page.getByRole("link", { name: "Dave", exact: true }))
      .toBeVisible();
  });
}

test("notification polling pauses while hidden and resumes immediately", async ({ context, page }) => {
  const { state } = await fixture(context);
  await openNotifications(page, "en");
  await page.evaluate(() =>
    (window as PollingWindow).setNotificationVisibility("hidden")
  );
  const requests = state.feedRequests;
  state.items.unshift(notification(2, "Bob"));
  state.unread = 2;
  await tick(page);
  expect(state.feedRequests).toBe(requests);
  await page.evaluate(() =>
    (window as PollingWindow).setNotificationVisibility("visible")
  );
  await expect(page.getByRole("link", { name: "Bob", exact: true }))
    .toBeVisible();
  state.items.unshift(notification(3, "Carol"));
  state.unread = 3;
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(page.getByRole("link", { name: "Carol", exact: true }))
    .toBeVisible();
});

test("notification background failures retain the feed and recover through Retry", async ({ context, page }) => {
  const { state } = await fixture(context);
  await openNotifications(page, "en");
  state.failFeed = true;
  state.failCount = true;
  await tick(page);
  const alert = page.getByRole("alert");
  await expect(alert).toContainText("Could not refresh notifications.");
  await expect(page.getByRole("link", { name: "Alice", exact: true }))
    .toBeVisible();
  state.failFeed = false;
  state.failCount = false;
  state.items.unshift(notification(2, "Bob"));
  state.unread = 2;
  await alert.getByRole("button").click();
  await expect(alert).toHaveCount(0);
  await expect(page.locator("#notifications-title")).toBeFocused();
  await expect(page.getByRole("link", { name: "Bob", exact: true }))
    .toBeVisible();
});

test("pending notification polls serialize and cannot undo marking all read", async ({ context, page }) => {
  const { state, release, releaseMark } = await fixture(context);
  await openNotifications(page, "en");
  const previous = state.feedRequests;
  state.hold = true;
  await tick(page);
  await expect.poll(() => state.feedRequests).toBe(previous + 1);
  await tick(page);
  expect(state.feedRequests).toBe(previous + 1);
  state.holdMark = true;
  await page.getByRole("button", { name: "Mark all as read", exact: true })
    .click();
  state.hold = false;
  release();
  releaseMark();
  await expect(page.locator("#notifications-title")).toHaveText(
    "Notifications",
  );
  await expect(page.locator("button[data-notification-mark-unread]"))
    .toHaveCount(0);
});

test("an old account's notification poll cannot populate the next account", async ({ context, page }) => {
  const { state, release } = await fixture(context);
  await openNotifications(page, "en");
  const requests = state.feedRequests;
  state.hold = true;
  await tick(page);
  await expect.poll(() => state.feedRequests).toBe(requests + 1);
  await page.locator("header").getByRole("button", {
    name: /^Account\b/,
  }).click();
  await page.locator("header").getByRole("button", {
    name: "Log out",
    exact: true,
  }).click();
  await expect(page).toHaveURL(/\/en\/login\/?$/);
  await page.getByLabel("Email", { exact: true }).fill("next@example.invalid");
  await page.getByLabel("Password", { exact: true }).fill(
    "fixture-next-password",
  );
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/notifications\/?$/);
  state.hold = false;
  release();
  await expect(page.getByRole("link", { name: "Alice", exact: true }))
    .toHaveCount(0);
  await expect(page.locator("#notifications-title")).toHaveText(
    "Notifications",
  );
});
