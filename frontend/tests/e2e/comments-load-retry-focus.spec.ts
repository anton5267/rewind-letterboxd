import { expect, test, type Route } from "@playwright/test";

test("Review comments Retry returns focus after another failure and empty recovery", async ({ page }) => {
  let commentAttempts = 0;
  const movie = { id: 4401, title: "Retry Movie", imdbId: null, shortPlot: null, photoUrl: null, backdropUrl: null, releaseDate: "2024-01-01", durationMinutes: 100, ageRating: null, rating: null, trailerUrl: null, genres: [], actors: [], directors: [], producers: [], externalRatings: [], similarMovies: [], myFlags: null };
  const review = { id: 4402, content: "A short test review.", rating: 4, createdAt: "2026-10-01T12:00:00Z", author: { id: 4403, username: "reviewer", displayName: "Reviewer", avatarUrl: null }, movie, likes: 0, likedBy: [] };
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "comments-retry-focus" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/movies/4401/details") return route.fulfill({ json: movie });
    if (pathname === "/api/movies/4401/reviews") return route.fulfill({ json: { content: [{ id: review.id, userId: 4403, username: "reviewer", content: review.content, rating: 4, createdAt: review.createdAt }], number: 0, size: 10, totalElements: 1, totalPages: 1 } });
    if (pathname === `/api/reviews/${review.id}/likes`) return route.fulfill({ json: 0 });
    if (pathname === `/api/reviews/${review.id}/comments`) {
      commentAttempts++;
      if (commentAttempts < 3) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({ json: { content: [], number: 0, size: 20, totalElements: 0, totalPages: 0 } });
    }
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/films/4401");
  const comments = page.getByRole("region", { name: /коментарі/i });
  await comments.getByRole("button", { name: /показати коментарі/i }).click();
  const retry = comments.getByRole("button", { name: /спробувати ще/i });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(() => commentAttempts).toBe(2);
  const repeatedRetry = comments.getByRole("button", { name: /спробувати ще/i });
  await expect(repeatedRetry).toBeFocused();
  await expect(repeatedRetry).toBeEnabled();
  await repeatedRetry.press("Enter");
  await expect.poll(() => commentAttempts).toBe(3);
  const panel = comments.locator("[data-comments-panel]");
  await expect(panel).toBeFocused();
  await expect(panel).toHaveCSS("outline-style", "solid");
  await expect(panel).toContainText("Коментарів поки немає.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
});

test("Review comment edit Retry restores focus after repeated save failure and successful save", async ({ page }) => {
  const user = { id: 4503, username: "reviewer", role: "USER", displayName: "Reviewer", avatarUrl: null };
  const movie = { id: 4401, title: "Retry Movie", imdbId: null, shortPlot: null, photoUrl: null, backdropUrl: null, releaseDate: "2024-01-01", durationMinutes: 100, ageRating: null, rating: null, trailerUrl: null, genres: [], actors: [], directors: [], producers: [], externalRatings: [], similarMovies: [], myFlags: null };
  const review = { id: 4402, content: "A short test review.", rating: 4, createdAt: "2026-10-01T12:00:00Z", author: { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: null }, movie, likes: 0, likedBy: [] };
  let saveAttempts = 0;
  let commentReads = 0;
  let lastSaved = "Original comment text.";
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: user });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "comment-edit-retry" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/movies/4401/details") return route.fulfill({ json: movie });
    if (pathname === "/api/movies/4401/reviews") return route.fulfill({ json: { content: [{ id: review.id, userId: user.id, username: user.username, content: review.content, rating: 4, createdAt: review.createdAt }], number: 0, size: 10, totalElements: 1, totalPages: 1 } });
    if (pathname === `/api/movies/4401/reviews/me`) return route.fulfill({ status: 204 });
    if (pathname === `/api/reviews/${review.id}/like-status`) return route.fulfill({ json: { liked: false, likes: 0 } });
    if (pathname === `/api/reviews/${review.id}/comments` && route.request().method() === "GET") {
      commentReads++;
      return route.fulfill({ json: { content: [{ id: 4404, reviewId: review.id, userId: user.id, username: user.username, userAvatarUrl: null, text: lastSaved, createdAt: "2026-10-02T12:00:00Z", updatedAt: "2026-10-02T12:00:00Z" }], number: 0, size: 20, totalElements: 1, totalPages: 1 } });
    }
    if (pathname === "/api/comments/4404" && route.request().method() === "PATCH") {
      saveAttempts++;
      if (saveAttempts < 3) return route.fulfill({ status: 503, json: {} });
      lastSaved = route.request().postDataJSON().text;
      return route.fulfill({ json: { id: 4404, reviewId: review.id, userId: user.id, username: user.username, userAvatarUrl: null, text: lastSaved, createdAt: "2026-10-02T12:00:00Z", updatedAt: "2026-10-03T12:00:00Z" } });
    }
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/films/4401");
  const comments = page.getByRole("region", { name: /коментарі/i });
  await comments.getByRole("button", { name: /показати коментарі/i }).click();
  const panel = comments.locator("[data-comments-panel]");
  await expect(panel.getByText(lastSaved)).toBeVisible();
  await panel.getByRole("button", { name: /редагувати коментар/i }).click();
  await panel.getByRole("textbox", { name: /редагувати коментар/i }).fill("Updated after retries.");
  await panel.getByRole("button", { name: /зберегти/i }).click();
  const retry = panel.getByRole("button", { name: /спробувати ще/i });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(() => saveAttempts).toBe(2);
  const repeatedRetry = panel.getByRole("button", { name: /спробувати ще/i });
  await expect(repeatedRetry).toBeFocused();
  await repeatedRetry.press("Enter");
  await expect.poll(() => saveAttempts).toBe(3);
  await expect(panel).toBeFocused();
  await expect(panel).toContainText("Updated after retries.");
  expect(commentReads).toBeGreaterThanOrEqual(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
});

