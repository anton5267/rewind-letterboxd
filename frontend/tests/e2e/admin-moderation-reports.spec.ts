import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("admin moderation report table combines content types and dismisses reports", async ({ page }) => {
  const admin = { id: 950001, username: "report-admin", role: "ADMIN", avatarUrl: null };
  const reviews = [{ id: 950010, movieId: 1, movieTitle: "Fixture Film", userId: 950020, username: "review-author", email: "review@example.invalid", content: "Reported review", rating: 4, isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2026-01-01T00:00:00Z", reportId: 951010, reportReason: "SPAM", reportCreatedAt: "2026-01-03T00:00:00Z", likesCount: 0, commentsCount: 0 }];
  const comments = [{ id: 950011, reviewId: 950010, userId: 950021, username: "comment-author", email: "comment@example.invalid", content: "Reported comment", isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2026-01-01T00:00:00Z", reportId: 951011, reportReason: "BULLYING", reportCreatedAt: "2026-01-02T00:00:00Z", relatedTitle: "Fixture Film" }];
  const lists = [{ id: 950012, userId: 950022, username: "list-author", email: "list@example.invalid", name: "Reported list", description: null, listType: "CUSTOM", isPublic: true, itemCount: 2, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", featuredPosition: null, reportId: 951012, reportReason: "INAPPROPRIATE_CONTENT", reportCreatedAt: "2026-01-01T00:00:00Z", likeCount: 0 }];
  const dismissed: string[] = [];
  const edited: string[] = [];
  const pageResponse = (content: unknown[]) => ({ content, totalPages: content.length ? 1 : 0, totalElements: content.length, number: 0, size: 50 });

  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    if (pathname === "/api/users/me") return route.fulfill({ json: admin });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "moderation-report-e2e" } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/admin/reported-reviews") return route.fulfill({ json: pageResponse(reviews) });
    if (pathname === "/api/admin/reviews/950010/history") return route.fulfill({ json: reviews[0].content === "Reported review" ? [] : [{ id: 2, adminId: 950001, action: "REVIEW_CONTENT_EDITED", targetType: "REVIEW", targetId: 950010, metadata: "content edited by administrator", createdAt: "2026-01-04T00:00:00Z" }] });
    if (pathname === "/api/admin/reported-comments") return route.fulfill({ json: pageResponse(comments) });
    if (pathname === "/api/admin/comments/950011/history") return route.fulfill({ json: edited.length ? [{ id: 1, adminId: 950001, action: "COMMENT_CONTENT_EDITED", targetType: "COMMENT", targetId: 950011, metadata: "content edited by administrator", createdAt: "2026-01-04T00:00:00Z" }] : [] });
    if (pathname === "/api/admin/reported-lists") return route.fulfill({ json: pageResponse(lists) });
    if (pathname === "/api/admin/comments/950011" && request.method() === "PATCH") {
      const body = request.postDataJSON() as { content: string };
      edited.push(body.content);
      comments[0].content = body.content;
      return route.fulfill({ json: comments[0] });
    }
    if (pathname === "/api/admin/reviews/950010" && request.method() === "PATCH") {
      const body = request.postDataJSON() as { content: string };
      reviews[0].content = body.content;
      return route.fulfill({ json: reviews[0] });
    }
    const match = pathname.match(/^\/api\/admin\/reported-(reviews|comments|lists)\/(\d+)\/dismiss$/);
    if (match) {
      dismissed.push(pathname);
      const id = Number(match[2]);
      if (match[1] === "reviews") reviews.splice(0, reviews.findIndex(item => item.reportId === id) + 1);
      if (match[1] === "comments") comments.splice(0, comments.findIndex(item => item.reportId === id) + 1);
      if (match[1] === "lists") lists.splice(0, lists.findIndex(item => item.reportId === id) + 1);
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ json: pageResponse([]) });
  });

  await page.goto("/en/admin?view=moderation");
  const section = page.getByRole("region", { name: "List of Content for Moderation" });
  await expect(section.getByRole("row")).toHaveCount(4);
  const listRow = section.getByRole("row").filter({ hasText: "list-author" });
  await expect(listRow).toContainText("list@example.invalid");
  await expect(listRow).toContainText("Lists");
  await section.getByRole("searchbox").fill("comment@example.invalid");
  await expect(section.getByRole("row")).toHaveCount(2);
  await expect(section.getByRole("row").nth(1)).toContainText("comment-author");
  await section.getByRole("searchbox").fill("");
  await page.setViewportSize({ width: 1440, height: 2314 });
  await section.getByRole("link", { name: "Open Comment: Reported comment" }).click();
  const detail = page.getByRole("region", { name: "Edit Reported Comment" });
  await expect(detail.getByText("comment-author · comment@example.invalid")).toBeVisible();
  await expect(detail.getByText("Fixture Film")).toBeVisible();
  await expect(detail.getByText("1", { exact: true })).toBeVisible();
  await detail.getByRole("button", { name: "Change text" }).click();
  await detail.getByRole("textbox", { name: "Comment text" }).fill("Edited report fixture");
  await detail.getByRole("button", { name: "Save changes" }).click();
  await expect(detail.getByText("Comment changes saved.")).toBeVisible();
  await expect(detail.getByText(/COMMENT CONTENT EDITED/)).toBeVisible();
  expect(edited).toEqual(["Edited report fixture"]);
  await page.reload();
  await expect(page.getByRole("region", { name: "Edit Reported Comment" })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  const detailGeometry = {
    hero: await page.locator('main > header').boundingBox(),
    title: await detail.getByRole("heading", { level: 2 }).boundingBox(),
    card: await detail.locator('[class*="card"]').boundingBox(),
    footer: await page.locator("footer").boundingBox(),
    pageHeight: await page.evaluate(() => document.documentElement.scrollHeight),
  };
  expect(detailGeometry.hero?.height).toBe(1020);
  expect(detailGeometry.title?.y).toBeCloseTo(1073, 0);
  expect(detailGeometry.card?.x).toBe(120);
  expect(detailGeometry.card?.y).toBeCloseTo(1219, 0);
  expect(detailGeometry.card?.height).toBe(660);
  expect(detailGeometry.footer?.y).toBeCloseTo(2049, 0);
  expect(detailGeometry.pageHeight).toBe(2314);
  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261124/admin-moderation");
  await mkdir(captureDirectory, { recursive: true });
  await page.screenshot({ path: resolve(captureDirectory, "rewind-reported-comment-en-desktop-1440x2314.png"), fullPage: false });
  await page.getByRole("link", { name: "Content reports" }).click();
  const reportTable = page.getByRole("region", { name: "List of Content for Moderation" });
  await expect(reportTable.getByRole("row")).toHaveCount(4);
  await reportTable.getByRole("link", { name: "Open Review: Fixture Film" }).click();
  const reviewDetail = page.getByRole("region", { name: "Edit Reported Review" });
  await expect(reviewDetail.getByText("review-author", { exact: true })).toBeVisible();
  await expect(reviewDetail.getByText("Fixture Film", { exact: true })).toBeVisible();
  await expect(reviewDetail.getByText("1", { exact: true })).toBeVisible();
  const reviewStatusField = reviewDetail.getByRole("heading", { name: "Status", exact: true }).locator("xpath=..");
  await expect(reviewStatusField.getByRole("button", { name: "Change status", exact: true })).toBeVisible();
  await reviewDetail.getByRole("button", { name: "Change text" }).click();
  await reviewDetail.getByRole("textbox", { name: "Review text" }).fill("Edited review fixture");
  await reviewDetail.getByRole("button", { name: "Save changes" }).click();
  await expect(reviewDetail.getByText("Comment changes saved.")).toBeVisible();
  await expect(reviewDetail.getByText(/REVIEW CONTENT EDITED/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("region", { name: "Edit Reported Review" })).toBeVisible();
  await expect(page.getByText(/REVIEW CONTENT EDITED/)).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 2435 });
  await page.evaluate(() => window.scrollTo(0, 0));
  const reviewCard = await reviewDetail.locator('[class*="card"]').boundingBox();
  expect(reviewCard?.x).toBe(120);
  expect(reviewCard?.y).toBeCloseTo(1219, 0);
  expect(reviewCard?.height).toBeCloseTo(792, 0);
  const reviewCaptureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261124/admin-moderation");
  await mkdir(reviewCaptureDirectory, { recursive: true });
  await page.screenshot({ path: resolve(reviewCaptureDirectory, "rewind-reported-review-en-desktop-1440x2435.png"), fullPage: false });
  await page.getByRole("link", { name: "Content reports" }).click();
  await expect(page.getByRole("region", { name: "List of Content for Moderation" }).getByRole("row")).toHaveCount(4);

  for (const [reportId, author, path] of [
    [951010, "review-author", "/api/admin/reported-reviews/951010/dismiss"],
    [951011, "comment-author", "/api/admin/reported-comments/951011/dismiss"],
    [951012, "list-author", "/api/admin/reported-lists/951012/dismiss"],
  ] as const) {
    const row = section.getByRole("row").filter({ hasText: author });
    await row.getByRole("button", { name: "Dismiss report" }).click();
    await expect(row).toHaveCount(0);
    expect(dismissed).toContain(path);
  }
  await expect(section.getByText("There are no open reports.")).toBeVisible();
});
