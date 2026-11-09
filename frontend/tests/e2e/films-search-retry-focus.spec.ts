import { expect, test, type Page, type Route } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261103", "films-search-retry-focus");
mkdirSync(evidenceDir, { recursive: true });
const emptyPage = { content: [], number: 0, size: 36, totalElements: 0, totalPages: 0 };

async function installFixture(page: Page, target: "genres" | "results", delayedSuccess = false) {
  let attempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (url.pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (url.pathname === "/api/genres") {
      if (target === "genres") {
        attempts++;
        if (attempts < 3) return route.fulfill({ status: 503, json: {} });
        if (delayedSuccess) await new Promise(resolve => setTimeout(resolve, 300));
      }
      return route.fulfill({ json: [{ id: 1, name: "Drama" }] });
    }
    if (url.pathname === "/api/movies/search") {
      if (target === "results") {
        attempts++;
        if (attempts < 3) return route.fulfill({ status: 503, json: {} });
        if (delayedSuccess) await new Promise(resolve => setTimeout(resolve, 300));
      }
      return route.fulfill({ json: emptyPage });
    }
    return route.fulfill({ json: [] });
  });
  return () => attempts;
}

for (const { target, lang, width } of [
  { target: "genres" as const, lang: "uk", width: 393 },
  { target: "genres" as const, lang: "en", width: 1440 },
  { target: "results" as const, lang: "en", width: 393 },
  { target: "results" as const, lang: "uk", width: 1440 },
]) {
  test(`Films ${target} Retry restores focus after repeated failure and recovery (${lang}/${width})`, async ({ page }) => {
    const getAttempts = await installFixture(page, target);
    await page.setViewportSize({ width, height: width < 500 ? 900 : 1000 });
    await page.goto(`/${lang}/films`);
    const retry = page.locator(`[data-search-retry="${target}"]`).getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(getAttempts).toBe(2);
    const retryAgain = page.locator(`[data-search-retry="${target}"]`).getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retryAgain).toBeFocused();
    await retryAgain.press("Enter");
    await expect.poll(getAttempts).toBe(3);
    const focusTarget = target === "genres"
      ? width < 768 ? page.getByRole("button", { name: /filters|фільтри/i }) : page.locator("#film-search-genre")
      : page.locator("[data-search-results-focus]");
    await expect(focusTarget).toBeFocused();
    await expect(focusTarget).toHaveCSS("outline-style", "solid");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    if ((target === "genres" && width < 500) || (target === "results" && width === 1440)) await page.screenshot({ path: path.join(evidenceDir, `${target}-${width < 500 ? "phone" : "desktop"}-${lang}.png`), fullPage: true });
  });
}

test("Films Search Retry preserves manual Tab during delayed success", async ({ page }) => {
  const getAttempts = await installFixture(page, "results", true);
  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/films");
  const retry = page.locator('[data-search-retry="results"]').getByRole("button", { name: /retry|try again|спробувати/i });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(getAttempts).toBe(2);
  const retryAgain = page.locator('[data-search-retry="results"]').getByRole("button", { name: /retry|try again|спробувати/i });
  await expect(retryAgain).toBeFocused();
  await retryAgain.press("Enter");
  await expect.poll(getAttempts).toBe(3);
  const pageRoot = page.locator("main[aria-labelledby='films-page-title']");
  await expect(pageRoot).toHaveAttribute("aria-busy", "true");
  await page.keyboard.press("Tab");
  const active = await page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName);
  await expect(pageRoot).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("[data-search-results-focus]")).not.toBeFocused();
  await expect.poll(async () => page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName)).toBe(active);
});
