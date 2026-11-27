import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { waitForPageContent } from "./helpers";

test("All Films desktop retains numbered pagination and matched catalog anchors", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/films");
  await waitForPageContent(page);
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  await page.waitForFunction(
    () => [...document.querySelectorAll("main img")].every(image => (image as HTMLImageElement).complete),
    undefined,
    { timeout: 20_000 },
  );

  const pagination = page.locator('main nav[aria-label="Film pages"]');
  await expect(pagination.getByRole("button", { name: "Page 1", exact: true })).toBeVisible();
  await expect(page.locator('main button[aria-label="Previous"]')).toBeHidden();
  await expect(page.locator('main button[aria-label="Next"]')).toBeHidden();
  await expect(page.locator("#film-search-query")).toBeHidden();
  await expect(page.locator('main [class*="catalogCount_"]')).toContainText("Films found: 50");

  const geometry = await page.evaluate(() => {
    const grid = document.querySelector('main [class*="grid"]');
    const firstPoster = document.querySelector('main article a[href*="/films/"]');
    const title = document.querySelector('main h1');
    const filters = document.querySelector('main form[aria-label="Filters"]');
    const catalogCount = document.querySelector('main [class*="catalogCount_"]');
    const hero = document.querySelector('main section');
    const heroBar = document.querySelector('main section > div');
    const searchForm = document.querySelector('main form[aria-busy]');
    const rect = (node: Element | null) => {
      if (!node) return null;
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      viewport: innerWidth,
      document: document.documentElement.scrollWidth,
      main: rect(document.querySelector("main")),
      grid: rect(grid),
      poster: rect(firstPoster),
      title: rect(title),
      filters: rect(filters),
      catalogCount: rect(catalogCount),
      hero: rect(hero),
      heroBar: rect(heroBar),
      searchForm: rect(searchForm),
      pagination: rect(document.querySelector('main nav[aria-label="Film pages"]')),
      footer: rect(document.querySelector("footer")),
      visibleNumberedPages: [...(document.querySelectorAll('main nav[aria-label="Film pages"] button[aria-label^="Page "]'))]
        .filter(button => getComputedStyle(button).display !== "none").length,
    };
  });
  console.log(`ALL_FILMS_DESKTOP_LIVE ${JSON.stringify(geometry)}`);
  expect(geometry.document).toBe(1440);
  expect(geometry.grid?.x).toBeCloseTo(120.5, 1);
  expect(geometry.grid?.width).toBe(1199);
  expect(geometry.grid?.y).toBeCloseTo(607, 0);
  expect(geometry.poster?.width).toBeCloseTo(174, 0);
  expect(geometry.title?.y).toBeCloseTo(299, 0);
  expect(geometry.filters?.x).toBe(989);
  expect(geometry.filters?.y).toBe(294);
  expect(geometry.filters?.width).toBe(331);
  expect(geometry.catalogCount?.y).toBe(379);
  expect(geometry.catalogCount?.height).toBeCloseTo(58.4, 0);
  expect(geometry.footer?.y).toBe(2691);
  expect(geometry.visibleNumberedPages).toBeGreaterThan(0);

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261124/all-films-desktop-catalog");
  await mkdir(captureDirectory, { recursive: true });
  await page.screenshot({ path: resolve(captureDirectory, "rewind-films-catalog-en-desktop-1440x2956.png"), fullPage: true, scale: "css" });
  expect(pageErrors).toEqual([]);
});
