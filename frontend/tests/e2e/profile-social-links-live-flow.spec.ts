import { expect, test } from "@playwright/test";
import { cleanupDisposableAccount } from "./helpers";

test("profile social links save, reload, and clear through the live API", async ({ page, baseURL }) => {
  test.setTimeout(60_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = `social_live_${suffix}`;
  const email = `${username}@example.invalid`;
  const password = "E2e-password-123!";
  const website = `https://rewind-${suffix}.example.invalid/`;
  const instagram = `https://www.instagram.com/rewind_${suffix}`;
  let registered = false;

  try {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/uk/register");
    await page.getByLabel("Нікнейм").fill(username);
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    const registration = page.waitForResponse(response => new URL(response.url()).pathname === "/api/auth/register" && response.request().method() === "POST");
    await page.getByRole("button", { name: "Створити акаунт" }).click();
    const registeredResponse = await registration;
    expect(registeredResponse.status()).toBe(200);
    registered = true;

    await page.getByRole("button", { name: "Перейти до входу" }).click();
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Увійти" }).click();
    await expect(page).toHaveURL(/\/uk\/films$/);
    const userId = Number((await registeredResponse.json() as { id: number }).id);

    await page.goto("/uk/profile?settings=connections");
    const form = page.locator("form#settings-form-connections");
    await expect(form).toBeVisible();
    await form.locator("#social-link-website").fill(website);
    await form.locator("#social-link-instagram").fill(instagram);
    const saveLinks = page.waitForResponse(response => new URL(response.url()).pathname === "/api/profile/me/social-links" && response.request().method() === "PUT");
    await page.locator('button[form="settings-form-connections"]').click();
    const saved = await saveLinks;
    expect(saved.status()).toBe(200);
    expect(await saved.json()).toEqual([
      { platform: "instagram", url: instagram },
      { platform: "website", url: website },
    ]);
    expect(await (await page.request.get("/api/profile/me/social-links")).json()).toEqual([
      { platform: "instagram", url: instagram },
      { platform: "website", url: website },
    ]);
    expect((await (await page.request.get(`/api/users/${userId}/profile`)).json() as { socialLinks: { platform: string; url: string }[] }).socialLinks).toEqual([
      { platform: "instagram", url: instagram },
      { platform: "website", url: website },
    ]);

    await page.reload();
    await expect(form.locator("#social-link-website")).toHaveValue(website);
    await expect(form.locator("#social-link-instagram")).toHaveValue(instagram);
    await form.locator("#social-link-website").fill("");
    await form.locator("#social-link-instagram").fill("");
    const clearLinks = page.waitForResponse(response => new URL(response.url()).pathname === "/api/profile/me/social-links" && response.request().method() === "PUT");
    await page.locator('button[form="settings-form-connections"]').click();
    expect((await clearLinks).status()).toBe(200);
    await expect.poll(async () => (await page.request.get("/api/profile/me/social-links")).json()).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
  } finally {
    if (registered) await cleanupDisposableAccount(baseURL, email, password);
  }
});
