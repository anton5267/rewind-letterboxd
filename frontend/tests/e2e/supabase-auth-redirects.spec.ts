import { expect, test } from "@playwright/test";

const fixtureUserId = "b1f5872a-148b-4878-8581-06b809b2992f";

function fixtureAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
    sub: fixtureUserId,
    aud: "authenticated",
    role: "authenticated",
    email: "member@example.invalid",
    iat: now,
    exp: now + 3600,
  })}.c2ln`;
}

const fixtureUser = {
  id: fixtureUserId,
  email: "member@example.invalid",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  created_at: "2026-11-14T00:00:00Z",
};

function fixtureSession(accessToken: string) {
  return {
    access_token: accessToken,
    refresh_token: "fixture-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    user: fixtureUser,
  };
}

test.beforeEach(async ({ page }) => {
  // These UI-flow tests use synthetic accounts. Keep them isolated even when
  // pointed at a hosted build whose auth client talks directly to Supabase.
  await page.route("**/auth/v1/**", route => route.fulfill({
    status: 404,
    contentType: "application/json",
    body: JSON.stringify({ message: "Unmocked fixture Auth request" }),
  }));
  await page.route(url => url.pathname.startsWith("/api/"), route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/csrf") return route.fulfill({ json: { token: "fixture-csrf" } });
    if (path === "/api/auth/refresh" || path === "/api/users/me") {
      return route.fulfill({ status: 401, json: { message: "Unauthenticated" } });
    }
    return route.fulfill({ status: 404, json: { message: "Unmocked API" } });
  });
});

test("registration confirmation asks the user to check email", async ({ page }) => {
  await page.route("**/api/auth/register", route => route.fulfill({ status: 202, json: { confirmationRequired: true } }));
  await page.route("**/auth/v1/signup**", route => route.fulfill({
    status: 200,
    json: { id: "fixture-user", email: "newmember@example.invalid", identities: [], user_metadata: {} },
  }));
  await page.goto("/uk/register");
  await page.locator("#register-username").fill("newmember");
  await page.locator("#register-email").fill("newmember@example.invalid");
  await page.locator("#register-password").fill("A-long-password-123!");
  await page.getByRole("button", { name: "Створити акаунт" }).click();
  await expect(page.getByRole("status")).toContainText(/пошту|лист/i);
});

test("English registration keeps English locale for the provider confirmation callback", async ({ page }) => {
  let callbackLocale = "";
  await page.route("**/api/auth/register", route => {
    callbackLocale = route.request().headers()["accept-language"] ?? "";
    return route.fulfill({ status: 202, json: { confirmationRequired: true } });
  });
  await page.route("**/auth/v1/signup**", route => {
    callbackLocale = new URL(route.request().url()).searchParams.get("redirect_to") ?? "";
    return route.fulfill({ status: 200, json: { id: "fixture-user", email: "newmemberen@example.invalid", identities: [], user_metadata: {} } });
  });
  await page.goto("/en/register");
  await page.locator("#register-username").fill("newmemberen");
  await page.locator("#register-email").fill("newmemberen@example.invalid");
  await page.locator("#register-password").fill("A-long-password-123!");
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page.getByRole("status")).toContainText(/email/i);
  expect(callbackLocale).toMatch(/^(?:en|.*\/en\/login\/?$)/);
});

test("English password recovery asks the backend for an English callback", async ({ page }) => {
  let callbackLocale = "";
  await page.route("**/api/auth/forgot-password", route => {
    callbackLocale = route.request().headers()["accept-language"] ?? "";
    return route.fulfill({ status: 202, json: { message: "If the account exists, a reset link has been sent." } });
  });
  await page.route("**/auth/v1/recover**", route => {
    callbackLocale = new URL(route.request().url()).searchParams.get("redirect_to") ?? "";
    return route.fulfill({ status: 200, json: {} });
  });
  await page.goto("/en/forgot-password");
  await page.locator("#forgot-password-email").fill("member@example.invalid");
  await page.getByRole("button", { name: "Reset password" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  expect(callbackLocale).toMatch(/^(?:en|.*\/en\/reset-password\/?$)/);
});

test("hosted recovery fragment establishes a session and updates the password", async ({ page }) => {
  const accessToken = fixtureAccessToken();
  let updatedPassword = "";
  let updateAuthorization = "";
  let authUserRequests = 0;
  page.on("request", request => {
    if (request.url().includes("/auth/v1/user")) authUserRequests++;
  });
  await page.route("**/auth/v1/user**", async route => {
    if (route.request().method() === "PUT") {
      updatedPassword = (route.request().postDataJSON() as { password: string }).password;
      updateAuthorization = route.request().headers().authorization ?? "";
    }
    await route.fulfill({ status: 200, json: fixtureUser });
  });
  await page.goto(`/uk/reset-password#access_token=${accessToken}&refresh_token=fixture-refresh-token&expires_in=3600&token_type=bearer&type=recovery`);
  await expect(page.locator("#reset-password")).toBeVisible();
  await expect.poll(() => authUserRequests).toBeGreaterThan(0);
  await expect(page).toHaveURL(/\/uk\/reset-password$/);
  await page.locator("#reset-password").fill("New-password-123!");
  await page.locator("#reset-password-confirm").fill("New-password-123!");
  await page.getByRole("button", { name: "Змінити пароль" }).click();
  await expect(page.getByRole("status")).toContainText("Пароль змінено");
  expect(updatedPassword).toBe("New-password-123!");
  expect(updateAuthorization).toBe(`Bearer ${accessToken}`);
});

