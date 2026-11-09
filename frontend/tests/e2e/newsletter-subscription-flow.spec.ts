import { expect, test } from "@playwright/test";
import { cleanupDisposableAccount } from "./helpers";

test("newsletter preference saves, persists after reload, and can be disabled", async ({ page, baseURL }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = `newsletter${suffix}`;
  const email = `${username}@example.invalid`;
  const password = "E2e-password-123!";
  let registered = false;

  try {
    await page.goto("/uk/register");
    await page.getByLabel("Нікнейм").fill(username);
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    const registration = page.waitForResponse(response => response.url().endsWith("/api/auth/register") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Створити акаунт" }).click();
    expect((await registration).status()).toBe(200);
    registered = true;
    await expect(page.getByRole("heading", { name: /Акаунт створено/ })).toBeVisible();

    await page.getByRole("button", { name: "Перейти до входу" }).click();
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Увійти" }).click();
    await expect(page).toHaveURL(/\/uk\/films$/);

    await page.goto("/uk/profile#newsletter-settings");
    const section = page.locator("#newsletter-settings").locator("..");
    const checkbox = section.getByRole("checkbox", { name: "Отримувати нові випуски на email" });
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();

    const enableResponse = page.waitForResponse(response => response.url().endsWith("/api/newsletter/subscription") && response.request().method() === "PUT");
    await checkbox.click();
    const enabled = await enableResponse;
    expect(enabled.status()).toBe(200);
    expect(await enabled.json()).toMatchObject({ subscribed: true });
    await expect(page.getByRole("status").filter({ hasText: "Налаштування бюлетеня збережено." })).toBeVisible();

    await page.reload();
    await expect(section.getByRole("checkbox", { name: "Отримувати нові випуски на email" })).toBeChecked();

    const disableResponse = page.waitForResponse(response => response.url().endsWith("/api/newsletter/subscription") && response.request().method() === "PUT");
    await section.getByRole("checkbox", { name: "Отримувати нові випуски на email" }).click();
    const disabled = await disableResponse;
    expect(disabled.status()).toBe(200);
    expect(await disabled.json()).toMatchObject({ subscribed: false });
  } finally {
    if (registered) await cleanupDisposableAccount(baseURL, email, password);
  }
});
