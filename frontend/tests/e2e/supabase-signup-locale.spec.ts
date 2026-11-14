import { expect, test } from "@playwright/test";

const signupFlows = [
  { language: "uk", username: "newmemberuk", email: "newmemberuk@example.invalid", button: "Створити акаунт" },
  { language: "en", username: "newmemberen", email: "newmemberen@example.invalid", button: "Create your account" },
] as const;

for (const flow of signupFlows) {
  test(`hosted ${flow.language} signup sends localized metadata and the configured login callback`, async ({ page, baseURL }) => {
    await page.route("**/auth/v1/**", route => route.fulfill({ status: 404, json: { message: "Unmocked fixture Auth request" } }));
    await page.route(url => url.pathname.startsWith("/api/"), route => route.fulfill({ status: 401, json: {} }));
    let signupUrl: URL | null = null;
    let signupBody: Record<string, unknown> | null = null;

    await page.route("https://cuirmicbzspomijgkkwo.supabase.co/auth/v1/signup**", async route => {
      signupUrl = new URL(route.request().url());
      signupBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "b1f5872a-148b-4878-8581-06b809b2992f",
          aud: "authenticated",
          role: "authenticated",
          email: flow.email,
          user_metadata: { username: flow.username, language: flow.language, rewind_auth_flow: "signup" },
          identities: [],
          created_at: new Date().toISOString(),
        }),
      });
    });

    await page.goto(`${flow.language}/register`);
    await page.locator("#register-username").fill(flow.username);
    await page.locator("#register-email").fill(flow.email);
    await page.locator("#register-password").fill("A-long-password-123!");
    await page.getByRole("button", { name: flow.button }).click();

    await expect(page.getByRole("status")).toContainText(/email/i);
    expect(signupUrl).not.toBeNull();
    expect(signupUrl!.searchParams.get("redirect_to")).toBe(
      new URL(`${flow.language}/login/`, baseURL).href,
    );
    expect(signupBody).toMatchObject({
      data: { username: flow.username, language: flow.language, rewind_auth_flow: "signup" },
    });
  });
}
