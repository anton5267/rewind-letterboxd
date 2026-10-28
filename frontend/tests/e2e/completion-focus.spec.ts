import { expect, test } from "@playwright/test";

test("canceling the article editor restores its exact row or the editor when that row disappears", async ({ page }) => {
  const articles = [1, 2, 3].map(id => ({ id: 950000 + id, slug: `editor-focus-${id}`, language: "en", category: "Community", title: `Editor fixture ${id}`, excerpt: "", content: "Controlled editor text", coverUrl: null, audioUrl: null, publishedAt: null }));
  const emptyPage = { content: [], totalPages: 0, totalElements: 0 };
  const mutations: string[] = [];
  await page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== "GET") { mutations.push(url.pathname); return route.abort(); }
    if (url.pathname === "/api/users/me") return route.fulfill({ json: { id: 950100, username: "editor-focus-admin", role: "ADMIN" } });
    if (url.pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (url.pathname === "/api/admin/dashboard") return route.fulfill({ json: { users: 0, activeUsers: 0, hqUsers: 0, movies: 0, reviews: 0, hiddenReviews: 0 } });
    if (url.pathname === "/api/admin/settings") return route.fulfill({ json: [] });
    if (url.pathname === "/api/admin/movies/tmdb-quality") return route.fulfill({ json: { totalMovies: 0, tmdbLinkedMovies: 0, completeTmdbMovies: 0, missingPoster: 0, missingBackdrop: 0, missingPlot: 0, missingRuntime: 0, missingTrailer: 0, missingTmdbRating: 0, linkedCoveragePercent: 0, metadataCompletenessPercent: 0 } });
    if (url.pathname === "/api/admin/journal/articles") return route.fulfill({ json: { content: url.searchParams.get("page") === "1" ? [articles[2]] : articles.slice(0, 2), totalPages: 2, totalElements: 3 } });
    return route.fulfill({ json: emptyPage });
  });
  await page.goto("/en/admin?view=articles");
  const editor = page.getByRole("region", { name: "Journal editor", exact: true });
  const trigger = editor.getByRole("button", { name: "Edit article: Editor fixture 2", exact: true });
  await trigger.focus();
  await trigger.press("Enter");
  const slug = editor.getByRole("textbox", { name: "Article slug", exact: true });
  await expect(slug).toBeFocused();
  await expect(slug).toHaveValue(articles[1].slug);
  const cancel = editor.getByRole("button", { name: "Cancel", exact: true });
  await cancel.focus();
  await cancel.press("Enter");
  await expect(trigger).toBeFocused();

  await trigger.press("Enter");
  await editor.getByRole("navigation", { name: "Article pages", exact: true }).getByRole("button", { name: "Next", exact: true }).click();
  await expect(editor.getByRole("button", { name: "Edit article: Editor fixture 3", exact: true })).toBeVisible();
  await expect(trigger).toHaveCount(0);
  await cancel.focus();
  await cancel.press("Enter");
  await expect(slug).toBeFocused();
  await expect(slug).toHaveValue("");
  expect(mutations).toEqual([]);
});

for (const lang of ["uk", "en"]) {
  test(`password reset completion focuses its success message and reaches login with Tab in ${lang}`, async ({ page }) => {
    let controlledResetRequests = 0;
    await page.route(/^https?:\/\/[^/]+\/api\//, route => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      if (pathname === "/api/users/me" || pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
      if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "controlled-csrf" } });
      if (pathname === "/api/auth/reset-password" && request.method() === "POST") {
        controlledResetRequests += 1;
        return route.fulfill({ status: 200, json: {} });
      }
      return route.abort();
    });
    await page.goto(`/${lang}/reset-password?token=controlled-reset-token`);
    await page.locator("#reset-password").fill("Valid-password-123!");
    await page.locator("#reset-password-confirm").fill("Valid-password-123!");
    const submit = page.locator("main form button[type=submit]");
    await submit.focus();
    await submit.press("Enter");
    const success = page.locator('main [role="status"]');
    await expect(success).toBeFocused();
    const login = success.getByRole("link");
    await expect(login).toHaveAttribute("href", `/${lang}/login`);
    await page.keyboard.press("Tab");
    await expect(login).toBeFocused();
    await login.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/${lang}/login$`));
    expect(controlledResetRequests).toBe(1);
  });
}
