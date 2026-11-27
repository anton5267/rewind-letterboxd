import { expect, test, type Page, type Locator } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

type Locale = "uk" | "en";
type MessageState = "loading" | "error" | "read-error" | "refresh-error" | "conversation" | "conversation-loading" | "conversation-error" | "no-conversations";

async function openMessagesWithState(page: Page, locale: Locale, state: MessageState) {
  const user = { id: 95010, username: "message-owner", role: "USER", displayName: "Message Owner", avatarUrl: null };
  const otherUser = {
    id: 95001,
    username: "fixture-chat-user",
    displayName: locale === "uk" ? "Олексій" : "Alex Morgan",
    avatarUrl: null,
  };
  const conversation = {
    id: 95000,
    otherUser,
    updatedAt: "2026-11-03T00:00:00Z",
    lastMessage: {
      id: 95003,
      conversationId: 95000,
      senderId: otherUser.id,
      body: locale === "uk" ? "Цей фільм, який ти радив, виглядає класно." : "That film you mentioned looks great.",
      createdAt: "2026-11-03T00:00:00Z",
      readAt: null,
    },
  };
  let finishLoading!: () => void;
  const loadingBarrier = new Promise<void>(resolveBarrier => { finishLoading = resolveBarrier; });
  let finishConversationsLoading!: () => void;
  const conversationsLoadingBarrier = new Promise<void>(resolveBarrier => { finishConversationsLoading = resolveBarrier; });
  let conversationLoads = 0;
  let messageLoads = 0;

  await page.route("**/api/users/me", route => route.fulfill({ json: user }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "messages-mobile-fixture" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/conversations?**", route => {
    conversationLoads++;
    if (state === "no-conversations") return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } });
    if (state === "conversation-loading" && conversationLoads === 1) return conversationsLoadingBarrier.then(() => route.fulfill({ json: { content: [conversation], totalPages: 1, totalElements: 1 } }));
    if (state === "conversation-error" && conversationLoads === 1) return route.fulfill({ status: 503, json: {} });
    if (state === "refresh-error" && conversationLoads > 1) return route.fulfill({ status: 503, json: {} });
    return route.fulfill({ json: { content: [conversation], totalPages: 1, totalElements: 1 } });
  });
  await page.route("**/api/conversations/95000/messages?**", async route => {
    messageLoads++;
    if (state === "loading") {
      await loadingBarrier;
      return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } });
    }
    if (state === "error" || (state === "refresh-error" && messageLoads > 1)) return route.fulfill({ status: 503, json: {} });
    const messages = [{ id: 95004, conversationId: 95000, senderId: otherUser.id, body: locale === "uk" ? "Дивився новий фільм?" : "New film tonight?", createdAt: "2026-11-18T12:40:00Z", readAt: null }];
    if (state === "conversation") messages.unshift({ id: 95005, conversationId: 95000, senderId: user.id, body: locale === "uk" ? "Так, ходімо!" : "Yes, let's go!", createdAt: "2026-11-18T12:40:00Z", readAt: null });
    return route.fulfill({ json: { content: messages, totalPages: 1, totalElements: messages.length } });
  });
  await page.route("**/api/conversations/95000/read", route => route.fulfill({ status: state === "read-error" ? 503 : 204, body: "" }));

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto(`/${locale}/messages`);
  if (state !== "conversation-loading" && state !== "conversation-error" && state !== "no-conversations") {
    await page.getByRole("button", { name: locale === "uk" ? /Олексій/ : /Alex Morgan/ }).click();
  }
  return { conversation, finishLoading, finishConversationsLoading };
}

async function expectBox(locator: Locator, expected: { x: number; y: number; width: number; height: number }) {
  await expect.poll(async () => {
    const box = await locator.boundingBox();
    if (!box) return null;
    return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) };
  }).toEqual(expected);
}

