import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const emptyPage = { content: [], number: 0, totalPages: 0, totalElements: 0 };
const labels = {
  uk: { edit: "Редагувати", save: "Зберегти огляд", cancel: "Скасувати", permission: "Хто може відповідати", anyone: "Усі", followed: "Друзі (на кого ви підписані)", self: "Лише ви", inherited: "З налаштувань профілю", back: "Налаштування" },
  en: { edit: "Edit", save: "Save review", cancel: "Cancel", permission: "Allow replies from", anyone: "Anyone", followed: "Friends (people you follow)", self: "You", inherited: "Use profile setting", back: "Settings" },
};

async function fixture(context: BrowserContext, options: { create?: boolean; rejectFirst?: boolean; hold?: boolean } = {}) {
  let review = options.create ? null : { id: 91, userId: 7, username: "review-owner", content: "Saved review", rating: 4, replyPreference: "SELF" as string | null, createdAt: "2026-11-14T00:00:00Z" };
  const patches: Record<string, unknown>[] = [];
  const creates: Record<string, unknown>[] = [];
  let release = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  const session = (id: number) => ({
    access_token: `fixture-access-${id}`, refresh_token: `fixture-refresh-${id}`, token_type: "bearer", expires_in: 3600,
    user: { id: `b1f5872a-148b-4878-8581-06b809b2992${id}`, email: `review-${id}@example.invalid`, aud: "authenticated", role: "authenticated", app_metadata: { provider: "email" }, user_metadata: {}, created_at: "2026-11-14T00:00:00Z" },
  });
  await context.route("**/auth/v1/**", route => route.fulfill({ status: 404, json: { message: "Unmocked fixture Auth request" } }));
  await context.route("**/auth/v1/token**", route => route.fulfill({ json: session(7) }));
  await context.route("**/auth/v1/verify**", route => route.fulfill({ json: session(8) }));
  await context.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const actor = request.headers().authorization?.endsWith("-8") ? 8 : 7;
    if (path === "/api/users/me") return route.fulfill({ json: { id: actor, username: `review-${actor}`, role: "USER" } });
    if (path === "/api/movies/5/details") return route.fulfill({ json: {
      id: 5, title: "Review fixture", imdbId: null, originalLanguage: "en", shortPlot: null,
      photoUrl: null, backdropUrl: null, releaseDate: "2020-01-01", durationMinutes: 100,
      ageRating: null, rating: 4, trailerUrl: null, genres: [], actors: [], directors: [], producers: [], externalRatings: [], similarMovies: [],
      myFlags: { watched: false, watchlist: false, favorites: false },
    } });
    if (path === "/api/movies/5/rating/me") return route.fulfill({ json: { rating: 4 } });
    if (path === "/api/movies/5/reviews/me") return review && actor === review.userId
      ? route.fulfill({ json: review }) : route.fulfill({ status: 204 });
    if (path === "/api/movies/5/reviews" && request.method() === "POST") {
      const body = request.postDataJSON();
      creates.push(body);
      review = { id: 91, userId: actor, username: `review-${actor}`, content: body.content, rating: body.rating, replyPreference: body.replyPreference, createdAt: "2026-11-14T00:00:00Z" };
      return route.fulfill({ json: review });
    }
    if (path === "/api/movies/5/reviews") return route.fulfill({ json: { ...emptyPage, content: review ? [review] : [], totalElements: review ? 1 : 0, totalPages: review ? 1 : 0 } });
    if (path === "/api/reviews/91" && request.method() === "PATCH") {
      const body = request.postDataJSON();
      patches.push(body);
      if (options.hold) await gate;
      if (options.rejectFirst && patches.length === 1) return route.fulfill({ status: 503, json: { message: "Fixture retry" } });
      review = { ...review!, ...body };
      return route.fulfill({ json: review });
    }
    if (path.endsWith("/like-status")) return route.fulfill({ json: { liked: false, likes: 0 } });
    if (path.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (path === "/api/profile/me") return route.fulfill({ json: {
      id: actor, username: `review-${actor}`, displayName: "Review fixture", email: "fixture@example.invalid", role: "USER",
      avatarUrl: null, bio: null, location: null, pronoun: null, replyPreference: "ANYONE", supabaseLinked: true,
      stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 }, lists: [], recentRatings: [], recentReviews: [],
    } });
    if (path.endsWith("social-links")) return route.fulfill({ json: [] });
    if (path === "/api/lists") return route.fulfill({ json: [] });
    return route.fulfill({ json: emptyPage });
  });
  return { patches, creates, release };
}

