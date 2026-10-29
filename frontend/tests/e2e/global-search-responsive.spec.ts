import { expect, test, type Locator, type Page } from "@playwright/test";
import type { GlobalSearchResponse } from "../../src/api/search.api";

const widths = [320, 393, 600, 720, 768, 1024, 1100, 1101, 1440] as const;
const desktopWidths = [1024, 1100, 1101, 1440] as const;
const locales = ["uk", "en"] as const;

function response(locale: typeof locales[number], empty: boolean): GlobalSearchResponse {
  const title = locale === "uk"
    ? "Дуже довга назва історії про кінематограф, режисерів та несподівані відкриття глядачів. "
    : "A long story about cinema, filmmakers and the unexpected discoveries made by audiences. ";
  const copy = locale === "uk"
    ? "Цей докладний опис зберігає зміст і читабельність, коли результати містять багато тексту. "
    : "This detailed description preserves meaning and readability when results contain plenty of text. ";
  const films = empty ? [] : Array.from({ length: 6 }, (_, index) => ({
    id: 987100 + index, title: `${index + 1}. ${title.repeat(3)}`.trim(), releaseDate: "2024-01-01", rating: 4, photoUrl: null,
  }));
  return {
    films: { content: films, number: 0, totalElements: films.length, totalPages: films.length ? 1 : 0 },
    users: { content: [], totalElements: 0 }, tags: [], people: [],
    reviews: { content: empty ? [] : [{
      id: 987200, movieId: films[0].id, movieTitle: films[0].title, userId: 987300,
      username: "cinema-reader", content: copy.repeat(20), rating: 4, createdAt: "2026-10-20T12:00:00Z",
      moviePhotoUrl: null, userAvatarUrl: null,
    }], totalElements: empty ? 0 : 1 },
    lists: { content: empty ? [] : [{
      id: 987400, name: title.repeat(4).trim(), description: copy.repeat(20), ownerId: 987300,
      ownerUsername: "cinema-reader", tags: [], itemCount: 6, previewMovies: films.slice(0, 5),
    }], totalElements: empty ? 0 : 1 },
    journal: { content: empty ? [] : Array.from({ length: 3 }, (_, index) => ({
      id: 987500 + index, slug: `responsive-story-${index}`, category: "NEWS", title: `${index + 1}. ${title.repeat(4)}`.trim(),
      excerpt: copy.repeat(20), coverUrl: null, publishedAt: "2026-10-20T12:00:00Z",
    })), totalElements: empty ? 0 : 3 },
  };
}

async function mockSearch(page: Page) {
  const mutations: string[] = [];
  await page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== "GET") {
      mutations.push(`${request.method()} ${url.pathname}`);
      return route.abort();
    }
    if (url.pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/search/global") return route.fulfill({
      json: response(url.searchParams.get("language") === "uk" ? "uk" : "en", url.searchParams.get("q") === "missing"),
    });
    if (url.pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ status: 404, json: {} });
  });
  return mutations;
}

async function expectNoPageOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}

// Measure the rendered text containers, allowing deliberate line clamps on
// excerpts while detecting a whole title/body hidden by a fixed-height card.
async function expectContentsWithin(cards: Locator, selector: string) {
  const failures = await cards.evaluateAll((elements, childSelector) => elements.flatMap((card, index) => {
    const outer = card.getBoundingClientRect();
    return [...card.querySelectorAll(childSelector)].flatMap(child => {
      const box = child.getBoundingClientRect();
      if (!box.width || !box.height) return [];
      const escaped = box.left < outer.left - 1 || box.right > outer.right + 1 || box.top < outer.top - 1 || box.bottom > outer.bottom + 1;
      return escaped ? [`card ${index}: ${child.tagName} escapes its card`] : [];
    });
  }), selector);
  expect(failures).toEqual([]);
}

