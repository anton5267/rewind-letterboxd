import { expect, test, type Page } from "@playwright/test";

const createLists = (count: number) => Array.from({ length: count }, (_, index) => ({
  id: 991100 + index,
  name: index === 0 ? "Top 250 Narrative Feature Films" : index === 1 ? "A long list title that remains readable on narrow screens" : `Tagged list ${index + 1}`,
  description: "A long description that confirms the desktop card can grow with its content while keeping the poster rail and real metadata in place.",
  ownerId: 991200 + index,
  ownerUsername: `tagged-member-${index}`,
  itemCount: 25 - index,
  likeCount: 296 - index,
  tags: ["api"],
  previewMovies: Array.from({ length: 5 }, (_, movieIndex) => ({
    id: 991300 + index * 10 + movieIndex,
    title: `Preview film ${movieIndex + 1}`,
    photoUrl: null,
    releaseDate: null,
    rating: null,
  })),
}));

async function mockTaggedLists(page: Page) {
  await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/tags/popular") return route.fulfill({ json: [] });
    if (url.pathname === "/api/lists/public") {
      const size = Number(url.searchParams.get("size"));
      return route.fulfill({ json: { content: createLists(size), totalPages: 3, totalElements: 12, number: 0, size } });
    }
    return route.fulfill({ status: 404, json: {} });
  });
}

