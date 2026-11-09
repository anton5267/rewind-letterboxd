import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page, type Route } from "@playwright/test";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261103", "popular-retries");
mkdirSync(evidenceDir, { recursive: true });

type ApiReply = (route: Route) => Promise<void> | void;

async function installApi(page: Page, overrides: Record<string, ApiReply>) {
  await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
    const path = new URL(route.request().url()).pathname;
    const override = overrides[path];
    if (override) return override(route);
    if (path === "/api/users/me") return route.fulfill({ status: 401, json: { message: "Unauthenticated" } });
    if (path === "/api/auth/csrf") return route.fulfill({ json: { token: "retry-focus-csrf" } });
    if (path.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: [] });
  });
}

const reviewers = [{ id: 771001, username: "retry-reader", displayName: "Retry Reader", avatarUrl: null, likes: 8 }];
const reviews = [{
  id: 772001, movieId: 773001, movieTitle: "Retry Film", userId: 771001,
  username: "retry-reader", content: "A review returned after retry.", rating: 4,
  createdAt: "2026-10-20T12:00:00Z", moviePhotoUrl: null,
}];

test("popular reviews restores focus to Retry after repeated failure and to results after recovery", async ({ page }) => {
  let reviewAttempts = 0;
  await installApi(page, {
    "/api/users/popular-reviewers": route => route.fulfill({ json: reviewers }),
    "/api/reviews/popular": route => {
      reviewAttempts += 1;
      return reviewAttempts < 3
        ? route.fulfill({ status: 503, json: { message: "Temporary failure" } })
        : route.fulfill({ json: { content: reviews, totalPages: 1, totalElements: 1, number: 0, size: 4 } });
    },
  });

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/uk/reviews");
  await expect(page.getByRole("heading", { level: 1, name: "Популярні огляди" })).toBeVisible();
  const section = page.locator('[aria-labelledby="reviews-title"]');
  const retry = section.getByRole("button", { name: "Спробувати ще" });
  await expect(retry).toBeVisible();

  await retry.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => reviewAttempts).toBe(2);
  await expect(section).toHaveAttribute("aria-busy", "false");
  const repeatedFailure = section.getByRole("button", { name: "Спробувати ще" });
  await expect(repeatedFailure).toBeFocused();
  await expect(repeatedFailure).toHaveCSS("outline-style", "solid");

  await page.keyboard.press("Enter");
  await expect.poll(() => reviewAttempts).toBe(3);
  await expect(section.locator("article")).toHaveCount(1);
  await expect(section).toBeFocused();
  await expect(section).toHaveCSS("outline-style", "solid");
  expect(reviewAttempts).toBe(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: path.join(evidenceDir, "popular-reviews-mobile-uk-after-retry.png"), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await page.screenshot({ path: path.join(evidenceDir, "popular-reviews-desktop-uk-after-retry.png"), fullPage: true });
});

test("popular reviewers preserves a user's moved keyboard focus while retry is loading", async ({ page }) => {
  let reviewerAttempts = 0;
  let markSecondStarted!: () => void;
  let releaseSecond!: () => void;
  const secondStarted = new Promise<void>(resolve => { markSecondStarted = resolve; });
  const secondReply = new Promise<void>(resolve => { releaseSecond = resolve; });

  await installApi(page, {
    "/api/users/popular-reviewers": async route => {
      reviewerAttempts += 1;
      if (reviewerAttempts === 1) return route.fulfill({ status: 503, json: { message: "Temporary failure" } });
      markSecondStarted();
      await secondReply;
      return route.fulfill({ json: reviewers });
    },
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/community/reviewers");
  await expect(page.getByRole("heading", { level: 1, name: "Popular reviewers" })).toBeVisible();
  const results = page.locator("main > section");
  const retry = results.getByRole("button", { name: "Retry" });
  await expect(retry).toBeVisible();
  await retry.focus();
  await page.keyboard.press("Enter");
  await secondStarted;
  await expect(results).toHaveAttribute("aria-busy", "true");

  await page.keyboard.press("Tab");
  const movedFocusHtml = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.outerHTML ?? "");
  expect(movedFocusHtml).not.toBe("");
  expect(await retry.count()).toBe(0);
  releaseSecond();

  await expect(results.locator("#reviewer-list li")).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => (document.activeElement as HTMLElement | null)?.outerHTML ?? "")).toBe(movedFocusHtml);
  expect(reviewerAttempts).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await page.screenshot({ path: path.join(evidenceDir, "popular-reviewers-desktop-en-after-retry.png"), fullPage: true });
  await page.setViewportSize({ width: 393, height: 852 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: path.join(evidenceDir, "popular-reviewers-mobile-en-after-retry.png"), fullPage: true });
});

test("popular reviewers returns focus to Retry after another failed request", async ({ page }) => {
  let attempts = 0;
  await installApi(page, {
    "/api/users/popular-reviewers": route => {
      attempts += 1;
      return route.fulfill({ status: 503, json: { message: "Temporary failure" } });
    },
  });

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/community/reviewers");
  const results = page.locator("main > section");
  const retry = results.getByRole("button", { name: "Retry" });
  await expect(retry).toBeVisible();
  await retry.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => attempts).toBe(2);
  const nextRetry = results.getByRole("button", { name: "Retry" });
  await expect(nextRetry).toBeFocused();
  await expect(nextRetry).toHaveCSS("outline-style", "solid");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
});
