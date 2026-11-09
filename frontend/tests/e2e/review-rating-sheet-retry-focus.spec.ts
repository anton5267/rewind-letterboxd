import { expect, test, type Page, type Route } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "functional-audit-20261103", "rating-sheet-retry-focus");
mkdirSync(evidenceDir, { recursive: true });
const user = { id: 95271, username: "rating-sheet-owner", role: "USER", displayName: "Rating Sheet Owner", avatarUrl: null };
const review = {
  id: 95272, content: "A review used to verify rating sheet Retry focus.", rating: 4,
  createdAt: "2026-10-01T12:00:00Z",
  author: { id: 95273, username: "review-author", displayName: "Review Author", avatarUrl: null },
  movie: { id: 95274, title: "Retry Film", releaseDate: "2020-01-01", durationMinutes: 120, ageRating: "12+", photoUrl: null, backdropUrl: null, trailerUrl: null },
  likes: 3, likedBy: [],
};

async function openRatingSheet(page: Page, lang: "uk" | "en", width: number) {
  const trigger = width < 500
    ? page.getByRole("button", { name: lang === "uk" ? "Додаткові дії" : "More options" })
    : page.getByRole("button", { name: lang === "uk" ? /оцінити фільм/i : /rate film/i });
  await expect(trigger).toBeVisible();
  await trigger.click();
  return page.getByRole("dialog", { name: "Retry Film" });
}

async function installFixture(page: Page, endpoint: "rating" | "like-status" | "like-mutation", delayedSuccess = false) {
  let attempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: user });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "rating-sheet-retry" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/reviews/95272") return route.fulfill({ json: review });
    if (pathname === "/api/reviews/95272/like-status") {
      if (endpoint !== "like-status") return route.fulfill({ json: { liked: false, likes: 3 } });
      attempts++;
      if (attempts < 3) return route.fulfill({ status: 503, json: {} });
      if (delayedSuccess) await new Promise(resolve => setTimeout(resolve, 350));
      return route.fulfill({ json: { liked: false, likes: 3 } });
    }
    if (pathname === "/api/reviews/95272/likes" && route.request().method() === "POST") {
      if (endpoint !== "like-mutation") return route.fulfill({ status: 204 });
      attempts++;
      if (attempts < 3) return route.fulfill({ status: 503, json: {} });
      if (delayedSuccess) await new Promise(resolve => setTimeout(resolve, 350));
      return route.fulfill({ status: 204 });
    }
    if (pathname === "/api/movies/95274/rating/me") {
      if (endpoint !== "rating") return route.fulfill({ json: { rating: 0 } });
      attempts++;
      if (attempts < 3) return route.fulfill({ status: 503, json: {} });
      if (delayedSuccess) await new Promise(resolve => setTimeout(resolve, 350));
      return route.fulfill({ json: { rating: 0 } });
    }
    return route.fulfill({ json: [] });
  });
  return () => attempts;
}

