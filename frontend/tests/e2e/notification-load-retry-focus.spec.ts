import { expect, test, type Page, type Route } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261103", "notification-load-retry-focus");
mkdirSync(evidenceDir, { recursive: true });
type Target = "unread" | "preferences" | "feed";
const user = { id: 97000, username: "notification-owner", role: "USER", displayName: "Notification Owner", avatarUrl: null };
const emptyFeed = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 20 };

async function installFixture(page: Page, target: Target, delayedSuccess = false) {
  let attempts = 0;
  await page.route("**/api/notifications/stream", route => route.abort());
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/notifications/stream") return route.abort();
    if (url.pathname === "/api/users/me") return route.fulfill({ json: user });
    if (url.pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "notification-load-focus" } });
    if (url.pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    const targetPath = target === "unread" ? "/api/notifications/unread-count" : target === "preferences" ? "/api/notifications/preferences" : "/api/notifications";
    if (url.pathname === targetPath && (target !== "feed" || route.request().method() === "GET")) {
      attempts++;
      const failures = target === "unread" ? 3 : 2;
      if (attempts <= failures) return route.fulfill({ status: 503, json: {} });
      if (delayedSuccess) await new Promise(resolve => setTimeout(resolve, 300));
      if (target === "unread") return route.fulfill({ json: { count: 0 } });
      if (target === "preferences") return route.fulfill({ json: { followsEnabled: true, reviewLikesEnabled: true } });
      return route.fulfill({ json: emptyFeed });
    }
    if (url.pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (url.pathname === "/api/notifications/preferences") return route.fulfill({ json: { followsEnabled: true, reviewLikesEnabled: true } });
    if (url.pathname === "/api/notifications") return route.fulfill({ json: emptyFeed });
    return route.fulfill({ json: [] });
  });
  return () => attempts;
}

for (const { target, lang, width } of [
  { target: "unread" as const, lang: "uk", width: 393 },
  { target: "preferences" as const, lang: "en", width: 1440 },
  { target: "feed" as const, lang: "en", width: 393 },
  { target: "feed" as const, lang: "uk", width: 1440 },
]) {
  test(`Notifications ${target} Retry restores focus after repeated failure and recovery (${lang}/${width})`, async ({ page }) => {
    const getAttempts = await installFixture(page, target);
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await page.goto(`/${lang}/notifications`);
    const section = page.locator(`[data-notification-retry="${target}"]`);
    const retry = section.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retry).toBeVisible();
    const observedInitialCount = await getAttempts();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(getAttempts).toBe(observedInitialCount + 1);
    const retryAgain = section.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retryAgain).toBeFocused();
    await retryAgain.press("Enter");
    await expect.poll(getAttempts).toBe(observedInitialCount + 2);
    const heading = target === "preferences" ? page.locator("#notification-preferences") : page.locator("#notifications-title");
    await expect(heading).toBeFocused();
    await expect(heading).toHaveCSS("outline-style", "solid");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    if (target === "preferences" || target === "feed" && width === 1440) await page.screenshot({ path: path.join(evidenceDir, `${target}-${width < 500 ? "phone" : "desktop"}-${lang}.png`), fullPage: true });
  });
}

test("Notifications preferences Retry preserves manual Tab during delayed success", async ({ page }) => {
  const getAttempts = await installFixture(page, "preferences", true);
  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/uk/notifications");
  const section = page.locator('[data-notification-retry="preferences"]');
  const retry = section.getByRole("button", { name: /retry|try again|спробувати/i });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(getAttempts).toBe(2);
  const retryAgain = section.getByRole("button", { name: /retry|try again|спробувати/i });
  await expect(retryAgain).toBeFocused();
  await retryAgain.press("Enter");
  await expect.poll(getAttempts).toBe(3);
  await expect(section.getByRole("status")).toBeVisible();
  await page.keyboard.press("Tab");
  const active = await page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName);
  await expect(section.getByRole("status")).toBeHidden();
  await expect(section.locator("h2")).not.toBeFocused();
  await expect.poll(async () => page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName)).toBe(active);
});
