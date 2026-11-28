import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const empty = { content: [], number: 0, totalPages: 0, totalElements: 0 };
async function fixture(context: BrowserContext, options: { holdCommentWrite?: boolean; failCommentLoad?: boolean; holdCommentLoad?: boolean; commentFailure?: number | null; authenticated?: boolean; emptyComments?: boolean } = {}) {
  const { holdCommentWrite = false, holdCommentLoad = false, authenticated = true, emptyComments = false } = options;
  let failCommentLoad = options.failCommentLoad ?? false;
  let commentFailure = options.commentFailure === undefined ? 403 : options.commentFailure;
  let list = { id: 8, name: "Commentable list", description: "A public collection", listType: "CUSTOM", isPublic: true, isRanked: false, tags: [], replyPreference: "SELF" as string | null };
  let comments = emptyComments ? [] : [{ id: 21, reviewId: null, listId: 8, userId: 9, username: "other-reader", userAvatarUrl: null, text: "Existing reply", createdAt: "2026-11-14T00:00:00Z", updatedAt: "2026-11-14T00:00:00Z" }];
  const writes: { path: string; body: Record<string, unknown>; method: string }[] = [];
  let rejectFirstListPatch = true;
  let release = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  let releaseCommentLoad = () => {};
  const commentLoadGate = new Promise<void>(resolve => { releaseCommentLoad = resolve; });
  const session = (id: number) => ({ access_token: `fixture-access-${id}`, refresh_token: `fixture-refresh-${id}`, token_type: "bearer", expires_in: 3600,
    user: { id: `b1f5872a-148b-4878-8581-06b809b2992${id}`, email: `list-${id}@example.invalid`, aud: "authenticated", role: "authenticated", app_metadata: { provider: "email" }, user_metadata: {}, created_at: "2026-11-14T00:00:00Z" } });
  await context.route("**/auth/v1/**", route => route.fulfill({ status: 404, json: {} }));
  await context.route("**/auth/v1/token**", route => route.fulfill({ json: session(7) }));
  await context.route("**/auth/v1/verify**", route => route.fulfill({ json: session(6) }));
  await context.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const actor = request.headers().authorization?.endsWith("6") ? 6 : 7;
    if (method === "OPTIONS") return route.fulfill({ status: 204 });
    if (path === "/api/users/me") return route.fulfill(authenticated
      ? { json: { id: actor, username: `list-${actor}`, displayName: "List fixture", role: "USER", avatarUrl: null } }
      : { status: 401, json: {} });
    if (path === "/api/profile/me") return route.fulfill({ json: { id: actor, username: `list-${actor}`, displayName: "List fixture", email: "fixture@example.invalid", role: "USER", avatarUrl: null, supabaseLinked: true, stats: { watched: 0, watchlist: 0, favorites: 0, reviews: 0, ratings: 0 }, lists: [], recentRatings: [], recentReviews: [] } });
    if (path.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (path === "/api/genres") return route.fulfill({ json: [] });
    if (path.endsWith("social-links")) return route.fulfill({ json: [] });
    if (path === "/api/lists/my") return route.fulfill({ json: [list] });
    if (path === "/api/lists/my/page") return route.fulfill({ json: { ...empty, content: [list], totalPages: 1, totalElements: 1 } });
    if (path === "/api/lists/public/8") return route.fulfill({ json: { ...list, ownerId: 7, ownerUsername: "list-7", ownerAvatarUrl: null, movies: [], likeCount: 0 } });
    if (path === "/api/lists/8/items") return route.fulfill({ json: [] });
    if (path.endsWith("like-status")) return route.fulfill({ json: { liked: false, likes: 0 } });
    if (path === "/api/lists/8" && method === "PATCH") {
      const body = request.postDataJSON(); writes.push({ path, method, body });
      if (rejectFirstListPatch) { rejectFirstListPatch = false; return route.fulfill({ status: 503, json: {} }); }
      list = { ...list, ...body }; return route.fulfill({ json: list });
    }
    if (path === "/api/lists/public/8/comments") {
      if (method === "GET") {
        if (holdCommentLoad) await commentLoadGate;
        if (failCommentLoad) { failCommentLoad = false; return route.fulfill({ status: 503, json: {} }); }
        return route.fulfill({ json: { ...empty, content: comments, totalPages: 1, totalElements: comments.length } });
      }
      const body = request.postDataJSON(); writes.push({ path, method, body });
      if (holdCommentWrite) await gate;
      if (commentFailure !== null) { const status = commentFailure; commentFailure = null; return route.fulfill({ status, json: {} }); }
      const comment = { ...comments[0], id: 22, userId: actor, username: `list-${actor}`, text: body.text };
      comments.push(comment); return route.fulfill({ json: comment });
    }
    if (path === "/api/comments/22") {
      const body = method === "PATCH" ? request.postDataJSON() : {};
      writes.push({ path, method, body });
      if (method === "DELETE") { comments = comments.filter(c => c.id !== 22); return route.fulfill({ status: 204 }); }
      comments = comments.map(c => c.id === 22 ? { ...c, text: body.text } : c);
      return route.fulfill({ json: comments.find(c => c.id === 22) });
    }
    if (path.endsWith("/report")) return route.fulfill({ json: { reported: false, report: null } });
    return route.fulfill({ json: empty });
  });
  return { writes, release, releaseCommentLoad };
}

