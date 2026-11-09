import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

for (const lang of ["uk", "en"] as const) {
test(`message send button recovers focus to Retry and composer while preserving the draft (${lang})`, async ({ page }) => {
  const user = { id: 95010, username: "message-owner", role: "USER", displayName: "Message Owner", avatarUrl: null };
  const conversation = {
    id: 95000,
    otherUser: { id: 95001, username: "fixture-chat-user", displayName: "Fixture Chat User", avatarUrl: null },
    updatedAt: "2026-11-03T00:00:00Z",
    lastMessage: null,
  };
  let sendAttempts = 0;
  let sentMessage: { id: number; conversationId: number; senderId: number; body: string; createdAt: string; readAt: null } | null = null;
  await page.route("**/api/users/me", route => route.fulfill({ json: user }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "message-focus-fixture" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/conversations?**", route => route.fulfill({ json: { content: [conversation], totalPages: 1, totalElements: 1 } }));
  await page.route("**/api/conversations/95000/messages?**", route => route.fulfill({ json: { content: sentMessage ? [sentMessage] : [], totalPages: sentMessage ? 1 : 0, totalElements: sentMessage ? 1 : 0 } }));
  await page.route("**/api/conversations/95000/read", route => route.fulfill({ status: 204, body: "" }));
  await page.route("**/api/conversations/95000/messages", async route => {
    if (route.request().method() !== "POST") return route.fallback();
    sendAttempts++;
    await new Promise(resolve => setTimeout(resolve, sendAttempts === 3 ? 500 : 100));
    if (sendAttempts === 1) return route.fulfill({ status: 503, json: {} });
    sentMessage = {
      id: 95002,
      conversationId: conversation.id,
      senderId: user.id,
      body: sendAttempts === 3 ? "Manual Tab message draft" : "Keyboard message draft",
      createdAt: "2026-11-03T00:00:00Z",
      readAt: null,
    };
    return route.fulfill({ status: 201, json: sentMessage });
  });

  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto(`/${lang}/messages`);
  await page.getByRole("button", { name: /Fixture Chat User/ }).click();
  const composer = page.getByLabel(lang === "uk" ? "Текст повідомлення" : "Message text");
  await expect(composer).toBeVisible();
  await composer.fill("Keyboard message draft");
  await page.getByRole("button", { name: lang === "uk" ? "Написати" : "Message" }).click();
  await expect(composer).toHaveJSProperty("readOnly", true);
  await expect(page.getByRole("alert")).toContainText(lang === "uk" ? "Не вдалося надіслати повідомлення." : "Could not send the message.");
  await expect(composer).toHaveValue("Keyboard message draft");
  const retry = page.getByRole("button", { name: lang === "uk" ? "Спробувати ще" : "Retry" });
  await expect(retry).toBeFocused();
  await expect(composer).toHaveJSProperty("readOnly", false);

  await retry.click();
  await expect(page.getByText("Keyboard message draft").last()).toBeVisible();
  await expect(composer).toHaveValue("");
  await expect(composer).toBeFocused();
  expect(sendAttempts).toBe(2);

  await composer.fill("Manual Tab message draft");
  await page.getByRole("button", { name: lang === "uk" ? "Написати" : "Message" }).click();
  await expect(composer).toHaveJSProperty("readOnly", true);
  await page.keyboard.press("Tab");
  const manualFocus = await page.evaluate(() => document.activeElement instanceof HTMLElement ? document.activeElement.outerHTML : "");
  expect(manualFocus).not.toBe("");
  await expect(page.getByText("Manual Tab message draft").last()).toBeVisible();
  expect(await page.evaluate(() => document.activeElement instanceof HTMLElement ? document.activeElement.outerHTML : "")).toBe(manualFocus);
  expect(sendAttempts).toBe(3);

  const captureDirectory = resolve(process.cwd(), "../artifacts/functional-audit-20261103/messages-send-focus");
  await mkdir(captureDirectory, { recursive: true });
  await page.screenshot({ path: resolve(captureDirectory, `messages-send-${lang}-393-fixture.png`), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: resolve(captureDirectory, `messages-send-${lang}-1440-fixture.png`), fullPage: true });
});
}
