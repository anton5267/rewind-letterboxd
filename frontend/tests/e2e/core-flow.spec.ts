import { expect, test } from "@playwright/test";
import { cleanupDisposableAccount } from "./helpers";

test("register, use a film, edit and remove review", async ({ page, baseURL }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `e2e-${suffix}@example.invalid`;
  const password = "E2e-password-123!";
  const review = `E2E review ${suffix}`;
  const editedReview = `${review} edited`;

  let registered = false;
  try {
    await page.goto("/uk/register");
    await page.getByLabel("Нікнейм").fill(`e2e${suffix}`);
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль").fill(password);
    const registration = page.waitForResponse(response => response.url().endsWith("/api/auth/register") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Створити акаунт" }).click();
    expect((await registration).status()).toBe(200);
    registered = true;
    await expect(page.getByRole("heading", { name: /Акаунт створено/ })).toBeVisible();

    await page.getByRole("button", { name: "Перейти до входу" }).click();
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль").fill(password);
    await page.getByRole("button", { name: "Увійти" }).click();
    await expect(page).toHaveURL(/\/uk\/films$/);
    await expect(page.getByRole("status").filter({ hasText: "Знайдено фільмів" })).toContainText("Знайдено фільмів");

    const firstFilm = page.locator("main article h2 a").first();
    await expect(firstFilm).toBeVisible();
    await firstFilm.click();
    await expect(page.getByRole("heading", { name: "Мої дії" })).toBeVisible();

    const watchlist = page.getByRole("button", { name: "До перегляду" });
    await watchlist.click();
    await expect(watchlist).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Оцінити на 4" }).click();
    await expect(page.getByText("Ваша оцінка: 4")).toBeVisible();

    await page.getByRole("textbox", { name: "Ваш огляд" }).fill(review);
    await page.getByRole("button", { name: "Опублікувати огляд" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Огляд опубліковано" })).toContainText("Огляд опубліковано");
    await expect(page.getByText(review)).toBeVisible();
    const reviewArticle = page.locator("article").filter({ hasText: review }).first();
    const likeResponsePromise = page.waitForResponse(response => response.url().includes("/api/reviews/") && response.url().endsWith("/likes") && response.request().method() === "POST");
    await reviewArticle.getByRole("button", { name: "Вподобати" }).click();
    const likeResponse = await likeResponsePromise;
    expect(likeResponse.ok(), `review like failed: ${likeResponse.status()} ${await likeResponse.text()}`).toBeTruthy();
    await expect(reviewArticle.getByRole("button", { name: "Прибрати вподобання" })).toBeVisible();
    await reviewArticle.getByRole("button", { name: "Прибрати вподобання" }).click();
    await expect(reviewArticle.getByRole("button", { name: "Вподобати" })).toBeVisible();

    const csrfHeaders = async () => {
      const csrf = await page.request.get("/api/auth/csrf");
      expect(csrf.status()).toBe(200);
      const cookie = (await page.request.storageState()).cookies.find(item => item.name === "XSRF-TOKEN");
      expect(cookie).toBeTruthy();
      return { "X-XSRF-TOKEN": decodeURIComponent(cookie!.value) };
    };
    const movieId = Number(new URL(page.url()).pathname.split("/").pop());
    const reviewsResponse = await page.request.get(`/api/movies/${movieId}/reviews?size=20`);
    expect(reviewsResponse.ok()).toBeTruthy();
    const reviewPage = await reviewsResponse.json();
    const reviewId = reviewPage.content.find((item: { content: string }) => item.content === review)?.id;
    expect(reviewId).toBeTruthy();
    for (let index = 0; index < 21; index += 1) {
      const response = await page.request.post(`/api/reviews/${reviewId}/comments`, {
        headers: await csrfHeaders(),
        data: { text: `${review} comment ${index}` },
      });
      expect(response.ok(), `comment create failed: ${response.status()} ${await response.text()}`).toBeTruthy();
    }
    // Return to browser-driven actions with the API context's current cookie state.
    await page.reload();
    await expect(reviewArticle).toBeVisible();
    await reviewArticle.getByRole("button", { name: "Показати коментарі" }).click();
    await expect(reviewArticle.getByRole("listitem")).toHaveCount(20);
    const commentsPagination = page.getByRole("navigation", { name: "Сторінки коментарів" }).last();
    await expect(commentsPagination.getByRole("button", { name: "Далі" })).toBeEnabled();
    await commentsPagination.getByRole("button", { name: "Далі" }).click();
    await expect(commentsPagination.getByRole("status")).toHaveText("Сторінка 2 з 2");
    await expect(reviewArticle.getByText(`${review} comment 20`)).toBeVisible();

    await reviewArticle.getByRole("button", { name: "Редагувати коментар" }).click();
    await reviewArticle.getByRole("textbox", { name: "Редагувати коментар" }).fill(`${review} comment 20 edited`);
    await reviewArticle.getByRole("button", { name: "Зберегти" }).click();
    await expect(reviewArticle.getByText(`${review} comment 20 edited`)).toBeVisible();
    page.once("dialog", dialog => dialog.accept());
    await reviewArticle.getByRole("button", { name: "Видалити коментар" }).click();
    await expect(reviewArticle.getByText(`${review} comment 20 edited`)).toHaveCount(0);

    await page.getByRole("button", { name: "Редагувати", exact: true }).click();
    await page.getByRole("textbox", { name: "Ваш огляд" }).fill(editedReview);
    await page.getByRole("button", { name: "Зберегти огляд" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Огляд оновлено" })).toContainText("Огляд оновлено");
    await expect(page.getByText(editedReview)).toBeVisible();

    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Видалити огляд" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Огляд видалено" })).toContainText("Огляд видалено");
    await expect(page.getByText(editedReview)).toHaveCount(0);

    await page.getByRole("button", { name: "Видалити оцінку" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Оцінку видалено" })).toContainText("Оцінку видалено");

    await watchlist.click();
    await expect(watchlist).toHaveAttribute("aria-pressed", "false");
  } finally {
    if (registered) await cleanupDisposableAccount(baseURL, email, password);
  }
});
