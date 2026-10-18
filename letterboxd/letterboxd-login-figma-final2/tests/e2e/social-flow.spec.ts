import { expect, test } from "@playwright/test";

async function registerAndLogin(page: import("@playwright/test").Page, suffix: string, username: string) {
  const email = `${username}-${suffix}@example.invalid`;
  const password = "E2e-password-123!";
  await page.goto("/uk/register");
  await page.getByLabel("Нікнейм").fill(`${username}${suffix}`);
  await page.getByLabel("Електронна пошта").fill(email);
  await getByLabel(page, "Пароль").fill(password);
  await page.getByRole("button", { name: "Створити акаунт" }).click();
  await expect(page.getByRole("heading", { name: /Акаунт створено/ })).toBeVisible();
  await page.getByRole("button", { name: "Перейти до входу" }).click();
  await page.getByLabel("Електронна пошта").fill(email);
  await getByLabel(page, "Пароль").fill(password);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);
  return { email, password };
}

function getByLabel(page: import("@playwright/test").Page, label: string) {
  return page.getByLabel(label);
}

test("user can follow another profile and receive a notification", async ({ page }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const first = await registerAndLogin(page, suffix, "social-a");
  const firstUser = await page.evaluate(async () => (await fetch("/api/users/me")).json() as { id: number });

  await page.getByRole("button", { name: "Вийти" }).click();
  await expect(page).toHaveURL(/\/uk\/login$/);

  await registerAndLogin(page, suffix, "social-b");
  const secondUser = await page.evaluate(async () => (await fetch("/api/users/me")).json() as { id: number });
  await page.goto(`/uk/users/${firstUser.id}`);
  await expect(page.getByRole("heading", { name: new RegExp(`social-a${suffix}`) })).toBeVisible();
  const followButton = page.getByRole("button", { name: "Підписатися" });
  await expect(followButton).toBeVisible();
  await followButton.click();
  await expect(page.getByRole("button", { name: "Відписатися" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Підписники" })).toBeVisible();

  await page.getByRole("button", { name: "Вийти" }).click();
  await expect(page).toHaveURL(/\/uk\/login$/);
  await page.getByLabel("Електронна пошта").fill(first.email);
  await page.getByLabel("Пароль").fill(first.password);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);
  await expect(page.getByRole("button", { name: "Вийти" })).toBeVisible();
  await page.goto("/uk/notifications");
  await expect(page.getByRole("heading", { name: "Сповіщення" })).toBeVisible();
  await expect(page.getByText(/підписав/)).toBeVisible();

  const followPreference = page.getByLabel("Нові підписки");
  const originalFollowPreference = await followPreference.isChecked();
  await followPreference.click();
  await expect(page.getByRole("status")).toContainText("Налаштування збережено.");
  await page.reload();
  await expect(page.getByLabel("Нові підписки")).toBeChecked({ checked: !originalFollowPreference });
  await page.getByLabel("Нові підписки").click();
  await expect(page.getByRole("status")).toContainText("Налаштування збережено.");

  const message = `E2E private message ${suffix}`;
  await page.goto(`/uk/messages?user=${secondUser.id}`);
  await expect(page.getByRole("heading", { name: "Повідомлення" })).toBeVisible();
  await page.getByLabel("Текст повідомлення").fill(message);
  await page.getByRole("button", { name: "Надіслати" }).click();
  await expect(page.getByText(message)).toBeVisible();

  await page.getByRole("button", { name: "Вийти" }).click();
  await expect(page).toHaveURL(/\/uk\/login$/);
  await page.getByLabel("Електронна пошта").fill(`${"social-b"}-${suffix}@example.invalid`);
  await getByLabel(page, "Пароль").fill("E2e-password-123!");
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);
  await page.goto("/uk/messages");
  await expect(page.getByText(message)).toBeVisible();
});
