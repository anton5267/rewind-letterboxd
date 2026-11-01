import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const reviewRows = [
  {
    id: 900021, movieId: 77, movieTitle: "Superman", userId: 900011, username: "CineMindset",
    content: "This version is more human than mythic. He doubts, listens, and reacts to the consequences of his presence rather than blindly embracing the symbol he represents. The film leans into emotional restraint, allowing quiet moments to carry as much weight as the action set pieces.",
    rating: 4, isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2025-12-10T12:00:00Z",
  },
  {
    id: 900022, movieId: 78, movieTitle: "Avatar: Fire and Ash", userId: 900012, username: "MovieMoon",
    content: "James Cameron is in no hurry. This guy has been working on Avatar in some shape or form since at least 1994, and the two Avatar sequels for the last 16 years. Compared to all of that, Avatar: Fire and Ash's 197-minute runtime is like a drop in the ocean when Payakan (The Mighty Tulkun) roams. If spending three hours and 15 minutes in a theater intimidates you, stay home and look at social media on your phone.",
    rating: 5, isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2025-12-12T12:00:00Z",
  },
  {
    id: 900023, movieId: 79, movieTitle: "The Hunt", userId: 900013, username: "ReelRaven",
    content: "Look, I KNEW what this film was about. I knew this was going to be difficult to watch, but nothing could have prepared me for the amount of frustration, anxiety, and just plain sadness I felt watching The Hunt. Mikkelsen's performance is particularly powerful and heartbreaking, even though everyone in this film is great. But yea, I'm pretty much emotionally exhausted now.",
    rating: 4, isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2025-12-09T12:00:00Z",
  },
].map(review => ({ ...review, moviePhotoUrl: null }));

test("Admin Reviews retains the selected layout across languages and responsive widths", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900010, username: "admin-fixture", role: "ADMIN", displayName: "Admin Fixture",
    email: "admin@example.invalid", avatarUrl: null, isActive: true, isHq: false,
  } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "admin-reviews-layout" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/admin/reviews**", route => route.fulfill({ json: {
    content: reviewRows, totalPages: 1, totalElements: reviewRows.length, number: 0, size: 50,
  } }));

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261101/admin-reviews-layout-fixture");
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
      await expect(cards.first().locator("time")).toHaveAttribute("dateTime", reviewRows[0].createdAt);
      await expect(cards.first().getByRole("button", { name: hideLabel })).toBeVisible();
      await expect(section.getByText(/reported reviews|скаргами на рецензії/i)).toHaveCount(0);
      if (locale === "uk" && width === 1440) {
        const sectionBox = await section.boundingBox();
        expect(sectionBox?.x).toBeCloseTo(120, 0);
        expect(sectionBox?.width).toBe(1200);
        const cardBox = await cards.first().boundingBox();
        expect(cardBox?.width).toBe(1200);
        expect(cardBox?.height).toBe(429);
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
    }
  }
});
