import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const comments = [
  {
    id: 901001, reviewId: 401, userId: 901101, username: "Cinephile_99",
    content: "Visually flawless. The scientific accuracy combined with deep human drama makes this movie an all-time classic.",
    isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2025-12-12T12:00:00Z", parentLikesCount: 22, parentRepliesCount: 7,
  },
  {
    id: 901002, reviewId: 402, userId: 901102, username: "GothamResident",
    content: "A stunning exploration of madness. Phoenix delivered an incredible performance that gives you goosebumps. Very heavy, but important cinema.",
    isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2025-12-09T12:00:00Z", parentLikesCount: 19, parentRepliesCount: 2,
  },
  {
    id: 901003, reviewId: 403, userId: 901103, username: "Dreamer_X",
    content: "The concept of dream levels is brilliantly executed. I need to rewatch it a couple more times to finally put this puzzle together in my head.",
    isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2025-12-10T12:00:00Z", parentLikesCount: 76, parentRepliesCount: 18,
  },
];

test("Admin Comments matches the desktop Figma layout and stays usable at responsive widths", async ({ page }) => {
  const requestedPages: number[] = [];
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 960001, username: "Lola James", role: "ADMIN", displayName: "Lola James",
    email: "admin@example.invalid", avatarUrl: "https://fixtures.example.test/admin-review-receipt-avatar.png", isActive: true, isHq: false,
  } }));
  await page.route("https://fixtures.example.test/admin-review-receipt-avatar.png", route => route.fulfill({ path: resolve(process.cwd(), "tests/e2e/fixtures/admin-review-receipt-avatar.png") }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "admin-comments-figma" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/admin/comments**", route => {
    requestedPages.push(Number(new URL(route.request().url()).searchParams.get("page") ?? 0));
    return route.fulfill({ json: { content: comments, totalPages: 6, totalElements: 18, number: 0, size: 3 } });
  });

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261124/admin-reviews");
  await mkdir(captureDirectory, { recursive: true });
  for (const locale of ["uk", "en"] as const) {
    const title = locale === "uk" ? "Усі коментарі" : "All Comments";
    const linkName = locale === "uk" ? "Переглянути скарги на коментарі" : "View Reported Comments";
    const pageLabel = locale === "uk" ? "Сторінки коментарів" : "Comment pages";
    for (const width of [320, 393, 600, 720, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/admin?view=comments`);
      const section = page.getByRole("region", { name: locale === "uk" ? "Коментарі" : "Comments" });
      const cards = section.getByRole("listitem");
      await expect(cards).toHaveCount(3);
      const engagement = cards.first().locator("div[class*='commentMetric']");
      await expect(engagement).toHaveCount(2);
      await expect(engagement.nth(0)).toContainText(locale === "uk" ? "Вподобання22" : "Likes22");
      await expect(engagement.nth(1)).toContainText(locale === "uk" ? "Відповіді7" : "Replies7");
      const reportedLink = section.getByRole("link", { name: linkName });
      await expect(reportedLink).toBeVisible();
      await expect(reportedLink).toHaveAttribute("href", `/${locale}/admin?view=reported-comments`);
      const pagination = section.getByRole("navigation", { name: pageLabel });
      await expect(pagination.getByRole("button", { name: locale === "uk" ? "Сторінка 6" : "Page 6" })).toBeVisible();

      if (locale === "uk" && width === 1440) {
        const heading = await section.getByRole("heading", { name: title }).boundingBox();
        expect(heading?.y).toBeCloseTo(1073, 0);
        const link = await reportedLink.boundingBox();
        expect(link?.y).toBeCloseTo(1219, 0);
        const firstCard = await cards.first().boundingBox();
        expect(firstCard?.x).toBeCloseTo(120, 0);
        expect(firstCard?.y).toBeCloseTo(1344, 0);
        expect(firstCard?.width).toBe(1200);
        expect(firstCard?.height).toBe(249);
      }

      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      if ((locale === "uk" && width === 1440) || (locale === "en" && width === 393)) {
        await page.screenshot({ path: resolve(captureDirectory, `admin-comments-${locale}-${width}-fixture.png`), fullPage: true });
      }
      if (locale === "uk" && width === 1440) {
        await pagination.getByRole("button", { name: "Сторінка 2" }).click();
        await expect(pagination.getByRole("button", { name: "Сторінка 2" })).toHaveAttribute("aria-current", "page");
        await expect.poll(() => requestedPages.at(-1)).toBe(1);
      }
    }
  }
});
