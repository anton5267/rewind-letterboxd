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

  const geometry = await page.evaluate(() => {
    const grid = document.querySelector('main [class*="grid"]');
    const firstPoster = document.querySelector('main article a[href*="/films/"]');
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
      pagination: rect(document.querySelector('main nav[aria-label="Film pages"]')),
      footer: rect(document.querySelector("footer")),
      visibleNumberedPages: [...(document.querySelectorAll('main nav[aria-label="Film pages"] button[aria-label^="Page "]'))]
        .filter(button => getComputedStyle(button).display !== "none").length,
    };
  });
  console.log(`ALL_FILMS_DESKTOP_LIVE ${JSON.stringify(geometry)}`);
  expect(geometry.document).toBe(1440);
  expect(geometry.grid?.x).toBe(120);
  expect(geometry.grid?.width).toBe(1200);
  expect(geometry.grid?.y).toBeCloseTo(607, 0);
  expect(geometry.poster?.width).toBeCloseTo(174, 0);
  expect(geometry.visibleNumberedPages).toBeGreaterThan(0);

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261102/all-films-mobile-live");
  await mkdir(captureDirectory, { recursive: true });
  await page.screenshot({ path: resolve(captureDirectory, "runtime-en-desktop-1440x2956.png"), fullPage: true, scale: "css" });
  expect(pageErrors).toEqual([]);
});
