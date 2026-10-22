import { expect, test, type Page } from "@playwright/test";

const query = "Complete search";
const movies = Array.from({ length: 6 }, (_, index) => ({
  id: 982001 + index,
  title: `Film ${index + 1}: ${"A complete title without clipping its accessible name ".repeat(3)}`.trim(),
  releaseDate: "2024-01-01", rating: 4, photoUrl: `https://search-fixture.invalid/poster-${index}.svg`,
}));

async function searchFixture(page: Page) {
  const searches: string[] = [], mutations: string[] = [];
  await page.route("https://search-fixture.invalid/**", route => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="149"><rect width="100" height="149" fill="#3b4950"/></svg>' }));
  await page.route(url => url.pathname.startsWith("/api/"), route => {
    const request = route.request(), pathname = new URL(request.url()).pathname;
    if (request.method() !== "GET") { mutations.push(`${request.method()} ${pathname}`); return route.abort(); }
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: 982000, username: "search-reader", role: "USER" } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/search/global") {
      searches.push(new URL(request.url()).searchParams.get("q") ?? "");
      return route.fulfill({ json: {
        films: { content: movies, number: 0, size: 6, totalElements: 21, totalPages: 4 },
        users: { content: [{ id: 982010, username: "reader", displayName: "Search Reader", avatarUrl: null }], totalElements: 1 },
        people: [{ id: 982011, name: "Film Director", type: "DIRECTOR", photoUrl: null }],
        reviews: { content: [{ id: 982012, movieId: movies[0].id, movieTitle: movies[0].title, userId: 982010, username: "reader", content: "The complete review remains available through its own link.", rating: 4, createdAt: "2026-10-20T12:00:00Z", moviePhotoUrl: movies[0].photoUrl, userAvatarUrl: null }], totalElements: 1 },
        tags: Array.from({ length: 9 }, (_, index) => ({ id: 982013 + index, name: `Cinema ${index + 1}`, slug: `cinema-${index + 1}` })),
        lists: { content: [{ id: 982014, name: "A complete collection title", ownerUsername: "reader", itemCount: 6, description: "A collection description", previewMovies: movies }], totalElements: 1 },
        journal: { content: [{ id: 982015, slug: "search-story", title: "A complete journal title", category: "News", excerpt: "A journal excerpt", coverUrl: null, publishedAt: "2026-10-20T12:00:00Z" }], totalElements: 1 },
      } });
    }
    return route.fulfill({ status: 404, json: {} });
  });
  return { searches, mutations };
}

