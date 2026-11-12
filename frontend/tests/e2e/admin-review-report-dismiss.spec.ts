import { expect, test } from "@playwright/test";

test("an administrator can dismiss an open review report in Ukrainian and English", async ({ page }) => {
  await page.addInitScript(() => {
    const now = Math.floor(Date.now() / 1000);
    localStorage.setItem("sb-cuirmicbzspomijgkkwo-auth-token", JSON.stringify({
      access_token: "fixture-admin-access-token",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: now + 3600,
      refresh_token: "fixture-admin-refresh-token",
      user: {
        id: "b1f5872a-148b-4878-8581-06b809b2992f",
        aud: "authenticated",
        role: "authenticated",
        email: "admin@example.invalid",
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: { username: "admin-fixture", language: "uk" },
        created_at: new Date().toISOString(),
      },
    }));
  });
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900010, username: "admin-fixture", role: "ADMIN", displayName: "Admin Fixture",
    email: "admin@example.invalid", avatarUrl: null, isActive: true, isHq: false,
  } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "admin-report-dismiss" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));

  const report = {
    id: 900021, movieId: 77, movieTitle: "Superman", moviePhotoUrl: null,
    userId: 900011, username: "CineMindset", content: "A fixture review reported as spam.",
    rating: 4, isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2025-12-10T12:00:00Z",
    reportId: 910001, reportReason: "SPAM", reportCreatedAt: "2026-11-10T12:00:00Z", likesCount: 2, commentsCount: 1,
  };
  let reportOpen = true;
  let dismissRequests = 0;
  await page.route("**/api/admin/reviews**", route => route.fulfill({ json: {
    content: [], totalPages: 0, totalElements: 0, number: 0, size: 50,
  } }));
  await page.route("**/api/admin/reported-reviews**", route => route.fulfill({ json: {
    content: reportOpen ? [report] : [], totalPages: reportOpen ? 1 : 0, totalElements: reportOpen ? 1 : 0, number: 0, size: 50,
  } }));
  await page.route("**/api/admin/reported-reviews/*/dismiss", async route => {
    dismissRequests++;
    reportOpen = false;
    await route.fulfill({ status: 204 });
  });

  for (const locale of ["uk", "en"] as const) {
    reportOpen = true;
    const labels = locale === "uk"
      ? { section: "Огляди", filter: "Видимість", reported: "Лише зі скаргами", dismiss: "Відхилити скаргу", success: "Скаргу відхилено" }
      : { section: "Reviews", filter: "Visibility", reported: "Reported only", dismiss: "Dismiss report", success: "The report was dismissed" };
    await page.goto(`${locale}/admin?view=reviews`);
    const section = page.getByRole("region", { name: labels.section });
    await section.getByRole("combobox", { name: labels.filter }).selectOption("reported");
    const row = section.getByRole("listitem");
    await expect(row).toContainText("Superman");
    await row.getByRole("button", { name: labels.dismiss, exact: true }).click();
    await expect(section.locator("p[role='status']")).toContainText(labels.success);
    await expect(section.getByRole("listitem")).toHaveCount(0);
  }

  expect(dismissRequests).toBe(2);
});
