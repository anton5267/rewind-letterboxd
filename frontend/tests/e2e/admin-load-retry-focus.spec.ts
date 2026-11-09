import { expect, test, type Page, type Route } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261103", "admin-load-retry-focus");
mkdirSync(evidenceDir, { recursive: true });
type Target = "articles" | "conversations" | "notifications";
const admin = { id: 91001, username: "retry-admin", role: "ADMIN", displayName: "Retry Admin", email: "retry-admin@example.invalid", avatarUrl: null, isActive: true, isHq: false };
const emptyPage = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 50 };
const endpoint: Record<Target, string> = {
  articles: "/api/admin/journal/articles",
  conversations: "/api/admin/conversations",
  notifications: "/api/admin/notifications",
};
const headingLabel: Record<Target, { uk: RegExp; en: RegExp }> = {
  articles: { uk: /редактор журналу/i, en: /journal editor/i },
  conversations: { uk: /діалоги/i, en: /conversations/i },
  notifications: { uk: /сповіщення/i, en: /notifications/i },
};

async function installFixture(page: Page, target: Target, delayedSuccess = false) {
  let attempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ json: admin });
    if (url.pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "admin-load-retry" } });
    if (url.pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (url.pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (url.pathname === endpoint[target] && route.request().method() === "GET") {
      attempts++;
      if (attempts < 3) return route.fulfill({ status: 503, json: {} });
      if (delayedSuccess) await new Promise(resolve => setTimeout(resolve, 300));
      return route.fulfill({ json: emptyPage });
    }
    return route.fulfill({ json: emptyPage });
  });
  return () => attempts;
}

for (const { target, lang, width } of [
  { target: "articles" as const, lang: "uk", width: 393 },
  { target: "conversations" as const, lang: "en", width: 1440 },
  { target: "notifications" as const, lang: "uk", width: 1440 },
]) {
  test(`Admin ${target} Retry returns focus on repeated failure and recovery (${lang}/${width})`, async ({ page }) => {
    const getAttempts = await installFixture(page, target);
    await page.setViewportSize({ width, height: width < 500 ? 900 : 1000 });
    await page.goto(`/${lang}/admin?view=${target}`);
    const region = page.getByRole("region", { name: headingLabel[target][lang] });
    const retry = region.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(getAttempts).toBe(2);
    const retryAgain = region.getByRole("button", { name: /retry|try again|спробувати/i });
    await expect(retryAgain).toBeFocused();
    await retryAgain.press("Enter");
    await expect.poll(getAttempts).toBe(3);
    const heading = region.getByRole("heading").first();
    await expect(heading).toBeFocused();
    await expect(heading).toHaveCSS("outline-style", "solid");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    if (target === "articles" || target === "notifications") await page.screenshot({ path: path.join(evidenceDir, `${target}-${width < 500 ? "phone" : "desktop"}-${lang}.png`), fullPage: true });
  });
}

test("Admin Conversations Retry preserves manual Tab during delayed success", async ({ page }) => {
  const getAttempts = await installFixture(page, "conversations", true);
  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/admin?view=conversations");
  const region = page.getByRole("region", { name: headingLabel.conversations.uk });
  const retry = region.getByRole("button", { name: /retry|try again|спробувати/i });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(getAttempts).toBe(2);
  const retryAgain = region.getByRole("button", { name: /retry|try again|спробувати/i });
  await expect(retryAgain).toBeFocused();
  await retryAgain.press("Enter");
  await expect.poll(getAttempts).toBe(3);
  await expect(region).toHaveAttribute("aria-busy", "true");
  await page.keyboard.press("Tab");
  const active = await page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName);
  await expect(region).toHaveAttribute("aria-busy", "false");
  await expect(region.getByRole("heading")).not.toBeFocused();
  await expect.poll(async () => page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName)).toBe(active);
});

test("Admin Movies TMDB quality Retry returns focus after repeated failure and recovery", async ({ page }) => {
  let attempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ json: admin });
    if (url.pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "admin-quality-retry" } });
    if (url.pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (url.pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (url.pathname === "/api/admin/movies/tmdb-quality") {
      attempts++;
      if (attempts < 3) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({ json: { totalMovies: 0, tmdbLinkedMovies: 0, completeTmdbMovies: 0, missingPoster: 0, missingBackdrop: 0, missingPlot: 0, missingRuntime: 0, missingTrailer: 0, missingTmdbRating: 0, linkedCoveragePercent: 0, metadataCompletenessPercent: 0 } });
    }
    return route.fulfill({ json: emptyPage });
  });
  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/admin?view=movies");
  const region = page.getByRole("region", { name: /база фільмів/i });
  await region.getByText(/додати фільм/i).click();
  const retry = region.getByRole("button", { name: /retry|try again|спробувати/i });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(() => attempts).toBe(2);
  const retryAgain = region.getByRole("button", { name: /retry|try again|спробувати/i });
  await expect(retryAgain).toBeFocused();
  await retryAgain.press("Enter");
  await expect.poll(() => attempts).toBe(3);
  const heading = region.getByRole("heading", { name: /імпорт фільмів із tmdb/i });
  await expect(heading).toBeFocused();
  await expect(heading).toHaveCSS("outline-style", "solid");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: path.join(evidenceDir, "movies-quality-phone-uk.png"), fullPage: true });
});
