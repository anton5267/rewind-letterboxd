import { expect, test, type Page, type Route } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261103", "newsletter-retry-focus");
mkdirSync(evidenceDir, { recursive: true });

const user = { id: 95150, username: "newsletter-owner", role: "USER", displayName: "Newsletter Owner", avatarUrl: null };
const profile = {
  ...user,
  email: "newsletter-owner@example.invalid",
  stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
  ratingDistribution: [], socialLinks: [], lists: [], recentRatings: [], recentReviews: [],
};
const emptyPage = { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 };

async function installFixture(page: Page, options: { newsletterLoadFails?: boolean; newsletterSaveFails?: boolean; delayFinalSave?: boolean } = {}) {
  let getAttempts = 0;
  let saveAttempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    const method = route.request().method();
    if (pathname === "/api/users/me") return route.fulfill({ json: user });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/profile/me/social-links") return route.fulfill({ json: [] });
    if (pathname === "/api/profile/me/favorites" || pathname.endsWith("/ratings") || pathname.endsWith("/reviews")) return route.fulfill({ json: emptyPage });
    if (pathname.endsWith("/activity")) return route.fulfill({ json: { content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 } });
    if (pathname.endsWith("/following") || pathname.endsWith("/followers")) return route.fulfill({ json: { content: [], number: 0, size: 8, totalElements: 0, totalPages: 0 } });
    if (pathname === "/api/lists/my") return route.fulfill({ json: [] });
    if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/newsletter/subscription" && method === "GET") {
      getAttempts++;
      if (options.newsletterLoadFails && getAttempts < 3) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({ json: { subscribed: false } });
    }
    if (pathname === "/api/newsletter/subscription" && method === "PUT") {
      saveAttempts++;
      if (options.newsletterSaveFails && saveAttempts < 3) return route.fulfill({ status: 503, json: {} });
      if (options.delayFinalSave && saveAttempts === 3) await new Promise(resolve => setTimeout(resolve, 300));
      return route.fulfill({ json: { subscribed: true } });
    }
    return route.fulfill({ json: [] });
  });
  return { getAttempts: () => getAttempts, saveAttempts: () => saveAttempts };
}

for (const { width, label } of [
  { width: 393, label: "phone" },
  { width: 1440, label: "desktop" },
]) {
  test(`Newsletter preference GET Retry recovers focus through repeated failure and success on ${label}`, async ({ page }) => {
    const attempts = await installFixture(page, { newsletterLoadFails: true });
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await page.goto("/uk/profile#newsletter-settings");
    const section = page.locator("#newsletter-settings").locator("..");
    const retry = section.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(attempts.getAttempts).toBe(2);
    await expect(section.getByRole("button", { name: /retry|try again|спробувати/i })).toBeFocused();

    await section.getByRole("button", { name: /retry|try again|спробувати/i }).press("Enter");
    await expect.poll(attempts.getAttempts).toBe(3);
    await expect(page.locator("#newsletter-settings")).toBeFocused();
    await expect(page.locator("#newsletter-settings")).toHaveCSS("outline-style", "solid");
    await expect(section.locator("input[type=checkbox]")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({ path: path.join(evidenceDir, `newsletter-load-retry-${width === 393 ? "mobile" : "desktop"}-uk.png`), fullPage: true });
  });
}

for (const { width, label } of [
  { width: 393, label: "phone" },
  { width: 1440, label: "desktop" },
]) {
  test(`Newsletter preference SAVE Retry recovers focus after repeated failure and success on ${label}`, async ({ page }) => {
    const attempts = await installFixture(page, { newsletterSaveFails: true });
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await page.goto("/en/profile#newsletter-settings");
    const section = page.locator("#newsletter-settings").locator("..");
    const checkbox = section.locator("input[type=checkbox]");
    await expect(checkbox).toBeVisible();
    await checkbox.click();
    await expect.poll(attempts.saveAttempts).toBe(1);
    const retry = section.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(attempts.saveAttempts).toBe(2);
    await expect(section.getByRole("button", { name: /retry|try again|спробувати/i })).toBeFocused();

    await section.getByRole("button", { name: /retry|try again|спробувати/i }).press("Enter");
    await expect.poll(attempts.saveAttempts).toBe(3);
    await expect(page.locator("#newsletter-settings")).toBeFocused();
    await expect(checkbox).toBeChecked();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({ path: path.join(evidenceDir, `newsletter-save-retry-${width === 393 ? "mobile" : "desktop"}-en.png`), fullPage: true });
  });
}

for (const { width, label } of [
  { width: 393, label: "phone" },
  { width: 1440, label: "desktop" },
]) {
  test(`Newsletter SAVE Retry preserves manual Tab while the update is pending on ${label}`, async ({ page }) => {
    const attempts = await installFixture(page, { newsletterSaveFails: true, delayFinalSave: true });
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    await page.goto("/uk/profile#newsletter-settings");
    const section = page.locator("#newsletter-settings").locator("..");
    const checkbox = section.locator("input[type=checkbox]");
    await expect(checkbox).toBeVisible();
    await checkbox.click();
    await expect.poll(attempts.saveAttempts).toBe(1);
    const retry = section.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(attempts.saveAttempts).toBe(2);
    const retryAgain = section.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retryAgain).toBeFocused();
    await retryAgain.press("Enter");
    await expect.poll(attempts.saveAttempts).toBe(3);
    await expect(section).toHaveAttribute("aria-busy", "true");
    await page.keyboard.press("Tab");
    const manualFocus = await page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName);
    await expect(section).toHaveAttribute("aria-busy", "false");
    await expect(page.locator("#newsletter-settings")).not.toBeFocused();
    await expect.poll(async () => page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName)).toBe(manualFocus);
  });
}
