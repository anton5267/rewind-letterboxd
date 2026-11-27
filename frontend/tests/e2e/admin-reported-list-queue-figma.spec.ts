import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("reported list queue shows the Figma likes column for each report", async ({ page }) => {
  const reports = [
    { id: 970011, reportId: 971011, userId: 972011, username: "SpamCollector", email: "spam@example.invalid", name: "Win Free iPhone Movies Collection", description: "A misleading list filled with promotional links and irrelevant content.", listType: "CUSTOM", isPublic: false, itemCount: 0, createdAt: "2025-11-19T00:00:00Z", updatedAt: "2025-11-19T00:00:00Z", featuredPosition: null, featuredCategory: null, reportReason: "SPAM", reportCreatedAt: "2025-11-19T00:00:00Z", likeCount: 0 },
    { id: 970012, reportId: 971012, userId: 972012, username: "FilmTruthSeeker", email: "truth@example.invalid", name: "Top 10 Documentaries About Space Aliens", description: "A list presenting conspiracy theories and fabricated documentaries as factual cinema.", listType: "CUSTOM", isPublic: true, itemCount: 10, createdAt: "2025-11-19T00:00:00Z", updatedAt: "2025-11-19T00:00:00Z", featuredPosition: null, featuredCategory: null, reportReason: "INAPPROPRIATE_CONTENT", reportCreatedAt: "2025-11-19T00:00:00Z", likeCount: 3 },
    { id: 970013, reportId: 971013, userId: 972013, username: "ToxicReviewer", email: "toxic@example.invalid", name: "Worst Users and Their Terrible Lists", description: "A harmful list targeting specific community members and promoting bullying.", listType: "CUSTOM", isPublic: true, itemCount: 4, createdAt: "2025-12-20T00:00:00Z", updatedAt: "2025-12-20T00:00:00Z", featuredPosition: null, featuredCategory: null, reportReason: "BULLYING", reportCreatedAt: "2025-12-20T00:00:00Z", likeCount: 0 },
  ];
  const writes: string[] = [];

  await page.route(url => new URL(url).pathname.startsWith("/api/"), async route => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    if (request.method() !== "GET") writes.push(`${request.method()} ${pathname}`);
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: 970001, username: "admin-fixture", role: "ADMIN", displayName: "Admin Fixture", email: "admin@example.invalid", avatarUrl: null, isActive: true, isHq: false } });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "reported-list-queue-figma" } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/admin/dashboard") return route.fulfill({ json: { users: 3, activeUsers: 3, hqUsers: 0, movies: 20, reviews: 0, hiddenReviews: 0 } });
    if (pathname === "/api/admin/lists") return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 50 } });
    if (pathname === "/api/admin/reported-lists") return route.fulfill({ json: { content: reports, totalPages: 6, totalElements: 18, number: 0, size: 50 } });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 50 } });
  });

  await mkdir(resolve(process.cwd(), "../artifacts/visual-audit-20261126/admin-reported-list-queue"), { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/admin?view=lists");
  const lists = page.getByRole("region", { name: "All Lists" });
  await lists.getByRole("button", { name: "Reported only", exact: true }).click();

  const rows = lists.getByRole("listitem");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText("Win Free iPhone Movies Collection");
  await expect(rows.nth(0)).toContainText("SpamCollector");
  await expect(rows.nth(0).getByText("Likes", { exact: true })).toBeVisible();
  await expect(rows.nth(0).getByTestId("reported-list-like-count")).toHaveText("0");
  await expect(rows.nth(0).getByTestId("reported-list-date")).toBeVisible();
  await expect(rows.nth(0).getByTestId("reported-list-reason")).toContainText("Spam");
  const moreActions = rows.nth(0).getByText("More actions", { exact: true });
  await expect(moreActions).toBeVisible();
  await expect(rows.nth(0).getByRole("button", { name: "Dismiss report" })).toBeHidden();
  await moreActions.click();
  await expect(rows.nth(0).getByRole("button", { name: "Dismiss report" })).toBeVisible();
  await moreActions.click();
  const columns = await Promise.all([
    rows.nth(0).locator(":scope > div").nth(0).evaluate(node => { const { x, width } = node.getBoundingClientRect(); return { x, width }; }),
    rows.nth(0).getByTestId("reported-list-date").evaluate(node => { const { x, width } = node.getBoundingClientRect(); return { x, width }; }),
    rows.nth(0).getByTestId("reported-list-metrics").evaluate(node => { const { x, width } = node.getBoundingClientRect(); return { x, width }; }),
  ]);
  expect(columns[0].x + columns[0].width).toBeLessThan(columns[1].x);
  expect(columns[1].x + columns[1].width).toBeLessThan(columns[2].x);
  const pagination = page.getByRole("navigation", { name: "List pages" });
  await expect(pagination.getByRole("button", { name: "Page 2" })).toBeVisible();
  await expect(pagination.getByRole("button", { name: "Page 6" })).toBeVisible();
  await expect(rows.nth(1)).toContainText("Top 10 Documentaries About Space Aliens");
  await expect(rows.nth(1).getByTestId("reported-list-like-count")).toHaveText("3");
  await expect(rows.nth(2)).toContainText("Worst Users and Their Terrible Lists");
  await expect(rows.nth(2).getByTestId("reported-list-like-count")).toHaveText("0");
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261126/admin-reported-list-queue/queue-en-1440.png"), fullPage: true });
  await page.setViewportSize({ width: 393, height: 852 });
  await page.reload();
  const mobileLists = page.getByRole("region", { name: "All Lists" });
  await mobileLists.getByRole("button", { name: "Reported only", exact: true }).click();
  await expect(mobileLists.getByRole("listitem")).toHaveCount(3);
  await expect(mobileLists.getByRole("listitem").first().getByTestId("reported-list-like-count")).toHaveText("0");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261126/admin-reported-list-queue/queue-en-mobile-393.png"), fullPage: true });
  expect(writes).toEqual([]);
});
