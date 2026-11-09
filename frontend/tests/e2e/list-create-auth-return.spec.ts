import { expect, test } from "@playwright/test";

const user = { id: 98031, username: "list-return-owner", role: "USER" };
const emptyPage = { content: [], number: 0, size: 12, totalPages: 0, totalElements: 0, first: true, last: true };

test("list creation intent survives registration and returns after login", async ({ page }) => {
  let loggedIn = false;
  let submittedEmail: string | undefined;
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "list-return-csrf" } });
    if (pathname === "/api/auth/register" && request.method() === "POST") {
      return route.fulfill({ status: 200, json: { confirmationRequired: false } });
    }
    if (pathname === "/api/auth/login" && request.method() === "POST") {
      submittedEmail = request.postDataJSON().email;
      loggedIn = true;
      return route.fulfill({ status: 200 });
    }
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/users/me") {
      return loggedIn
        ? route.fulfill({ json: user })
        : route.fulfill({ status: 401, json: {} });
    }
    if (pathname === "/api/lists/my/page") return route.fulfill({ json: emptyPage });
    if (pathname === "/api/lists/my" || pathname === "/api/genres") return route.fulfill({ json: [] });
    if (pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: emptyPage });
  });

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/uk/lists/discover");
  await page.getByRole("link", { name: "Створіть власний список" }).click();
  await expect(page).toHaveURL("/uk/login");

  await page.getByRole("link", { name: "Створити", exact: true }).click();
  await expect(page).toHaveURL("/uk/register");
  await expect(page.locator("#register-page-title")).toBeVisible();
  await page.locator("#register-username").fill("list-return-owner");
  await expect(page.locator("#register-username")).toHaveValue("list-return-owner");
  await expect(page.locator("#register-username")).toBeFocused();
  await page.locator("#register-email").fill("list-return@example.invalid");
  await expect(page.locator("#register-email")).toHaveValue("list-return@example.invalid");
  await page.locator("#register-password").fill("Valid-password-123!");
  await expect(page.locator("#register-password")).toHaveValue("Valid-password-123!");
  await page.locator('main button[type="submit"]').click();
  await expect(page.locator("#register-success-title")).toBeVisible();

  await page.getByRole("button", { name: "Перейти до входу" }).click();
  await expect(page).toHaveURL("/uk/login");
  await expect(page.locator("#login-page-title")).toBeVisible();
  await page.locator("#login-email").fill("list-return@example.invalid");
  await expect(page.locator("#login-email")).toHaveValue("list-return@example.invalid");
  await expect(page.locator("#login-email")).toBeFocused();
  await page.locator("#login-password").fill("Valid-password-123!");
  await expect(page.locator("#login-password")).toHaveValue("Valid-password-123!");
  await page.locator('main button[type="submit"]').click();

  await expect(page).toHaveURL("/uk/lists");
  expect(submittedEmail).toBe("list-return@example.invalid");
  expect(loggedIn).toBe(true);
  await expect(page.locator('main[data-list-editor="create"]')).toBeVisible();
  await expect(page.locator("#new-list-name")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});
