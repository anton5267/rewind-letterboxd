import { expect, test, type Route } from "@playwright/test";

test("Community section Retry returns focus after another failure and after recovery", async ({ page }) => {
  let hqAttempts = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "community-retry-focus" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/users/hq") {
      hqAttempts++;
      if (hqAttempts < 3) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({ json: { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0, first: true, last: true } });
    }
    if (pathname === "/api/users/popular-reviewers") return route.fulfill({ json: [] });
    if (pathname === "/api/users/directory") return route.fulfill({ json: { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0, first: true, last: true } });
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/community");
  const section = page.locator('[data-community-section="hq"]');
  const retry = section.getByRole("button", { name: /спробувати ще/i });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(() => hqAttempts).toBe(2);
  const repeatedRetry = section.getByRole("button", { name: /спробувати ще/i });
  await expect(repeatedRetry).toBeFocused();
  await repeatedRetry.press("Enter");
  await expect.poll(() => hqAttempts).toBe(3);
  const heading = section.getByRole("heading");
  await expect(heading).toBeFocused();
  await expect(heading).toHaveCSS("outline-style", "solid");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
});
