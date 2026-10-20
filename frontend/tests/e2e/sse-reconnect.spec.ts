import { expect, test } from "@playwright/test";
import { cleanupDisposableAccount } from "./helpers";

test("notifications reconnect the SSE stream after a transport error", async ({ page, baseURL }) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    const sources: any[] = [];
    class MockEventSource extends EventTarget {
      closed = false;
      onerror: ((event: Event) => void) | null = null;
      constructor(public url: string) {
        super();
        sources.push(this);
      }
      close() { this.closed = true; }
      dispatchEvent(event: Event) {
        const result = super.dispatchEvent(event);
        if (event.type === "error" && this.onerror) this.onerror(event);
        return result;
      }
    }
    (window as any).__rewindEventSources = sources;
    Object.defineProperty(window, "EventSource", { value: MockEventSource, configurable: true });
  });

  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `sse-${suffix}@example.invalid`;
  const password = "E2e-password-123!";
  let registered = false;
  try {
    await page.goto("/uk/register");
    await page.getByLabel("Нікнейм").fill(`sse${suffix}`);
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль").fill(password);
    const registration = page.waitForResponse(response => response.url().endsWith("/api/auth/register") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Створити акаунт" }).click();
    expect((await registration).status()).toBe(200);
    registered = true;
    await expect(page.getByRole("heading", { name: /Акаунт створено/ })).toBeVisible();
    await page.getByRole("button", { name: "Перейти до входу" }).click();
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль").fill(password);
    await page.getByRole("button", { name: "Увійти" }).click();
    await expect(page).toHaveURL(/\/uk\/films$/);
    await page.goto("/uk/notifications");
    await expect(page.getByRole("heading", { name: "Сповіщення" })).toBeVisible();
    await page.waitForFunction(() => (window as any).__rewindEventSources?.length === 1);

    await page.evaluate(() => {
      const source = (window as any).__rewindEventSources[0];
      source.dispatchEvent(new Event("error"));
    });
    await page.waitForFunction(() => (window as any).__rewindEventSources?.length === 2, null, { timeout: 5000 });
    const state = await page.evaluate(() => ({
      firstClosed: (window as any).__rewindEventSources[0].closed,
      secondUrl: (window as any).__rewindEventSources[1].url,
    }));
    expect(state.firstClosed).toBe(true);
    expect(state.secondUrl).toBe("/api/notifications/stream");
    // Teardown must still remove this test account after its browser page closes.
    await page.close();
  } finally {
    if (registered) await cleanupDisposableAccount(baseURL, email, password);
  }
});
