import { expect, test, type Page, type Route } from "@playwright/test";

const user = { id: 985010, username: "list-like-owner", role: "USER", displayName: "List Like Owner", avatarUrl: null };
const list = {
  id: 985000, name: "Like retry list", description: "A public list for retry focus coverage.", ownerId: 985011,
  ownerUsername: "FilmOracle", ownerAvatarUrl: null, tags: [], likeCount: 3, movies: [],
};

async function installFixture(page: Page, mode: "status" | "mutation") {
  let attempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: user });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "list-like-retry" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/lists/public/985000") return route.fulfill({ json: list });
    if (pathname === "/api/lists/public/985000/like-status") {
      if (mode !== "status") return route.fulfill({ json: { liked: false, likes: 3 } });
      attempts++;
      if (attempts < 3) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({ json: { liked: false, likes: 3 } });
    }
    if (pathname === "/api/lists/985000/likes" && route.request().method() === "POST") {
      if (mode !== "mutation") return route.fulfill({ status: 204 });
      attempts++;
      if (attempts < 3) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ json: [] });
  });
  return () => attempts;
}

async function openSurface(page: Page, mode: "desktop" | "phone") {
  if (mode === "phone") {
    await page.getByRole("button", { name: "Інформація про список" }).click();
    return page.getByRole("dialog", { name: "Like retry list" });
  }
  return page.locator("[data-public-list-actions]");
}

for (const mode of ["desktop", "phone"] as const) {
  test(`Public List like-status Retry remains focused after repeat failure and focuses action on recovery (${mode})`, async ({ page }) => {
    const attempts = await installFixture(page, "status");
    await page.setViewportSize(mode === "phone" ? { width: 393, height: 900 } : { width: 1440, height: 1000 });
    await page.goto("/uk/lists/public/985000");
    await expect.poll(attempts).toBe(1);
    const surface = await openSurface(page, mode);
    const retry = surface.locator("[data-list-like-status-error] [data-retry-button]");
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(attempts).toBe(2);
    const repeated = surface.locator("[data-list-like-status-error] [data-retry-button]");
    await expect(repeated).toBeFocused();
    await repeated.press("Enter");
    await expect.poll(attempts).toBe(3);
    await expect(surface.locator("[data-list-like-action]")).toBeFocused();
  });

  test(`Public List like mutation Retry remains actionable after repeat failure (${mode})`, async ({ page }) => {
    const attempts = await installFixture(page, "mutation");
    await page.setViewportSize(mode === "phone" ? { width: 393, height: 900 } : { width: 1440, height: 1000 });
    await page.goto("/uk/lists/public/985000");
    const surface = await openSurface(page, mode);
    const like = surface.locator("[data-list-like-action]");
    await expect(like).toBeVisible();
    await expect(like).toBeEnabled();
    await like.focus();
    await like.press("Enter");
    await expect.poll(attempts).toBe(1);
    let retry = surface.locator("[data-list-like-mutation-error] [data-retry-button]");
    await expect(retry).toBeFocused();
    await retry.press("Enter");
    await expect.poll(attempts).toBe(2);
    retry = surface.locator("[data-list-like-mutation-error] [data-retry-button]");
    await expect(retry).toBeFocused();
    await retry.press("Enter");
    await expect.poll(attempts).toBe(3);
    await expect(like).toBeFocused();
    await expect(like).toHaveAttribute("aria-pressed", "true");
  });
}