for (const locale of ["uk", "en"] as const) {
  test(`global search matches the phone shortcut, list and tag variants in ${locale}`, async ({ page }) => {
    await searchFixture(page);
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(`/${locale}/search`);

    const main = page.getByRole("main");
    const shortcuts = main.getByRole("navigation", { name: locale === "uk" ? "Швидкі переходи пошуку" : "Search shortcuts" });
    const expected = locale === "uk"
      ? ["Фільми", "Вибрані добірки", "Популярні фільми", "Списки", "Учасники", "Популярні рецензенти"]
      : ["Films", "Featured lists", "Popular films", "Lists", "Members", "Popular reviewers"];
    await expect(shortcuts.getByRole("link")).toHaveCount(6);
    for (const label of expected) await expect(shortcuts.getByRole("link", { name: label, exact: true })).toBeVisible();
    await expect(shortcuts.getByRole("link", { name: expected[1], exact: true })).toHaveAttribute("href", `/${locale}/lists/discover?feed=team`);
    await expect(shortcuts.getByRole("link", { name: expected[2], exact: true })).toHaveAttribute("href", `/${locale}/films?sort=rating_desc`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

    await page.goto(`/${locale}/search?q=${encodeURIComponent(query)}&tab=lists`);
    const listCard = main.locator("#lists > div > a").first();
    await expect(listCard).toBeVisible();
    const listBox = await listCard.boundingBox();
    expect(listBox?.width).toBeCloseTo(361, 0);
    const posterBoxes = await listCard.locator("img").evaluateAll(images => images.map(image => image.getBoundingClientRect()).map(box => ({ left: box.left, right: box.right, width: box.width })));
    expect(posterBoxes).toHaveLength(5);
    expect(posterBoxes.every(box => box.width >= 78 && box.width <= 80)).toBe(true);
    expect(posterBoxes.at(-1)!.right).toBeLessThanOrEqual(listBox!.x + listBox!.width - 17);

    await page.getByRole("combobox", { name: locale === "uk" ? "Показати результати" : "Show results for" }).selectOption("tags");
    const tags = main.locator("#tags a");
    await expect(tags).toHaveCount(9);
    const tagRows = await tags.evaluateAll(items => new Set(items.map(item => Math.round(item.getBoundingClientRect().top))).size);
    expect(tagRows).toBeGreaterThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}

for (const locale of ["uk", "en"] as const) {
  test(`global search native categories preserve keyboard, full titles and URL history in ${locale}`, async ({ page }) => {
    const api = await searchFixture(page);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(`/${locale}/search?q=${encodeURIComponent(query)}`);
    const main = page.getByRole("main");
    const selector = main.getByRole("combobox", { name: locale === "uk" ? "Показати результати" : "Show results for", exact: true });
    const input = page.locator("#global-search-query");
    await expect(main).toHaveAttribute("aria-busy", "false");
    await expect(selector).toBeVisible();
    await expect(selector.locator('option[value="films"]')).toHaveText(`${locale === "uk" ? "Фільми" : "Films"} (21)`);
    await expect(selector.locator("option")).toHaveCount(8);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

    const posters = main.locator("#films article > a");
    await expect(posters.first()).toHaveAccessibleName(`${movies[0].title} ${locale === "uk" ? "Постер" : "Poster"}`);
    await expect(posters.first()).toHaveAccessibleDescription("2024 · ★ 4");
    await posters.first().focus();
    for (let index = 1; index < movies.length; index++) await page.keyboard.press("Tab");
    await expect(posters.last()).toBeFocused();
    await expect(posters.last()).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.keyboard.press("Tab");
    await expect(main.locator("#reviews a").first()).toBeFocused();

    await selector.focus();
    await selector.press("ArrowDown");
    await expect(selector).toHaveValue("films");
    await expect(page).toHaveURL(/tab=films/);
    await expect(page.getByRole("tabpanel", { name: locale === "uk" ? "Фільми" : "Films", exact: true })).toBeVisible();
    await selector.press("End");
    await expect(selector).toHaveValue("journal");
    await expect(main.getByRole("heading", { name: "A complete journal title", exact: true })).toBeVisible();

    await page.goBack();
    await expect(selector).toHaveValue("films");
    await page.goBack();
    await expect(selector).toHaveValue("all");
    await expect(input).toHaveValue(query);
    expect(api.searches).toEqual([query]);

    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: "REWIND", exact: true })).toBeHidden();
    const bottomLinks = header.locator("nav:visible a");
    await expect(bottomLinks).toHaveCount(5);
    for (const link of await bottomLinks.all()) {
      await expect(link).toBeVisible();
      expect(await link.evaluate(element => {
        const box = element.getBoundingClientRect();
        return document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)?.closest("a") === element;
      }), "every bottom navigation link remains clickable through the contextual header").toBe(true);
    }
    const back = main.getByRole("link", { name: locale === "uk" ? "Головна" : "Home", exact: true });
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    const backBox = await back.boundingBox();
    expect(backBox?.width).toBeGreaterThanOrEqual(44);
    expect(backBox?.height).toBeGreaterThanOrEqual(44);
    // This corner lies under the fixed header; it must reach the local back link.
    await back.click({ position: { x: 5, y: 5 } });
    await expect(page).toHaveURL(new RegExp(`/${locale}/home$`));
    // The Figma Home phone frame uses the contextual bottom navigation only;
    // the upper logo/menu remain hidden on Home just like on Search.
    await expect(header.getByRole("link", { name: "REWIND", exact: true })).toBeHidden();
    await expect(header.getByRole("button", { name: locale === "uk" ? "Меню" : "Menu", exact: true })).toBeHidden();
    await expect(header.locator("nav:visible a")).toHaveCount(5);
    await page.goBack();
    await expect(input).toHaveValue(query);
    await expect(selector).toHaveValue("all");
    await expect(main).toHaveAttribute("aria-busy", "false");

    await page.setViewportSize({ width: 768, height: 900 });
    await expect(selector).toBeHidden();
    const allTab = page.getByRole("tab", { name: locale === "uk" ? "Усі" : "All", exact: true });
    await allTab.focus();
    await allTab.press("ArrowRight");
    await expect(page.getByRole("tab", { name: locale === "uk" ? "Фільми" : "Films", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("tabpanel")).toBeFocused();
    expect(api.mutations).toEqual([]);
    expect(errors).toEqual([]);
  });
}
