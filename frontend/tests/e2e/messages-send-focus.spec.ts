import { expect, test, type Locator } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

for (const lang of ["uk", "en"] as const) {
test(`message send button recovers focus to Retry and composer while preserving the draft (${lang})`, async ({ page }) => {
  const user = { id: 95010, username: "message-owner", role: "USER", displayName: "Message Owner", avatarUrl: null };
  const conversation = {
    id: 95000,
    otherUser: { id: 95001, username: "fixture-chat-user", displayName: lang === "uk" ? "Олексій" : "Alex Morgan", avatarUrl: null },
    updatedAt: "2026-11-03T00:00:00Z",
    lastMessage: { id: 95003, conversationId: 95000, senderId: 95001, body: lang === "uk" ? "Цей фільм, який ти радив, виглядає класно." : "That film you mentioned looks great.", createdAt: "2026-11-03T00:00:00Z", readAt: null },
  };
  let sendAttempts = 0;
  let sentMessage: { id: number; conversationId: number; senderId: number; body: string; createdAt: string; readAt: null } | null = null;
  const previousMessage = { id: 95003, conversationId: conversation.id, senderId: conversation.otherUser.id, body: lang === "uk" ? "Дивився новий фільм?" : "New film tonight?", createdAt: "2026-11-18T12:40:00Z", readAt: null };
  await page.route("**/api/users/me", route => route.fulfill({ json: user }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "message-focus-fixture" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/conversations?**", route => route.fulfill({ json: { content: [conversation], totalPages: 1, totalElements: 1 } }));
  await page.route("**/api/conversations/95000/messages?**", route => route.fulfill({ json: { content: sentMessage ? [sentMessage] : [previousMessage], totalPages: 1, totalElements: sentMessage ? 1 : 1 } }));
  await page.route("**/api/conversations/95000/read", route => route.fulfill({ status: 204, body: "" }));
  await page.route("**/api/conversations/95000/messages", async route => {
    if (route.request().method() !== "POST") return route.fallback();
    sendAttempts++;
    await new Promise(resolve => setTimeout(resolve, sendAttempts === 1 || sendAttempts === 3 ? 900 : 100));
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

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto(`/${lang}/messages`);
  await page.getByRole("button", { name: lang === "uk" ? /Олексій/ : /Alex Morgan/ }).click();
  const composer = page.getByLabel(lang === "uk" ? "Текст повідомлення" : "Message text");
  await expect(composer).toBeVisible();
  const expectFrameBox = async (locator: Locator, expected: { x: number; y: number; width: number; height: number }) => {
    await expect.poll(async () => {
      const box = await locator.boundingBox();
      if (!box) return null;
      return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) };
    }).toEqual(expected);
  };
  const title = page.getByRole("heading", { name: conversation.otherUser.displayName });
  await expectFrameBox(page.getByRole("heading", { level: 1 }).locator("xpath=.."), { x: 12, y: 96, width: 369, height: 170 });
  await expectFrameBox(page.locator("main aside"), { x: 12, y: 282, width: 369, height: 122 });
  await expectFrameBox(title.locator("xpath=.."), { x: 12, y: 418, width: 369, height: 340 });
  await expectFrameBox(composer, { x: 28, y: 621, width: 337, height: 44 });
  await expectFrameBox(page.getByRole("button", { name: lang === "uk" ? "Написати" : "Message" }), { x: 28, y: 673, width: 337, height: 44 });
  await composer.fill("Keyboard message draft");
  await page.getByRole("button", { name: lang === "uk" ? "Написати" : "Message" }).click();
  await expect(composer).toHaveJSProperty("readOnly", true);
  await expectFrameBox(page.getByRole("log").locator("li").first(), { x: 28, y: 480, width: 253, height: 57 });
  await expectFrameBox(page.locator("form[aria-busy=true]"), { x: 28, y: 537, width: 337, height: 104 });
  const sendingDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261124/messages");
  await mkdir(sendingDirectory, { recursive: true });
  await page.screenshot({ path: resolve(sendingDirectory, `rewind-messages-sending-${lang}-mobile-393.png`), fullPage: false });
  const sendAlert = page.getByRole("alert");
  const retry = page.getByRole("button", { name: lang === "uk" ? "Спробувати ще" : "Retry" });
  await expect(sendAlert).toContainText(lang === "uk" ? "Не вдалося надіслати повідомлення." : "Could not send the message.");
  await expectFrameBox(sendAlert, { x: 28, y: 537, width: 337, height: lang === "uk" ? 116 : 72 });
  await expectFrameBox(retry, { x: lang === "uk" ? 44 : 267, y: lang === "uk" ? 594 : 550, width: lang === "uk" ? 132 : 81, height: 44 });
  await page.screenshot({ path: resolve(sendingDirectory, `rewind-messages-send-error-${lang}-mobile-393.png`), fullPage: false });
  await expect(composer).toHaveValue("Keyboard message draft");
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
