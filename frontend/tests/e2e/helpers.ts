import { expect, request, type Page } from "@playwright/test";

export async function waitForPageContent(page: Page) {
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.locator("#route-loading-title")).toHaveCount(0);
  await expect(page.locator("main h1").first()).toBeVisible();
}

/** Keep fixture mutations in the browser's cookie context, like the application. */
export async function browserMutation(page: Page, url: string, method: "POST" | "PUT" | "PATCH" | "DELETE", data?: unknown) {
  return page.evaluate(async ({ url, method, data }) => {
    const csrfCookie = () => document.cookie.split("; ").find(value => value.startsWith("XSRF-TOKEN="))?.slice("XSRF-TOKEN=".length);
    if (!csrfCookie()) await fetch("/api/auth/csrf", { credentials: "same-origin" });
    const response = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": decodeURIComponent(csrfCookie() ?? "") },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch { /* Status assertions report non-JSON failures. */ }
    return { status: response.status, ok: response.ok, data: payload };
  }, { url, method, data });
}

/** Remove only the account registered by the test, even if its browser page closed. */
export async function cleanupDisposableAccount(baseURL: string | undefined, email: string, passwords: string | string[]) {
  if (!baseURL || !email.endsWith("@example.invalid")) throw new Error("Disposable cleanup requires a test URL and account");
  const api = await request.newContext({ baseURL, timeout: 10_000 });
  try {
    const csrfHeaders = async () => {
      const csrf = await api.get("/api/auth/csrf");
      expect(csrf.status(), "Cleanup must obtain a CSRF token").toBe(200);
      const cookie = (await api.storageState()).cookies.find(item => item.name === "XSRF-TOKEN");
      expect(cookie, "Cleanup must receive its own CSRF cookie").toBeTruthy();
      return { "X-XSRF-TOKEN": decodeURIComponent(cookie!.value) };
    };
    let currentPassword: string | undefined;
    for (const password of typeof passwords === "string" ? [passwords] : passwords) {
      const login = await api.post("/api/auth/login", { headers: await csrfHeaders(), data: { email, password } });
      if (login.ok()) {
        currentPassword = password;
        break;
      }
    }
    expect.soft(currentPassword !== undefined, "The disposable account must authenticate for cleanup").toBe(true);
    if (currentPassword === undefined) return;
    const removed = await api.delete("/api/profile/me", { headers: await csrfHeaders(), data: { currentPassword } });
    expect.soft(removed.ok(), `The disposable account must be removed (HTTP ${removed.status()})`).toBe(true);
    if (removed.ok()) expect.soft((await api.get("/api/users/me")).status(), "Removed account must have no authenticated session").toBe(401);
  } finally {
    await api.dispose();
  }
}
