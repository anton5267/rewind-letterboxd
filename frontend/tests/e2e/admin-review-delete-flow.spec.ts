import { expect, test } from "@playwright/test";

test("admin review delete can be cancelled, retried after failure, and recover from an emptied last page", async ({ page }) => {
  const review = {
    id: 99050, movieId: 1, movieTitle: "Fixture film", userId: 1, username: "fixture-user",
    content: "The final review on this page.", rating: 4, isHidden: false,
    moderatedReason: null, moderatedAt: null, createdAt: "2026-10-17T00:00:00Z",
  };
  let deleted = false;
  let deleteRequests = 0;
  const reviewPages: number[] = [];

  await page.route(/\/api\//, route => route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } }));
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 99010, username: "admin-fixture", role: "ADMIN", displayName: "Admin Fixture",
    email: "admin@example.invalid", avatarUrl: null, isActive: true, isHq: false,
  } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "admin-review-delete" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route(/\/api\/admin\/reviews(?:\?.*)?$/, route => {
    const url = new URL(route.request().url());
    const currentPage = Number(url.searchParams.get("page") ?? "0");
    reviewPages.push(currentPage);
    return route.fulfill({ json: currentPage === 1 && !deleted
      ? { content: [review], totalPages: 2, totalElements: 51 }
      : { content: [], totalPages: deleted ? 1 : 2, totalElements: deleted ? 50 : 50 } });
  });
  await page.route("**/api/admin/reviews/99050", async route => {
    if (route.request().method() !== "DELETE") return route.fallback();
    deleteRequests += 1;
    if (deleteRequests === 1) return route.fulfill({ status: 503, json: { message: "Temporary failure" } });
    deleted = true;
    return route.fulfill({ status: 204, body: "" });
  });

  await page.goto("/uk/admin?view=reviews");
  const reviews = page.getByRole("region", { name: "Огляди" });
  await expect(reviews).toHaveAttribute("aria-busy", "false");
  await reviews.getByRole("button", { name: "Далі" }).click();
  const row = reviews.getByRole("listitem").filter({ hasText: review.content });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: "Видалити огляд" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Скасувати" }).click();
  await expect(row).toBeVisible();
  await expect(row.getByRole("button", { name: "Видалити огляд" })).toBeFocused();
  expect(deleteRequests).toBe(0);

  await row.getByRole("button", { name: "Видалити огляд" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Видалити огляд", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Видалити огляд" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Видалити огляд", exact: true }).click();

  await expect(reviews.getByRole("status")).toContainText("успішно видалено");
  await reviews.getByRole("button", { name: "Повернутися до рецензій" }).click();
  await expect(reviews.getByRole("heading", { name: "Усі огляди" })).toBeFocused();
  await expect(reviews.getByRole("button", { name: "Далі" })).toHaveCount(0);
  expect(deleteRequests).toBe(2);
  expect(reviewPages).toContain(0);
});
