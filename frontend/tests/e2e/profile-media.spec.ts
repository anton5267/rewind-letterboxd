import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const empty = { content: [], number: 0, totalPages: 0, totalElements: 0 };
async function fixture(context: BrowserContext, options: { hold?: boolean; failFirst?: boolean } = {}) {
  const images = new Map<number, { avatarUrl: string | null; bannerUrl: string | null }>();
  const files = new Map<string, { body: Buffer; contentType: string }>();
  const writes: { actor: number; expectedUserId: string | null; kind: string; method: string; type: string; size: number }[] = [];
  let failed = false;
  let release = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  const media = (id: number) => images.get(id) ?? { avatarUrl: null, bannerUrl: null };
  const profile = (id: number) => ({
    id, username: `reader-${id}`, displayName: "Profile Reader", email: "fixture@example.invalid", role: "USER", ...media(id),
    givenName: null, familyName: null, bio: null, location: null, pronoun: null, replyPreference: "ANYONE", supabaseLinked: true,
    ratingDistribution: [], socialLinks: [], hq: false,
    stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 }, lists: [], recentRatings: [], recentReviews: [],
  });
  const session = (id: number) => ({
    access_token: `fixture-access-${id}`, refresh_token: `fixture-refresh-${id}`, token_type: "bearer", expires_in: 3600,
    user: { id: `b1f5872a-148b-4878-8581-06b809b2992${id}`, email: "fixture@example.invalid", aud: "authenticated", role: "authenticated", app_metadata: { provider: "email" }, user_metadata: {}, created_at: "2026-11-14T00:00:00Z" },
  });
  await context.route("**/auth/v1/**", route => route.fulfill({ status: 404, json: {} }));
  await context.route("**/auth/v1/token**", route => route.fulfill({ json: session(7) }));
  await context.route("**/auth/v1/verify**", route => route.fulfill({ json: session(6) }));
  await context.route("https://images.invalid/**", route => {
    const file = files.get(route.request().url());
    return route.fulfill(file ? { status: 200, ...file } : { status: 404 });
  });
  await context.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request();
    const url = new URL(request.url());
    const actor = request.headers().authorization?.endsWith("6") ? 6 : 7;
    if (url.pathname === "/api/users/me") return route.fulfill({ json: { id: actor, username: `reader-${actor}`, role: "USER" } });
    if (url.pathname === "/api/profile/me") return route.fulfill({ json: profile(actor) });
    if (url.pathname === "/api/users/7/profile") return route.fulfill({ json: { ...profile(7), followersCount: 0, followingCount: 0 } });
    if (url.pathname.startsWith("/api/profile/me/media/")) {
      const kind = url.pathname.split("/").at(-1)!;
      writes.push({ actor, expectedUserId: url.searchParams.get("expectedUserId"), kind, method: request.method(), type: request.headers()["content-type"], size: request.postDataBuffer()?.length ?? 0 });
      if (options.hold) await gate;
      if (options.failFirst && !failed) { failed = true; return route.fulfill({ status: 503, json: {} }); }
      const next = { ...media(actor), [kind === "avatar" ? "avatarUrl" : "bannerUrl"]: request.method() === "DELETE" ? null : `https://images.invalid/${actor}/${kind}.png` };
      if (request.method() === "POST") files.set(`https://images.invalid/${actor}/${kind}.png`, { body: request.postDataBuffer()!, contentType: request.headers()["content-type"] });
      images.set(actor, next);
      return route.fulfill({ json: next });
    }
    if (url.pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (url.pathname.endsWith("social-links") || url.pathname === "/api/lists/my") return route.fulfill({ json: [] });
    return route.fulfill({ json: empty });
  });
  return { writes, release };
}
async function login(page: Page, lang = "en", tab = "avatar") {
  await page.goto(`/${lang}/login`);
  await page.getByLabel(lang === "uk" ? "Електронна пошта" : "Email", { exact: true }).fill("fixture@example.invalid");
  await page.getByLabel(lang === "uk" ? "Пароль" : "Password", { exact: true }).fill("fixture-password-only");
  await page.getByRole("button", { name: lang === "uk" ? "Увійти" : "Log in", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${lang}/films/?$`));
  await page.goto(`/${lang}/profile?settings=${tab}`);
}
async function picture(page: Page, type = "image/png") {
  const encoded = await page.evaluate(mime => {
    const canvas = document.createElement("canvas");
    canvas.width = 32; canvas.height = 24;
    canvas.getContext("2d")!.fillRect(0, 0, 32, 24);
    return canvas.toDataURL(mime).split(",")[1];
  }, type);
  return { name: type === "image/png" ? "avatar.png" : "banner.jpg", mimeType: type, buffer: Buffer.from(encoded, "base64") };
}
for (const lang of ["uk", "en"] as const) {
  test(`profile images validate, retry, persist and clear in ${lang}`, async ({ context, page }) => {
    const state = await fixture(context, { failFirst: true });
    await page.setViewportSize({ width: lang === "uk" ? 393 : 1440, height: 900 });
    await login(page, lang);
    const avatar = page.locator('input[type="file"]').nth(0);
    const banner = page.locator('input[type="file"]').nth(1);
    await avatar.setInputFiles({ name: "script.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg/>") });
    await expect(page.getByRole("alert")).toBeVisible();
    expect(state.writes).toHaveLength(0);
    await avatar.setInputFiles(await picture(page));
    await expect(page.getByRole("button", { name: lang === "uk" ? "Спробувати ще" : "Retry", exact: true })).toBeVisible();
    await page.getByRole("button", { name: lang === "uk" ? "Спробувати ще" : "Retry", exact: true }).click();
    const removeAvatar = page.getByRole("button", { name: lang === "uk" ? "Прибрати аватар" : "Remove avatar", exact: true });
    await expect(removeAvatar).toBeVisible();
    await banner.setInputFiles(await picture(page, "image/jpeg"));
    const removeBanner = page.getByRole("button", { name: lang === "uk" ? "Прибрати банер" : "Remove banner", exact: true });
    await expect(removeBanner).toBeVisible();
    await expect.poll(() => page.locator('img[src="https://images.invalid/7/banner.png"]').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(32);
    await page.reload(); await expect(removeAvatar).toBeVisible(); await expect(removeBanner).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`profile-media-${lang}.png`), fullPage: true });
    await removeAvatar.click(); await expect(removeAvatar).toHaveCount(0);
    await removeBanner.click(); await expect(removeBanner).toHaveCount(0);
    expect(state.writes.map(write => [write.expectedUserId, write.kind, write.method, write.type])).toEqual([
      ["7", "avatar", "POST", "image/png"], ["7", "avatar", "POST", "image/png"], ["7", "banner", "POST", "image/jpeg"],
      ["7", "avatar", "DELETE", undefined], ["7", "banner", "DELETE", undefined],
    ]);
    expect(state.writes.slice(0, 3).every(write => write.size > 20 && write.size <= 2097152)).toBe(true);
  });
}
test("upload preserves the mobile metadata draft and locks simultaneous saves", async ({ context, page }) => {
  const state = await fixture(context, { hold: true });
  try {
    await page.setViewportSize({ width: 393, height: 900 });
    await login(page, "en", "profile");
    const name = page.locator("#profile-display-name");
    await name.fill("Unsaved name");
    await page.locator('input[type="file"]').first().setInputFiles(await picture(page));
    await expect.poll(() => state.writes.length).toBe(1);
    await expect(page.locator('button[form="settings-form-profile"]')).toBeDisabled();
    state.release();
    await expect(page.getByRole("button", { name: "Remove avatar", exact: true })).toBeVisible();
    await expect(name).toHaveValue("Unsaved name");
    await expect(name).toBeEnabled();
  } finally { state.release(); }
});
test("saved banner renders in own and public profiles across tablet and phone layouts", async ({ context, page }) => {
  await fixture(context);
  await page.setViewportSize({ width: 900, height: 900 });
  await login(page);
  await page.locator('input[type="file"]').nth(1).setInputFiles(await picture(page));
  await expect(page.getByRole("button", { name: "Remove banner", exact: true })).toBeVisible();
  const preview = page.locator('img[src="https://images.invalid/7/banner.png"]');
  await expect.poll(() => preview.evaluate(image => image.getBoundingClientRect().height)).toBe(320);
  await page.goto("/en/profile");
  const ownHero = page.locator('section[aria-labelledby="profile-identity"]');
  await expect.poll(() => ownHero.evaluate(element => getComputedStyle(element, "::before").backgroundImage)).toMatch(/images\.invalid\/7\/banner\.png/);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect.poll(() => ownHero.evaluate(element => getComputedStyle(element, "::before").backgroundImage)).toMatch(/images\.invalid\/7\/banner\.png/);
  await page.goto("/en/users/7");
  await expect(page.locator('section[aria-labelledby="public-profile-title"]')).toHaveCSS("background-image", /images\.invalid\/7\/banner\.png/);
  await page.setViewportSize({ width: 393, height: 900 });
  await expect(page.locator('section[aria-labelledby="public-profile-title"]')).toHaveCSS("background-image", /images\.invalid\/7\/banner\.png/);
});
test("a delayed upload from the previous account cannot replace the current account images", async ({ context, page }) => {
  const state = await fixture(context, { hold: true });
  try {
    await login(page);
    await page.locator('input[type="file"]').first().setInputFiles(await picture(page));
    await expect.poll(() => state.writes.length).toBe(1);
    const other = await context.newPage();
    await other.goto("/en/email-action/#rewind_action=signup&type=email&token_hash=fixture-next-account");
    await other.getByRole("button", { name: "Confirm email", exact: true }).click();
    await expect(other).toHaveURL(/\/en\/films\/?$/);
    await expect(page.locator('input[type="file"]').first()).toBeEnabled();
    state.release();
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: "Remove avatar", exact: true })).toHaveCount(0);
    await expect(page.getByRole("status").filter({ hasText: "Avatar updated" })).toHaveCount(0);
    expect(state.writes[0].expectedUserId).toBe("7");
  } finally { state.release(); }
});
