import { expect, test, type Route } from "@playwright/test";

const admin = { id: 950001, username: "report-admin", role: "ADMIN", displayName: "Report Admin", email: "admin@example.invalid", avatarUrl: null, isActive: true, isHq: false };
const emptyPage = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 50 };

for (const locale of ["uk", "en"] as const) {
  test(`admin can dismiss reported comments and lists in ${locale}`, async ({ page }) => {
    const comment = { id: 950002, reviewId: 950003, userId: 950004, username: "comment-author", content: "Reported comment fixture", isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2026-11-10T12:00:00Z" };
    let list = { id: 950006, userId: 950007, username: "list-owner", name: "Reported public list", description: null, isPublic: true, listType: "CUSTOM", itemCount: 1, createdAt: "2026-11-09T12:00:00Z", updatedAt: "2026-11-09T12:00:00Z", featuredPosition: null };
    let commentReports = [
      { ...comment, reportId: 950005, reportReason: "BULLYING", reportCreatedAt: "2026-11-11T12:00:00Z" },
      { ...comment, reportId: 950009, reportReason: "SPAM", reportCreatedAt: "2026-11-12T12:00:00Z" },
    ];
    let listReports = [
      { ...list, reportId: 950008, reportReason: "SPAM", reportCreatedAt: "2026-11-11T12:00:00Z" },
      { ...list, reportId: 950010, reportReason: "BULLYING", reportCreatedAt: "2026-11-12T12:00:00Z" },
    ];
    const dismissRequests: string[] = [];
    const duplicateKeyWarnings: string[] = [];
    page.on("console", message => {
      if (message.type() === "error" && /same key|unique.*key/i.test(message.text())) duplicateKeyWarnings.push(message.text());
    });
    await page.route(url => url.pathname.startsWith("/api/"), async (route: Route) => {
      const request = route.request();
      const { pathname } = new URL(request.url());
      if (pathname === "/api/users/me") return route.fulfill({ json: admin });
      if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "admin-content-report-e2e" } });
      if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
      if (pathname === "/api/admin/dashboard") return route.fulfill({ json: { users: 2, activeUsers: 2, hqUsers: 0, movies: 1, reviews: 0, hiddenReviews: 0 } });
      if (pathname === "/api/admin/comments") return route.fulfill({ json: emptyPage });
      if (pathname === "/api/admin/reported-comments") return route.fulfill({ json: {
        ...emptyPage,
        content: commentReports, totalPages: commentReports.length ? 1 : 0, totalElements: commentReports.length,
      } });
      if (pathname === "/api/admin/lists") return route.fulfill({ json: emptyPage });
      if (pathname === "/api/admin/reported-lists") return route.fulfill({ json: {
        ...emptyPage,
        content: listReports, totalPages: listReports.length ? 1 : 0, totalElements: listReports.length,
      } });
      if (pathname === "/api/admin/lists/950006/visibility") {
        expect(request.method()).toBe("PUT");
        expect(new URL(request.url()).searchParams.get("visible")).toBe("false");
        list = { ...list, isPublic: false };
        listReports = listReports.map(report => ({ ...report, isPublic: false }));
        // The visibility endpoint returns the base AdminList, without report-specific fields.
        return route.fulfill({ json: list });
      }
      if (pathname === "/api/admin/lists/950006/featured") {
        expect(request.method()).toBe("PUT");
        expect(new URL(request.url()).searchParams.get("featured")).toBe("true");
        list = { ...list, featuredPosition: 0 };
        listReports = listReports.map(report => ({ ...report, featuredPosition: 0 }));
        // The featured endpoint also returns the base AdminList DTO.
        return route.fulfill({ json: list });
      }
      const dismissComment = pathname.match(/^\/api\/admin\/reported-comments\/(\d+)\/dismiss$/);
      if (dismissComment) {
        expect(request.method()).toBe("POST");
        dismissRequests.push(pathname);
        commentReports = commentReports.filter(report => report.reportId !== Number(dismissComment[1]));
        return route.fulfill({ status: 204 });
      }
      const dismissList = pathname.match(/^\/api\/admin\/reported-lists\/(\d+)\/dismiss$/);
      if (dismissList) {
        expect(request.method()).toBe("POST");
        dismissRequests.push(pathname);
        listReports = listReports.filter(report => report.reportId !== Number(dismissList[1]));
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ json: emptyPage });
    });

    const labels = locale === "uk"
      ? { comments: "Коментарі", lists: "Списки", visibility: "Видимість", reported: "Лише зі скаргами", dismiss: "Відхилити скаргу", spam: "Спам", bullying: "Булінг" }
      : { comments: "Comments", lists: "Lists", visibility: "Visibility", reported: "Reported only", dismiss: "Dismiss report", spam: "Spam", bullying: "Bullying" };

    await page.goto(`/${locale}/admin?view=comments`);
    const comments = page.getByRole("region", { name: labels.comments });
    await comments.getByRole("combobox", { name: labels.visibility }).selectOption("reported");
    const commentRows = comments.getByRole("listitem");
    await expect(commentRows).toHaveCount(2);
    const bullyingComment = commentRows.filter({ hasText: labels.bullying });
    await expect(bullyingComment).toContainText("Reported comment fixture");
    await bullyingComment.getByRole("button", { name: labels.dismiss, exact: true }).click();
    await expect(commentRows).toHaveCount(1);
    const remainingComment = commentRows.filter({ hasText: labels.spam });
    await expect(remainingComment).toContainText("Reported comment fixture");
    await remainingComment.getByRole("button", { name: labels.dismiss, exact: true }).click();
    await expect(comments.getByRole("listitem")).toHaveCount(0);

    await page.goto(`/${locale}/admin?view=lists`);
    const lists = page.getByRole("region", { name: labels.lists });
    await lists.getByRole("button", { name: labels.reported, exact: true }).click();
    const listRows = lists.getByRole("listitem");
    await expect(listRows).toHaveCount(2);
    const spamList = listRows.filter({ hasText: labels.spam });
    await expect(spamList).toContainText("Reported public list");
    await spamList.getByRole("button", { name: locale === "uk" ? "Додати до вибраних" : "Feature list", exact: true }).click();
    await expect(listRows).toHaveCount(2);
    await expect(listRows.filter({ hasText: labels.spam })).toContainText(labels.spam);
    await expect(listRows.filter({ hasText: labels.bullying })).toContainText(labels.bullying);
    await spamList.getByRole("button", { name: locale === "uk" ? "Приховати" : "Hide", exact: true }).click();
    await expect(listRows).toHaveCount(2);
    const remainingSpamList = listRows.filter({ hasText: labels.spam });
    const bullyingList = listRows.filter({ hasText: labels.bullying });
    await expect(remainingSpamList).toContainText("Reported public list");
    await expect(bullyingList).toContainText("Reported public list");
    await expect(remainingSpamList).toContainText(labels.spam);
    await expect(bullyingList).toContainText(labels.bullying);
    await spamList.getByRole("button", { name: labels.dismiss, exact: true }).click();
    await expect(listRows).toHaveCount(1);
    const remainingList = listRows.filter({ hasText: labels.bullying });
    await expect(remainingList).toContainText("Reported public list");
    await remainingList.getByRole("button", { name: labels.dismiss, exact: true }).click();
    await expect(lists.getByRole("listitem")).toHaveCount(0);

    expect(dismissRequests).toEqual([
      "/api/admin/reported-comments/950005/dismiss",
      "/api/admin/reported-comments/950009/dismiss",
      "/api/admin/reported-lists/950008/dismiss",
      "/api/admin/reported-lists/950010/dismiss",
    ]);
    expect(duplicateKeyWarnings).toEqual([]);
  });
}
