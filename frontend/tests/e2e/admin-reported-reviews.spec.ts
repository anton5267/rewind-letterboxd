import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("admin all reported reviews matches the three-card Figma page and pagination", async ({ page }) => {
  const admin = { id: 960001, username: "report-admin", role: "ADMIN", avatarUrl: null };
  const reviews = Array.from({ length: 4 }, (_, index) => ({
    id: 960010 + index, movieId: index + 1, movieTitle: ["Dune: Part Two", "Poor Things", "The Marvels", "Past Lives"][index],
    userId: 960020 + index, username: ["PixelRogue", "Midnight", "RealTalker89", "cinemafan"][index], email: `review${index}@example.invalid`,
    content: index === 0 ? "An absolute cinematic masterpiece that everyone needs to experience in IMAX. The visuals, the sound design, the pacing — everything works flawlessly. I honestly can’t imagine watching this anywhere else. If you truly love cinema, this is the kind of film you should be supporting on the biggest screen possible, preferably with premium seating and the full surround experience." : `Fixture reported review ${index}. `.repeat(index === 1 ? 18 : 14),
    rating: 1, isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: `2026-01-0${index + 1}T00:00:00Z`,
    reportId: 961010 + index, reportReason: ["SPAM", "INAPPROPRIATE_CONTENT", "BULLYING"][index % 3], reportCreatedAt: `2026-01-1${index + 1}T00:00:00Z`, likesCount: index, commentsCount: index ? 0 : 1,
  }));
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: admin });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "reported-reviews-e2e" } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/admin/reported-reviews") return route.fulfill({ json: { content: reviews, totalPages: 1, totalElements: reviews.length, number: 0, size: 50 } });
    if (/^\/api\/admin\/reviews\/\d+\/history$/.test(pathname)) return route.fulfill({ json: [] });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 50 } });
  });

  await page.setViewportSize({ width: 1440, height: 3217 });
  await page.goto("/en/admin?view=reported-reviews");
  const section = page.getByRole("region", { name: "All Reported Reviews" });
  await expect(section.getByRole("article")).toHaveCount(3);
  await expect(section.getByText("Dune: Part Two")).toBeVisible();
  await expect(section.getByText("PixelRogue")).toBeVisible();
  await expect(section.getByText("Spam")).toBeVisible();
  const cards = section.getByRole("article");
  const first = await cards.nth(0).boundingBox();
  const second = await cards.nth(1).boundingBox();
  const third = await cards.nth(2).boundingBox();
  expect(first?.x).toBe(120);
  expect(first?.y).toBeCloseTo(1219, 0);
  expect(first?.height).toBe(429);
  expect(second?.y).toBeCloseTo(1732, 0);
  expect(second?.height).toBe(401);
  expect(third?.y).toBeCloseTo(2277, 0);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261124/admin-moderation/rewind-reported-reviews-en-desktop-1440x3217.png"), fullPage: false });
  await section.getByRole("button", { name: "Next" }).click();
  await expect(section.getByRole("article")).toHaveCount(1);
  await expect(section.getByText("Past Lives")).toBeVisible();
  await section.getByRole("link", { name: "Edit Review" }).click();
  await expect(page.getByRole("region", { name: "Edit Reported Review" })).toBeVisible();

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/admin?view=reported-reviews");
  await expect(page.getByRole("region", { name: "All Reported Reviews" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
});