test("review comments cannot be submitted with whitespace-only text", async ({ page }) => {
  const user = { id: 4503, username: "reviewer", role: "USER", displayName: "Reviewer", avatarUrl: null };
  const movie = { id: 4401, title: "Retry Movie", imdbId: null, shortPlot: null, photoUrl: null, backdropUrl: null, releaseDate: "2024-01-01", durationMinutes: 100, ageRating: null, rating: null, trailerUrl: null, genres: [], actors: [], directors: [], producers: [], externalRatings: [], similarMovies: [], myFlags: null };
  const review = { id: 4402, content: "A short test review.", rating: 4, createdAt: "2026-10-01T12:00:00Z", author: { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: null }, movie, likes: 0, likedBy: [] };
  let createRequests = 0;
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: user });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "comment-empty-guard" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/movies/4401/details") return route.fulfill({ json: movie });
    if (pathname === "/api/movies/4401/reviews") return route.fulfill({ json: { content: [{ id: review.id, userId: user.id, username: user.username, content: review.content, rating: 4, createdAt: review.createdAt }], number: 0, size: 10, totalElements: 1, totalPages: 1 } });
    if (pathname === "/api/movies/4401/reviews/me") return route.fulfill({ status: 204 });
    if (pathname === `/api/reviews/${review.id}/comments`) {
      if (route.request().method() === "POST") createRequests++;
      return route.fulfill({ json: { content: [], number: 0, size: 20, totalElements: 0, totalPages: 0 } });
    }
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/films/4401");
  const comments = page.getByRole("region", { name: /коментарі/i });
  await comments.getByRole("button", { name: /показати коментарі/i }).click();
  const composer = comments.getByRole("textbox", { name: /ваш коментар/i });
  await expect(composer).toBeVisible();
  await composer.fill("   \n\t ");
  const send = comments.getByRole("button", { name: /надіслати/i });
  await expect(send).toBeDisabled();
  await composer.evaluate(element => (element as HTMLTextAreaElement).form?.requestSubmit());
  await page.waitForTimeout(100);
  expect(createRequests).toBe(0);
  await composer.fill("A useful comment.");
  await expect(send).toBeEnabled();
});

