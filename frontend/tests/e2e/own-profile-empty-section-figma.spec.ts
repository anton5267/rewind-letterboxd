import { expect, test } from "@playwright/test";

const owner = { id: 94310, username: "emma-cerys", displayName: "Emma Cerys", role: "USER", email: "emma@example.invalid" };
const profile = {
  ...owner, avatarUrl: null, bannerUrl: null, bio: "", location: "", supabaseLinked: false,
  stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 }, lists: [], recentRatings: [], recentReviews: [],
};
const emptyPage = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 12 };

test("visible Figma Profile empty section matches its 361×92 mobile state", async ({ page }) => {
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: owner });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 204 });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/profile/me/social-links") return route.fulfill({ json: [] });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: emptyPage });
  });

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/profile");
  const section = page.locator("#profile-activity");
  await expect(section).toHaveAttribute("aria-busy", "false");
  await expect(section.getByRole("heading", { name: "Recent activity" })).toBeVisible();
  await expect(section.getByText("No activity yet.", { exact: true })).toBeVisible();
  await expect(section.locator(".previewHeading button")).toHaveCount(0);

  const geometry = await section.evaluate(element => {
    const box = element.getBoundingClientRect();
    const heading = element.querySelector("h2")!.getBoundingClientRect();
    const message = element.querySelector("p")!.getBoundingClientRect();
    return { x: box.x, width: box.width, height: box.height, headingY: heading.y, messageY: message.y };
  });
  expect(geometry.x).toBe(16);
  expect(geometry.width).toBe(361);
  expect(geometry.height).toBe(92);
  expect(geometry.messageY).toBeGreaterThan(geometry.headingY);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await section.evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 180, behavior: "instant" }));
  const unobscured = await page.evaluate(() => {
    const message = document.querySelector<HTMLElement>("#profile-activity p")!.getBoundingClientRect();
    const nav = document.querySelector<HTMLElement>("header nav[class*='mobileNav']")?.getBoundingClientRect();
    return { messageBottom: message.bottom, navTop: nav?.top ?? window.innerHeight };
  });
  expect(unobscured.messageBottom).toBeLessThanOrEqual(unobscured.navTop);
  await section.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-profile-empty-section-en-mobile-393.png" });

  await page.goto("/uk/profile");
  const ukrainianSection = page.locator("#profile-activity");
  await expect(ukrainianSection).toHaveAttribute("aria-busy", "false");
  await expect(ukrainianSection.getByRole("heading", { name: "Остання активність" })).toBeVisible();
  await expect(ukrainianSection.getByText("Активності поки немає.", { exact: true })).toBeVisible();
  expect(await ukrainianSection.evaluate(element => element.getBoundingClientRect().height)).toBe(92);
});
