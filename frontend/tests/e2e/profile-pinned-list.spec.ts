import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const empty = { content: [], number: 0, totalPages: 0, totalElements: 0 };
async function fixture(context: BrowserContext, options: { hold?: boolean; failFirst?: boolean; unavailable?: boolean } = {}) {
  const pins = new Map<number, number | null>([[7, options.unavailable ? 11 : null]]);
  const writes: { actor: number; expectedUserId: string | null; pinnedListId: number | null }[] = [];
  const commentReads: string[] = [];
  let failed = false;
  let release = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  const lists = (id: number) => [
    { id: id === 7 ? 11 : 61, name: "Public selection", listType: "CUSTOM", isPublic: true, tags: [], description: "A public film collection" },
    { id: 12, name: "Private selection", listType: "CUSTOM", isPublic: false, tags: [], description: null },
    { id: 13, name: "Watched system list", listType: "WATCHED", isPublic: true, tags: [], description: null },
  ];
  const profile = (id: number) => ({
    id, username: `reader-${id}`, displayName: "Profile Reader", email: "fixture@example.invalid", role: "USER", avatarUrl: null,
    bannerUrl: null, givenName: null, familyName: null, pinnedListId: pins.get(id) ?? null,
    bio: null, location: null, pronoun: null, replyPreference: "ANYONE", supabaseLinked: true, hq: false,
    stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 }, lists: lists(id),
    recentRatings: [], recentReviews: [], socialLinks: [], ratingDistribution: [],
  });
  const session = (id: number) => ({ access_token: `fixture-access-${id}`, refresh_token: `fixture-refresh-${id}`, token_type: "bearer", expires_in: 3600,
    user: { id: `b1f5872a-148b-4878-8581-06b809b2992${id}`, email: "fixture@example.invalid", aud: "authenticated", role: "authenticated", app_metadata: { provider: "email" }, user_metadata: {}, created_at: "2026-11-14T00:00:00Z" } });
  await context.route("**/auth/v1/**", route => route.fulfill({ status: 404, json: {} }));
  await context.route("**/auth/v1/token**", route => route.fulfill({ json: session(7) }));
  await context.route("**/auth/v1/verify**", route => route.fulfill({ json: session(6) }));
  await context.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname;
    const actor = request.headers().authorization?.endsWith("6") ? 6 : 7;
    if (path === "/api/users/me") return route.fulfill({ json: { id: actor, username: `reader-${actor}`, role: "USER" } });
    if (path === "/api/profile/me") {
      if (request.method() === "PATCH") {
        const body = request.postDataJSON();
        writes.push({ actor, expectedUserId: url.searchParams.get("expectedUserId"), pinnedListId: body.pinnedListId });
        if (options.hold) await gate;
        if (options.failFirst && !failed) { failed = true; return route.fulfill({ status: 503, json: {} }); }
        pins.set(actor, body.pinnedListId);
      }
      return route.fulfill({ json: profile(actor) });
    }
    if (path === "/api/users/7/profile") return route.fulfill({ json: profile(7) });
    if (path === "/api/lists/public/11") {
      if (options.unavailable) return route.fulfill({ status: 404, json: {} });
      return route.fulfill({ json: { ...lists(7)[0], ownerId: 7, ownerUsername: "reader-7", ownerAvatarUrl: null, likeCount: 0,
        movies: Array.from({ length: 5 }, (_, index) => ({ id: index + 1, title: `Film ${index + 1}`, photoUrl: null, rating: null, releaseDate: null })) } });
    }
    if (path === "/api/lists/public/11/comments") {
      commentReads.push(path);
      return route.fulfill({ json: { ...empty, totalPages: 1, totalElements: 1, content: [{ id: 100, reviewId: null, listId: 11,
        userId: 8, username: "commenter", userAvatarUrl: null, text: "Comment on the pinned list", createdAt: "2026-11-14T00:00:00Z", updatedAt: "2026-11-14T00:00:00Z" }] } });
    }
    if (path.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (path.endsWith("social-links") || path === "/api/lists/my") return route.fulfill({ json: path === "/api/lists/my" ? lists(actor) : [] });
    if (/\/api\/lists\/\d+\/items$/.test(path)) return route.fulfill({ json: [] });
    return route.fulfill({ json: empty });
  });
  return { writes, release, commentReads };
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
  test(`pin selection survives retry, renders its comments in both profiles and clears in ${lang}`, async ({ context, page }) => {
    const state = await fixture(context, { failFirst: true });
    await page.setViewportSize({ width: lang === "uk" ? 393 : 1440, height: 900 });
    await login(page, lang);
    const select = page.getByLabel(lang === "uk" ? "Закріплений список" : "Pinned list", { exact: true });
    await expect(select.locator("option")).toHaveText([lang === "uk" ? "Без закріпленого списку" : "No pinned list", "Public selection"]);
    const field = select.locator("..");
    await expect.poll(() => field.locator("p").evaluate(element => element.getBoundingClientRect().width)).toBeCloseTo(await field.evaluate(element => element.getBoundingClientRect().width), 0);
    await select.selectOption("11");
    const save = lang === "uk" ? page.locator('button[form="settings-form-profile"]') : page.locator("#settings-form-profile").getByRole("button", { name: "Save", exact: true });
    await save.click(); await expect(page.getByRole("alert")).toBeVisible(); await expect(select).toHaveValue("11");
    await save.click();
    await expect(page.getByText(lang === "uk" ? "Профіль оновлено." : "Profile updated.", { exact: true })).toBeVisible();
    await page.reload(); await expect(select).toHaveValue("11");
    await page.goto(`/${lang}/profile`);
    const pinned = page.getByRole("region", { name: lang === "uk" ? "Закріплений список" : "Pinned list", exact: true });
    await pinned.getByRole("button", { name: lang === "uk" ? "Показати коментарі" : "Show comments", exact: true }).click();
    await expect(pinned.getByText("Comment on the pinned list", { exact: true })).toBeVisible();
    await expect(pinned.getByRole("link", { name: "Public selection", exact: true }).first()).toHaveAttribute("href", `/${lang}/lists/public/11`);
    const pinnedY = await pinned.evaluate(element => element.getBoundingClientRect().top);
    const favoritesY = await page.locator("#profile-overview").evaluate(element => element.getBoundingClientRect().top);
    expect(pinnedY).toBeLessThan(favoritesY);
    await page.goto(`/${lang}/users/7`);
    await pinned.getByRole("button", { name: lang === "uk" ? "Показати коментарі" : "Show comments", exact: true }).click();
    await expect(pinned.getByText("Comment on the pinned list", { exact: true })).toBeVisible();
    const posters = pinned.getByRole("img", { name: "Public selection", exact: true });
    await expect.poll(() => posters.evaluate(element => element.getBoundingClientRect().height)).toBe(lang === "uk" ? 116 : 260);
    await expect.poll(() => posters.evaluate(element => element.getBoundingClientRect().width)).toBe(lang === "uk" ? 325 : 446);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`profile-pinned-list-${lang}.png`), fullPage: true });
    await pinned.screenshot({ path: test.info().outputPath(`pinned-card-${lang}.png`) });
    await page.goto(`/${lang}/profile?settings=profile`); await select.selectOption(""); await save.click();
    await expect(page.getByText(lang === "uk" ? "Профіль оновлено." : "Profile updated.", { exact: true })).toBeVisible();
    await page.goto(`/${lang}/profile`); await expect(pinned).toHaveCount(0);
    expect(state.writes.map(write => [write.expectedUserId, write.pinnedListId])).toEqual([["7", 11], ["7", 11], ["7", null]]);
  });
}
test("an unavailable pinned list reveals no card or comment thread", async ({ context, page }) => {
  const state = await fixture(context, { unavailable: true });
  const loaded = page.waitForResponse(response => new URL(response.url()).pathname === "/api/lists/public/11");
  await page.goto("/en/users/7");
  await loaded;
  await expect(page.getByRole("region", { name: "Pinned list", exact: true })).toHaveCount(0);
  expect(state.commentReads).toEqual([]);
});
test("a delayed previous-account pin save preserves the current account selection", async ({ context, page }) => {
  const state = await fixture(context, { hold: true });
  try {
    await login(page, "en");
    const select = page.getByLabel("Pinned list", { exact: true });
    await select.selectOption("11");
    await page.locator("#settings-form-profile").getByRole("button", { name: "Save", exact: true }).click();
    await expect.poll(() => state.writes.length).toBe(1);
    const other = await context.newPage();
    await other.goto("/en/email-action/#rewind_action=signup&type=email&token_hash=fixture-next-account");
    await other.getByRole("button", { name: "Confirm email", exact: true }).click();
    await expect(other).toHaveURL(/\/en\/films\/?$/);
    await expect(select).toBeEnabled(); await select.selectOption("61");
    const delayed = page.waitForResponse(response => response.request().method() === "PATCH");
    state.release(); await (await delayed).finished(); await page.waitForLoadState("networkidle");
    await expect(select).toHaveValue("61");
    await expect(page.getByText("Profile updated.", { exact: true })).toHaveCount(0);
  } finally { state.release(); }
});
