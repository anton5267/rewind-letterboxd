import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const covers = [1, 2, 3].map(number => `https://images.example.invalid/journal-${number}.png`);
const contentBlocks = [
  { type: "heading", text: "Illustrated story", level: 2 },
  { type: "image", url: covers[0], alt: "A film illustration", caption: "Image caption", layout: "aside" },
  { type: "paragraph", text: "<script>window.injected = true</script>\n" + "Readable editorial content. ".repeat(35) },
  { type: "list", items: ["First item", "Second item"] },
  { type: "image", url: "https://images.example.invalid/missing.png", alt: "Missing illustration", caption: null, layout: "full" },
];
const article = { id: 17, slug: "media-story", language: "en", category: "Community", title: "Media story", excerpt: "An illustrated article",
  content: "Searchable article text", coverUrl: covers[0], coverImages: covers, contentBlocks,
  audioUrl: null, authorName: "Fixture editor", publishedAt: "2026-11-14T00:00:00Z" };
const empty = { content: [], totalElements: 0, totalPages: 0, number: 0 };

async function images(context: BrowserContext) {
  await context.route("https://images.example.invalid/**", route => {
    if (route.request().url().endsWith("missing.png")) return route.fulfill({ status: 404, body: "Missing" });
    return route.fulfill({ contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aAZkAAAAASUVORK5CYII=", "base64") });
  });
}

for (const lang of ["uk", "en"] as const) {
  test(`illustrated Journal preserves collage geometry, safe content and legacy rendering in ${lang}`, async ({ context, page }) => {
    await images(context);
    await context.route(url => url.pathname.startsWith("/api/"), route => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/api/journal/articles/media-story") return route.fulfill({ json: article });
      if (path === "/api/journal/articles/legacy-story") return route.fulfill({ json: { ...article, slug: "legacy-story", coverImages: null, contentBlocks: null, content: "Legacy first paragraph.\n\nLegacy second paragraph." } });
      if (path.endsWith("/archive")) return route.fulfill({ json: [] });
      if (path === "/api/journal/articles") return route.fulfill({ json: { ...empty, content: [article], totalElements: 1, totalPages: 1 } });
      return route.fulfill({ json: empty });
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/${lang}/journal/media-story`);
    const hero = page.locator('[class*="coverHero"]');
    await expect(hero.locator('[data-journal-cover="3"]')).toBeVisible();
    await expect(hero.locator("img")).toHaveCount(3);
    const geometry = await hero.boundingBox();
    expect(geometry?.x).toBeCloseTo(120, 0);
    expect(geometry?.width).toBe(1126);
    expect(geometry?.height).toBe(642);
    for (const image of await hero.locator("img").all()) expect((await image.boundingBox())?.width).toBeCloseTo(1126 / 3, 0);
    await expect(page.getByRole("heading", { name: "Illustrated story", level: 2 })).toBeVisible();
    await expect(page.getByText("<script>window.injected = true</script>", { exact: false })).toBeVisible();
    expect(await page.evaluate(() => (window as Window & { injected?: boolean }).injected)).toBeUndefined();
    const aside = page.getByRole("img", { name: "A film illustration", exact: true });
    await expect(aside).toBeVisible();
    expect((await aside.boundingBox())?.width).toBe(174);
    expect((await aside.boundingBox())?.height).toBe(140);
    await expect(page.getByRole("listitem").filter({ hasText: "Second item" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Missing illustration", exact: true })).toContainText(lang === "uk" ? "Зображення недоступне" : "Image unavailable");
    await page.setViewportSize({ width: 393, height: 852 });
    await expect(aside).toHaveCSS("width", "260px");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
    await page.goto(`/${lang}/journal/legacy-story`);
    await expect(page.locator('[data-journal-cover]')).toHaveCount(0);
    await expect(page.locator('[class*="body"]').filter({ hasText: "Legacy first paragraph." })).toHaveText("Legacy first paragraph.\n\nLegacy second paragraph.");
    await page.goto(`/${lang}/journal`);
    await expect(page.locator('article [data-journal-cover="3"]')).toBeVisible();
  });
}

async function admin(context: BrowserContext, page: Page, lang: "uk" | "en") {
  const writes: Record<string, unknown>[] = [];
  let stored: typeof article | null = null;
  let fail = true;
  await context.route("**/auth/v1/**", route => route.fulfill({ status: 404, json: {} }));
  await context.route("**/auth/v1/token**", route => route.fulfill({ json: {
    access_token: "fixture-access", refresh_token: "fixture-refresh", token_type: "bearer", expires_in: 3600,
    user: { id: "b1f5872a-148b-4878-8581-06b809b29927", email: "fixture@example.invalid", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-11-14T00:00:00Z" },
  } }));
  await context.route(url => url.pathname.startsWith("/api/"), route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === "/api/users/me") return route.fulfill({ json: { id: 7, username: "editor", role: "ADMIN" } });
    if (path.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (path.startsWith("/api/admin/journal/articles")) {
      if (request.method() === "GET") return route.fulfill({ json: { ...empty, content: stored ? [stored] : [], totalElements: stored ? 1 : 0, totalPages: stored ? 1 : 0 } });
      const body = request.postDataJSON();
      writes.push(body);
      if (fail) { fail = false; return route.fulfill({ status: 503, json: {} }); }
      stored = { ...body, id: 17, publishedAt: body.published ? "2026-11-14T00:00:00Z" : null };
      return route.fulfill({ json: stored });
    }
    return route.fulfill({ json: empty });
  });
  await page.goto(`/${lang}/login`);
  await page.getByLabel(lang === "uk" ? "Електронна пошта" : "Email", { exact: true }).fill("fixture@example.invalid");
  await page.getByLabel(lang === "uk" ? "Пароль" : "Password", { exact: true }).fill("fixture-password-only");
  await page.getByRole("button", { name: lang === "uk" ? "Увійти" : "Log in", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${lang}/films/?$`));
  await page.goto(`/${lang}/admin?view=articles`);
  return writes;
}

for (const lang of ["uk", "en"] as const) {
  test(`Journal Admin creates, retries, reorders and clears illustrated content in ${lang}`, async ({ context, page }) => {
    await page.setViewportSize({ width: lang === "uk" ? 393 : 1440, height: 1000 });
    const writes = await admin(context, page, lang);
    const form = page.locator("form").filter({ has: page.getByLabel(lang === "uk" ? "Slug статті" : "Article slug", { exact: true }) });
    await form.getByLabel(lang === "uk" ? "Slug статті" : "Article slug", { exact: true }).fill("media-story");
    await form.getByLabel(lang === "uk" ? "Заголовок" : "Title", { exact: true }).fill("Media story");
    await form.getByLabel(lang === "uk" ? "Категорія" : "Category", { exact: true }).selectOption({ index: 1 });
    await form.getByLabel(lang === "uk" ? "Текст статті" : "Article content", { exact: true }).fill("First paragraph");
    await form.getByRole("button", { name: lang === "uk" ? "Додати форматування та зображення" : "Add formatting and images", exact: true }).click();
    const type = form.getByRole("combobox", { name: lang === "uk" ? "Тип блоку" : "Block type", exact: true });
    const add = form.getByRole("button", { name: lang === "uk" ? "Додати блок" : "Add block", exact: true });
    await type.selectOption("heading"); await add.click();
    await form.getByLabel(lang === "uk" ? "Підзаголовок" : "Heading", { exact: true }).fill("Heading");
    await type.selectOption("image"); await add.click();
    await form.getByLabel(lang === "uk" ? "URL зображення" : "Image URL", { exact: true }).fill(covers[0]);
    await form.getByLabel(lang === "uk" ? "Опис зображення для читача екрана" : "Image description for screen readers", { exact: true }).fill("Artwork");
    await form.getByRole("combobox", { name: lang === "uk" ? "Розташування зображення" : "Image layout", exact: true }).selectOption("aside");
    await type.selectOption("paragraph"); await add.click();
    const extraBlock = form.getByRole("group", { name: lang === "uk" ? "4. Абзац" : "4. Paragraph", exact: true });
    await extraBlock.getByRole("button", { name: lang === "uk" ? "Прибрати блок" : "Remove block", exact: true }).press("Enter");
    await expect(form.getByLabel(lang === "uk" ? "URL зображення" : "Image URL", { exact: true })).toBeFocused();
    const cover = form.getByRole("group", { name: lang === "uk" ? "Обкладинка статті" : "Article cover", exact: true });
    await cover.locator('input[type="url"]').first().fill(covers[0]);
    await cover.getByRole("button", { name: lang === "uk" ? "Додати зображення обкладинки" : "Add cover image", exact: true }).click();
    await cover.locator('input[type="url"]').nth(1).fill(covers[1]);
    const addCover = cover.getByRole("button", { name: lang === "uk" ? "Додати зображення обкладинки" : "Add cover image", exact: true });
    const removeCover = cover.getByRole("button", { name: lang === "uk" ? "Прибрати зображення обкладинки" : "Remove cover image", exact: true });
    await addCover.click();
    await cover.locator('input[type="url"]').nth(2).fill(covers[2]);
    await removeCover.last().press("Enter");
    await expect(cover.locator('input[type="url"]').nth(1)).toBeFocused();
    await removeCover.last().press("Enter");
    await expect(cover.locator('input[type="url"]').first()).toBeFocused();
    await addCover.click();
    await cover.locator('input[type="url"]').nth(1).fill(covers[1]);
    const create = form.getByRole("button", { name: lang === "uk" ? "Створити" : "Create", exact: true });
    await create.click(); await expect(page.getByRole("alert")).toBeVisible();
    await expect(form.getByLabel(lang === "uk" ? "Абзац" : "Paragraph", { exact: true })).toHaveValue("First paragraph");
    await create.click(); await expect.poll(() => writes.length).toBe(2);
    expect(writes[1].coverImages).toEqual(covers.slice(0, 2));
    expect(writes[1].content).toBe("First paragraph\n\nHeading");
    expect(writes[1].contentBlocks).toEqual([
      { type: "paragraph", text: "First paragraph" }, { type: "heading", text: "Heading", level: 2 },
      { type: "image", url: covers[0], alt: "Artwork", caption: null, layout: "aside" },
    ]);
    await page.getByRole("button", { name: new RegExp(`${lang === "uk" ? "Редагувати статтю" : "Edit article"}.*Media story`) }).click();
    const heading = form.getByLabel(lang === "uk" ? "Підзаголовок" : "Heading", { exact: true });
    const headingBlock = heading.locator("..").locator("..");
    const moveUp = headingBlock.getByRole("button", { name: lang === "uk" ? "Перемістити вище" : "Move up", exact: true });
    const moveDown = headingBlock.getByRole("button", { name: lang === "uk" ? "Перемістити нижче" : "Move down", exact: true });
    await moveUp.press("Enter");
    await expect(moveDown).toBeFocused();
    await moveDown.press("Enter");
    await expect(moveDown).toBeFocused();
    await moveDown.press("Enter");
    await expect(moveUp).toBeFocused();
    await moveUp.press("Enter");
    await moveUp.press("Enter");
    await expect(moveDown).toBeFocused();
    await heading.fill("Reordered heading"); await expect(heading).toBeFocused();
    const convert = form.getByRole("button", { name: lang === "uk" ? "Перетворити на звичайний текст" : "Convert to plain text", exact: true });
    await convert.click(); await page.getByRole("alertdialog").getByRole("button", { name: lang === "uk" ? "Скасувати" : "Cancel", exact: true }).click();
    await expect(heading).toHaveValue("Reordered heading");
    await convert.click(); await page.getByRole("alertdialog").getByRole("button", { name: lang === "uk" ? "Перетворити на звичайний текст" : "Convert to plain text", exact: true }).click();
    await expect(form.getByLabel(lang === "uk" ? "Текст статті" : "Article content", { exact: true })).toHaveValue("Reordered heading\n\nFirst paragraph");
    await form.getByRole("button", { name: lang === "uk" ? "Зберегти" : "Save", exact: true }).click();
    await expect.poll(() => writes.length).toBe(3);
    expect(writes[2].contentBlocks).toBeNull();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });
}
