import { expect, test, type Page } from "@playwright/test";

const tokenHash = "one-time-fixture-token-hash";

async function mockSupabaseVerification(page: Page) {
  const appOrigin = new URL(process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000").origin;
  const verificationBodies: Array<{ token_hash: string; type: string }> = [];
  await page.route("**/auth/v1/verify**", async route => {
    verificationBodies.push(route.request().postDataJSON() as { token_hash: string; type: string });
    const now = Math.floor(Date.now() / 1000);
    await route.fulfill({ json: {
      access_token: "fixture-access-token",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: now + 3600,
      refresh_token: "fixture-refresh-token",
      user: {
        id: "b1f5872a-148b-4878-8581-06b809b2992f",
        aud: "authenticated",
        role: "authenticated",
        email: "member@example.invalid",
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: { username: "fixture-member", language: "uk" },
        created_at: new Date().toISOString(),
      },
    } });
  });
  await page.route(url => {
    const requestUrl = new URL(url);
    return requestUrl.origin === appOrigin && requestUrl.pathname.startsWith("/api/");
  }, async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/users/me") {
      return route.fulfill({ json: { id: 7, username: "fixture-member", role: "USER" } });
    }
    return route.fulfill({ status: 401, json: { message: "Unauthenticated fixture request" } });
  });
  return verificationBodies;
}

test("signup email action waits for an explicit click and removes its fragment before verification", async ({ page }) => {
  const verificationBodies = await mockSupabaseVerification(page);
  await page.goto(`/uk/email-action/#rewind_action=signup&token_hash=${tokenHash}&type=email`);

  await expect(page.getByRole("heading", { name: "Підтвердьте свою пошту" })).toBeVisible();
  await expect(page).toHaveURL(/\/uk\/email-action\/?$/);
  expect(verificationBodies).toHaveLength(0);

  await page.getByRole("button", { name: "Підтвердити пошту" }).click();
  await expect(page).toHaveURL(/\/uk\/films\/?$/);
  expect(verificationBodies).toHaveLength(1);
  expect(verificationBodies[0]).toMatchObject({ token_hash: tokenHash, type: "email" });
});

test("recovery email action waits for an explicit click and opens the existing password form", async ({ page }) => {
  const verificationBodies = await mockSupabaseVerification(page);
  await page.goto(`/en/email-action/#rewind_action=recovery&token_hash=${tokenHash}&type=recovery`);

  await expect(page.getByRole("heading", { name: "Confirm your password change" })).toBeVisible();
  await expect(page).toHaveURL(/\/en\/email-action\/?$/);
  expect(verificationBodies).toHaveLength(0);

  await page.getByRole("button", { name: "Continue to password change" }).click();
  await expect(page).toHaveURL(/\/en\/reset-password\/?$/);
  await expect(page.locator("#reset-password")).toBeVisible();
  expect(verificationBodies).toHaveLength(1);
  expect(verificationBodies[0]).toMatchObject({ token_hash: tokenHash, type: "recovery" });
});
