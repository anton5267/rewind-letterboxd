import { expect, type BrowserContext, type Page } from "@playwright/test";

export async function installHostedAuthFixture(context: BrowserContext) {
  const session = (id: number) => ({
    access_token: `fixture-access-${id}`, refresh_token: `fixture-refresh-${id}`,
    token_type: "bearer", expires_in: 3600,
    user: {
      id: `b1f5872a-148b-4878-8581-06b809b2992${id}`, email: "fixture@example.invalid",
      aud: "authenticated", role: "authenticated", app_metadata: { provider: "email" },
      user_metadata: {}, created_at: "2026-11-14T00:00:00Z",
    },
  });
  await context.route("**/auth/v1/**", route => route.fulfill({ status: 404, json: {} }));
  await context.route("**/auth/v1/token**", route => route.fulfill({ json: session(7) }));
  await context.route("**/auth/v1/verify**", route => route.fulfill({ json: session(6) }));
}

export async function signInHostedFixture(page: Page, language: "uk" | "en") {
  await page.goto(`/${language}/login`);
  await page.getByLabel(language === "uk" ? "Електронна пошта" : "Email", { exact: true }).fill("fixture@example.invalid");
  await page.getByLabel(language === "uk" ? "Пароль" : "Password", { exact: true }).fill("fixture-password-only");
  await page.getByRole("button", { name: language === "uk" ? "Увійти" : "Log in", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${language}/films/?$`));
}
