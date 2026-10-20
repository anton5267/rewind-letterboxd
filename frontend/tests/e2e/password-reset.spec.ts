import { expect, test } from "@playwright/test";
import { cleanupDisposableAccount } from "./helpers";

test("password reset delivers a one-time Mailpit link and permits the new login", async ({ page, baseURL }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `e2e-reset-${suffix}@example.invalid`;
  const oldPassword = "Old-e2e-password-123!";
  const newPassword = "New-e2e-password-123!";
  const mailpitUrl = process.env.E2E_MAILPIT_BASE_URL ?? "http://127.0.0.1:8025";

  let registered = false;
  try {
    await page.goto("/uk/register");
    await page.getByLabel("Нікнейм").fill(`e2ereset${suffix}`);
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль").fill(oldPassword);
    const registration = page.waitForResponse(response => response.url().endsWith("/api/auth/register") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Створити акаунт" }).click();
    expect((await registration).status()).toBe(200);
    registered = true;
    await expect(page.getByRole("heading", { name: /Акаунт створено/ })).toBeVisible();

    await page.getByRole("button", { name: "Перейти до входу" }).click();
    await page.goto("/uk/forgot-password");
    const previousMail = await page.request.get(`${mailpitUrl}/view/latest.txt`);
    const previousToken = (await previousMail.text()).match(/\/uk\/reset-password\?token=([A-Za-z0-9_-]+)/)?.[1];
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByRole("button", { name: "Відновити пароль" }).click();
    await expect(page.getByText("Якщо акаунт існує, лист із посиланням надіслано.")).toBeVisible();

    let token: string | undefined;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await page.request.get(`${mailpitUrl}/view/latest.txt`);
      const message = await response.text();
      token = message.match(/\/uk\/reset-password\?token=([A-Za-z0-9_-]+)/)?.[1];
      if (token && token !== previousToken) break;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    expect(token).toBeTruthy();

    await page.goto(`/uk/reset-password?token=${token}`);
    await page.locator("#reset-password").fill(newPassword);
    await page.locator("#reset-password-confirm").fill(newPassword);
    await page.getByRole("button", { name: "Змінити пароль" }).click();
    await expect(page.getByRole("status")).toContainText("Пароль змінено.");

    await page.getByRole("status").getByRole("link", { name: "Увійти" }).click();
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль").fill(newPassword);
    await page.getByRole("button", { name: "Увійти" }).click();
    await expect(page).toHaveURL(/\/uk\/films$/);
  } finally {
    if (registered) await cleanupDisposableAccount(baseURL, email, [newPassword, oldPassword]);
  }
});
