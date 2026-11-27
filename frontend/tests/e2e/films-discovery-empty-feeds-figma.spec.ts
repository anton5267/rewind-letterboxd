import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const films = {
  content: Array.from({ length: 6 }, (_, index) => ({ id: 99001 + index, title: `Film ${index + 1}`, releaseDate: "2025-01-01", rating: 4.2, photoUrl: null })),
  totalPages: 1, totalElements: 6, number: 0, size: 6,
};
const emptyPage = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 0 };

test("mobile film discovery empty review feeds match Figma", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "empty-discovery-fixture" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/movies/search**", route => route.fulfill({ json: films }));
  await page.route("**/api/genres", route => route.fulfill({ json: [] }));
  await page.route("**/api/reviews/recent**", route => route.fulfill({ json: emptyPage }));
  await page.route("**/api/reviews/popular**", route => route.fulfill({ json: emptyPage }));
  await page.route("**/api/lists/public/team**", route => route.fulfill({ json: emptyPage }));

  await page.setViewportSize({ width: 393, height: 852 });
  for (const [locale, expectedRecent, expectedPopular, viewAllX, viewAllWidth] of [
    ["en", "Just reviewed", "Popular reviews this week", 321, 56],
    ["uk", "Щойно переглянули", "Популярні огляди цього тижня", 273, 104],
  ] as const) {
    await page.goto(`/${locale}/films/discover`);
    await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
    const popular = page.locator('[data-films-feed="popular"]');
    const recent = page.locator('[data-films-feed="recent"]');
    const reviews = page.locator('[data-films-feed="reviews"]');
    await expect(recent.locator("h2")).toContainText(expectedRecent);
    await expect(recent.locator('[class*="empty_"]')).toBeVisible();
    await expect(reviews.locator("h2")).toContainText(expectedPopular);
    await expect(reviews.locator('[class*="empty_"]')).toBeVisible();
    const geometry = await page.evaluate(() => {
      const rect = (node: Element | null) => {
        if (!node) return null;
        const { x, y, width, height } = node.getBoundingClientRect();
        return { x, y, width, height };
      };
      const textRect = (node: Element | null) => {
        if (!node) return null;
        const range = document.createRange();
        range.selectNodeContents(node);
        const { x, y, width, height } = range.getBoundingClientRect();
        return { x, y, width, height };
      };
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        firstPoster: rect(document.querySelector('[data-films-feed="popular"] [class*="popularGrid"] li a')),
        recent: rect(document.querySelector('[data-films-feed="recent"]')),
        recentHeading: rect(document.querySelector('[data-films-feed="recent"] h2')),
        recentEmpty: rect(document.querySelector('[data-films-feed="recent"] [class*="empty_"]')),
        recentEmptyText: textRect(document.querySelector('[data-films-feed="recent"] [class*="empty_"]')),
        popularReviews: rect(document.querySelector('[data-films-feed="reviews"]')),
        popularHeading: rect(document.querySelector('[data-films-feed="reviews"] h2')),
        popularViewAll: rect(document.querySelector('[data-films-feed="reviews"] [class*="heading"] > a')),
        popularViewAllText: textRect(document.querySelector('[data-films-feed="reviews"] [class*="heading"] > a')),
        popularEmpty: rect(document.querySelector('[data-films-feed="reviews"] [class*="empty_"]')),
        popularEmptyText: textRect(document.querySelector('[data-films-feed="reviews"] [class*="empty_"]')),
        recentMore: rect(document.querySelector('[data-films-feed="recent"] [class*="heading"] > a')),
        crewHeading: rect(document.querySelector('[data-films-feed="crew"] h2')),
        mobileNav: rect(document.querySelector('header nav[class*="mobileNav"]')),
      };
    });
    expect(geometry.overflow).toBe(0);
    expect(geometry.firstPoster).toMatchObject({ x: 16, y: 168, width: 100, height: 149 });
    expect(geometry.recentHeading?.y).toBeGreaterThanOrEqual(395);
    expect(geometry.recentHeading?.y).toBeLessThanOrEqual(397);
    expect(geometry.recentEmptyText?.x).toBe(36);
    expect(geometry.recentEmptyText?.y).toBeGreaterThanOrEqual(458);
    expect(geometry.recentEmptyText?.y).toBeLessThanOrEqual(461);
    expect(geometry.popularHeading?.y).toBeGreaterThanOrEqual(541);
    expect(geometry.popularHeading?.y).toBeLessThanOrEqual(543);
    expect(geometry.popularViewAll).toMatchObject({ x: viewAllX, y: 542, width: viewAllWidth, height: 44 });
    expect(geometry.popularViewAllText?.x).toBe(viewAllX);
    expect(geometry.popularViewAllText?.y).toBeGreaterThanOrEqual(547);
    expect(geometry.popularViewAllText?.y).toBeLessThanOrEqual(549);
    expect(geometry.popularEmptyText?.x).toBe(36);
    expect(geometry.popularEmptyText?.y).toBeGreaterThanOrEqual(604);
    expect(geometry.popularEmptyText?.y).toBeLessThanOrEqual(607);
    expect(geometry.recentMore?.width).toBe(0);
    expect(geometry.crewHeading?.y).toBeGreaterThanOrEqual(760);
    expect(geometry.mobileNav).toMatchObject({ y: 760, height: 92 });
    const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261125/films");
    await mkdir(captureDirectory, { recursive: true });
    await page.screenshot({ path: resolve(captureDirectory, `films-discovery-empty-${locale}-393.png`), fullPage: false });
  }
});
