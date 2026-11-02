import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { waitForPageContent } from "./helpers";

test("All Films phone catalog matches the 4-by-6 layout and keeps working pagination in Android/iOS", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.setViewportSize({ width: 393, height: 1215 });
  await page.goto("/uk/films");
  await waitForPageContent(page);
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");

  const results = page.locator('main section[aria-label="Фільми"]');
  const cards = results.locator("article");
  await expect(cards).toHaveCount(24);
  await page.waitForFunction(
    () => [...document.querySelectorAll("main img")].every(image => (image as HTMLImageElement).complete),
    undefined,
    { timeout: 20_000 },
  );
  const pagination = page.locator('main nav[aria-label="Сторінки фільмів"]');
  const previous = pagination.getByRole("button", { name: "Назад", exact: true });
  const next = pagination.getByRole("button", { name: "Далі", exact: true });
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  const previousBox = await previous.boundingBox();
  const nextBox = await next.boundingBox();
  expect(previousBox?.x).toBeCloseTo(16, 0);
  expect(nextBox ? nextBox.x + nextBox.width : -1).toBeCloseTo(377, 0);

  const measurements = await page.evaluate(() => {
    const grid = document.querySelector('main [class*="grid"]');
    const firstPoster = document.querySelector('main article a[href*="/films/"]');
    const pagination = document.querySelector('main nav[aria-label="Сторінки фільмів"]');
    const filter = document.querySelector('main button[aria-controls="film-filter-controls"]');
    const rect = (node: Element | null) => {
      if (!node) return null;
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      viewport: innerWidth,
      document: document.documentElement.scrollWidth,
      grid: rect(grid),
      poster: rect(firstPoster),
      pagination: rect(pagination),
      pageNumbersVisible: [...(pagination?.querySelectorAll("button") ?? [])]
        .some(button => !button.hasAttribute("aria-label") || !["Назад", "Далі"].includes(button.getAttribute("aria-label") ?? "")
          ? getComputedStyle(button).display !== "none"
          : false),
      filter: rect(filter),
    };
  });
  console.log(`ALL_FILMS_PHONE_LIVE ${testInfo.project.name} ${JSON.stringify(measurements)}`);
  expect(measurements.document).toBe(393);
  expect(measurements.grid?.x).toBe(16);
  expect(measurements.grid?.y).toBeCloseTo(228.25, 0);
  expect(measurements.grid?.width).toBe(361);
  expect(measurements.poster?.width).toBeCloseTo(79, 0);
  expect(measurements.poster?.height).toBeCloseTo(116, 0);
  expect(measurements.pagination?.y).toBeGreaterThan(1045);
  expect(measurements.pagination?.y).toBeLessThan(1060);
  expect(measurements.pageNumbersVisible).toBe(false);

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261102/all-films-mobile-live");
  await mkdir(captureDirectory, { recursive: true });
  const platform = testInfo.project.name.includes("iOS") ? "ios-webkit" : "android-chromium";
  await page.screenshot({ path: resolve(captureDirectory, `${platform}-uk-393x1215.png`), scale: "css" });

  const filter = page.locator('main button[aria-controls="film-filter-controls"]');
  await filter.tap();
  await expect(filter).toHaveAttribute("aria-expanded", "true");
  const query = page.locator("#film-search-query");
  await expect(query).toBeVisible();
  await expect(query).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(filter).toHaveAttribute("aria-expanded", "false");
  await expect(filter).toBeFocused();

  await next.tap();
  await expect(page).toHaveURL(/page=1/);
  await expect(pagination.getByRole("status")).toContainText("Сторінка 2 з");
  await expect(previous).toBeEnabled();
  await previous.tap();
  await expect(page).toHaveURL(/page=0/);
  await expect(pagination.getByRole("status")).toContainText("Сторінка 1 з");
  expect(pageErrors).toEqual([]);
});

test("All Films phone paging localizes and fits narrow widths in Android/iOS", async ({ page }) => {
  for (const scenario of [
    { lang: "uk", width: 320, previous: "Назад", next: "Далі", nav: "Сторінки фільмів" },
    { lang: "en", width: 393, previous: "Previous", next: "Next", nav: "Film pages" },
  ]) {
    await page.setViewportSize({ width: scenario.width, height: 852 });
    await page.goto(`/${scenario.lang}/films`);
    await waitForPageContent(page);
    await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
    const pagination = page.locator(`main nav[aria-label="${scenario.nav}"]`);
    const previous = pagination.getByRole("button", { name: scenario.previous, exact: true });
    const next = pagination.getByRole("button", { name: scenario.next, exact: true });
    await expect(previous).toBeVisible();
    await expect(previous).toBeDisabled();
    await expect(next).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(scenario.width);
    await next.tap();
    await expect(page).toHaveURL(/page=1/);
    await expect(previous).toBeEnabled();
    await previous.tap();
    await expect(page).toHaveURL(/page=0/);
  }
});