async function signIn(page: Page, lang: "uk" | "en") {
  await page.goto(`/${lang}/login`);
  await page.getByLabel(lang === "uk" ? "Електронна пошта" : "Email", { exact: true }).fill("review-7@example.invalid");
  await page.getByLabel(lang === "uk" ? "Пароль" : "Password", { exact: true }).fill("fixture-password-only");
  await page.getByRole("button", { name: lang === "uk" ? "Увійти" : "Log in", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${lang}/films/?$`));
  await page.goto(`/${lang}/films/5`);
}

async function choose(page: Page, lang: "uk" | "en", value: "ANYONE" | "FOLLOWED" | "SELF" | "") {
  const copy = labels[lang];
  if ((page.viewportSize()?.width ?? 1440) >= 768) {
    await page.getByRole("combobox", { name: copy.permission, exact: true }).selectOption(value);
    return;
  }
  await page.getByRole("button", { name: copy.permission, exact: true }).click();
  const name = value === "" ? copy.inherited : value === "ANYONE" ? copy.anyone : value === "FOLLOWED" ? copy.followed : copy.self;
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("radio", { name, exact: true }).check();
  if (lang === "uk" && value === "FOLLOWED") {
    const rows = await dialog.getByRole("radio").evaluateAll(inputs => inputs.map(input => input.parentElement!.getBoundingClientRect().height));
    expect(rows).toEqual([45, 45, 45, 45]);
    await page.screenshot({ path: test.info().outputPath("review-reply-sheet.png") });
  }
  await dialog.getByRole("button", { name: copy.back, exact: true }).click();
}

for (const lang of ["uk", "en"] as const) {
  test(`review override retains failed drafts, saves, reloads and returns to profile inheritance in ${lang}`, async ({ context, page }, testInfo) => {
    const { patches } = await fixture(context, { rejectFirst: true });
    const copy = labels[lang];
    await page.setViewportSize({ width: lang === "uk" ? 393 : 1440, height: 852 });
    await signIn(page, lang);
    await page.getByRole("button", { name: copy.edit, exact: true }).click();
    await choose(page, lang, "ANYONE");
    await page.getByRole("button", { name: copy.cancel, exact: true }).click();
    await page.getByRole("button", { name: copy.edit, exact: true }).click();
    if (lang === "en") await expect(page.getByRole("combobox", { name: copy.permission, exact: true })).toHaveValue("SELF");
    else await expect(page.getByRole("button", { name: copy.permission, exact: true })).toContainText(copy.self);
    await page.locator("#review-content").fill("Updated review draft");
    await choose(page, lang, "FOLLOWED");
    await page.screenshot({ path: testInfo.outputPath("review-reply-preference.png") });
    await page.getByRole("button", { name: copy.save, exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: lang === "uk" ? "Не вдалося оновити огляд." : "Could not update the review." })).toBeVisible();
    await expect(page.locator("#review-content")).toHaveValue("Updated review draft");
    await page.getByRole("button", { name: copy.save, exact: true }).click();
    await expect(page.locator("#review-content")).toHaveCount(0);
    await page.reload();
    await page.getByRole("button", { name: copy.edit, exact: true }).click();
    await choose(page, lang, "");
    await page.getByRole("button", { name: copy.save, exact: true }).click();
    await expect(page.locator("#review-content")).toHaveCount(0);
    await page.reload();
    await page.getByRole("button", { name: copy.edit, exact: true }).click();
    if (lang === "en") await expect(page.getByRole("combobox", { name: copy.permission, exact: true })).toHaveValue("");
    else await expect(page.getByRole("button", { name: copy.permission, exact: true })).toContainText(copy.inherited);
    expect(patches.map(body => body.replyPreference)).toEqual(["FOLLOWED", "FOLLOWED", null]);
    await page.goto(`/${lang}/profile?settings=profile`);
    if (lang === "en") {
      await expect(page.getByRole("combobox", { name: copy.permission, exact: true }).getByRole("option")).toHaveCount(3);
    } else {
      await page.getByRole("button", { name: copy.permission, exact: true }).click();
      await expect(page.getByRole("dialog").getByRole("radio")).toHaveCount(3);
      await page.keyboard.press("Escape");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
  });
}

test("new review submits its explicit reply permission through the existing create endpoint", async ({ context, page }) => {
  const { creates } = await fixture(context, { create: true });
  await signIn(page, "en");
  await page.locator("#review-content").fill("New review");
  await choose(page, "en", "SELF");
  await page.getByRole("button", { name: "Publish review", exact: true }).click();
  await expect(page.locator("#review-content")).toHaveCount(0);
  expect(creates).toEqual([{ content: "New review", rating: 4, replyPreference: "SELF" }]);
});

test("an account switch discards the prior review draft and ignores its delayed save", async ({ context, page }) => {
  const state = await fixture(context, { hold: true });
  try {
    await signIn(page, "en");
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await page.locator("#review-content").fill("Previous account draft");
    await choose(page, "en", "ANYONE");
    await page.getByRole("button", { name: "Save review", exact: true }).click();
    await expect.poll(() => state.patches.length).toBe(1);
    const otherTab = await context.newPage();
    await otherTab.goto("/en/email-action/#rewind_action=signup&type=email&token_hash=fixture-next-account");
    await otherTab.getByRole("button", { name: "Confirm email", exact: true }).click();
    await expect(otherTab).toHaveURL(/\/en\/films\/?$/);
    await expect(page.getByRole("button", { name: "Publish review", exact: true })).toBeVisible();
    await expect(page.locator("#review-content")).toHaveValue("");
    await expect(page.getByRole("combobox", { name: labels.en.permission, exact: true })).toHaveValue("");
    await page.locator("#review-content").fill("Current account draft");
    const delayedResponse = page.waitForResponse(response => new URL(response.url()).pathname === "/api/reviews/91" && response.request().method() === "PATCH");
    state.release();
    await (await delayedResponse).finished();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#review-content")).toHaveValue("Current account draft");
    await expect(page.getByRole("button", { name: "Publish review", exact: true })).toBeEnabled();
  } finally {
    state.release();
  }
});