for (const lang of ["uk", "en"] as const) {
  test(`reply restriction keeps the comment draft and recovers through Retry in ${lang}`, async ({ page }) => {
    const user = { id: 7303, username: "commenter", role: "USER", displayName: "Commenter", avatarUrl: null };
    const movie = {
      id: 7301, title: "Reply permissions", imdbId: null, shortPlot: null, photoUrl: null, backdropUrl: null,
      releaseDate: "2024-01-01", durationMinutes: 100, ageRating: null, rating: null, trailerUrl: null,
      genres: [], actors: [], directors: [], producers: [], externalRatings: [], similarMovies: [], myFlags: null,
    };
    const review = { id: 7302, userId: 7304, username: "author", content: "A review with reply permissions.", rating: 4, createdAt: "2026-10-01T12:00:00Z" };
    let postAttempts = 0;
    let savedText = "";
    await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
      const { pathname } = new URL(route.request().url());
      if (pathname === "/api/users/me") return route.fulfill({ json: user });
      if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "reply-permissions-fixture" } });
      if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
      if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
      if (pathname === `/api/movies/${movie.id}/details`) return route.fulfill({ json: movie });
      if (pathname === `/api/movies/${movie.id}/reviews`) return route.fulfill({ json: { content: [review], number: 0, totalElements: 1, totalPages: 1 } });
      if (pathname === `/api/movies/${movie.id}/reviews/me`) return route.fulfill({ status: 204 });
      if (pathname.endsWith("/like-status")) return route.fulfill({ json: { liked: false, likes: 0 } });
      if (pathname === `/api/reviews/${review.id}/comments`) {
        if (route.request().method() === "POST") {
          postAttempts++;
          if (postAttempts === 1) return route.fulfill({ status: 403, json: { message: "Replies are not allowed for this review" } });
          savedText = route.request().postDataJSON().text;
          return route.fulfill({ json: { id: 7305, reviewId: review.id, userId: user.id, username: user.username, text: savedText } });
        }
        const content = savedText ? [{ id: 7305, reviewId: review.id, userId: user.id, username: user.username, text: savedText }] : [];
        return route.fulfill({ json: { content, number: 0, totalElements: content.length, totalPages: content.length ? 1 : 0 } });
      }
      return route.fulfill({ json: [] });
    });

    await page.setViewportSize({ width: lang === "uk" ? 393 : 1440, height: 900 });
    await page.goto(`/${lang}/films/${movie.id}`);
    const comments = page.getByRole("region", { name: lang === "uk" ? "Коментарі" : "Comments" });
    await comments.getByRole("button", { name: lang === "uk" ? "Показати коментарі" : "Show comments" }).click();
    const composer = comments.getByRole("textbox", { name: lang === "uk" ? "Ваш коментар" : "Your comment" });
    const draft = "This draft survives a permission rejection.";
    await composer.fill(draft);
    await comments.getByRole("button", { name: lang === "uk" ? "Надіслати" : "Send" }).click();
    const message = lang === "uk"
      ? "Автор обмежив коментування цього огляду або заблокував взаємодію."
      : "The author has restricted comments on this review or blocked this interaction.";
    await expect(comments.getByRole("alert")).toContainText(message);
    await expect(composer).toHaveValue(draft);
    const retry = comments.getByRole("button", { name: lang === "uk" ? "Спробувати ще" : "Retry" });
    await retry.focus();
    await retry.press("Enter");
    await expect.poll(() => postAttempts).toBe(2);
    await expect(comments.getByText(draft, { exact: true })).toBeVisible();
    await expect(composer).toHaveValue("");
    await expect(comments.locator("[data-comments-panel]")).toBeFocused();
    await expect(comments.getByRole("alert")).toHaveCount(0);
    expect(savedText).toBe(draft);
  });
}