async function login(page: Page, lang = "en") {
  await page.goto(`/${lang}/login`);
  await page.getByLabel(lang === "uk" ? "Електронна пошта" : "Email", { exact: true }).fill("fixture@example.invalid");
  await page.getByLabel(lang === "uk" ? "Пароль" : "Password", { exact: true }).fill("fixture-password-only");
  await page.getByRole("button", { name: lang === "uk" ? "Увійти" : "Log in", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${lang}/films/?$`));
}

test("public list comments preserve a denied draft and support retry, edit and delete", async ({ context, page }) => {
  const state = await fixture(context);
  await login(page);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/lists/public/8");
  const thread = page.getByRole("region", { name: "Comments", exact: true });
  const commentsToggle = thread.getByRole("button", { name: "Show comments" });
  await expect.poll(async () => commentsToggle.boundingBox()).toMatchObject({ x: 20, width: 353, height: 44 });
  await commentsToggle.click();
  await expect(thread.getByText("Existing reply")).toBeVisible();
  await expect(thread.getByRole("button", { name: "Edit comment" })).toHaveCount(0);
  await expect(thread.getByRole("button", { name: "Report comment" })).toBeVisible();
  await thread.getByLabel("Your comment").fill("My list reply");
  await thread.getByRole("button", { name: "Send", exact: true }).click();
  const alert = thread.getByRole("alert");
  await expect(alert).toContainText("The list owner has restricted comments");
  await expect.poll(async () => alert.boundingBox()).toMatchObject({ width: 353, height: 110 });
  await expect.poll(async () => alert.getByRole("button").boundingBox()).toMatchObject({ width: 136, height: 44 });
  await expect(thread.getByLabel("Your comment")).toHaveValue("My list reply");
  await thread.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(thread.getByText("My list reply", { exact: true })).toBeVisible();
  await thread.getByRole("button", { name: "Edit comment", exact: true }).click();
  await thread.getByRole("textbox", { name: "Edit comment", exact: true }).fill("Edited reply");
  await thread.getByRole("button", { name: "Save", exact: true }).click();
  await expect(thread.getByText("Edited reply", { exact: true })).toBeVisible();
  await thread.getByRole("button", { name: "Delete comment", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete comment", exact: true }).click();
  await expect(thread.getByText("Edited reply", { exact: true })).toHaveCount(0);
  expect(state.writes.map(w => w.method)).toEqual(["POST", "POST", "PATCH", "DELETE"]);
});

test("guest can open comments on an empty public list", async ({ context, page }) => {
  await fixture(context, { authenticated: false, emptyComments: true });
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/lists/public/8");
  const comments = page.getByRole("region", { name: "Comments", exact: true });
  await comments.getByRole("button", { name: "Show comments" }).click();
  await expect(comments.getByText("No comments yet.")).toBeVisible();
  await expect(comments.getByText("Log in to leave a comment.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
});

test("public list comment restriction error matches the mobile Figma state (uk)", async ({ context, page }) => {
  await fixture(context);
  await page.setViewportSize({ width: 393, height: 852 });
  await login(page, "uk");
  await page.goto("/uk/lists/public/8");
  await page.getByRole("button", { name: "Показати коментарі" }).click();
  const thread = page.getByRole("region", { name: "Коментарі" });
  await expect(thread.getByText("Existing reply")).toBeVisible();
  await thread.getByLabel("Ваш коментар").fill("Тестовий коментар");
  await thread.getByRole("button", { name: "Надіслати", exact: true }).click();
  const alert = thread.getByRole("alert");
  await expect(alert).toContainText("Власник списку обмежив коментування");
  await expect.poll(async () => alert.boundingBox()).toMatchObject({ width: 353, height: 110 });
  await expect.poll(async () => alert.getByRole("button").boundingBox()).toMatchObject({ width: 136, height: 44 });
});

for (const lang of ["uk", "en"] as const) {
  test(`public list comment load failure matches the mobile Figma card (${lang})`, async ({ context, page }) => {
    const state = await fixture(context, { failCommentLoad: true });
    await page.setViewportSize({ width: 393, height: 852 });
    await login(page, lang);
    await page.goto(`/${lang}/lists/public/8`);
    const show = page.getByRole("button", { name: lang === "uk" ? "Показати коментарі" : "Show comments" });
    await expect.poll(async () => show.boundingBox()).toMatchObject({ x: 20, width: 353, height: 44 });
    await show.click();
    const thread = page.getByRole("region", { name: lang === "uk" ? "Коментарі" : "Comments" });
    const alert = thread.getByRole("alert");
    await expect(alert).toContainText(lang === "uk" ? "Не вдалося завантажити коментарі." : "Could not load comments.");
    await expect.poll(async () => alert.boundingBox()).toMatchObject({ width: 353, height: lang === "en" ? 66 : 110 });
    const errorBox = await alert.boundingBox();
    await expect.poll(async () => alert.getByRole("button").boundingBox()).toMatchObject({ x: errorBox!.x + (lang === "en" ? 197 : 11), y: errorBox!.y + (lang === "en" ? 10 : 53), width: lang === "en" ? 75 : 136, height: 44 });
    await alert.getByRole("button").click();
    await expect(thread.getByText("Existing reply")).toBeVisible();
  });

  test(`public list comment add failure matches the mobile Figma card (${lang})`, async ({ context, page }) => {
    await fixture(context, { commentFailure: 500 });
    await page.setViewportSize({ width: 393, height: 852 });
    await login(page, lang);
    await page.goto(`/${lang}/lists/public/8`);
    await page.getByRole("button", { name: lang === "uk" ? "Показати коментарі" : "Show comments" }).click();
    const thread = page.getByRole("region", { name: lang === "uk" ? "Коментарі" : "Comments" });
    await expect(thread.getByText("Existing reply")).toBeVisible();
    await thread.getByLabel(lang === "uk" ? "Ваш коментар" : "Your comment").fill("Sample comment");
    await thread.getByRole("button", { name: lang === "uk" ? "Надіслати" : "Send", exact: true }).click();
    const alert = thread.getByRole("alert");
    await expect(alert).toContainText(lang === "uk" ? "Не вдалося додати коментар." : "Could not add the comment.");
    await expect(thread.getByLabel(lang === "uk" ? "Ваш коментар" : "Your comment")).toHaveValue("Sample comment");
    await expect.poll(async () => alert.boundingBox()).toMatchObject({ width: 353, height: lang === "en" ? 66 : 110 });
    const errorBox = await alert.boundingBox();
    await expect.poll(async () => alert.getByRole("button").boundingBox()).toMatchObject({ x: errorBox!.x + (lang === "en" ? 213 : 11), y: errorBox!.y + (lang === "en" ? 10 : 53), width: lang === "en" ? 75 : 136, height: 44 });
  });

  test(`public list comment loading matches the mobile Figma state (${lang})`, async ({ context, page }) => {
    const state = await fixture(context, { holdCommentLoad: true });
    await page.setViewportSize({ width: 393, height: 852 });
    await login(page, lang);
    await page.goto(`/${lang}/lists/public/8`);
    await page.getByRole("button", { name: lang === "uk" ? "Показати коментарі" : "Show comments" }).click();
    const thread = page.getByRole("region", { name: lang === "uk" ? "Коментарі" : "Comments" });
    const status = thread.getByRole("status");
    await expect(status).toContainText(lang === "uk" ? "Завантаження..." : "Loading...");
    await expect.poll(async () => status.boundingBox()).toMatchObject({ width: 353, height: 44 });
    state.releaseCommentLoad();
    await expect(thread.getByText("Existing reply")).toBeVisible();
  });
}

for (const lang of ["uk", "en"] as const) {
  test(`list reply override saves, reloads, resets and preserves failed drafts in ${lang}`, async ({ context, page }) => {
    const state = await fixture(context);
    await page.setViewportSize({ width: lang === "uk" ? 393 : 1440, height: 852 });
    await login(page, lang);
    await page.goto(`/${lang}/lists?list=8&mode=edit`);
    const label = lang === "uk" ? "Хто може відповідати" : "Allow replies from";
    const openDesktopReplySetting = async () => {
      if (lang !== "en") return;
      const control = page.getByRole("combobox", { name: label, exact: true });
      if (!(await control.isVisible().catch(() => false))) {
        await page.getByText("More profile settings", { exact: true }).click();
      }
      await expect(control).toBeVisible();
    };
    const choose = async (value: string) => {
      if (lang === "en") { await openDesktopReplySetting(); await page.getByRole("combobox", { name: label, exact: true }).selectOption(value); return; }
      await page.getByRole("button", { name: label, exact: true }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("radio", { name: value === "ANYONE" ? "Усі" : "З налаштувань профілю", exact: true }).check();
      await dialog.getByRole("button", { name: "Налаштування", exact: true }).click();
    };
    await choose("ANYONE");
    const save = page.getByRole("button", { name: lang === "uk" ? "Зберегти" : "Save", exact: true });
    await save.click();
    await expect(page.getByRole("alert")).toContainText(lang === "uk" ? "Не вдалося оновити список" : "Could not update the list");
    await save.click();
    await expect(page.getByRole("status")).toContainText(lang === "uk" ? "Збережено" : "Saved");
    await page.reload();
    if (lang === "en") { await openDesktopReplySetting(); await expect(page.getByRole("combobox", { name: label, exact: true })).toHaveValue("ANYONE"); }
    else await expect(page.getByRole("button", { name: label, exact: true })).toContainText("Усі");
    await choose(""); await save.click();
    await expect.poll(() => state.writes.length).toBe(3);
    expect(state.writes.map(w => w.body.replyPreference)).toEqual(["ANYONE", "ANYONE", null]);
    if (lang === "uk") {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: test.info().outputPath("list-reply-settings.png"), fullPage: true });
    }
  });
}

test("switching accounts clears list comment drafts and ignores a delayed previous-viewer response", async ({ context, page }) => {
  const state = await fixture(context, { holdCommentWrite: true });
  try {
    await login(page); await page.goto("/en/lists/public/8");
    const thread = page.getByRole("region", { name: "Comments", exact: true });
    await thread.getByRole("button", { name: "Show comments" }).click();
    await thread.getByLabel("Your comment").fill("Previous viewer draft");
    await thread.getByRole("button", { name: "Send", exact: true }).click();
    await expect.poll(() => state.writes.length).toBe(1);
    const other = await context.newPage();
    await other.goto("/en/email-action/#rewind_action=signup&type=email&token_hash=fixture-next-account");
    await other.getByRole("button", { name: "Confirm email", exact: true }).click();
    await expect(other).toHaveURL(/\/en\/films\/?$/);
    await expect(thread.getByRole("button", { name: "Show comments" })).toBeVisible();
    await thread.getByRole("button", { name: "Show comments" }).click();
    await expect(thread.getByLabel("Your comment")).toHaveValue("");
    await thread.getByLabel("Your comment").fill("Current viewer draft");
    const delayed = page.waitForResponse(r => r.request().method() === "POST" && r.url().includes("/lists/public/8/comments"));
    state.release(); await (await delayed).finished();
    await page.waitForLoadState("networkidle");
    await expect(thread.getByLabel("Your comment")).toHaveValue("Current viewer draft");
    await expect(thread.getByRole("alert")).toHaveCount(0);
  } finally { state.release(); }
});
