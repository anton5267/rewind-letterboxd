import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261124", "review-dune-rating-sheet-phone");
mkdirSync(evidenceDir, { recursive: true });

test("Review Dune rating sheet matches Figma mobile frame 1480:9407", async ({ page }) => {
  await page.route(url => new URL(url).pathname.startsWith("/api/"), async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: 94073, username: "silverframe", role: "USER" } });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "figma-review-sheet" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/reviews/94072") return route.fulfill({ json: {
      id: 94072,
      content: "A review fixture for the Dune rating sheet Figma state.",
      rating: 4,
      createdAt: "2026-10-18T12:30:00Z",
      author: { id: 94073, username: "silverframe", displayName: "SilverFrame", avatarUrl: null },
      movie: { id: 35, title: "Dune", releaseDate: "2021-10-22", durationMinutes: 155, ageRating: "12+", photoUrl: null, backdropUrl: null, trailerUrl: null },
      likes: 500,
      likedBy: [],
    } });
    if (pathname === "/api/reviews/94072/like-status") return route.fulfill({ json: { liked: false, likes: 500 } });
    if (pathname === "/api/movies/35/rating/me") return route.fulfill({ json: { rating: 0 } });
    if (pathname === "/api/reviews/94072/report") return route.fulfill({ json: { reported: false, report: null } });
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/reviews/94072");
  await page.getByRole("button", { name: "More options", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Dune" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Review by SilverFrame", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Like Dune" })).toContainText("500");
  await expect(dialog.getByText("Rate", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Done", exact: true })).toBeVisible();
  await expect(dialog.locator('[class*="_stars_"] button')).toHaveCount(5);

  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing ${selector}`);
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      title: rect("#rating-sheet-title"),
      subtitle: rect('[class*="_subtitle_"]'),
      card: rect('[class*="_reviewCard_"]'),
      favorite: rect('[class*="_reviewLikeButton_"] img'),
      ratingArea: rect('[class*="_reviewRatingArea_"]'),
      ratingLabel: rect('[class*="_reviewRatingArea_"] p'),
      stars: (() => {
        const buttons = [...document.querySelectorAll<HTMLElement>('[class*="_reviewRatingArea_"] [class*="_stars_"] button')];
        const first = buttons[0]?.getBoundingClientRect();
        const last = buttons.at(-1)?.getBoundingClientRect();
        if (!first || !last) throw new Error("Missing rating buttons");
        return { x: first.x, y: first.y, width: last.right - first.x, height: first.height };
      })(),
      done: rect('[class*="_doneButton_"]'),
    };
  });
  expect(geometry.title.y).toBeCloseTo(488.62, 0);
  expect(geometry.subtitle.y).toBeCloseTo(509.62, 0);
  expect(geometry.card).toMatchObject({ x: 16, y: 535.625, width: 361 });
  expect(geometry.favorite).toMatchObject({ x: 171, y: 551.625, width: 51, height: 51 });
  expect(geometry.ratingArea.y).toBeCloseTo(642.62, 0);
  expect(geometry.ratingLabel.y).toBeCloseTo(658.62, 0);
  expect(geometry.stars.x).toBeCloseTo(87, 0);
  expect(geometry.stars.y).toBeCloseTo(682.62, 0);
  expect(geometry.stars.width).toBeCloseTo(219, 0);
  expect(geometry.stars.height).toBe(44);
  expect(geometry.done).toMatchObject({ x: 16, y: 761, width: 361, height: 56 });
  console.log("DUNE_RATING_SHEET_GEOMETRY", JSON.stringify(geometry));
  await page.screenshot({ path: path.join(evidenceDir, "rewind-review-dune-rating-sheet-en-phone-393x852.png"), fullPage: false });
});