test("tagged Lists follows the desktop READY hero and card anchors", async ({ page }) => {
  await mockTaggedLists(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const response = page.waitForResponse(item => {
    const url = new URL(item.url());
    return url.pathname === "/api/lists/public" && url.searchParams.get("tag") === "api";
  });
  await page.goto("/en/lists/discover?feed=recent&tag=api");
  const apiResponse = await response;
  expect(apiResponse.ok()).toBe(true);
  expect(new URL(apiResponse.url()).searchParams.get("size")).toBe("4");
  await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");

  const main = page.getByRole("main");
  const hero = main.locator('section[class*="taggedHero"]');
  const heroBox = await hero.boundingBox();
  expect(heroBox?.x).toBeCloseTo(0, 0);
  expect(heroBox?.y).toBeCloseTo(0, 0);
  expect(heroBox?.width).toBeCloseTo(1440, 0);
  expect(heroBox?.height).toBeCloseTo(278, 0);
  await expect(hero.locator('a[class*="taggedSearch"]')).toBeHidden();

  const cards = main.locator('section[aria-labelledby="lists-grid-heading"] article');
  await expect(cards).toHaveCount(4);
  const cardBox = await cards.first().boundingBox();
  expect(cardBox?.x).toBeCloseTo(120, 0);
  expect(cardBox?.y).toBeCloseTo(379, 0);
  expect(cardBox?.width).toBeCloseTo(1200, 0);
  expect(cardBox?.height).toBeCloseTo(339, 0);
  const posterBox = await cards.first().locator('a[class*="taggedPosterLink"]').boundingBox();
  expect(posterBox?.x).toBeCloseTo(154, 0);
  expect(posterBox?.width).toBeCloseTo(446, 0);
  expect(posterBox?.height).toBeCloseTo(260, 0);
  await expect(cards.first().locator('a[class*="taggedPosterLink"] > div > div')).toHaveCount(5);
  await expect(cards.first().locator('p[class*="taggedMeta"]')).toContainText("tagged-member-0");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
});

test("tagged Lists follows the phone READY toolbar, card and bottom navigation anchors", async ({ page }) => {
  await mockTaggedLists(page);
  await page.setViewportSize({ width: 393, height: 1055 });
  const response = page.waitForResponse(item => {
    const url = new URL(item.url());
    return url.pathname === "/api/lists/public" && url.searchParams.get("tag") === "api";
  });
  await page.goto("/uk/lists/discover?feed=recent&tag=api");
  const apiResponse = await response;
  expect(apiResponse.ok()).toBe(true);
  expect(new URL(apiResponse.url()).searchParams.get("size")).toBe("3");
  await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");

  const main = page.getByRole("main");
  await expect(page.locator('header a[class*="logo"]')).toBeHidden();
  await expect(page.locator('header button[class*="menuToggle"]')).toBeHidden();
  await expect(page.locator('header nav[class*="mobileNav"]')).toBeVisible();
  const heroBox = await main.locator('section[class*="taggedHero"]').boundingBox();
  expect(heroBox?.x).toBeCloseTo(0, 0);
  expect(heroBox?.width).toBeCloseTo(393, 0);
  expect(heroBox?.height).toBeCloseTo(163, 0);
  const toolbar = main.locator('div[class*="taggedToolbar"]');
  await expect(toolbar.locator('a[class*="taggedBack"]')).toBeVisible();
  await expect(toolbar.locator('a[class*="taggedFilter"]')).toBeVisible();
  const searchBox = await toolbar.locator('a[class*="taggedSearch"]').boundingBox();
  expect(searchBox?.width).toBeCloseTo(361, 0);

  const cards = main.locator('section[aria-labelledby="lists-grid-heading"] article');
  await expect(cards).toHaveCount(3);
  const cardBox = await cards.first().boundingBox();
  expect(cardBox?.x).toBeCloseTo(10, 0);
  expect(cardBox?.y).toBeCloseTo(247, 0);
  expect(cardBox?.width).toBeCloseTo(361, 0);
  expect(cardBox?.height).toBeCloseTo(188, 0);
  const posterBox = await cards.first().locator('a[class*="taggedPosterLink"]').boundingBox();
  expect(posterBox?.x).toBeCloseTo(28, 0);
  expect(posterBox?.width).toBeCloseTo(325, 0);
  expect(posterBox?.height).toBeCloseTo(116, 0);
  await expect(cards.first().locator('a[class*="taggedPosterLink"] > div > div')).toHaveCount(5);
  const longTitleBox = await cards.nth(1).boundingBox();
  expect(longTitleBox?.height).toBeGreaterThan(188);
  await expect(main.locator("#lists-grid-heading")).toContainText("api");
  await expect(main.locator('nav[class*="pagination"]')).toBeVisible();
  const back = toolbar.locator('a[class*="taggedBack"]');
  if (test.info().project.name.startsWith("Android")) {
    for (let index = 0; index < 6; index += 1) await page.keyboard.press("Tab");
    await expect(back).toBeFocused();
    expect(await page.evaluate(() => getComputedStyle(document.activeElement!).outlineWidth)).not.toBe("0px");
  } else {
    // iOS Safari emulation has no physical keyboard; verify the phone control
    // still accepts focus without treating touch emulation as a keyboard test.
    await back.focus();
    await expect(back).toBeFocused();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
});

test("tagged Lists stays contained through intermediate widths and both locales", async ({ page }) => {
  await mockTaggedLists(page);
  for (const lang of ["uk", "en"] as const) {
    for (const width of [320, 393, 600, 720, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const response = page.waitForResponse(item => {
        const url = new URL(item.url());
        return url.pathname === "/api/lists/public" && url.searchParams.get("tag") === "api";
      });
      await page.goto(`/${lang}/lists/discover?feed=recent&tag=api`);
      expect((await response).ok(), `${lang} ${width}px tagged API response`).toBe(true);
      await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
      const layout = await page.evaluate(() => {
        const card = document.querySelector<HTMLElement>('main [aria-labelledby="lists-grid-heading"] article');
        const rect = card?.getBoundingClientRect();
        const logo = document.querySelector<HTMLElement>('header [class*="logo"]');
        const nav = document.querySelector<HTMLElement>('header nav[class*="mobileNav"]');
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          cardX: rect?.x ?? -1,
          cardWidth: rect?.width ?? 0,
          headerLogo: logo ? getComputedStyle(logo).display !== "none" : false,
          bottomNavigation: nav ? getComputedStyle(nav).display !== "none" : false,
        };
      });
      expect(layout.overflow, `${lang} tagged route must not overflow at ${width}px`).toBeLessThanOrEqual(1);
      expect(layout.cardWidth).toBeGreaterThan(0);
      if (width < 768) {
        expect(layout.headerLogo).toBe(false);
        expect(layout.bottomNavigation).toBe(true);
      } else {
        expect(layout.headerLogo).toBe(true);
      }
      expect(layout.cardX).toBeGreaterThanOrEqual(0);
    }
  }
});
