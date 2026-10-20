import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({ trace: "off", video: "off" });

const listId = 943001;
const listTitle = "Header navigation collection";
const emptyPage = { content: [], number: 0, totalPages: 0, totalElements: 0 };

async function listHeaderFixture(page: Page, details: { tags?: string[]; likeCount?: number } = {}) {
  const mutations: string[] = [], unexpectedGets: string[] = [];
  await page.route(url => url.pathname.startsWith("/api/"), route => {
    const request = route.request(), endpoint = new URL(request.url()).pathname;
    if (request.method() !== "GET") {
      mutations.push(`${request.method()} ${endpoint}`);
      return route.abort();
    }
    if (endpoint === "/api/users/me") return route.fulfill({ json: { id: 943000, username: "header-reader", role: "USER" } });
    if (endpoint.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (endpoint === `/api/lists/public/${listId}`) return route.fulfill({ json: {
      id: listId, name: listTitle, description: null, ownerId: 943002,
      ownerUsername: "collection-reader", ownerAvatarUrl: null, tags: [], likeCount: 0, movies: [], ...details,
    } });
    if (endpoint === `/api/lists/public/${listId}/like-status`) return route.fulfill({ json: { liked: false, likes: 0 } });
    if (/^\/api\/lists\/public(?:\/(?:popular|recently-liked|team))?$/.test(endpoint)
      || ["/api/movies/search", "/api/reviews/popular", "/api/activity/recent-watched", "/api/journal/articles"].includes(endpoint)) return route.fulfill({ json: emptyPage });
    if (["/api/tags/popular", "/api/users/popular-reviewers"].includes(endpoint)) return route.fulfill({ json: [] });
    unexpectedGets.push(endpoint);
    return route.fulfill({ status: 404, json: {} });
  });
  return { mutations, unexpectedGets };
}

for (const locale of ["uk", "en"] as const) {
  test(`public list information dialog preserves keyboard, retry and route behavior in ${locale}`, async ({ page }) => {
    const api = await listHeaderFixture(page, { tags: ["Science Fiction", "rewatch"], likeCount: 7 });
    const pageErrors: string[] = [], consoleErrors: string[] = [], controlledMutations: string[] = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
    let statusRequests = 0;
    let releaseStatus!: () => void, releaseLike!: () => void;
    const statusGate = new Promise<void>(resolve => { releaseStatus = resolve; });
    const likeGate = new Promise<void>(resolve => { releaseLike = resolve; });
    await page.route(`**/api/lists/public/${listId}/like-status`, async route => {
      if (route.request().method() !== "GET") return route.fallback();
      statusRequests += 1;
      if (statusRequests === 1) return route.fulfill({ status: 503, json: {} });
      await statusGate;
      return route.fulfill({ json: { liked: false, likes: 7 } });
    });
    await page.route("**/api/auth/csrf", route => route.request().method() === "GET"
      ? route.fulfill({ json: { token: "browser-fixture-only" } }) : route.fallback());
    await page.route(`**/api/lists/${listId}/likes`, async route => {
      if (route.request().method() !== "POST") return route.fallback();
      controlledMutations.push(`POST /api/lists/${listId}/likes`);
      if (controlledMutations.length === 1) {
        await likeGate;
        return route.fulfill({ status: 503, json: {} });
      }
      return route.fulfill({ status: 204 });
    });
    try {
      await page.setViewportSize({ width: 393, height: 900 });
      await page.goto(`/${locale}/lists/public/${listId}`);
      const main = page.getByRole("main");
      const heading = main.getByRole("heading", { name: listTitle, level: 1, exact: true });
      await expect(heading).toBeVisible();
      await expect(main).toHaveAttribute("aria-busy", "false");
      const trigger = main.getByRole("button", { name: locale === "uk" ? "Інформація про список" : "List information", exact: true });
      const dialog = page.getByRole("dialog", { name: listTitle, exact: true });
      const done = dialog.getByRole("button", { name: locale === "uk" ? "Готово" : "Done", exact: true });
      const retryName = locale === "uk" ? "Спробувати ще" : "Retry";
      const originalOverflow = await page.evaluate(() => document.body.style.overflow);
      const expectUnlocked = async () => {
        await expect(dialog).toBeHidden();
        await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe(originalOverflow);
      };
      const open = async () => {
        // The 44px square corner remains clickable through the transparent mobile Header.
        await trigger.click({ position: { x: 5, y: 5 } });
        await expect(dialog).toHaveAttribute("aria-modal", "true");
        await expect(done).toBeFocused();
        await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");
      };
      await open();
      const owner = dialog.getByRole("link", { name: "collection-reader", exact: true });
      await expect(owner).toHaveAttribute("href", `/${locale}/users/943002`);
      await expect(dialog.getByRole("link", { name: "#Science Fiction", exact: true })).toHaveAttribute("href", `/${locale}/lists/discover?feed=recent&tag=science-fiction`);
      await expect(dialog.getByText(/^7 /)).toBeVisible();
      await page.keyboard.press("Tab");
      await expect(owner).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(done).toBeFocused();
      await page.keyboard.press("Escape");
      await expectUnlocked();
      await expect(trigger).toBeFocused();
      await open();
      await done.click();
      await expectUnlocked();
      await expect(trigger).toBeFocused();

      await open();
      await dialog.getByRole("alert").getByRole("button", { name: retryName, exact: true }).click();
      await expect(dialog.getByRole("status")).toHaveText(locale === "uk" ? "Завантаження..." : "Loading...");
      releaseStatus();
      const like = dialog.getByRole("button", { name: locale === "uk" ? "Вподобати список" : "Like list", exact: true });
      await expect(like).toHaveAttribute("aria-pressed", "false");
      await like.click();
      const pending = dialog.getByRole("button", { name: locale === "uk" ? "Завантаження..." : "Loading...", exact: true });
      await expect(pending).toBeDisabled();
      await expect(pending).toHaveAttribute("aria-busy", "true");
      releaseLike();
      await dialog.getByRole("alert").getByRole("button", { name: retryName, exact: true }).click();
      await expect(dialog.getByRole("button", { name: locale === "uk" ? "Прибрати вподобання" : "Unlike list", exact: true })).toHaveAttribute("aria-pressed", "true");
      await expect(dialog.getByText(/^8 /)).toBeVisible();
      await expect(dialog.getByRole("alert")).toHaveCount(0);

      // The mobile trigger is hidden at desktop width; closing restores a visible heading instead.
      await page.setViewportSize({ width: 768, height: 900 });
      await expect(dialog).toBeVisible();
      await done.click();
      await expectUnlocked();
      await expect(heading).toBeFocused();
      await page.setViewportSize({ width: 393, height: 900 });
      await open();
      await page.setViewportSize({ width: 768, height: 900 });
      await page.keyboard.press("Escape");
      await expectUnlocked();
      await expect(heading).toBeFocused();
      await page.setViewportSize({ width: 393, height: 900 });
      await open();
      await page.mouse.click(5, 5);
      await expectUnlocked();
      await expect(trigger).toBeFocused();
      await open();
      await dialog.getByRole("link", { name: "#Science Fiction", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/lists/discover\\?feed=recent&tag=science-fiction$`));
      await expectUnlocked();
      await assertOrdinaryHeader(page.getByRole("banner"), locale, 393);
      expect(statusRequests).toBe(2);
      expect(controlledMutations).toEqual(Array(2).fill(`POST /api/lists/${listId}/likes`));
      expect(api.mutations).toEqual([]);
      expect(api.unexpectedGets).toEqual([]);
      expect(pageErrors).toEqual([]);
      // Both 503 responses are intentional local fixtures; any other console error fails this check.
      expect(consoleErrors).toHaveLength(2);
      expect(consoleErrors.every(message => /503/.test(message))).toBe(true);
    } finally {
      releaseStatus();
      releaseLike();
    }
  });
}

async function assertBottomLinks(header: Locator, locale: "uk" | "en") {
  const links = header.locator("nav:visible a");
  await expect(links).toHaveCount(5);
  for (const [index, destination] of ["home", "search", "films", "journal", "profile"].entries()) {
    const link = links.nth(index);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", `/${locale}/${destination}`);
    expect(await link.evaluate(element => {
      const box = element.getBoundingClientRect();
      return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)?.closest("a") === element;
    }), `bottom link ${destination} receives pointer events through the contextual header`).toBe(true);
  }
}

async function assertOrdinaryHeader(header: Locator, locale: "uk" | "en", width: number) {
  await expect(header.getByRole("link", { name: "REWIND", exact: true })).toBeVisible();
  const menu = header.getByRole("button", { name: locale === "uk" ? "Меню" : "Menu", exact: true });
  if (width <= 720) await expect(menu).toBeVisible();
  else await expect(menu).toBeHidden();
}

for (const locale of ["uk", "en"] as const) for (const width of [320, 393, 600, 720, 768]) {
  test(`public list header preserves contextual navigation in ${locale} at ${width}px`, async ({ page }) => {
    const api = await listHeaderFixture(page);
    const pageErrors: string[] = [], consoleErrors: string[] = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/${locale}/lists/public/${listId}`);
    const header = page.getByRole("banner");
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: listTitle, exact: true })).toBeVisible();
    await expect(main).toHaveAttribute("aria-busy", "false");
    const logo = header.getByRole("link", { name: "REWIND", exact: true });
    const menu = header.getByRole("button", { name: locale === "uk" ? "Меню" : "Menu", exact: true });
    const homeName = locale === "uk" ? "Головна" : "Home";
    const filtersName = locale === "uk" ? "Фільтри" : "Filters";
    const back = main.locator(`a[aria-label="${locale === "uk" ? "Мої списки" : "My lists"}"]`);

    if (width <= 720) {
      await expect(logo).toBeHidden();
      await expect(menu).toBeHidden();
      await assertBottomLinks(header, locale);
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      const box = await back.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
      // This square-target corner lies outside the visual circle and under the fixed header.
      await back.click({ position: { x: 5, y: 5 } });
    } else {
      await assertOrdinaryHeader(header, locale, width);
      await expect(back).toBeHidden();
      await page.goto(`/${locale}/lists/discover`);
    }
    await expect(page).toHaveURL(new RegExp(`/${locale}/lists/discover$`));
    await expect(main).toHaveAttribute("aria-busy", "false");

    if (width <= 560) {
      await expect(logo).toBeHidden();
      await expect(menu).toBeHidden();
      await assertBottomLinks(header, locale);
      const filters = header.getByRole("link", { name: filtersName, exact: true });
      await filters.click({ position: { x: 5, y: 5 } });
      await expect(page).toHaveURL(new RegExp(`/${locale}/lists/discover\\?feed=recent$`));
      await expect(main).toHaveAttribute("aria-busy", "false");
      await assertOrdinaryHeader(header, locale, width);
      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`/${locale}/lists/discover$`));
      await expect(logo).toBeHidden();
      // The labelled top control is distinct from the visible bottom Home link.
      await header.locator(`a[aria-label="${homeName}"]`).click({ position: { x: 5, y: 5 } });
    } else {
      await assertOrdinaryHeader(header, locale, width);
      await expect(header.locator(`a[aria-label="${filtersName}"]`)).toBeHidden();
      if (width <= 720) {
        await assertBottomLinks(header, locale);
        await header.locator("nav:visible").getByRole("link", { name: homeName, exact: true }).click();
      } else await logo.click();
    }
    await expect(page).toHaveURL(new RegExp(`/${locale}/home$`));
    await expect(main).toHaveAttribute("aria-busy", "false");
    await assertOrdinaryHeader(header, locale, width);
    if (width <= 720) await assertBottomLinks(header, locale);
    expect(api.mutations).toEqual([]);
    expect(api.unexpectedGets).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}