for (const lang of ["uk", "en"] as const) {
  test(`Rating Sheet like action Retry stays available after repeated mutation failure (${lang})`, async ({ page }) => {
    const attempts = await installFixture(page, "like-mutation");
    const width = lang === "uk" ? 393 : 1440;
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/${lang}/reviews/95272`);
    const dialog = await openRatingSheet(page, lang, width);
    const like = dialog.getByRole("button", { name: lang === "uk" ? "Вподобати Retry Film" : "Like Retry Film" });
    await expect(like).toBeEnabled();
    await like.focus();
    await like.press("Enter");
    await expect.poll(attempts).toBe(1);
    let retry = dialog.locator("[data-like-mutation-error] [data-retry-button]");
    await expect(retry).toBeFocused();
    await retry.press("Enter");
    await expect.poll(attempts).toBe(2);
    retry = dialog.locator("[data-like-mutation-error] [data-retry-button]");
    await expect(retry).toBeFocused();
    await retry.press("Enter");
    await expect.poll(attempts).toBe(3);
    await expect(dialog.getByRole("button", { name: lang === "uk" ? "Прибрати вподобання Retry Film" : "Unlike Retry Film" })).toBeFocused();
    await page.screenshot({ path: path.join(evidenceDir, `rating-like-mutation-${lang}-${width}.png`), fullPage: true });
  });
}

for (const lang of ["uk", "en"] as const) {
  test(`Review desktop like-status Retry returns focus after failure and recovery (${lang})`, async ({ page }) => {
    const attempts = await installFixture(page, "like-status");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/${lang}/reviews/95272`);
    const retry = page.locator("[data-review-like-status-error] [data-retry-button]");
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(attempts).toBe(2);
    const repeated = page.locator("[data-review-like-status-error] [data-retry-button]");
    await expect(repeated).toBeFocused();
    await repeated.press("Enter");
    await expect.poll(attempts).toBe(3);
    await expect(page.locator("[data-review-like-action]")).toBeFocused();
    if (lang === "uk") await page.screenshot({ path: path.join(evidenceDir, "review-like-status-desktop-uk.png"), fullPage: true });
  });

  test(`Review desktop like mutation Retry returns focus after failure and recovery (${lang})`, async ({ page }) => {
    const attempts = await installFixture(page, "like-mutation");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/${lang}/reviews/95272`);
    const like = page.locator("[data-review-like-action]");
    await expect(like).toBeVisible();
    await like.focus();
    await like.press("Enter");
    await expect.poll(attempts).toBe(1);
    let retry = page.locator("[data-review-like-mutation-error] [data-retry-button]");
    await expect(retry).toBeFocused();
    await retry.press("Enter");
    await expect.poll(attempts).toBe(2);
    retry = page.locator("[data-review-like-mutation-error] [data-retry-button]");
    await expect(retry).toBeFocused();
    await retry.press("Enter");
    await expect.poll(attempts).toBe(3);
    await expect(page.locator("[data-review-like-action]")).toBeFocused();
    if (lang === "uk") await page.screenshot({ path: path.join(evidenceDir, "review-like-mutation-desktop-uk.png"), fullPage: true });
  });

  test(`Rating Sheet score Retry restores focus after repeated error and recovery (${lang})`, async ({ page }) => {
    const attempts = await installFixture(page, "rating");
    await page.setViewportSize({ width: lang === "uk" ? 393 : 1440, height: 1000 });
    await page.goto(`/${lang}/reviews/95272`);
    await expect(page.getByRole("heading", { name: "Retry Film" })).toBeVisible();
    const dialog = await openRatingSheet(page, lang, lang === "uk" ? 393 : 1440);
    const retry = dialog.locator("[data-rating-load-error] [data-retry-button]");
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(attempts).toBe(2);
    const repeat = dialog.locator("[data-rating-load-error] [data-retry-button]");
    await expect(repeat).toBeFocused();
    await repeat.press("Enter");
    await expect.poll(attempts).toBe(3);
    const firstStar = dialog.getByRole("button", { name: lang === "uk" ? "Оцінити на 1" : "Rate as 1" });
    await expect(firstStar).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(lang === "uk" ? 393 : 1440);
    await page.screenshot({ path: path.join(evidenceDir, `rating-score-${lang}-${lang === "uk" ? 393 : 1440}.png`), fullPage: true });
  });

  test(`Rating Sheet like-status Retry restores focus after repeated error and recovery (${lang})`, async ({ page }) => {
    const attempts = await installFixture(page, "like-status");
    const width = lang === "uk" ? 393 : 1440;
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/${lang}/reviews/95272`);
    await expect.poll(attempts).toBe(1);
    const dialog = await openRatingSheet(page, lang, width);
    const retry = dialog.locator("[data-like-status-error] [data-retry-button]");
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(attempts).toBe(2);
    const repeat = dialog.locator("[data-like-status-error] [data-retry-button]");
    await expect(repeat).toBeFocused();
    await repeat.press("Enter");
    await expect.poll(attempts).toBe(3);
    await expect(dialog.getByRole("button", { name: lang === "uk" ? "Вподобати Retry Film" : "Like Retry Film" })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(lang === "uk" ? 393 : 1440);
    await page.screenshot({ path: path.join(evidenceDir, `rating-like-${lang}-${width}.png`), fullPage: true });
  });
}

test("Rating Sheet preserves manual Tab while a like-status Retry is pending", async ({ page }) => {
  const attempts = await installFixture(page, "like-status", true);
  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/reviews/95272");
  await expect.poll(attempts).toBe(1);
  const dialog = await openRatingSheet(page, "uk", 393);
  const retry = dialog.locator("[data-like-status-error] [data-retry-button]");
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(attempts).toBe(2);
  const repeat = dialog.locator("[data-like-status-error] [data-retry-button]");
  await expect(repeat).toBeFocused();
  await repeat.press("Enter");
  await expect.poll(attempts).toBe(3);
  const likeButton = dialog.getByRole("button", { name: "Вподобати Retry Film" });
  await expect(likeButton).toBeDisabled();
  await page.keyboard.press("Tab");
  const manualFocus = await page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName);
  await expect(likeButton).toBeEnabled();
  await expect(likeButton).not.toBeFocused();
  await expect.poll(async () => page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label") || document.activeElement?.tagName)).toBe(manualFocus);
});
