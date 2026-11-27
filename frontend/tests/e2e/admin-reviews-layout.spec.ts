import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const reviewRows = [
  {
    id: 900021, movieId: 77, movieTitle: "Superman", userId: 900011, username: "CineMindset",
    content: "This version of Superman is more human than mythic. He doubts, listens, and reacts to the consequences of his presence rather than blindly embracing the symbol he represents. The film leans into emotional restraint, allowing quiet moments to carry as much weight as the action set pieces — which, when they arrive, are clean, purposeful, and never empty noise.",
    rating: 4, isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2025-12-10T12:00:00Z", likesCount: 20, commentsCount: 8,
  },
  {
    id: 900022, movieId: 78, movieTitle: "Avatar: Fire and Ash", userId: 900012, username: "MovieMoon",
    content: "James Cameron is in no hurry. This guy has been working on Avatar in some shape or form since at least 1994, and the two Avatar sequels for the last 16 years. Compared to all of that, Avatar: Fire and Ash's 197-minute runtime is like a drop in the ocean when Payakan (The Mighty Tulkun) roams. If spending three hours and 15 minutes in a theater intimidates you, stay home and look at social media on your phone.",
    rating: 5, isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2025-12-12T12:00:00Z", likesCount: 15, commentsCount: 3,
  },
  {
    id: 900023, movieId: 79, movieTitle: "The Hunt", userId: 900013, username: "ReelRaven",
    content: "Look, I KNEW what this film was about, I knew this was going to be difficult to watch, but nothing could have prepared me for the amount of frustration, anxiety, and just plain sadness I felt watching The Hunt. Mikkelsen's performance is particularly powerful and heartbreaking, even though everyone in this film is great. But yea, I'm pretty much emotionally exhausted now.",
    rating: 4, isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2025-12-09T12:00:00Z", likesCount: 130, commentsCount: 98,
  },
].map(review => ({ ...review, moviePhotoUrl: null }));

test("Admin Reviews retains the selected layout across languages and responsive widths", async ({ page }) => {
  const requestedReviewPages: number[] = [];
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 960001, username: "Lola James", role: "ADMIN", displayName: "Lola James",
    email: "admin@example.invalid", avatarUrl: "https://fixtures.example.test/admin-review-receipt-avatar.png", isActive: true, isHq: false,
  } }));
  await page.route("https://fixtures.example.test/admin-review-receipt-avatar.png", route => route.fulfill({ path: resolve(process.cwd(), "tests/e2e/fixtures/admin-review-receipt-avatar.png") }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "admin-reviews-layout" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/admin/reviews**", route => {
    requestedReviewPages.push(Number(new URL(route.request().url()).searchParams.get("page") ?? 0));
    return route.fulfill({ json: {
      content: reviewRows, totalPages: 6, totalElements: 18, number: 0, size: 3,
    } });
  });

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261124/admin-reviews");
  await mkdir(captureDirectory, { recursive: true });
  for (const locale of ["uk", "en"] as const) {
    const sectionName = locale === "uk" ? "Огляди" : "Reviews";
    const ratingLabel = locale === "uk" ? "Рейтинг" : "Rating";
    const hideLabel = locale === "uk" ? "Приховати" : "Hide";
    for (const width of [320, 393, 600, 720, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/admin?view=reviews`);
      const section = page.getByRole("region", { name: sectionName });
      const cards = section.getByRole("listitem");
      await expect(cards).toHaveCount(3);
      await expect(cards.first().getByText(ratingLabel, { exact: true })).toBeVisible();
      await expect(cards.first().locator("div[class*='reviewEngagement']")).toContainText(locale === "uk" ? "Вподобання20Коментарі8" : "Likes20Comments8");
      await expect(cards.first().locator("time")).toHaveAttribute("dateTime", reviewRows[0].createdAt);
      await expect(cards.first().getByRole("button", { name: hideLabel })).toBeVisible();
      const reportedLink = section.getByRole("link", { name: locale === "uk" ? "Переглянути скарги на огляди" : "View Reported Reviews" });
      await expect(reportedLink).toBeVisible();
      await expect(reportedLink).toHaveAttribute("href", `/${locale}/admin?view=reported-reviews`);
      const pagination = section.getByRole("navigation", { name: locale === "uk" ? "Сторінки оглядів" : "Review pages" });
      await expect(pagination).toBeVisible();
      await expect(pagination.getByRole("button", { name: locale === "uk" ? "Сторінка 1" : "Page 1" })).toHaveAttribute("aria-current", "page");
      await expect(pagination.getByRole("button", { name: locale === "uk" ? "Сторінка 6" : "Page 6" })).toBeVisible();
      if (locale === "uk" && width === 1440) {
        const sectionBox = await section.boundingBox();
        expect(sectionBox?.x).toBeCloseTo(120, 0);
        expect(sectionBox?.width).toBe(1200);
        const headingBox = await section.getByRole("heading", { name: "Усі огляди" }).boundingBox();
        expect(headingBox?.y).toBeCloseTo(1073, 0);
        const linkBox = await reportedLink.boundingBox();
        expect(linkBox?.y).toBeCloseTo(1219, 0);
        const cardBox = await cards.first().boundingBox();
        expect(cardBox?.y).toBeCloseTo(1344, 0);
        expect(cardBox?.width).toBe(1200);
        // The exact Figma copy occupies more height with the local font metrics;
        // let the card grow instead of clipping review content.
        expect(cardBox?.height).toBeCloseTo(451, 0);
        const mainBox = await cards.first().locator("div[class*='reviewMain']").boundingBox();
        const sideBox = await cards.first().locator("div[class*='reviewSide']").boundingBox();
        expect(mainBox?.x).toBeCloseTo(143, 0);
        expect(mainBox?.width).toBe(417);
        expect(sideBox?.x).toBeCloseTo(720, 0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      if ((locale === "uk" && width === 1440) || (locale === "en" && width === 393)) {
        await page.screenshot({ path: resolve(captureDirectory, `admin-reviews-${locale}-${width}-fixture.png`), fullPage: true });
      }
      if (locale === "uk" && width === 1440) {
        await pagination.getByRole("button", { name: "Сторінка 2" }).click();
        await expect(pagination.getByRole("button", { name: "Сторінка 2" })).toHaveAttribute("aria-current", "page");
        await expect.poll(() => requestedReviewPages.at(-1)).toBe(1);
      }
    }
  }
});
