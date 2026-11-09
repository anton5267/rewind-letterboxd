import { expect, request, test, type APIRequestContext } from "@playwright/test";
import { cleanupDisposableAccount } from "./helpers";

async function mutate(api: APIRequestContext, method: "POST" | "PATCH", path: string, data?: unknown) {
  const csrf = await api.get("/api/auth/csrf");
  expect(csrf.ok()).toBe(true);
  const cookie = (await api.storageState()).cookies.find(item => item.name === "XSRF-TOKEN");
  expect(cookie).toBeTruthy();
  return api.fetch(path, {
    method,
    headers: { "X-XSRF-TOKEN": decodeURIComponent(cookie!.value) },
    ...(data === undefined ? {} : { data }),
  });
}

test("real direct messages deliver, mark read, and reject a sender after blocking", async ({ page, baseURL, browser }) => {
  test.setTimeout(60_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const senderUsername = `dm_sender_${suffix}`;
  const recipientUsername = `dm_recipient_${suffix}`;
  const senderEmail = `${senderUsername}@example.invalid`;
  const recipientEmail = `${recipientUsername}@example.invalid`;
  const password = "E2e-password-123!";
  const message = `Live message ${suffix}`;
  const recipientApi = await request.newContext({ baseURL });
  let senderRegistered = false;
  let recipientRegistered = false;
  let senderId = 0;
  let recipientId = 0;
  let recipientBrowser: Awaited<ReturnType<typeof browser.newContext>> | undefined;

  try {
    const senderRegistration = await mutate(page.request, "POST", "/api/auth/register", { username: senderUsername, email: senderEmail, password });
    expect(senderRegistration.status()).toBe(200);
    senderRegistered = true;
    senderId = Number((await senderRegistration.json() as { id: number }).id);

    const recipientRegistration = await mutate(recipientApi, "POST", "/api/auth/register", { username: recipientUsername, email: recipientEmail, password });
    expect(recipientRegistration.status()).toBe(200);
    recipientRegistered = true;
    recipientId = Number((await recipientRegistration.json() as { id: number }).id);

    await page.goto("/uk/login");
    await page.getByLabel("Електронна пошта").fill(senderEmail);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Увійти" }).click();
    await expect(page).toHaveURL(/\/uk\/films$/);

    const recipientLogin = await mutate(recipientApi, "POST", "/api/auth/login", { email: recipientEmail, password });
    expect(recipientLogin.status()).toBe(200);

    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(`/uk/messages?user=${recipientId}`);
    await expect(page.getByRole("heading", { name: recipientUsername })).toBeVisible();
    const composer = page.getByRole("textbox", { name: "Текст повідомлення" });
    const sendButton = page.getByRole("button", { name: "Написати" });
    await expect(sendButton).toBeDisabled();
    await composer.fill("   \t  ");
    await expect(sendButton).toBeDisabled();

    const senderConversations = await page.request.get("/api/conversations?page=0&size=20");
    expect(senderConversations.ok()).toBe(true);
    const senderConversationData = await senderConversations.json() as { content: { id: number; otherUser: { id: number } }[] };
    const activeConversation = senderConversationData.content.find(item => item.otherUser.id === recipientId);
    expect(activeConversation).toBeTruthy();
    const blankMessage = await mutate(page.request, "POST", `/api/conversations/${activeConversation!.id}/messages`, { body: " \n\t " });
    expect(blankMessage.status()).toBe(400);
    const noBlankMessagePersisted = await page.request.get(`/api/conversations/${activeConversation!.id}/messages?page=0&size=50`);
    expect(noBlankMessagePersisted.ok()).toBe(true);
    expect((await noBlankMessagePersisted.json() as { totalElements: number }).totalElements).toBe(0);

    await composer.fill(message);
    await sendButton.click();
    await expect(page.locator("ul[class*='messageList']").getByText(message, { exact: true })).toBeVisible();
    await expect(composer).toHaveValue("");

    const unreadBeforeOpen = await recipientApi.get("/api/conversations/unread-count");
    expect(await unreadBeforeOpen.json()).toEqual({ count: 1 });
    const conversationsResponse = await recipientApi.get("/api/conversations?page=0&size=20");
    expect(conversationsResponse.ok()).toBe(true);
    const conversations = await conversationsResponse.json() as { content: { id: number; otherUser: { id: number } }[] };
    expect(conversations.content).toHaveLength(1);
    expect(conversations.content[0].otherUser.id).toBe(senderId);

    recipientBrowser = await browser.newContext({ baseURL, storageState: await recipientApi.storageState() });
    const recipientPage = await recipientBrowser.newPage();
    await recipientPage.setViewportSize({ width: 393, height: 852 });
    await recipientPage.goto("/uk/messages");
    const conversation = recipientPage.getByRole("button", { name: new RegExp(senderUsername) });
    await expect(conversation).toBeVisible();
    await conversation.click();
    await expect(recipientPage.locator("ul[class*='messageList']").getByText(message, { exact: true })).toBeVisible();
    await expect.poll(async () => (await (await recipientApi.get("/api/conversations/unread-count")).json() as { count: number }).count).toBe(0);

    const block = await mutate(recipientApi, "POST", `/api/users/${senderId}/block`);
    expect(block.ok()).toBe(true);
    const blockedMessage = `Blocked message ${suffix}`;
    await composer.fill(blockedMessage);
    await sendButton.click();
    await expect(page.getByRole("alert")).toContainText("Не вдалося надіслати повідомлення.");
    await expect(composer).toHaveValue(blockedMessage);
    const messageHistory = await recipientApi.get(`/api/conversations/${conversations.content[0].id}/messages?page=0&size=50`);
    expect(messageHistory.status()).toBe(403);

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
    expect(await recipientPage.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
  } finally {
    await recipientBrowser?.close();
    try {
      const cleanupResults: PromiseSettledResult<void>[] = [];
      for (const account of [
        ...(senderRegistered ? [senderEmail] : []),
        ...(recipientRegistered ? [recipientEmail] : []),
      ]) {
        try {
          await cleanupDisposableAccount(baseURL, account, password);
          cleanupResults.push({ status: "fulfilled", value: undefined });
        } catch (reason) {
          cleanupResults.push({ status: "rejected", reason });
        }
      }
      const cleanupFailure = cleanupResults.find(result => result.status === "rejected");
      if (cleanupFailure?.status === "rejected") throw cleanupFailure.reason;

      const auditApi = await request.newContext({ baseURL });
      try {
        for (const username of [senderUsername, recipientUsername]) {
          const remaining = await auditApi.get(`/api/users/directory?q=${encodeURIComponent(username)}&page=0&size=20`);
          expect(remaining.ok()).toBe(true);
          expect((await remaining.json() as { content: unknown[] }).content).toHaveLength(0);
        }
      } finally {
        await auditApi.dispose();
      }
    } finally {
      await recipientApi.dispose();
    }
  }
});
