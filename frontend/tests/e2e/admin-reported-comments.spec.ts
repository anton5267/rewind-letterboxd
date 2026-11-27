import { expect, test } from "@playwright/test";
import { resolve } from "node:path";

test("admin all reported comments matches the three-card Figma page and pagination", async ({ page }) => {
  const admin = { id: 960101, username: "report-admin", role: "ADMIN", avatarUrl: null };
  const comments = Array.from({ length: 4 }, (_, index) => ({
    id: 960110 + index, reviewId: index + 1, listId: null, userId: 960120 + index,
    username: ["Best_Prices_4U", "Dark_Knight_X", "Hater_88", "cinemafan"][index],
    email: `comment${index}@example.invalid`, content: `Fixture reported comment ${index}.`, isHidden: false,
    moderatedReason: null, moderatedAt: null, createdAt: `2026-01-0${index + 1}T00:00:00Z`,
    reportId: 961110 + index, reportReason: ["SPAM", "INAPPROPRIATE_CONTENT", "BULLYING"][index % 3],
    reportCreatedAt: `2026-01-1${index + 1}T00:00:00Z`, relatedTitle: ["Inception", "Basic Instinct", "The Marvels", "Past Lives"][index],
    parentLikesCount: [22, 3, 11, 0][index], parentRepliesCount: [7, 1, 2, 0][index],
  }));
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: admin });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "reported-comments-e2e" } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/admin/reported-comments") return route.fulfill({ json: { content: comments, totalPages: 1, totalElements: comments.length, number: 0, size: 50 } });
    if (/^\/api\/admin\/comments\/\d+\/history$/.test(pathname)) return route.fulfill({ json: [] });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 50 } });
  });

  await page.setViewportSize({ width: 1440, height: 2855 });
  await page.goto("/en/admin?view=reported-comments");
  const section = page.getByRole("region", { name: "All Reported Comments" });
  await expect(section.getByRole("article")).toHaveCount(3);
  await expect(section.getByText("Inception")).toBeVisible();
  await expect(section.getByText("Best_Prices_4U")).toBeVisible();
  await expect(section.getByText("Spam")).toBeVisible();
  const cards = section.getByRole("article");
  const first = await cards.nth(0).boundingBox();
  const second = await cards.nth(1).boundingBox();
  const third = await cards.nth(2).boundingBox();
  expect(first?.x).toBe(120);
  expect(first?.y).toBeCloseTo(1219, 0);
  expect(first?.height).toBe(288);
  expect(second?.y).toBeCloseTo(1592, 0);
  expect(second?.height).toBe(288);
  expect(third?.y).toBeCloseTo(1965, 0);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261124/admin-moderation/rewind-reported-comments-en-desktop-1440x2855.png"), fullPage: false });
  await section.getByRole("button", { name: "Next" }).click();
  await expect(section.getByRole("article")).toHaveCount(1);
  await expect(section.getByText("Past Lives")).toBeVisible();
  await section.getByRole("link", { name: "Edit Comment" }).click();
  await expect(page.getByRole("region", { name: "Edit Reported Comment" })).toBeVisible();

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/admin?view=reported-comments");
  await expect(page.getByRole("region", { name: "All Reported Comments" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
});
