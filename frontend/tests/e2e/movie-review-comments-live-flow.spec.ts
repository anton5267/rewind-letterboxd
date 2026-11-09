import { expect, test } from "@playwright/test";
import { browserMutation, cleanupDisposableAccount } from "./helpers";

test("real rating, review and comment actions persist and delete cleanly", async ({ page, baseURL }) => {
  test.setTimeout(60_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = `review_live_${suffix}`;
  const email = `${username}@example.invalid`;
  const password = "E2e-password-123!";
  const reviewDraft = `Live review ${suffix}`;
  const reviewUpdated = `Updated live review ${suffix}`;
  const commentDraft = `Live comment ${suffix}`;
  const commentUpdated = `Updated live comment ${suffix}`;
  let registered = false;
  let reviewId = 0;
  let commentId = 0;

  try {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/uk/register");
    await page.getByLabel("Нікнейм").fill(username);
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    const registration = page.waitForResponse(response => new URL(response.url()).pathname === "/api/auth/register" && response.request().method() === "POST");
    await page.getByRole("button", { name: "Створити акаунт" }).click();
    expect((await registration).status()).toBe(200);
    registered = true;
    await page.getByRole("button", { name: "Перейти до входу" }).click();
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Увійти" }).click();
    await expect(page).toHaveURL(/\/uk\/films$/);

    await page.goto("/uk/lists");
    await expect(page.locator('main[data-list-editor="create"]')).toBeVisible();
    await page.locator("#new-list-name").fill(`Empty draft ${suffix}`);
    await expect(page.locator('main[data-list-editor="create"] button[type="submit"]')).toBeDisabled();
    const emptyListAttempt = await browserMutation(page, "/api/lists", "POST", {
      name: `Empty API attempt ${suffix}`, description: null, isPublic: false, tags: [], movieIds: [],
    });
    expect(emptyListAttempt.status).toBe(400);
    const blankNameAttempt = await browserMutation(page, "/api/lists", "POST", {
      name: " \n\t ", description: null, isPublic: false, tags: [], movieIds: [5],
    });
    expect(blankNameAttempt.status).toBe(400);

    await page.goto("/uk/films/5");
    await expect(page.locator("#movie-title")).toBeVisible();
    await page.getByRole("button", { name: "Мої дії" }).click();
    const sheet = page.getByRole("dialog", { name: await page.locator("#movie-title").innerText() });
    await expect(sheet).toBeVisible();

    for (const flag of [
      { path: "watched", collection: "watched", label: "Переглянуто" },
      { path: "favorite", collection: "favorites", label: "Вподобати" },
      { path: "watchlist", collection: "watchlist", label: "До перегляду" },
    ]) {
      const action = sheet.getByRole("button", { name: flag.label, exact: true });
      await expect(action).toHaveAttribute("aria-pressed", "false");
      const addFlag = page.waitForResponse(response => new URL(response.url()).pathname === `/api/movies/5/${flag.path}` && response.request().method() === "POST");
      await action.click();
      expect((await addFlag).status()).toBe(200);
      await expect(action).toHaveAttribute("aria-pressed", "true");
      const collection = await (await page.request.get(`/api/profile/me/${flag.collection}?page=0&size=24`)).json() as { content: { id: number }[] };
      expect(collection.content.some(movie => movie.id === 5)).toBe(true);

      const removeFlag = page.waitForResponse(response => new URL(response.url()).pathname === `/api/movies/5/${flag.path}` && response.request().method() === "DELETE");
      await action.click();
      expect((await removeFlag).status()).toBe(204);
      await expect(action).toHaveAttribute("aria-pressed", "false");
      const collectionAfterDelete = await (await page.request.get(`/api/profile/me/${flag.collection}?page=0&size=24`)).json() as { content: { id: number }[] };
      expect(collectionAfterDelete.content.some(movie => movie.id === 5)).toBe(false);
    }

    const rating = sheet.locator('[data-movie-rating-focus] button').nth(3);
    const saveRating = page.waitForResponse(response => new URL(response.url()).pathname === "/api/movies/5/rating" && response.request().method() === "PUT");
    await rating.click();
    expect((await saveRating).status()).toBe(200);
    await expect(rating).toHaveAttribute("aria-pressed", "true");
    expect(await (await page.request.get("/api/movies/5/rating/me")).json()).toEqual({ rating: 4 });

    await page.getByRole("button", { name: "Готово", exact: true }).click();
    const reviewForm = page.locator("form[class*='reviewForm']");
    await reviewForm.scrollIntoViewIfNeeded();
    const textarea = reviewForm.locator("#review-content");
    await expect(reviewForm.getByRole("button", { name: "Опублікувати огляд" })).toBeDisabled();
    await textarea.fill(reviewDraft);
    const createReview = page.waitForResponse(response => new URL(response.url()).pathname === "/api/movies/5/reviews" && response.request().method() === "POST");
    await reviewForm.getByRole("button", { name: "Опублікувати огляд" }).click();
    const createdReview = await createReview;
    expect(createdReview.status()).toBe(200);
    reviewId = Number((await createdReview.json() as { id: number }).id);
    expect(reviewId).toBeGreaterThan(0);
    await expect(page.getByRole("status").filter({ hasText: "Огляд опубліковано." })).toBeVisible();
    expect((await (await page.request.get(`/api/reviews/${reviewId}`)).json() as { content: string; rating: number }).content).toBe(reviewDraft);

    const ownReview = page.locator("article[class*='myReview']");
    await ownReview.getByRole("button", { name: "Показати коментарі" }).click();
    const commentForm = ownReview.locator("section[aria-label='Коментарі'] form");
    const commentTextarea = commentForm.getByRole("textbox", { name: "Ваш коментар" });
    await expect(commentForm.getByRole("button", { name: "Надіслати", exact: true })).toBeDisabled();
    await commentTextarea.fill(commentDraft);
    const createComment = page.waitForResponse(response => new URL(response.url()).pathname === `/api/reviews/${reviewId}/comments` && response.request().method() === "POST");
    await commentForm.getByRole("button", { name: "Надіслати", exact: true }).click();
    const createdComment = await createComment;
    expect(createdComment.status()).toBe(200);
    commentId = Number((await createdComment.json() as { id: number }).id);
    expect(commentId).toBeGreaterThan(0);
    await expect(ownReview.getByText(commentDraft, { exact: true })).toBeVisible();

    const commentRow = ownReview.locator("li").filter({ hasText: commentDraft });
    await commentRow.getByRole("button", { name: "Редагувати коментар" }).click();
    const editForm = commentRow.locator("form");
    await editForm.getByRole("textbox", { name: "Редагувати коментар" }).fill(commentUpdated);
    const updateComment = page.waitForResponse(response => new URL(response.url()).pathname === `/api/comments/${commentId}` && response.request().method() === "PATCH");
    await editForm.getByRole("button", { name: "Зберегти", exact: true }).click();
    expect((await updateComment).status()).toBe(200);
    await expect(commentRow.getByText(commentUpdated, { exact: true })).toBeVisible();
    expect((await (await page.request.get(`/api/reviews/${reviewId}/comments?page=0&size=20`)).json() as { content: { text: string }[] }).content[0].text).toBe(commentUpdated);

    await commentRow.getByRole("button", { name: "Видалити коментар" }).click();
    const commentDialog = page.getByRole("alertdialog");
    await commentDialog.getByRole("button", { name: "Видалити коментар", exact: true }).click();
    await expect(commentRow).toHaveCount(0);
    const commentsAfterDelete = await (await page.request.get(`/api/reviews/${reviewId}/comments?page=0&size=20`)).json() as { content: { id: number }[] };
    expect(commentsAfterDelete.content.some(comment => comment.id === commentId)).toBe(false);

    await ownReview.getByRole("button", { name: "Редагувати", exact: true }).click();
    await reviewForm.locator("#review-content").fill(reviewUpdated);
    await reviewForm.locator("#review-rating").selectOption("5");
    const updateReview = page.waitForResponse(response => new URL(response.url()).pathname === `/api/reviews/${reviewId}` && response.request().method() === "PATCH");
    await reviewForm.getByRole("button", { name: "Зберегти огляд" }).click();
    expect((await updateReview).status()).toBe(200);
    await expect(ownReview.getByText(reviewUpdated, { exact: true })).toBeVisible();
    expect(await (await page.request.get(`/api/reviews/${reviewId}`)).json()).toMatchObject({ content: reviewUpdated, rating: 5 });

    await ownReview.getByRole("button", { name: "Видалити огляд" }).click();
    const reviewDialog = page.getByRole("alertdialog");
    await reviewDialog.getByRole("button", { name: "Видалити огляд", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Огляд видалено." })).toBeVisible();
    expect((await page.request.get(`/api/reviews/${reviewId}`)).status()).toBe(404);

    const deleteRating = page.waitForResponse(response => new URL(response.url()).pathname === "/api/movies/5/rating" && response.request().method() === "DELETE");
    await page.getByRole("button", { name: "Мої дії" }).click();
    const reopenedSheet = page.getByRole("dialog", { name: await page.locator("#movie-title").innerText() });
    await reopenedSheet.getByRole("button", { name: "Видалити оцінку" }).click();
    expect((await deleteRating).status()).toBe(204);
    expect((await page.request.get("/api/movies/5/rating/me")).status()).toBe(204);
    await reopenedSheet.getByRole("button", { name: "Готово", exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
  } finally {
    if (registered) await cleanupDisposableAccount(baseURL, email, password);
  }
});
