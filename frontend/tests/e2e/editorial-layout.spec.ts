import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { waitForPageContent } from "./helpers";

const article = {
  id: 1, slug: "editorial-fixture", language: "uk", category: "News",
  title: "Редакційна стаття", excerpt: null, content: "Текст статті",
  coverUrl: null, audioUrl: null, publishedAt: "2026-10-18T00:00:00Z",
};

async function mockSession(page: Page, authenticated: boolean) {
  // UI-only fixtures: do not create accounts or change the live database.
  await page.route("**/api/users/me", route => route.fulfill({
    status: authenticated ? 200 : 401,
    json: authenticated ? { id: 100001, username: "header-fixture", role: "ADMIN" } : {},
  }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 125 } }));
}

for (const authenticated of [false, true]) {
  test(`header stays readable and keyboard reachable for ${authenticated ? "an administrator" : "a guest"}`, async ({ page }, testInfo) => {
    await mockSession(page, authenticated);
    for (const width of [320, 768, 1280]) {
      await page.setViewportSize({ width, height: 850 });
      for (const route of ["/uk/journal", "/uk/films"]) {
        await page.goto(route);
        await waitForPageContent(page);
        const header = page.getByRole("banner");
        const nav = header.getByRole("navigation", { name: "Головна навігація" });
        const mobile = width <= 720;
        const filmsMobileCanvas = mobile && route === "/uk/films" && width <= 560;
        if (mobile) {
          for (const label of ["Головна", "Пошук", "Додати", "Журнал", authenticated ? "Профіль" : "Увійти"]) {
            await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
          }
          if (!filmsMobileCanvas) {
            await header.getByRole("button", { name: "Меню", exact: true }).click();
            await expect(header.getByRole("navigation", { name: "Додаткова навігація" }).locator(`a[href="/uk/${authenticated ? "admin" : "login"}"]`)).toBeAttached();
            await page.keyboard.press("Escape");
          } else {
            await expect(header.getByRole("link", { name: "REWIND", exact: true })).toHaveCount(0);
            await expect(header.getByRole("button", { name: "Меню", exact: true })).toHaveCount(0);
          }
        } else {
          await expect(nav.locator(`a[href="/uk/${authenticated ? "admin" : "login"}"]`)).toBeAttached();
        }
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        const bounds = await header.evaluate((element, isMobile) => {
          const box = (target: Element) => {
            const { x, y, width, height } = target.getBoundingClientRect();
            return { x, y, width, height, right: x + width, bottom: y + height };
          };
          const visibleNav = [...element.querySelectorAll("nav")].find(target => getComputedStyle(target).display !== "none")!;
          const topAction = isMobile ? element.querySelector("button[aria-expanded]") : element.querySelector("a[aria-label]");
          const logo = element.querySelector("a");
          return {
            header: box(element),
            logo: logo ? box(logo) : null,
            nav: box(visibleNav),
            search: topAction ? box(topAction) : null,
            heading: box(document.querySelector("h1")!),
            mobileNav: isMobile ? box(visibleNav) : null,
          };
        }, mobile);
        const disjoint = (a: typeof bounds.logo, b: typeof bounds.logo) => a.right <= b.x || b.right <= a.x || a.bottom <= b.y || b.bottom <= a.y;
        if (bounds.logo && bounds.search) {
          expect(disjoint(bounds.logo, bounds.nav), `${route} logo/nav overlap at ${width}px`).toBe(true);
          expect(disjoint(bounds.search, bounds.nav), `${route} search/nav overlap at ${width}px`).toBe(true);
        }
        expect(bounds.header.height, `${route} Figma header height at ${width}px`).toBe(mobile ? 64 : 106);
        if (mobile) expect(bounds.mobileNav?.height, `${route} Figma bottom navigation height at ${width}px`).toBe(92);
        expect(bounds.heading.y, `${route} header covers its title`).toBeGreaterThanOrEqual(bounds.header.bottom);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

        if (width === 320) {
          const audit = await new AxeBuilder({ page }).include("header").withTags(["wcag2a", "wcag2aa"]).analyze();
          expect(audit.violations).toEqual([]);
          await page.screenshot({ path: testInfo.outputPath(route.endsWith("journal") ? "light-mobile.png" : "dark-mobile.png") });
        }

        if (filmsMobileCanvas) continue;
        await header.getByRole("link", { name: "REWIND", exact: true }).focus();
        if (mobile) {
          await page.keyboard.press("Tab");
          await expect(header.getByRole("button", { name: "Меню", exact: true })).toBeFocused();
        }
        for (const control of await nav.locator("a, button").all()) {
          await page.keyboard.press("Tab");
          await expect(control).toBeFocused();
          const inNav = await control.evaluate(element => {
            const rect = element.getBoundingClientRect();
            const viewport = element.closest("nav")!.getBoundingClientRect();
            return rect.left >= viewport.left - 1 && rect.right <= viewport.right + 1;
          });
          expect(inNav, "keyboard focus should scroll the menu item into view").toBe(true);
        }
      }
    }
  });
}

