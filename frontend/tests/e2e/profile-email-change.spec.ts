import { expect, test } from "@playwright/test";

for (const lang of ["uk", "en"] as const) {
  test(`hosted email editor requests confirmation and refreshes only the address in ${lang}`, async ({ page }, testInfo) => {
    const user = { id: 7, username: "email-fixture", role: "USER" };
    const oldEmail = "current@example.invalid";
    const newEmail = "confirmed@example.invalid";
    let confirmed = false;
    let requests = 0;
    let patches = 0;
    await page.route("**/auth/v1/**", route => route.fulfill({ status: 404, json: { message: "Unmocked fixture Auth request" } }));
    await page.route("**/auth/v1/token**", async route => route.fulfill({ json: {
      access_token: "fixture-access-token", refresh_token: "fixture-refresh-token", token_type: "bearer", expires_in: 3600,
      user: { id: "b1f5872a-148b-4878-8581-06b809b2992f", email: oldEmail, aud: "authenticated", role: "authenticated", app_metadata: { provider: "email" }, user_metadata: {}, created_at: new Date().toISOString() },
    } }));
    await page.route(url => url.pathname.startsWith("/api/"), async route => {
      const { pathname } = new URL(route.request().url());
      if (pathname === "/api/users/me") return route.fulfill({ json: user });
      if (pathname === "/api/profile/me/email") {
        requests++;
        expect(route.request().postDataJSON()).toEqual({ email: newEmail, language: lang, expectedUserId: user.id });
        expect(route.request().headers().authorization).toBe("Bearer fixture-access-token");
        if (requests === 1) return route.fulfill({ status: 429, json: { message: "Rate limit" } });
        return route.fulfill({ status: 202, json: { confirmationRequired: true } });
      }
      if (pathname === "/api/profile/me") {
        if (route.request().method() === "PATCH") patches++;
        return route.fulfill({ json: {
          ...user, displayName: "Saved name", email: confirmed ? newEmail : oldEmail, avatarUrl: null, bio: null,
          location: null, pronoun: null, replyPreference: "ANYONE", supabaseLinked: true,
          stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 }, lists: [], recentRatings: [], recentReviews: [],
        } });
      }
      if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
      if (/\/(watched|watchlist|favorites|ratings|reviews|following|followers|activity)$/.test(pathname)) {
        return route.fulfill({ json: { content: [], number: 0, totalPages: 0, totalElements: 0 } });
      }
      return route.fulfill({ json: [] });
    });
    await page.setViewportSize({ width: lang === "uk" ? 393 : 1440, height: 852 });
    await page.goto(`/${lang}/login`);
    await page.getByLabel(lang === "uk" ? "Електронна пошта" : "Email", { exact: true }).fill(oldEmail);
    await page.getByLabel(lang === "uk" ? "Пароль" : "Password", { exact: true }).fill("fixture-password-only");
    await page.getByRole("button", { name: lang === "uk" ? "Увійти" : "Log in", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${lang}/films/?$`));
    await page.goto(`/${lang}/profile?settings=profile`);
    const name = page.locator("#profile-display-name");
    await name.fill("Unsaved name draft");
    const trigger = page.getByRole("button", { name: lang === "uk" ? "Змінити email" : "Change email", exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    const input = dialog.getByRole("textbox");
    await expect(input).toHaveValue(oldEmail);
    await input.fill(newEmail);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(requests).toBe(0);
    await trigger.click();
    await expect(input).toHaveValue(oldEmail);
    await input.fill(newEmail);
    await page.setViewportSize({ width: 393, height: 852 });
    await page.screenshot({ path: testInfo.outputPath("email-editor.png") });
    const done = dialog.getByRole("button", { name: lang === "uk" ? "Готово" : "Done", exact: true });
    await done.click();
    await expect(dialog.getByRole("alert")).toBeFocused();
    await expect(input).toHaveValue(newEmail);
    await done.click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toHaveText(oldEmail);
    await expect(name).toHaveValue("Unsaved name draft");
    const check = page.getByRole("button", { name: lang === "uk" ? "Перевірити підтвердження" : "Check confirmation", exact: true });
    await check.click();
    await expect(page.getByRole("status").filter({ hasText: lang === "uk" ? "Зміна ще очікує" : "The change is still awaiting" })).toBeVisible();
    confirmed = true;
    await check.click();
    await expect(trigger).toHaveText(newEmail);
    await expect(name).toHaveValue("Unsaved name draft");
    await expect(check).toBeHidden();
    expect(patches).toBe(0);
    expect(requests).toBe(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  });
}
