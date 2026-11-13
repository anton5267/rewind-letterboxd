import { expect, test } from "@playwright/test";

const searchTitles = ["Whiplash", "The Whale", "Whisper of the Heart", "White Noise", "White Chicks", "White House Down", "What Dreams May Come", "What's Eating Gilbert Grape", "What We Do in the Shadows"];

for (const lang of ["uk", "en"] as const) {
  test(`mobile list settings and entries preserve drafts and use the owner API in ${lang}`, async ({ page }, testInfo) => {
    const copy = lang === "uk"
      ? { settings: "Налаштування списку", name: "Назва списку", description: "Опис", tags: "Теги", public: "Публічний список", save: "Зберегти", saved: "Збережено.", cancel: "Скасувати", add: "Додати фільм", retry: "Спробувати ще", previous: "Назад", next: "Далі", entries: /^Редагувати фільми/, addError: "Не вдалося додати фільм до списку." }
      : { settings: "List Settings", name: "List name", description: "Description", tags: "Tags", public: "Public list", save: "Save", saved: "Saved.", cancel: "Cancel", add: "Add a film", retry: "Retry", previous: "Previous", next: "Next", entries: /^Edit entries/, addError: "Could not add the film to the list." };
    const owner = { id: 98001, username: "list-mobile-owner", role: "USER" };
    let list = { id: 98021, name: "My Top", description: "A personal collection of favourite films.", listType: "CUSTOM", isPublic: true, tags: ["mytop", "favorites", "rewatch"] };
    const film = (id: number, title: string) => ({ id, title, releaseDate: "2014-01-01", rating: 7.9, photoUrl: null });
    let items = Array.from({ length: 10 }, (_, index) => ({ id: 98101 + index, position: index, movie: film(98011 + index, `Fixture film ${index + 1}`) }));
    const candidates = searchTitles.map((title, index) => film(99001 + index, title));
    const updates: Record<string, unknown>[] = [];
    const additions: number[] = [];
    let failSearch = true;
    let failAdd = true;
    let failItems = false;

    await page.route(url => url.pathname.startsWith("/api/"), async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.pathname === "/api/users/me") return route.fulfill({ json: owner });
      if (url.pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "list-mobile-fixture" } });
      if (url.pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
      if (url.pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
      if (url.pathname === "/api/lists/my") return route.fulfill({ json: [list] });
      if (url.pathname === "/api/lists/my/page") return route.fulfill({ json: { content: [list], number: 0, size: 12, totalPages: 1, totalElements: 1 } });
      if (url.pathname === "/api/lists/98021/items") {
        if (failItems) { failItems = false; return route.fulfill({ status: 503, json: {} }); }
        return route.fulfill({ json: items });
      }
      if (url.pathname === "/api/lists/98021" && request.method() === "PATCH") {
        const body = request.postDataJSON();
        updates.push(body);
        list = { ...list, ...body };
        return route.fulfill({ json: list });
      }
      if (url.pathname === "/api/movies/search") {
        if (failSearch) { failSearch = false; return route.fulfill({ status: 503, json: {} }); }
        const currentPage = Number(url.searchParams.get("page") ?? 0);
        return route.fulfill({ json: { content: candidates.slice(currentPage * 8, currentPage * 8 + 8), number: currentPage, size: 8, totalPages: 2, totalElements: 9 } });
      }
      if (url.pathname === "/api/lists/98021/movies" && request.method() === "POST") {
        const movieId = Number(request.postDataJSON().movieId);
        additions.push(movieId);
        if (failAdd) { failAdd = false; return route.fulfill({ status: 503, json: {} }); }
        items = [...items, { id: 98201, position: items.length, movie: candidates.find(movie => movie.id === movieId)! }];
        failItems = true;
        return route.fulfill({ status: 200, body: "" });
      }
      return route.fulfill({ json: [] });
    });

    await page.setViewportSize({ width: 393, height: 852 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`/${lang}/lists?list=98021&mode=edit`);
    const settings = page.getByRole("form", { name: copy.settings, exact: true });
    const name = settings.getByRole("textbox", { name: copy.name, exact: true });
    const entries = settings.getByRole("button", { name: copy.entries });
    await expect(entries).toContainText("10");
    await expect(settings.getByRole("listitem")).toHaveCount(8);
    for (const image of await settings.locator("img").all()) {
      await expect(image).toHaveJSProperty("complete", true);
      expect(await image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    await settings.getByText(copy.tags, { exact: true }).click();
    await settings.screenshot({ path: testInfo.outputPath(`list-settings-${lang}.png`), animations: "disabled" });
    await name.fill("  Updated list  ");
    await settings.getByRole("textbox", { name: copy.description, exact: true }).fill("Updated description");
    await settings.getByText(copy.public, { exact: true }).click();
    await expect(settings.getByRole("checkbox", { name: copy.public, exact: true })).not.toBeChecked();
    await settings.getByRole("button", { name: copy.tags, exact: true }).click();
    await settings.getByRole("textbox", { name: copy.tags, exact: true }).fill("newtag, favorites");
    await entries.click();

    const finder = page.getByRole("search", { name: copy.add, exact: true });
    const query = finder.getByRole("searchbox", { name: copy.add, exact: true });
    const entriesTitle = await page.getByRole("heading", { name: lang === "uk" ? "Редагувати список" : "Edit List", exact: true }).boundingBox();
    expect(entriesTitle?.x).toBe(56);
    await expect(page.locator("[data-list-item-id]")).toHaveCount(10);
    for (const image of await page.locator("[data-list-item-id] img, header button img").all()) {
      await expect(image).toHaveJSProperty("complete", true);
      expect(await image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    await page.screenshot({ path: testInfo.outputPath(`list-entries-${lang}.png`), animations: "disabled" });
    expect(updates).toHaveLength(0);
    await query.fill("wh");
    await finder.getByRole("button", { name: copy.retry, exact: true }).click();
    await expect(query).toBeFocused();
    const addWhiplash = finder.getByRole("button", { name: `${copy.add} Whiplash`, exact: true });
    await expect(addWhiplash).toBeVisible();
    await finder.getByRole("button", { name: copy.next, exact: true }).click();
    await expect(finder.getByRole("button", { name: `${copy.add} What We Do in the Shadows`, exact: true })).toBeVisible();
    await finder.getByRole("button", { name: copy.previous, exact: true }).click();
    await addWhiplash.click();
    await expect(page.getByRole("alert").filter({ hasText: copy.addError })).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: copy.addError })).toBeFocused();
    await addWhiplash.click();
    await page.getByRole("button", { name: copy.retry, exact: true }).waitFor();
    await expect(addWhiplash).toBeDisabled();
    await page.getByRole("button", { name: copy.retry, exact: true }).click();
    await expect(page.locator('[data-list-item-id="98201"]')).toBeVisible();
    await expect(addWhiplash).toBeDisabled();
    expect(additions).toEqual([99001, 99001]);
    await query.fill("");
    await expect(addWhiplash).toHaveCount(0);
    await page.getByRole("button", { name: copy.settings, exact: true }).click();
    await expect(entries).toBeFocused();
    await expect(entries).toContainText("11");
    await expect(name).toHaveValue("  Updated list  ");
    await expect(settings.getByText("newtag", { exact: true })).toBeVisible();
    await settings.getByRole("button", { name: copy.save, exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: copy.saved })).toBeVisible();
    expect(updates).toEqual([{ name: "Updated list", description: "Updated description", isPublic: false, tags: ["newtag", "favorites"] }]);
    await page.reload();
    await expect(name).toHaveValue("Updated list");
    await name.fill("Discard this name");
    await settings.getByRole("button", { name: copy.cancel, exact: true }).click();
    await expect(page).toHaveURL(/mode=view/);
    expect(updates).toHaveLength(1);
    await page.getByRole("link", { name: copy.settings, exact: true }).click();
    await expect(name).toHaveValue("Updated list");
    await settings.getByRole("button", { name: copy.tags, exact: true }).click();
    await expect(settings.getByRole("textbox", { name: copy.tags, exact: true })).toBeFocused();
    await page.setViewportSize({ width: 768, height: 900 });
    await expect(page.locator("#edit-list-tags")).toBeFocused();
    await page.setViewportSize({ width: 767, height: 900 });
    await expect(settings.getByRole("textbox", { name: copy.tags, exact: true })).toBeFocused();
    await name.focus();
    await page.setViewportSize({ width: 768, height: 900 });
    await expect(page.locator("#edit-list-name")).toBeVisible();
    await expect(page.locator("#edit-list-name")).toBeFocused();
    await expect(page.locator("#edit-list-name")).toHaveValue("Updated list");
    await page.setViewportSize({ width: 767, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(name).toBeVisible();
    await expect(settings).toHaveCSS("animation-name", "none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });
}
