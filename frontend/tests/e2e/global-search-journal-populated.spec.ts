import { expect, test } from "@playwright/test";

const articles = [{
  id: 983100,
  slug: "rewind-journal-long-title-fixture",
  category: "NEWS",
  title: "A Long Journal Headline That Must Wrap Cleanly Without Breaking the Search Result Card",
  excerpt: "An isolated API fixture verifies that populated Journal results remain readable beside missing cover art.",
  coverUrl: null,
  publishedAt: "2026-10-30T12:00:00Z",
}, {
  id: 983101,
  slug: "rewind-journal-card-fixture-two",
  category: "COMMUNITY",
  title: "A Second Isolated Journal Result",
  excerpt: "Another test-only response checks how the category grid fills out.",
  coverUrl: null,
  publishedAt: "2026-10-29T12:00:00Z",
}, {
  id: 983102,
  slug: "rewind-journal-card-fixture-three",
  category: "PLATFORM",
  title: "A Third Isolated Journal Result",
  excerpt: "A third result confirms the responsive card grid.",
  coverUrl: null,
  publishedAt: "2026-10-28T12:00:00Z",
}];

const emptyMoviePage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 12 };
const emptyCollection = { content: [], totalElements: 0 };

for (const scenario of [
  { lang: "uk", width: 393, title: articles[0].title, excerpt: articles[0].excerpt },
  { lang: "en", width: 1024, title: articles[0].title, excerpt: articles[0].excerpt },
  { lang: "en", width: 1440, title: articles[0].title, excerpt: articles[0].excerpt },
]) {
  test(`populated Journal search stays readable and links to the article at ${scenario.width}px (${scenario.lang})`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.route(url => new URL(url).pathname.startsWith("/api/"), route => {
      const { pathname } = new URL(route.request().url());
      if (pathname === "/api/users/me") return route.fulfill({ json: null });
      if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "journal-search-csrf" } });
      if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
      if (pathname === "/api/search/global") return route.fulfill({ json: {
        films: emptyMoviePage,
        users: emptyCollection,
        lists: emptyCollection,
        tags: [],
        people: [],
        reviews: emptyCollection,
        journal: { content: articles, totalElements: articles.length },
      } });
      return route.fulfill({ json: emptyCollection });
    });

    await page.setViewportSize({ width: scenario.width, height: 900 });
    await page.goto(`/${scenario.lang}/search?q=rewind&tab=journal`);
    const panel = page.getByRole("tabpanel", { name: scenario.lang === "uk" ? "Журнал" : "Journal" });
    await expect(panel.getByRole("heading", { name: scenario.title })).toBeVisible();
    await expect(panel.getByText(scenario.excerpt, { exact: true })).toBeVisible();

    const card = panel.locator(`a[href="/${scenario.lang}/journal/${articles[0].slug}"]`);
    await expect(panel.locator(`a[href^="/${scenario.lang}/journal/"]`)).toHaveCount(articles.length);
    await expect(card).toHaveCount(1);
    await expect(card).toHaveAttribute("href", `/${scenario.lang}/journal/${articles[0].slug}`);
    await expect(card.locator("img")).toHaveCount(0);
    await expect(card.getByText("REWIND", { exact: true })).toBeVisible();
    if (scenario.width === 1440) {
      const cardBox = await card.boundingBox();
      expect(cardBox?.x).toBeCloseTo(116, 0);
      expect(cardBox?.y).toBeCloseTo(377, 0);
      expect(Math.abs((cardBox?.width ?? 0) - 385.643)).toBeLessThan(1.5);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(scenario.width);
    expect(pageErrors).toEqual([]);
  });
}
