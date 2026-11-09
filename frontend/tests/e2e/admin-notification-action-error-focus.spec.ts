import { expect, test, type Page } from "@playwright/test";

const admin = { id: 92070, username: "notification-action-admin", role: "ADMIN", displayName: "Notification Action Admin", avatarUrl: null, email: "notification-action@example.invalid", isActive: true, isHq: false };
const notification = { id: 92071, recipientId: 92072, actorId: null, type: "FOLLOW", reviewId: null, createdAt: "2026-11-03T12:00:00Z", readAt: null };
const pageOfNotifications = { content: [notification], totalPages: 1, totalElements: 1, number: 0, size: 50 };
type Action = "create" | "toggle" | "filtered-read";

async function installFixture(page: Page, action: Action, delayFailure = false) {
  let actionRequests = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
    const { pathname } = new URL(route.request().url());
    const method = route.request().method();
    if (pathname === "/api/users/me") return route.fulfill({ json: admin });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "admin-notification-action-focus" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/admin/notifications" && method === "GET") return route.fulfill({ json: pageOfNotifications });
    const isAction = action === "create" ? pathname === "/api/admin/notifications" && method === "POST"
      : action === "toggle" ? pathname === "/api/admin/notifications/92071/read" && method === "PATCH"
        : pathname === "/api/admin/notifications/read-all" && method === "PATCH";
    if (isAction) {
      actionRequests += 1;
      if (delayFailure) await new Promise(resolve => setTimeout(resolve, 350));
      return route.fulfill({ status: 503, json: {} });
    }
    return route.fulfill({ json: { updated: 1 } });
  });
  return () => actionRequests;
}

test("Admin notification creation failure returns focus to submit and preserves the draft", async ({ page }) => {
  const requests = await installFixture(page, "create");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/uk/admin?view=notifications");
  const section = page.getByRole("region", { name: "Сповіщення" });
  const recipient = section.getByRole("spinbutton", { name: "ID отримувача", exact: true });
  const actor = section.getByRole("spinbutton", { name: "ID ініціатора", exact: true });
  const submit = section.getByRole("button", { name: "Створити сповіщення" });
  await expect(submit).toBeDisabled();
  await recipient.fill("92072");
  await expect(submit).toBeDisabled();
  await actor.fill("92073");
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect.poll(requests).toBe(1);
  await expect(section.getByRole("alert")).toBeVisible();
  await expect(submit).toBeFocused();
  await expect(recipient).toHaveValue("92072");
  await expect(actor).toHaveValue("92073");
});

test("Admin review-like notification requires an actor and a real review reference", async ({ page }) => {
  const requests = await installFixture(page, "create");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/uk/admin?view=notifications");
  const section = page.getByRole("region", { name: "Сповіщення" });
  const recipient = section.getByRole("spinbutton", { name: "ID отримувача", exact: true });
  const actor = section.getByRole("spinbutton", { name: "ID ініціатора", exact: true });
  const review = section.getByRole("spinbutton", { name: "ID огляду", exact: true });
  const type = section.getByRole("combobox", { name: "Тип сповіщення", exact: true });
  const submit = section.getByRole("button", { name: "Створити сповіщення" });
  await recipient.fill("92072");
  await actor.fill("92073");
  await type.selectOption("REVIEW_LIKED");
  await expect(review).toHaveAttribute("required", "");
  await expect(submit).toBeDisabled();
  await review.fill("92074");
  await expect(submit).toBeEnabled();
  expect(requests()).toBe(0);
});

test("Admin notification read-state failure returns focus to the row action", async ({ page }) => {
  const requests = await installFixture(page, "toggle");
  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/en/admin?view=notifications");
  const section = page.getByRole("region", { name: "Notifications" });
  const action = section.getByRole("button", { name: "Mark as read" });
  await action.click();
  await expect.poll(requests).toBe(1);
  await expect(section.getByRole("alert")).toBeVisible();
  await expect(action).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
});

test("Admin filtered-read failure returns focus to its action and preserves manual Tab", async ({ page }) => {
  const requests = await installFixture(page, "filtered-read", true);
  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/uk/admin?view=notifications");
  const section = page.getByRole("region", { name: "Сповіщення" });
  const action = section.getByRole("button", { name: "Позначити відфільтровані прочитаними" });
  await action.focus();
  await action.press("Enter");
  await expect.poll(requests).toBe(1);
  await page.keyboard.press("Tab");
  const manualFocus = await page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent?.trim() || document.activeElement?.tagName);
  await expect(section.getByRole("alert")).toBeVisible();
  await expect(action).not.toBeFocused();
  await expect.poll(() => page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent?.trim() || document.activeElement?.tagName)).toBe(manualFocus);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
});
