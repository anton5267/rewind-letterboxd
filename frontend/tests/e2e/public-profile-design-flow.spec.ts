import { expect, test } from "@playwright/test";

const emptyPage = { content: [], totalPages: 0, totalElements: 0 };

test("public profile mobile follows the Figma identity geometry and contains long names", async ({ page }) => {
  let displayName = "Jeremy B.";
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/users/981234/profile") {
      await route.fulfill({ json: {
        id: 981234,
        username: "jeremy-b",
        displayName,
        avatarUrl: null,
        hq: false,
        stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
        ratingDistribution: [],
        socialLinks: [],
        lists: [],
        recentReviews: [],
      } });
      return;
    }
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    await route.fulfill({ json: emptyPage });
  });

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/users/981234");
  await expect(page.getByRole("heading", { name: "Jeremy B.", level: 1 })).toBeVisible();
  await expect(page.locator('[class*="mobilePublicProfile"] .logo')).toBeHidden();

  const avatar = page.locator('[class*="avatarFallback"]').first();
  const avatarBox = await avatar.boundingBox();
  expect(avatarBox?.x).toBeCloseTo(136.5, 1);
  expect(avatarBox?.y).toBe(190);
  expect(avatarBox?.width).toBe(120);
  expect(avatarBox?.height).toBe(120);

  const titleBox = await page.getByRole("heading", { name: "Jeremy B.", level: 1 }).boundingBox();
  expect(titleBox?.x).toBeGreaterThan(134);
  expect(titleBox?.x).toBeLessThan(141);
  expect(titleBox?.y).toBe(317);
  expect(titleBox?.height).toBeCloseTo(28.08, 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

  displayName = "A public profile name that is deliberately very long ".repeat(4);
  await page.goto("/en/users/981234");
  await expect(page.getByRole("heading", { name: displayName, level: 1 })).toBeVisible();
  const longTitle = await page.getByRole("heading", { name: displayName, level: 1 }).boundingBox();
  expect(longTitle?.x).toBeGreaterThanOrEqual(16);
  expect((longTitle?.x ?? 0) + (longTitle?.width ?? 0)).toBeLessThanOrEqual(377);
  const longAvatar = await page.locator('[class*="avatarFallback"]').first().boundingBox();
  expect(longAvatar).toMatchObject({ x: 136.5, y: 190, width: 120, height: 120 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});