for (const locale of ["uk", "en"] as const) {
  test(`mobile Figma no-conversations state (${locale})`, async ({ page }) => {
    await openMessagesWithState(page, locale, "no-conversations");
    const aside = page.locator("main aside");
    const empty = page.getByText(locale === "uk" ? "Діалогів поки немає." : "No conversations yet.");
    const messagePanel = page.locator("main section").nth(1);
    const choose = page.getByText(locale === "uk" ? "Оберіть діалог." : "Choose a conversation.");
    await expect(empty).toBeVisible();
    await expectBox(aside, { x: 12, y: 282, width: 369, height: 174 });
    await expectBox(empty, { x: 28, y: 340, width: 337, height: 88 });
    await expectBox(messagePanel, { x: 12, y: 472, width: 369, height: 186 });
    await expect(choose).toBeVisible();
    await mkdir(resolve(process.cwd(), "../artifacts/visual-audit-20261126/messages"), { recursive: true });
    await page.screenshot({ path: resolve(process.cwd(), `../artifacts/visual-audit-20261126/messages/rewind-messages-no-conversations-${locale}-mobile-393.png`), fullPage: false });
  });

  test(`mobile Figma message loading and recovery states (${locale})`, async ({ page }) => {
    const { conversation, finishLoading } = await openMessagesWithState(page, locale, "loading");
    const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261124/messages");
    const loading = page.getByRole("status").last();
    await expect(loading).toBeVisible();
    await expectBox(loading, { x: 28, y: 480, width: 337, height: 88 });
    await mkdir(captureDirectory, { recursive: true });
    await page.screenshot({ path: resolve(captureDirectory, `rewind-messages-loading-${locale}-mobile-393.png`), fullPage: false });

    finishLoading();
    const empty = page.getByText(locale === "uk" ? "У цьому діалозі ще немає повідомлень." : "There are no messages in this conversation yet.");
    await expect(empty).toBeVisible();
    await expect(page.getByRole("heading", { name: conversation.otherUser.displayName })).toBeVisible();
    await expectBox(empty.locator("xpath=.."), { x: 28, y: 480, width: 337, height: 106 });
    await expectBox(page.getByLabel(locale === "uk" ? "Текст повідомлення" : "Message text"), { x: 28, y: 621, width: 337, height: 44 });
    await mkdir(captureDirectory, { recursive: true });
    await page.screenshot({ path: resolve(captureDirectory, `rewind-messages-empty-${locale}-mobile-393.png`), fullPage: false });
  });

  test(`mobile Figma message load error card and retry (${locale})`, async ({ page }) => {
    await openMessagesWithState(page, locale, "error");
    const alert = page.getByRole("alert");
    const retry = page.getByRole("button", { name: locale === "uk" ? "Спробувати ще" : "Retry" });
    await expect(alert).toBeVisible();
    await expectBox(alert, { x: 28, y: 480, width: 337, height: 116 });
    await expectBox(retry, { x: 44, y: 542, width: locale === "uk" ? 132 : 75, height: 44 });
    const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261124/messages");
    await mkdir(captureDirectory, { recursive: true });
    await page.screenshot({ path: resolve(captureDirectory, `rewind-messages-load-error-${locale}-mobile-393.png`), fullPage: false });
  });

  test(`mobile Figma mark-read error card (${locale})`, async ({ page }) => {
    await openMessagesWithState(page, locale, "read-error");
    const alert = page.getByRole("alert");
    const retry = page.getByRole("button", { name: locale === "uk" ? "Спробувати ще" : "Retry" });
    await expect(alert).toBeVisible();
    await expectBox(alert, { x: 28, y: 480, width: 337, height: locale === "uk" ? 116 : 72 });
    await expectBox(retry, { x: locale === "uk" ? 44 : 268, y: locale === "uk" ? 538 : 494, width: locale === "uk" ? 132 : 81, height: 44 });
    const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261124/messages");
    await mkdir(captureDirectory, { recursive: true });
    await page.screenshot({ path: resolve(captureDirectory, `rewind-messages-mark-read-error-${locale}-mobile-393.png`), fullPage: false });
  });

  test(`mobile Figma refresh error card (${locale})`, async ({ page }) => {
    await openMessagesWithState(page, locale, "refresh-error");
    await expect(page.getByRole("log")).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    const alert = page.getByRole("alert");
    const retry = page.getByRole("button", { name: locale === "uk" ? "Спробувати ще" : "Retry" });
    await expect(alert).toBeVisible();
    await expectBox(alert, { x: 28, y: 434, width: 337, height: locale === "uk" ? 116 : 72 });
    await expectBox(retry, { x: locale === "uk" ? 44 : 268, y: locale === "uk" ? 492 : 448, width: locale === "uk" ? 132 : 81, height: 44 });
  });

  test(`mobile Figma selected conversation bubbles (${locale})`, async ({ page }) => {
    await openMessagesWithState(page, locale, "conversation");
    const bubbles = page.getByRole("log").locator("li");
    await expect(bubbles).toHaveCount(2);
    await expectBox(bubbles.nth(0), { x: 28, y: 480, width: 253, height: 57 });
    await expectBox(bubbles.nth(1), { x: 112, y: 546, width: 253, height: 57 });
    const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261124/messages");
    await mkdir(captureDirectory, { recursive: true });
    await page.screenshot({ path: resolve(captureDirectory, `rewind-messages-conversation-${locale}-mobile-393.png`), fullPage: false });
  });

  test(`mobile Figma conversation list loading and recovery (${locale})`, async ({ page }) => {
    const { conversation, finishConversationsLoading } = await openMessagesWithState(page, locale, "conversation-loading");
    await expect(page.getByRole("status")).toContainText(locale === "uk" ? "Завантаження" : "Loading");
    await expectBox(page.getByRole("status"), { x: 28, y: 340, width: 337, height: 88 });
    await expectBox(page.locator("main section").nth(1), { x: 12, y: 472, width: 369, height: 186 });
    const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261124/messages");
    await mkdir(captureDirectory, { recursive: true });
    await page.screenshot({ path: resolve(captureDirectory, `rewind-messages-conversations-loading-${locale}-mobile-393.png`), fullPage: false });
    finishConversationsLoading();
    await expect(page.getByRole("button", { name: locale === "uk" ? /Олексій/ : /Alex Morgan/ })).toBeVisible();
    expect(conversation.otherUser.displayName).toBeTruthy();
  });

  test(`mobile Figma conversation list error and retry (${locale})`, async ({ page }) => {
    await openMessagesWithState(page, locale, "conversation-error");
    const alert = page.getByRole("alert");
    const retry = page.getByRole("button", { name: locale === "uk" ? "Спробувати ще" : "Retry" });
    await expect(alert).toBeVisible();
    await expectBox(page.locator("main aside"), { x: 12, y: 282, width: 369, height: locale === "uk" ? 148 : 104 });
    await expectBox(alert, { x: 16, y: 298, width: 337, height: locale === "uk" ? 116 : 72 });
    await expectBox(retry, { x: locale === "uk" ? 32 : 256, y: locale === "uk" ? 356 : 312, width: locale === "uk" ? 132 : 81, height: 44 });
    await expectBox(page.locator("main section").nth(1), { x: 12, y: locale === "uk" ? 446 : 402, width: 369, height: 186 });
    const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261124/messages");
    await mkdir(captureDirectory, { recursive: true });
    await page.screenshot({ path: resolve(captureDirectory, `rewind-messages-conversations-error-${locale}-mobile-393.png`), fullPage: false });
    await retry.click();
    await expect(page.getByRole("button", { name: locale === "uk" ? /Олексій/ : /Alex Morgan/ })).toBeVisible();
  });
}
