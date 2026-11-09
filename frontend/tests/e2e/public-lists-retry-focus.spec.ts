import { expect, test, type Route } from "@playwright/test";

test("Public Lists popular tags Retry returns focus after another failure and recovery", async ({ page }) => {
  let tagAttempts = 0;
  const emptyPage = { content: [], number: 0, size: 6, totalElements: 0, totalPages: 0 };
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "public-lists-retry" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/tags/popular") {
      tagAttempts++;
      if (tagAttempts < 3) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({ json: [] });
    }
    if (pathname.startsWith("/api/lists/public")) return route.fulfill({ json: emptyPage });
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/lists/discover");
  const section = page.getByRole("region", { name: /популярні теги/i });
  const retry = section.getByRole("button", { name: /спробувати ще/i });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(() => tagAttempts).toBe(2);
  const repeatedRetry = section.getByRole("button", { name: /спробувати ще/i });
  await expect(repeatedRetry).toBeFocused();
  await repeatedRetry.press("Enter");
  await expect.poll(() => tagAttempts).toBe(3);
  const heading = page.getByRole("heading", { name: "Добірки", level: 1 });
  await expect(heading).toBeFocused();
  await expect(heading).toHaveCSS("outline-style", "solid");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
});