test("journal keeps articles usable when the archive fails and resets filtered pages", async ({ page }) => {
  await mockSession(page, false);
  const listRequests: URL[] = [];
  let archiveRequests = 0;
  let failEnglishArchive = true;
  await page.route("**/api/journal/articles**", async route => {
    const url = new URL(route.request().url());
    const language = url.searchParams.get("language");
    if (url.pathname.endsWith("/archive")) {
      archiveRequests++;
      if (language === "en" && failEnglishArchive) {
        failEnglishArchive = false;
        await route.fulfill({ status: 503, json: {} });
      } else {
        await route.fulfill({ json: [{ year: 2026, month: 10, articleCount: 21 }] });
      }
      return;
    }
    listRequests.push(url);
    await route.fulfill({ json: { content: [{ ...article, title: language === "en" ? "Editorial story" : article.title }], totalPages: 2, totalElements: 21 } });
  });
  await page.goto("/uk/journal");
  const archiveButton = page.getByRole("button", { name: /2026.*21/ });
  await expect(archiveButton).toBeVisible();
  await page.getByRole("navigation", { name: "Сторінки журналу" }).getByRole("button", { name: "Далі" }).click();
  await expect(page.getByRole("status")).toHaveText("Сторінка 2 з 2");
  const beforeLanguageChange = listRequests.length;
  await page.getByRole("link", { name: "EN", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Editorial story" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveText(/Could not load the archive/);
  await expect(archiveButton).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("Page 1 of 2");
  expect(listRequests.slice(beforeLanguageChange).map(url => url.searchParams.get("page"))).toEqual(["0"]);
  const beforeArchiveRetry = listRequests.length;
  await page.getByRole("alert").getByRole("button").click();
  await expect(archiveButton).toBeVisible();
  expect(listRequests).toHaveLength(beforeArchiveRetry);
  expect(archiveRequests).toBe(3);

  await page.getByRole("navigation", { name: "Journal pages" }).getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("status")).toHaveText("Page 2 of 2");
  const beforeFilter = listRequests.length;
  await page.getByRole("combobox", { name: "Section" }).selectOption("News");
  await expect(page.getByRole("status")).toHaveText("Page 1 of 2");
  expect(listRequests.slice(beforeFilter).map(url => [url.searchParams.get("category"), url.searchParams.get("page")])).toEqual([["News", "0"]]);
  expect(archiveRequests).toBe(3);
  await archiveButton.click();
  await expect(archiveButton).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => listRequests.at(-1)?.searchParams.get("month")).toBe("10");
  await page.getByRole("button", { name: "Show all months" }).click();
  await expect.poll(() => listRequests.at(-1)?.searchParams.has("month")).toBe(false);
});

test("article error, blank metadata and long content stay accessible on mobile", async ({ page }) => {
  await mockSession(page, false);
  await page.setViewportSize({ width: 320, height: 850 });
  let attempts = 0;
  await page.route("**/api/journal/articles/editorial-fixture**", async route => {
    attempts++;
    await route.fulfill(attempts === 1 ? { status: 503, json: {} } : {
      json: { ...article, title: attempts === 2 ? "  " : "ДовгийЗаголовок".repeat(15), category: " ", excerpt: "Опис".repeat(80), content: " " },
    });
  });
  await page.goto("/uk/journal/editorial-fixture");
  await expect(page.getByRole("alert")).toContainText("Не вдалося завантажити журнал.");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Журнал");
  await page.getByRole("button", { name: "Спробувати ще" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Стаття без заголовка");
  await expect(page.getByText("Без розділу", { exact: true })).toBeVisible();
  await expect(page.getByText("Текст цієї статті ще не додано.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ДовгийЗаголовок");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(audit.violations).toEqual([]);
});

test("mobile messages expose named empty and selected panels without long-name overflow", async ({ page }, testInfo) => {
  await mockSession(page, true);
  await page.setViewportSize({ width: 320, height: 850 });
  let populated = false;
  const name = "ДовгеІмяКористувача".repeat(6);
  await page.route("**/api/conversations?**", route => route.fulfill({ json: {
    content: populated ? [{ id: 100001, otherUser: { id: 100002, username: "reader", displayName: name, avatarUrl: null }, updatedAt: article.publishedAt, lastMessage: { id: 1, senderId: 100002, body: "Повідомлення".repeat(20), createdAt: article.publishedAt, readAt: null } }] : [],
    totalPages: 1, totalElements: populated ? 1 : 0,
  } }));
  await page.route("**/api/conversations/100001/messages?**", route => route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } }));
  await page.route("**/api/conversations/100001/read", route => route.fulfill({ status: 204 }));
  await page.goto("/uk/messages");
  await expect(page.getByText("Діалогів поки немає.", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Повідомлення", exact: true })).toBeVisible();
  await expect(page.getByText("Спільнота Rewind", { exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
  populated = true;
  await page.reload();
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await expect(page.getByRole("region", { name, exact: true })).toBeVisible();
  await expect(page.getByText("У цьому діалозі ще немає повідомлень.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: testInfo.outputPath("messages-mobile.png"), fullPage: true });
});
