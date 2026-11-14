import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const empty = { content: [], number: 0, totalPages: 0, totalElements: 0 };
async function fixture(context: BrowserContext, hold = false) {
  let names = { givenName: null as string | null, familyName: null as string | null };
  const writes: Record<string, unknown>[] = [];
  let rejectFirst = !hold;
  let release = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  const profile = (id: number) => ({
    id, username: `reader-${id}`, displayName: "Profile Reader", email: "fixture@example.invalid", avatarUrl: null, role: "USER",
    ...(id === 7 ? names : { givenName: null, familyName: null }),
    bio: null, location: null, pronoun: null, replyPreference: "ANYONE", supabaseLinked: true,
    stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 }, lists: [], recentRatings: [], recentReviews: [],
  });
  const session = (id: number) => ({ access_token: `fixture-access-${id}`, refresh_token: `fixture-refresh-${id}`, token_type: "bearer", expires_in: 3600,
    user: { id: `b1f5872a-148b-4878-8581-06b809b2992${id}`, email: "fixture@example.invalid", aud: "authenticated", role: "authenticated", app_metadata: { provider: "email" }, user_metadata: {}, created_at: "2026-11-14T00:00:00Z" } });
  await context.route("**/auth/v1/**", route => route.fulfill({ status: 404, json: {} }));
  await context.route("**/auth/v1/token**", route => route.fulfill({ json: session(7) }));
  await context.route("**/auth/v1/verify**", route => route.fulfill({ json: session(6) }));
  await context.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const actor = request.headers().authorization?.endsWith("6") ? 6 : 7;
    if (path === "/api/users/me") return route.fulfill({ json: { id: actor, username: `reader-${actor}`, role: "USER" } });
    if (path === "/api/profile/me") {
      if (request.method() === "PATCH") {
        const body = request.postDataJSON(); writes.push(body);
        if (hold) await gate;
        if (rejectFirst) { rejectFirst = false; return route.fulfill({ status: 503, json: {} }); }
        names = { givenName: body.givenName || null, familyName: body.familyName || null };
      }
      return route.fulfill({ json: profile(actor) });
    }
    if (path.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (path.endsWith("social-links") || path === "/api/lists/my") return route.fulfill({ json: [] });
    return route.fulfill({ json: empty });
  });
  return { writes, release };
}
async function login(page: Page, lang: "uk" | "en") {
  await page.goto(`/${lang}/login`);
  await page.getByLabel(lang === "uk" ? "Електронна пошта" : "Email", { exact: true }).fill("fixture@example.invalid");
  await page.getByLabel(lang === "uk" ? "Пароль" : "Password", { exact: true }).fill("fixture-password-only");
  await page.getByRole("button", { name: lang === "uk" ? "Увійти" : "Log in", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${lang}/films/?$`));
  await page.goto(`/${lang}/profile?settings=profile`);
}
for (const lang of ["uk", "en"] as const) {
  test(`optional profile names retain failed drafts, save, reload and clear in ${lang}`, async ({ context, page }) => {
    const state = await fixture(context);
    await page.setViewportSize({ width: lang === "uk" ? 393 : 1440, height: 900 });
    await login(page, lang);
    const given = page.getByLabel(lang === "uk" ? "Ім’я" : "Given name", { exact: true });
    const family = page.getByLabel(lang === "uk" ? "Прізвище" : "Family name", { exact: true });
    await expect(given).toHaveValue(""); await expect(family).toHaveValue("");
    await expect(given).toHaveAttribute("autocomplete", "given-name");
    await expect(family).toHaveAttribute("maxlength", "80");
    await given.fill("  Zoë  "); await family.fill("O’Neill");
    const save = lang === "uk" ? page.locator('button[form="settings-form-profile"]')
      : page.locator("#settings-form-profile").getByRole("button", { name: "Save", exact: true });
    await save.click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(given).toHaveValue("  Zoë  "); await expect(family).toHaveValue("O’Neill");
    await save.click();
    await expect(page.getByText(lang === "uk" ? "Профіль оновлено." : "Profile updated.", { exact: true })).toBeVisible();
    await page.reload(); await expect(given).toHaveValue("Zoë"); await expect(family).toHaveValue("O’Neill");
    const first = await given.boundingBox(); const last = await family.boundingBox();
    if (lang === "uk") expect(last!.y - first!.y).toBe(45);
    else { expect(last!.y).toBe(first!.y); expect(last!.x).toBeGreaterThan(first!.x + first!.width); }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`profile-names-${lang}.png`), fullPage: true });
    await given.fill(""); await family.fill(""); await save.click();
    await expect.poll(() => state.writes.length).toBe(3);
    expect(state.writes.map(body => [body.givenName, body.familyName])).toEqual([["Zoë", "O’Neill"], ["Zoë", "O’Neill"], ["", ""]]);
    await expect(page.getByText(lang === "uk" ? "Профіль оновлено." : "Profile updated.", { exact: true })).toBeVisible();
    await page.reload(); await expect(given).toHaveValue(""); await expect(family).toHaveValue("");
  });
}

test("a profile-name save from the previous account cannot replace the current account draft", async ({ context, page }) => {
  const state = await fixture(context, true);
  try {
    await login(page, "en");
    const given = page.getByLabel("Given name", { exact: true });
    await given.fill("Previous account");
    await page.locator("#settings-form-profile").getByRole("button", { name: "Save", exact: true }).click();
    await expect.poll(() => state.writes.length).toBe(1);
    const other = await context.newPage();
    await other.goto("/en/email-action/#rewind_action=signup&type=email&token_hash=fixture-next-account");
    await other.getByRole("button", { name: "Confirm email", exact: true }).click();
    await expect(other).toHaveURL(/\/en\/films\/?$/);
    await expect(given).toHaveValue(""); await given.fill("Current account");
    const delayed = page.waitForResponse(r => r.request().method() === "PATCH" && r.url().endsWith("/api/profile/me"));
    state.release(); await (await delayed).finished(); await page.waitForLoadState("networkidle");
    await expect(given).toHaveValue("Current account");
    await expect(page.getByText("Profile updated.", { exact: true })).toHaveCount(0);
  } finally { state.release(); }
});
