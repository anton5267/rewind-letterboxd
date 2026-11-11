import { expect, test } from "@playwright/test";

test("unread badge polling pauses in hidden tabs and refreshes when visible", async ({ page }) => {
  const user = { id: 97000, username: "visibility-owner", role: "USER", displayName: "Visibility Owner", avatarUrl: null };
  let messageCountRequests = 0;
  let notificationCountRequests = 0;

  await page.addInitScript(() => {
    let state: DocumentVisibilityState = "visible";
    const pollingCallbacks = new Set<() => void>();
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
    const nativeSetInterval = window.setInterval.bind(window);
    window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      if (timeout === 30_000) {
        if (typeof handler === "function") pollingCallbacks.add(handler as () => void);
        return 30_000 as unknown as number;
      }
      return nativeSetInterval(handler, timeout, ...args);
    }) as typeof window.setInterval;
    Object.defineProperty(window, "__setRewindTestVisibility", {
      configurable: true,
      value: (next: DocumentVisibilityState) => {
        state = next;
      },
    });
    Object.defineProperty(window, "__tickRewindPolling", {
      configurable: true,
      value: () => pollingCallbacks.forEach(callback => callback()),
    });
  });

  await page.route(/^https?:\/\/[^/]+\/api\//, route => route.fulfill({ json: {} }));
  await page.route("**/api/users/me", route => route.fulfill({ json: user }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "visibility-test" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/conversations/unread-count", route => {
    messageCountRequests++;
    return route.fulfill({ json: { count: 0 } });
  });
  await page.route("**/api/notifications/unread-count", route => {
    notificationCountRequests++;
    return route.fulfill({ json: { count: 0 } });
  });

  await page.goto("/uk/home");
  await expect.poll(() => messageCountRequests).toBe(1);
  await expect.poll(() => notificationCountRequests).toBe(1);

  await page.evaluate(() => (window as typeof window & { __setRewindTestVisibility: (state: DocumentVisibilityState) => void }).__setRewindTestVisibility("hidden"));
  await page.evaluate(() => (window as typeof window & { __tickRewindPolling: () => void }).__tickRewindPolling());
  expect(messageCountRequests).toBe(1);
  expect(notificationCountRequests).toBe(1);

  await page.evaluate(() => (window as typeof window & { __setRewindTestVisibility: (state: DocumentVisibilityState) => void }).__setRewindTestVisibility("visible"));
  await page.evaluate(() => (window as typeof window & { __tickRewindPolling: () => void }).__tickRewindPolling());
  await expect.poll(() => messageCountRequests).toBe(2);
  await expect.poll(() => notificationCountRequests).toBe(2);
});
