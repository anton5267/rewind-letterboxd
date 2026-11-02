import { expect, test, type Locator, type Page, type Route } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const owner = { id: 98001, username: "list-draft-owner", role: "USER" };
const film = { id: 98011, title: "Arrival", releaseDate: "2016-11-11", rating: 7.9, photoUrl: null };

async function activate(locator: Locator, projectName: string) {
  if (projectName.includes("emulation")) await locator.tap();
  else await locator.click();
}

async function captureDraft(page: Page, testName: string, projectName: string) {
  const output = path.resolve(process.cwd(), "../artifacts/visual-audit-20261102/list-create-draft");
  mkdirSync(output, { recursive: true });
  const platform = projectName.includes("iOS") ? "ios-webkit" : projectName.includes("Android") ? "android-chromium" : "desktop-chromium";
  await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo(0, 0); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(output, `${testName}-${platform}.png`), fullPage: true });
}

async function mockListDraft(page: Page, failCreate = false) {
  const mutations: string[] = [];
  let created: Record<string, unknown> | null = null;
  const items: Array<{ id: number; position: number; movie: typeof film }> = [];

  await page.route(url => url.pathname.startsWith("/api/"), async (route: Route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    if (pathname === "/api/users/me") return route.fulfill({ json: owner });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "list-draft-test" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/genres") return route.fulfill({ json: [] });
    if (pathname === "/api/lists/my") return route.fulfill({ json: created ? [created] : [] });
    if (pathname === "/api/lists/my/page") return route.fulfill({ json: { content: [], totalPages: 1, totalElements: 0, number: 0, size: 12 } });
    if (pathname === "/api/movies/search") return route.fulfill({ json: { content: [film], totalPages: 1, totalElements: 1, number: 0, size: 8 } });
    if (pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/lists" && request.method() === "POST") {
      mutations.push("create");
      if (failCreate) return route.fulfill({ status: 503, json: { message: "Temporary failure" } });
      const body = request.postDataJSON() as Record<string, unknown>;
      created = { id: 98021, description: null, listType: "CUSTOM", isPublic: false, tags: [], ...body };
      return route.fulfill({ json: created });
    }
    if (pathname === "/api/lists/98021/movies" && request.method() === "POST") {
      mutations.push("add-film");
      items.push({ id: 98031, position: items.length, movie: film });
      return route.fulfill({ status: 200, json: {} });
    }
    if (pathname === "/api/lists/98021/items") return route.fulfill({ json: items });
    return route.fulfill({ json: [] });
  });
  return { mutations, items };
}

test("Create List keeps film selection local until Save, then opens the returned list", async ({ page }, testInfo) => {
  const { mutations } = await mockListDraft(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en/lists");
  await expect(page.locator('main[data-list-editor="create"]')).toHaveAttribute("aria-busy", "false");

  await page.locator("#new-list-name").fill("Films to revisit");
  await page.locator("#new-list-description").fill("A private draft with a selected film.");
  await page.locator("#new-list-tags").fill("arrival, science fiction");
  const addFilm = page.getByRole("button", { name: "Add a film", exact: true });
  await expect(addFilm).toHaveAttribute("aria-expanded", "false");
  await activate(addFilm, testInfo.project.name);
  await expect(addFilm).toHaveAttribute("aria-expanded", "true");
  const query = page.locator("#draft-film-query");
  await expect(query).toBeFocused();
  const queryBox = await query.boundingBox();
  expect(queryBox?.width).toBeCloseTo(351, 0);
  await query.fill("Arrival");
  await activate(page.getByRole("button", { name: /Arrival/ }), testInfo.project.name);
  await expect(page.getByText("Arrival", { exact: true })).toBeVisible();
  expect(mutations).toEqual([]);
  await captureDraft(page, "desktop-en-1440", testInfo.project.name);

  await activate(page.getByRole("button", { name: "Save", exact: true }), testInfo.project.name);
  await expect(page).toHaveURL("/en/lists?list=98021&mode=view");
  await expect(page.getByRole("status").filter({ hasText: "List created." })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Films to revisit" })).toBeVisible();
  await expect(page.getByRole("link", { name: "List settings" })).toHaveAttribute("href", "/en/lists?list=98021&mode=edit");
  expect(mutations).toEqual(["create", "add-film"]);
});

test("Create List keeps the form and film draft after Save fails on a phone viewport", async ({ page }, testInfo) => {
  const { mutations } = await mockListDraft(page, true);
  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/uk/lists");
  await expect(page.locator('main[data-list-editor="create"]')).toHaveAttribute("aria-busy", "false");

  await page.locator("#new-list-name").fill("Список на потім");
  await page.locator("#new-list-description").fill("Чернетка збережеться після помилки.");
  await page.locator("#new-list-tags").fill("драма, космос");
  const addFilm = page.getByRole("button", { name: "Додати фільм", exact: true });
  await expect(addFilm).toHaveAttribute("aria-expanded", "false");
  await activate(addFilm, testInfo.project.name);
  await expect(addFilm).toHaveAttribute("aria-expanded", "true");
  const query = page.locator("#draft-film-query");
  const queryBox = await query.boundingBox();
  expect(queryBox?.width).toBeCloseTo(321, 0);
  await query.fill("Arrival");
  await activate(page.getByRole("button", { name: /Arrival/ }), testInfo.project.name);
  expect(mutations).toEqual([]);
  await captureDraft(page, "phone-uk-393", testInfo.project.name);

  await activate(page.getByRole("button", { name: "Зберегти", exact: true }), testInfo.project.name);
  await expect(page.getByRole("alert")).toContainText("Не вдалося створити список.");
  await expect(page.locator('main[data-list-editor="create"]')).toBeVisible();
  await expect(page.locator("#new-list-name")).toHaveValue("Список на потім");
  await expect(page.locator("#new-list-description")).toHaveValue("Чернетка збережеться після помилки.");
  await expect(page.locator("#new-list-tags")).toHaveValue("драма, космос");
  await expect(page.getByText("Arrival", { exact: true })).toBeVisible();
  const selectionList = page.locator('ul[class*="draftSelection"]');
  for (const width of [320, 393, 600, 720]) {
    await page.setViewportSize({ width, height: 844 });
    const [queryBox, selection] = await Promise.all([query.boundingBox(), selectionList.boundingBox()]);
    expect(queryBox?.width, `film search width at ${width}px`).toBeGreaterThan(0);
    expect(selection?.width, `selected-film row width at ${width}px`).toBeCloseTo(queryBox?.width ?? 0, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `document width at ${width}px`).toBeLessThanOrEqual(width);
  }
  expect(mutations).toEqual(["create"]);
});