test("signup confirmation fragment is cleared before password login", async ({ page }) => {
  await page.goto("/en/login#access_token=fixture-signup-token&type=signup");
  await expect(page.getByRole("status")).toContainText(/email/i);
  await expect(page).toHaveURL(/\/en\/login\/?$/);
  await expect(page.locator("#login-password")).toBeVisible();
});

test("account linking strips the confirmed provider token and verifies the existing local password", async ({ page }) => {
  let requestBody: { accessToken: string; currentPassword: string } | null = null;
  await page.route("**/api/auth/supabase-link/complete", async route => {
    requestBody = route.request().postDataJSON() as typeof requestBody;
    await route.fulfill({ status: 200, json: { id: 7, username: "existing", role: "USER" } });
  });
  await page.goto("/uk/link-account#access_token=confirmed-hosted-token&type=signup");
  await expect(page).toHaveURL(/\/uk\/link-account$/);
  await page.locator("#supabase-link-password").fill("existing-local-password");
  await page.getByRole("button", { name: "Підключити акаунт" }).click();
  await expect(page.getByRole("status")).toContainText("Акаунт підключено");
  expect(requestBody).toEqual({
    accessToken: "confirmed-hosted-token",
    currentPassword: "existing-local-password",
  });
});

test("account linking reports a missing confirmation token without exposing one in the URL", async ({ page }) => {
  await page.goto("/uk/link-account#error=access_denied&error_description=expired");
  await expect(page).toHaveURL(/\/uk\/link-account$/);
  await expect(page.getByRole("alert")).toContainText(/прострочене|недійсне/i);
});

test("a completed PKCE email confirmation continues into the app", async ({ page }) => {
  const accessToken = fixtureAccessToken();
  let exchangeBody: { auth_code: string; code_verifier: string } | null = null;
  await page.addInitScript(() => {
    localStorage.setItem("sb-cuirmicbzspomijgkkwo-auth-token-code-verifier", JSON.stringify("fixture-code-verifier"));
  });
  await page.route("**/auth/v1/token**", async route => {
    exchangeBody = route.request().postDataJSON() as typeof exchangeBody;
    await route.fulfill({ status: 200, json: fixtureSession(accessToken) });
  });
  await page.route("**/api/users/me", route => route.fulfill({
    status: 200,
    json: { id: 7, username: "confirmed-member", role: "USER" },
  }));
  await page.goto("/en/login/?code=fixture-auth-code");
  await expect(page).toHaveURL(/\/en\/films\/?$/);
  expect(exchangeBody).toEqual({ auth_code: "fixture-auth-code", code_verifier: "fixture-code-verifier" });
});

test("a failed PKCE confirmation clears its one-time code and explains the next step", async ({ page }) => {
  await page.goto("/uk/login/?code=expired-fixture-code");
  await expect(page.getByRole("alert")).toContainText("Не вдалося завершити підтвердження email");
  await expect(page).toHaveURL(/\/uk\/login\/?$/);
});

test("an expired or replayed confirmation link gives Ukrainian guidance and is removed from the URL", async ({ page }) => {
  await page.goto("/uk/login/?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired");
  await expect(page.getByRole("alert")).toContainText(/одноразове посилання вже використано або його термін дії минув/i);
  await expect(page).toHaveURL(/\/uk\/login\/?$/);
  await expect(page.locator("#login-password")).toBeVisible();
});

test("an expired or replayed confirmation link gives English guidance", async ({ page }) => {
  await page.goto("/en/login/#error=access_denied&error_code=otp_expired&error_description=Email+link+expired");
  await expect(page.getByRole("alert")).toContainText(/one-time link has already been used or has expired/i);
  await expect(page).toHaveURL(/\/en\/login\/?$/);
});
