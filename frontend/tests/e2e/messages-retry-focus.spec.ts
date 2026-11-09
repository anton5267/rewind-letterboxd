import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261103", "messages-retry-focus");
mkdirSync(evidenceDir, { recursive: true });

test("messages list and thread Retry keep or move keyboard focus after recovery", async ({ page }) => {
  const user = { id: 95010, username: "message-owner", role: "USER", displayName: "Message Owner", avatarUrl: null };
  const conversation = {
    id: 95000,
    otherUser: { id: 95001, username: "fixture-chat-user", displayName: "Fixture Chat User", avatarUrl: null },
    updatedAt: "2026-11-03T00:00:00Z",
    lastMessage: null,
  };
  let conversationAttempts = 0;
  let messageAttempts = 0;
  await page.route("**/api/users/me", route => route.fulfill({ json: user }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "message-retry-focus-fixture" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/conversations?**", route => {
    conversationAttempts++;
    return conversationAttempts === 1
      ? route.fulfill({ status: 503, json: {} })
      : route.fulfill({ json: { content: [conversation], totalPages: 1, totalElements: 1 } });
  });
  await page.route("**/api/conversations/95000/messages?**", route => {
    messageAttempts++;
    return messageAttempts < 3
      ? route.fulfill({ status: 503, json: {} })
      : route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } });
  });
  await page.route("**/api/conversations/95000/read", route => route.fulfill({ status: 204, body: "" }));

  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/uk/messages");
  const retryConversations = page.getByRole("button", { name: "Спробувати ще" });
  await expect(retryConversations).toBeVisible();
  await retryConversations.focus();
  await retryConversations.press("Enter");
  await expect.poll(() => conversationAttempts).toBe(2);
  await expect(page.getByRole("heading", { level: 2, name: "Діалоги" })).toBeFocused();
  await expect(page.getByRole("button", { name: /Fixture Chat User/ })).toBeVisible();

  await page.getByRole("button", { name: /Fixture Chat User/ }).click();
  const retryMessages = page.getByRole("button", { name: "Спробувати ще" });
  await expect(retryMessages).toBeVisible();
  await retryMessages.focus();
  await retryMessages.press("Enter");
  await expect.poll(() => messageAttempts).toBe(2);
  await expect(page.getByRole("button", { name: "Спробувати ще" })).toBeFocused();
  await expect(page.getByRole("button", { name: "Спробувати ще" })).toHaveCSS("outline-style", "solid");

  await page.getByRole("button", { name: "Спробувати ще" }).press("Enter");
  await expect.poll(() => messageAttempts).toBe(3);
  await expect(page.getByRole("heading", { level: 2, name: /Fixture Chat User/ })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: path.join(evidenceDir, "messages-mobile-uk-after-retry.png"), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await page.screenshot({ path: path.join(evidenceDir, "messages-desktop-uk-after-retry.png"), fullPage: true });
});