test("long localized search results stay within every responsive viewport and desktop card", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const mutations = await mockSearch(page);
  for (const locale of locales) {
    for (const width of widths) {
      await test.step(`${locale} at ${width}px`, async () => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}/search?q=cinema`);
        const main = page.getByRole("main");
        await expect(main).toHaveAttribute("aria-busy", "false");
        const films = main.locator("#films article");
        await expect(films).toHaveCount(6);
        await expect(main.locator('#journal a[href*="/journal/"]')).toHaveCount(3);
        await expect(main.locator('#lists a[href*="/lists/public/"]')).toHaveCount(1);
        const firstFilm = response(locale, false).films.content[0];
        await expect(films.first().locator(":scope > a")).toHaveAccessibleName(`${firstFilm.title} ${locale === "uk" ? "Постер" : "Poster"}`);
        const fallback = films.first().locator('[class*="posterFallback"] > span');
        await expect(fallback).toBeVisible();
        expect(await fallback.evaluate(element => {
          const text = element.getBoundingClientRect();
          const poster = element.closest('a')!.getBoundingClientRect();
          const heading = element.closest('article')!.querySelector('h3')!.getBoundingClientRect();
          return text.top >= poster.top && text.bottom <= poster.bottom && (!heading.height || text.bottom < heading.top);
        })).toBe(true);
        await expectNoPageOverflow(page);
        if (locale === "en" && (width === 393 || width === 1440)) await page.screenshot({ path: testInfo.outputPath(`search-${width}-fixture.png`), fullPage: true });
        if (width >= 1024) {
          await expectContentsWithin(films, "h3, p");
          await expectContentsWithin(main.locator("#reviews article"), '[class*="reviewBody"], [class*="reviewMeta"], p');
          await expectContentsWithin(main.locator('#lists a[href*="/lists/public/"]'), '[class*="listSummary"], h3, p, small');
          await expectContentsWithin(main.locator('#journal a[href*="/journal/"]'), ":scope > div, h3, p, small");
        }
      });
    }
  }
  expect(mutations).toEqual([]);
});

test("desktop categories remain visible and keyboard tabs reveal their focused control", async ({ page }) => {
  test.setTimeout(60_000);
  await mockSearch(page);
  for (const locale of locales) {
    for (const width of desktopWidths) {
      await test.step(`${locale} at ${width}px`, async () => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}/search?q=cinema`);
        await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
        const select = page.getByRole("combobox", { name: locale === "uk" ? "Показати результати" : "Show results for", exact: true });
        await expect(select).toBeVisible();
        await select.selectOption("journal");
        await expect(page).toHaveURL(/tab=journal/);
        await expect(page.locator("#journal")).toBeVisible();
        await expect(page.locator("#films")).toHaveCount(0);
        await select.focus();
        await page.keyboard.press("Tab");
        const journal = page.getByRole("tab", { name: locale === "uk" ? "Журнал" : "Journal", exact: true });
        const tabs = page.getByRole("tablist");
        await expect(journal).toBeFocused();
        await expect(tabs).toHaveCSS("clip-path", "none");
        expect(await journal.evaluate(element => {
          const box = element.getBoundingClientRect();
          return box.width > 20 && box.height > 20 && document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)?.closest('[role="tab"]') === element;
        })).toBe(true);
        await page.keyboard.press("ArrowLeft");
        const reviews = page.getByRole("tab", { name: locale === "uk" ? "Огляди" : "Reviews", exact: true });
        await expect(reviews).toBeFocused();
        await expect(page).toHaveURL(/tab=reviews/);
        await page.keyboard.press("Tab");
        await expect(page.getByRole("tabpanel")).toBeFocused();
        await expect(select).toBeVisible();
        await expectNoPageOverflow(page);
      });
    }
  }
});

test("localized responsive empty states return home with keyboard access", async ({ page }, testInfo) => {
  await mockSearch(page);
  for (const locale of locales) {
    for (const width of widths) {
      await test.step(`${locale} at ${width}px`, async () => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}/search?q=missing`);
        await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
        const empty = page.locator('main section[class*="noMatches"]');
        await expect(empty).toBeVisible();
        await expectContentsWithin(empty, ":scope > p, h2, a");
        const home = empty.getByRole("link", { name: locale === "uk" ? "На головну" : "Back to home", exact: true });
        await expect(home).toHaveAttribute("href", `/${locale}/home`);
        await home.focus();
        await expect(home).toBeFocused();
        if (locale === "en" && (width === 393 || width === 1440)) await page.screenshot({ path: testInfo.outputPath(`search-empty-${width}.png`), fullPage: true });
        expect(await home.evaluate(element => {
          const box = element.getBoundingClientRect();
          return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)?.closest("a") === element;
        })).toBe(true);
        await expectNoPageOverflow(page);
        await home.press("Enter");
        await expect(page).toHaveURL(new RegExp(`/${locale}/home$`));
      });
    }
  }
});
