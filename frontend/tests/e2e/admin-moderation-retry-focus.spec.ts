import { expect, test, type Page } from "@playwright/test";

const admin = { id: 91070, username: "moderation-retry-admin", role: "ADMIN", displayName: "Moderation Retry Admin", avatarUrl: null };
const emptyPage = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 50 };

async function installFixture(page: Page, delayedSuccess = false) {
  let attempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: admin });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "admin-moderation-retry-focus" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/admin/moderation/queue") {
      attempts += 1;
      if (attempts < 3) return route.fulfill({ status: 503, json: {} });
      if (delayedSuccess) await new Promise(resolve => setTimeout(resolve, 350));
      return route.fulfill({ json: emptyPage });
    }
    if (pathname === "/api/admin/dashboard") return route.fulfill({ json: { users: 0, activeUsers: 0, hqUsers: 0, movies: 0, reviews: 0, hiddenReviews: 0 } });
    return route.fulfill({ json: emptyPage });
  });
  return () => attempts;
}

test("Admin moderation queue Retry retains focus after repeated failure and returns to the queue after recovery", async ({ page }) => {
  const attempts = await installFixture(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/uk/admin?view=moderation");
  const queue = page.locator("section[aria-labelledby='moderation-heading']");
  const retry = queue.getByRole("button", { name: "Спробувати ще" });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(attempts).toBe(2);
  const retryAgain = queue.getByRole("button", { name: "Спробувати ще" });
  await expect(retryAgain).toBeEnabled();
  await expect(queue).toHaveAttribute("aria-busy", "false");
  await expect(retryAgain).toBeFocused();
  await retryAgain.press("Enter");
  await expect.poll(attempts).toBe(3);
  await expect(queue.getByRole("heading", { name: "Список контенту для модерації" })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
});

test("Admin moderation queue Retry preserves a manual Tab move during delayed recovery", async ({ page }) => {
  const attempts = await installFixture(page, true);
  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/en/admin?view=moderation");
  const queue = page.locator("section[aria-labelledby='moderation-heading']");
  const retry = queue.getByRole("button", { name: "Retry", exact: true });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(attempts).toBe(2);
  const retryAgain = queue.getByRole("button", { name: "Retry", exact: true });
  await expect(retryAgain).toBeEnabled();
  await expect(queue).toHaveAttribute("aria-busy", "false");
  await expect(retryAgain).toBeFocused();
  await retryAgain.press("Enter");
  await expect.poll(attempts).toBe(3);
  await expect(queue).toHaveAttribute("aria-busy", "true");
  await page.keyboard.press("Tab");
  const manualFocus = await page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent?.trim() || document.activeElement?.tagName);
  await expect(queue).toHaveAttribute("aria-busy", "false");
  await expect(queue.getByRole("heading", { name: "List of Content for Moderation" })).not.toBeFocused();
  await expect.poll(() => page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent?.trim() || document.activeElement?.tagName)).toBe(manualFocus);
});
