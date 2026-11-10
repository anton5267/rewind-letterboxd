import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
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
  await page.goto("/uk/register");
  await page.locator("#register-username").fill("newmember");
  await page.locator("#register-email").fill("newmember@example.invalid");
  await page.locator("#register-password").fill("A-long-password-123!");
  await page.getByRole("button", { name: "Створити акаунт" }).click();
  await expect(page.getByRole("status")).toContainText(/пошту|лист/i);
});

test("English registration keeps English locale for the provider confirmation callback", async ({ page }) => {
  let locale = "";
  await page.route("**/api/auth/register", route => {
    locale = route.request().headers()["accept-language"] ?? "";
    return route.fulfill({ status: 202, json: { confirmationRequired: true } });
  });
  await page.goto("/en/register");
  await page.locator("#register-username").fill("newmemberen");
  await page.locator("#register-email").fill("newmemberen@example.invalid");
  await page.locator("#register-password").fill("A-long-password-123!");
  await page.getByRole("button", { name: "Create your account" }).click();
  await expect(page.getByRole("status")).toContainText(/email/i);
  expect(locale).toBe("en");
});

test("English password recovery asks the backend for an English callback", async ({ page }) => {
  let locale = "";
  await page.route("**/api/auth/forgot-password", route => {
    locale = route.request().headers()["accept-language"] ?? "";
    return route.fulfill({ status: 202, json: { message: "If the account exists, a reset link has been sent." } });
  });
  await page.goto("/en/forgot-password");
  await page.locator("#forgot-password-email").fill("member@example.invalid");
  await page.getByRole("button", { name: "Reset password" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  expect(locale).toBe("en");
});

test("Supabase recovery fragment is submitted to the existing reset API and removed from the address", async ({ page }) => {
  let submittedToken = "";
  await page.route("**/api/auth/reset-password", async route => {
    submittedToken = (route.request().postDataJSON() as { token: string }).token;
    await route.fulfill({ status: 200, json: {} });
  });
  await page.goto("/uk/reset-password#access_token=fixture-recovery-token&type=recovery");
  await expect(page.locator("#reset-password")).toBeVisible();
  await expect(page).toHaveURL(/\/uk\/reset-password$/);
  await page.locator("#reset-password").fill("New-password-123!");
  await page.locator("#reset-password-confirm").fill("New-password-123!");
  await page.getByRole("button", { name: "Змінити пароль" }).click();
  await expect(page.getByRole("status")).toContainText("Пароль змінено");
  expect(submittedToken).toBe("fixture-recovery-token");
});

test("signup confirmation fragment is cleared before password login", async ({ page }) => {
  await page.goto("/en/login#access_token=fixture-signup-token&type=signup");
  await expect(page.getByRole("status")).toContainText(/email/i);
  await expect(page).toHaveURL(/\/en\/login$/);
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
  await page.route("**/api/users/me", route => route.fulfill({
    status: 200,
    json: { id: 7, username: "confirmed-member", role: "USER" },
  }));
  await page.goto("/en/login/?code=fixture-auth-code");
  await expect(page).toHaveURL(/\/en\/films\/?$/);
});

test("a failed PKCE confirmation clears its one-time code and explains the next step", async ({ page }) => {
  await page.goto("/uk/login/?code=expired-fixture-code");
  await expect(page.getByRole("alert")).toContainText("Не вдалося завершити підтвердження email");
  await expect(page).toHaveURL(/\/uk\/login\/?$/);
});
