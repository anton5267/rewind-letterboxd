import { expect, test, type Page } from "@playwright/test";

const me = { id: 95160, username: "sheet-viewer", role: "USER", displayName: "Sheet Viewer", avatarUrl: null };
const owner = {
  id: 95161, username: "sheet-owner", displayName: "Sheet Owner", avatarUrl: null, hq: false,
  stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
  ratingDistribution: [], socialLinks: [], lists: [], recentReviews: [],
};
const member = { id: 95162, username: "sheet-member", displayName: "Sheet Member", avatarUrl: null, role: "USER", hq: false };
const emptyPage = { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 };

async function installFixture(page: Page, delaySuccess = false) {
  let blockStatusAttempts = 0;
  let targetSheetOpened = false;
  await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: me });
    if (pathname === "/api/users/95161/profile") return route.fulfill({ json: owner });
    if (pathname === "/api/users/95161/follow-status" || pathname === "/api/users/95161/block-status") return route.fulfill({ json: pathname.endsWith("follow-status") ? { following: false } : { blocked: false } });
    if (pathname === "/api/users/95161/following") return route.fulfill({ json: { ...emptyPage, content: [member], totalElements: 1, totalPages: 1 } });
    if (pathname === "/api/users/95162/follow-status") return route.fulfill({ json: { following: false } });
    if (pathname === "/api/users/95162/block-status") {
      if (!targetSheetOpened) return route.fulfill({ json: { blocked: false } });
      blockStatusAttempts += 1;
      if (blockStatusAttempts < 3) return route.fulfill({ status: 503, json: {} });
      if (delaySuccess) await new Promise(resolve => setTimeout(resolve, 400));
      return route.fulfill({ json: { blocked: false } });
    }
    if (pathname.endsWith("/followers") || pathname.endsWith("/following")) return route.fulfill({ json: emptyPage });
    if (pathname.endsWith("/activity") || pathname.endsWith("/lists") || pathname.endsWith("/liked-reviews")) return route.fulfill({ json: emptyPage });
    if (pathname.includes("/collections/")) return route.fulfill({ json: emptyPage });
    if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: [] });
  });
  return { attempts: () => blockStatusAttempts, openSheet: () => { targetSheetOpened = true; } };
}

async function openMemberSheet(page: Page, openSheet: () => void) {
  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/uk/users/95161?view=following");
  const row = page.locator('[data-network-member-id="95162"]');
  await expect(row).toBeVisible();
  openSheet();
  await row.locator('[data-network-action="more"]').click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const blockError = dialog.getByRole("alert").filter({ hasText: /стан блокування/i }).last();
  await expect(blockError).toBeVisible();
  return { dialog, blockError };
}

async function installFollowMutationFailureFixture(page: Page) {
  let followMutations = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: me });
    if (pathname === "/api/users/95161/profile") return route.fulfill({ json: owner });
    if (pathname === "/api/users/95161/follow-status" || pathname === "/api/users/95161/block-status") return route.fulfill({ json: pathname.endsWith("follow-status") ? { following: false } : { blocked: false } });
    if (pathname === "/api/users/95161/following") return route.fulfill({ json: { ...emptyPage, content: [member], totalElements: 1, totalPages: 1 } });
    if (pathname === "/api/users/95162/follow-status") return route.fulfill({ json: { following: false } });
    if (pathname === "/api/users/95162/block-status") return route.fulfill({ json: { blocked: false } });
    if (pathname === "/api/users/95162/follow" && route.request().method() === "POST") {
      followMutations += 1;
      return route.fulfill({ status: 503, json: {} });
    }
    if (pathname.endsWith("/followers") || pathname.endsWith("/following")) return route.fulfill({ json: emptyPage });
    if (pathname.endsWith("/activity") || pathname.endsWith("/lists") || pathname.endsWith("/liked-reviews")) return route.fulfill({ json: emptyPage });
    if (pathname.includes("/collections/")) return route.fulfill({ json: emptyPage });
    if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: [] });
  });
  return () => followMutations;
}

test("member sheet block-status Retry restores focus after repeated failure and success", async ({ page }) => {
  const fixture = await installFixture(page);
  const { dialog, blockError } = await openMemberSheet(page, fixture.openSheet);
  const retry = blockError.getByRole("button", { name: "Спробувати ще" });
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(fixture.attempts).toBe(2);
  const retryAgain = dialog.getByRole("alert").filter({ hasText: /стан блокування/i }).last().getByRole("button", { name: "Спробувати ще" });
  await expect(retryAgain).toBeFocused();

  await retryAgain.press("Enter");
  await expect.poll(fixture.attempts).toBe(3);
  const blockAction = dialog.getByRole("button", { name: "Заблокувати", exact: true });
  await expect(blockAction).toBeEnabled();
  await expect(blockAction).toBeFocused();
  await expect(blockAction).toHaveCSS("outline-style", "solid");
  await expect(page.locator("html")).toHaveJSProperty("scrollWidth", 393);
});

test("member sheet block-status Retry does not steal focus after manual Tab", async ({ page }) => {
  const fixture = await installFixture(page, true);
  const { dialog, blockError } = await openMemberSheet(page, fixture.openSheet);
  const retry = blockError.getByRole("button", { name: "Спробувати ще" });
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(fixture.attempts).toBe(2);
  const retryAgain = dialog.getByRole("alert").filter({ hasText: /стан блокування/i }).last().getByRole("button", { name: "Спробувати ще" });
  await expect(retryAgain).toBeFocused();
  await retryAgain.press("Enter");
  await expect.poll(fixture.attempts).toBe(3);
  await page.keyboard.press("Tab");
  const manualFocus = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent?.trim() || document.activeElement?.tagName);
  const blockAction = dialog.getByRole("button", { name: "Заблокувати", exact: true });
  await expect(blockAction).toBeEnabled();
  await expect(blockAction).not.toBeFocused();
  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent?.trim() || document.activeElement?.tagName)).toBe(manualFocus);
});

test("member sheet follow Retry restores focus after the failed action status is refreshed", async ({ page }) => {
  const mutationCount = await installFollowMutationFailureFixture(page);
  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/uk/users/95161?view=following");
  const row = page.locator('[data-network-member-id="95162"]');
  await expect(row).toBeVisible();
  await row.locator('[data-network-action="more"]').click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const followAction = dialog.getByRole("button", { name: "Підписатися", exact: true });
  await expect(followAction).toBeEnabled();
  await followAction.click();
  await expect.poll(mutationCount).toBe(1);
  const actionError = dialog.getByRole("alert").filter({ hasText: /Не вдалося змінити підписку/i });
  await expect(actionError).toBeVisible();
  const retry = actionError.getByRole("button", { name: "Спробувати ще" });
  await retry.focus();
  await retry.press("Enter");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Підписатися", exact: true })).toBeEnabled();
  await expect(dialog.getByRole("button", { name: "Підписатися", exact: true })).toBeFocused();
  expect(mutationCount()).toBe(1);
});
