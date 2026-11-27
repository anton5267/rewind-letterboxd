import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("admin review detail maps the READY Figma frame and supports audited edits", async ({ page }) => {
  const admin = { id: 960001, username: "Lola James", role: "ADMIN", displayName: "Lola James", email: "admin@example.invalid", avatarUrl: "https://fixtures.example.test/admin-review-receipt-avatar.png", isActive: true, isHq: false };
  const review = { id: 960021, movieId: 77, movieTitle: "Superman", userId: 960011, username: "CineMindset", content: "This version of Superman is more human than mythic. He doubts, listens, and reacts to the consequences of his presence rather than blindly embracing the symbol he represents. The film leans into emotional restraint, allowing quiet moments to carry as much weight as the action set pieces — which, when they arrive, are clean, purposeful, and never empty noise.", rating: 4, isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2025-12-10T12:00:00Z" };
  let content = review.content;
  let hidden = false;
  await page.route("https://fixtures.example.test/admin-review-receipt-avatar.png", route => route.fulfill({ path: resolve(process.cwd(), "tests/e2e/fixtures/admin-review-receipt-avatar.png") }));
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: admin });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "admin-review-detail" } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/admin/reviews" && route.request().method() === "GET") return route.fulfill({ json: { content: [{ ...review, content, isHidden: hidden }], totalPages: 1, totalElements: 1, number: 0, size: 50 } });
    if (pathname === "/api/admin/reviews/960021/history") return route.fulfill({ json: [] });
    if (pathname === "/api/admin/reviews/960021" && route.request().method() === "PATCH") {
      content = route.request().postDataJSON().content;
      return route.fulfill({ json: { ...review, content } });
    }
    if (pathname === "/api/admin/reviews/960021/hide" && route.request().method() === "POST") {
      hidden = true;
      return route.fulfill({ json: { ...review, content, isHidden: true, moderatedAt: "2026-11-24T12:00:00Z", moderatedReason: "Rules violation" } });
    }
    return route.fulfill({ json: [] });
  });

  await mkdir(resolve(process.cwd(), "../artifacts/visual-audit-20261124/admin-moderation"), { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1400 });
  await page.goto("/en/admin?view=reviews");
  const reviews = page.getByRole("region", { name: "Reviews" });
  await reviews.getByRole("link", { name: "Superman", exact: true }).click();
  const detail = page.getByRole("region", { name: "Edit Review" });
  await expect(detail).toBeVisible();
  await expect(detail.getByText("CineMindset")).toBeVisible();
  await expect(detail.getByText("10 Dec 2025")).toBeVisible();
  await expect.poll(() => page.locator("[class*='avatar'] img").evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const heading = detail.locator("h2");
  const card = detail.locator("[class*='card']");
  const headingBox = await heading.boundingBox();
  const cardBox = await card.boundingBox();
  expect(headingBox?.y).toBeCloseTo(1073, 0);
  expect(cardBox?.x).toBe(120);
  expect(cardBox?.y).toBeCloseTo(1218, 0);
  expect(cardBox?.width).toBe(1200);
  expect(cardBox?.height).toBe(792);
  const author = await detail.getByText("Author of the Review", { exact: true }).boundingBox();
  const userRating = await detail.getByText("User Rating", { exact: true }).boundingBox();
  const reviewHeading = await detail.getByText("Review Text", { exact: true }).boundingBox();
  const textarea = detail.getByRole("textbox", { name: "Review Text" });
  const textareaBox = await textarea.boundingBox();
  const changeTextBox = await detail.getByRole("button", { name: "Change Text" }).boundingBox();
  const historyHeading = await detail.getByText("History of Changes", { exact: true }).boundingBox();
  const historyPill = await detail.getByText("No One Activated the Review", { exact: true }).boundingBox();
  const deleteAction = await detail.getByRole("button", { name: "Delete Review", exact: true }).boundingBox();
  expect(author?.x).toBe(157); expect(author?.y).toBeCloseTo(1248, 0);
  expect(userRating?.x).toBe(632); expect(userRating?.y).toBeCloseTo(1248, 0);
  expect(reviewHeading?.y).toBeCloseTo(1478, 0);
  expect(textareaBox?.x).toBe(157); expect(textareaBox?.y).toBeCloseTo(1522, 0);
  expect(textareaBox?.width).toBe(653); expect(textareaBox?.height).toBe(275);
  expect(changeTextBox?.y).toBeCloseTo(1753, 0);
  expect(historyHeading?.y).toBeCloseTo(1827, 0);
  expect(historyPill?.y).toBeCloseTo(1871, 0);
  expect(deleteAction?.x).toBe(157); expect(deleteAction?.y).toBeCloseTo(1942, 0);
  expect(deleteAction?.height).toBe(41); expect(deleteAction?.width).toBeCloseTo(179, 0);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261124/admin-moderation/rewind-review-detail-en-desktop-1440.png"), fullPage: true });

  await detail.getByRole("button", { name: "Change Text" }).click();
  await expect(textarea).not.toHaveAttribute("readonly");
  await textarea.fill("Updated review copy from the admin detail editor.");
  await detail.getByRole("button", { name: "Save changes" }).click();
  await expect(textarea).toHaveValue("Updated review copy from the admin detail editor.");
  expect(content).toBe("Updated review copy from the admin detail editor.");
  const statusControl = detail.locator("[class*='statusControl']");
  await expect(statusControl).toContainText("Published");
  await statusControl.getByRole("button", { name: "Change Status" }).click();
  await expect(statusControl).toContainText("hidden");

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/uk/admin?view=review-detail&reviewId=960021");
  const mobileDetail = page.getByRole("region", { name: "Редагування огляду" });
  await expect(mobileDetail).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
  expect((await mobileDetail.locator("[class*='card']").boundingBox())?.width).toBeLessThanOrEqual(393);
});
