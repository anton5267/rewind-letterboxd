import { expect, test } from "@playwright/test";
import { browserMutation, cleanupDisposableAccount } from "./helpers";

test("account deletion confirms, rejects a wrong password, removes related data and ends the session", async ({ page, baseURL }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = `delete${suffix}`;
  const email = `${username}@example.invalid`;
  const password = "E2e-delete-account-123!";
  const listName = `Disposable deletion list ${suffix}`;
  const reviewText = `Disposable deletion review ${suffix}`;
  let registered = false;
  let deleted = false;
  let userId = 0;
  let listId = 0;
  let reviewId = 0;
  let deletionRequests = 0;

  try {
    page.on("request", request => {
      if (new URL(request.url()).pathname === "/api/profile/me" && request.method() === "DELETE") deletionRequests += 1;
    });
    await page.goto("/uk/register");
    await page.getByLabel("Нікнейм").fill(username);
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    const registration = page.waitForResponse(response => response.url().endsWith("/api/auth/register") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Створити акаунт" }).click();
    expect((await registration).status()).toBe(200);
    registered = true;
    await page.getByRole("button", { name: "Перейти до входу" }).click();
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Увійти" }).click();
    await expect(page).toHaveURL(/\/uk\/films$/);

    userId = Number(await page.evaluate(async () => (await fetch("/api/users/me")).json().then((user: { id: number }) => user.id)));
    expect(userId).toBeGreaterThan(0);
    const createdList = await browserMutation(page, "/api/lists", "POST", {
      name: listName, description: "Disposable account-deletion E2E data", isPublic: true, tags: [], movieIds: [5],
    });
    expect(createdList.ok).toBeTruthy();
    listId = Number(createdList.data.id);
    const createdReview = await browserMutation(page, "/api/movies/5/reviews", "POST", { content: reviewText, rating: 4 });
    expect(createdReview.ok).toBeTruthy();
    reviewId = Number(createdReview.data.id);
    expect(listId).toBeGreaterThan(0);
    expect(reviewId).toBeGreaterThan(0);

    expect((await page.request.get(`/api/lists/public/${listId}`)).status()).toBe(200);
    expect((await page.request.get(`/api/reviews/${reviewId}`)).status()).toBe(200);
    await page.goto("/uk/profile?settings=profile");
    await page.getByRole("navigation", { name: "Дії профілю" }).getByRole("link", { name: "Видалення акаунта" }).click();
    const deletionForm = page.locator('form[aria-labelledby="profile-delete-form-title"]');
    await expect(deletionForm).toBeVisible();

    const passwordInput = deletionForm.getByLabel("Поточний пароль");
    const deleteButton = deletionForm.getByRole("button", { name: "Видалення акаунта", exact: true });

    await passwordInput.fill(password);
    await deleteButton.click();
    const confirmDialog = page.getByRole("alertdialog");
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Скасувати" }).click();
    await expect(confirmDialog).toBeHidden();
    expect(deletionRequests).toBe(0);
    expect((await page.request.get("/api/users/me")).status()).toBe(200);

    await passwordInput.fill("Wrong-password-123!");
    const wrongPasswordResponse = page.waitForResponse(response => new URL(response.url()).pathname === "/api/profile/me" && response.request().method() === "DELETE");
    await deleteButton.click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Видалення акаунта", exact: true }).click();
    expect((await wrongPasswordResponse).status()).toBe(400);
    expect(deletionRequests).toBe(1);
    await expect(page.getByRole("alert")).toContainText("Перевірте пароль.");
    expect((await page.request.get("/api/users/me")).status()).toBe(200);

    await passwordInput.fill(password);
    const deletionResponse = page.waitForResponse(response => new URL(response.url()).pathname === "/api/profile/me" && response.request().method() === "DELETE");
    await deleteButton.click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Видалення акаунта", exact: true }).click();
    expect((await deletionResponse).status()).toBe(204);
    expect(deletionRequests).toBe(2);
    deleted = true;

    await expect(page).toHaveURL(/\/uk\/home$/);
    expect((await page.request.get("/api/users/me")).status()).toBe(401);
    expect((await page.request.get(`/api/lists/public/${listId}`)).status()).toBe(404);
    expect((await page.request.get(`/api/reviews/${reviewId}`)).status()).toBe(404);

    await page.goto("/uk/login");
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Увійти" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    expect((await page.request.get(`/api/users/${userId}/profile`)).status()).toBe(404);
  } finally {
    if (registered && !deleted) await cleanupDisposableAccount(baseURL, email, password);
  }
});
