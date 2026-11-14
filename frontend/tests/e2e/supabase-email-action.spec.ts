import { expect, test, type Page } from "@playwright/test";

const tokenHash = "one-time-fixture-token-hash";

for (const language of ["uk", "en"] as const) {
  for (const complete of [false, true]) {
    test(`${language} email change handles ${complete ? "final" : "intermediate"} confirmation after an explicit click`, async ({ page }) => {
      const bodies = await mockSupabaseVerification(page);
      let verifications = 0;
      if (!complete) await page.route("**/auth/v1/verify**", async route => {
        verifications++;
        const body = route.request().postDataJSON();
        expect(body).toMatchObject({ type: "email_change", token_hash: tokenHash });
        await route.fulfill({ json: { msg: "Confirmation accepted" } });
      });
      await page.goto(`${language}/email-action/#rewind_action=email_change&token_hash=${tokenHash}&type=email_change`);
      const heading = language === "uk" ? "Підтвердьте зміну email" : "Confirm your email change";
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`/${language}/email-action/?$`));
      expect(bodies.length + verifications).toBe(0);
      await page.getByRole("button", { name: language === "uk" ? "Підтвердити пошту" : "Confirm email" }).click();
      const result = complete
        ? language === "uk" ? "Email оновлено" : "Email updated"
        : language === "uk" ? "Підтвердження прийнято" : "Confirmation accepted";
      await expect(page.getByRole("heading", { name: result })).toBeVisible();
      await expect(page.getByRole("alert")).toHaveCount(0);
      expect(bodies.length + verifications).toBe(1);
      if (complete) expect(bodies[0].type).toBe("email_change");
    });
  }
}

async function mockSupabaseVerification(page: Page) {
  const appOrigin = new URL(process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000").origin;
  const verificationBodies: Array<{ token_hash: string; type: string }> = [];
  await page.route("**/auth/v1/**", route => route.fulfill({ status: 404, json: { message: "Unmocked fixture Auth request" } }));
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

const emailActionFlows = [
  {
    name: "UK signup confirmation",
    language: "uk",
    action: "signup",
    type: "email",
    heading: "Підтвердьте свою пошту",
    button: "Підтвердити пошту",
    destination: /\/uk\/films\/?$/,
  },
  {
    name: "EN signup confirmation",
    language: "en",
    action: "signup",
    type: "email",
    heading: "Confirm your email",
    button: "Confirm email",
    destination: /\/en\/films\/?$/,
  },
  {
    name: "UK password recovery",
    language: "uk",
    action: "recovery",
    type: "recovery",
    heading: "Підтвердіть зміну пароля",
    button: "Продовжити до зміни пароля",
    destination: /\/uk\/reset-password\/?$/,
  },
  {
    name: "EN password recovery",
    language: "en",
    action: "recovery",
    type: "recovery",
    heading: "Confirm your password change",
    button: "Continue to password change",
    destination: /\/en\/reset-password\/?$/,
  },
] as const;

for (const flow of emailActionFlows) {
  test(`${flow.name} waits for an explicit click and removes its fragment before verification`, async ({ page }) => {
    const verificationBodies = await mockSupabaseVerification(page);
    await page.goto(`${flow.language}/email-action/#rewind_action=${flow.action}&token_hash=${tokenHash}&type=${flow.type}`);

    await expect(page.getByRole("heading", { name: flow.heading })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/${flow.language}/email-action/?$`));
    expect(verificationBodies).toHaveLength(0);

    await page.getByRole("button", { name: flow.button }).click();
    await expect(page).toHaveURL(flow.destination);
    if (flow.action === "recovery") await expect(page.locator("#reset-password")).toBeVisible();
    expect(verificationBodies).toHaveLength(1);
    expect(verificationBodies[0]).toMatchObject({ token_hash: tokenHash, type: flow.type });
  });
}
