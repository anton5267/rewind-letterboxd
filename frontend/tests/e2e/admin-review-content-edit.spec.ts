import { expect, test } from "@playwright/test";

test("editing a review preserves each duplicate report row in Ukrainian and English", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900010, username: "admin-fixture", role: "ADMIN", displayName: "Admin Fixture",
    email: "admin@example.invalid", avatarUrl: null, isActive: true, isHq: false,
  } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "admin-review-edit" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));

  const review = {
    id: 900021, movieId: 77, movieTitle: "Superman", moviePhotoUrl: null,
    userId: 900011, username: "CineMindset", content: "Original review text",
    rating: 4, isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2025-12-10T12:00:00Z",
  };
  const reports = [
    { ...review, reportId: 910001, reportReason: "SPAM", reportCreatedAt: "2026-11-10T12:00:00Z", likesCount: 2, commentsCount: 1 },
    { ...review, reportId: 910002, reportReason: "BULLYING", reportCreatedAt: "2026-11-11T12:00:00Z", likesCount: 2, commentsCount: 1 },
  ];
  const duplicateKeyWarnings: string[] = [];
  page.on("console", message => {
    if (message.type() === "error" && /same key|unique.*key/i.test(message.text())) duplicateKeyWarnings.push(message.text());
  });
  let updateRequests = 0;
  await page.route("**/api/admin/reviews**", async route => {
    if (route.request().method() === "PATCH") {
      expect(new URL(route.request().url()).pathname).toBe("/api/admin/reviews/900021");
      const body = route.request().postDataJSON();
      expect(body).toEqual({ content: "Edited review text" });
      review.content = body.content;
      updateRequests++;
      await route.fulfill({ json: { ...review, content: body.content } });
      return;
    }
    await route.fulfill({ json: {
      content: [review], totalPages: 1, totalElements: 1, number: 0, size: 50,
    } });
  });
  await page.route("**/api/admin/reported-reviews**", route => route.fulfill({ json: {
    content: reports, totalPages: 1, totalElements: 2, number: 0, size: 50,
  } }));

  for (const locale of ["uk", "en"] as const) {
    review.content = "Original review text";
    const labels = locale === "uk"
      ? { section: "Огляди", filter: "Видимість", reported: "Лише зі скаргами", edit: "Редагувати текст", content: "Текст огляду", save: "Зберегти", spam: "Спам", bullying: "Булінг" }
      : { section: "Reviews", filter: "Visibility", reported: "Reported only", edit: "Edit text", content: "Review text", save: "Save", spam: "Spam", bullying: "Bullying" };
    await page.goto(`${locale}/admin?view=reviews`);
    const section = page.getByRole("region", { name: labels.section });
    await section.getByRole("combobox", { name: labels.filter }).selectOption("reported");
    const rows = section.getByRole("listitem");
    await expect(rows).toHaveCount(2);
    const spamRow = rows.filter({ hasText: labels.spam });
    const bullyingRow = rows.filter({ hasText: labels.bullying });
    await expect(spamRow).toContainText("Superman");
    await expect(bullyingRow).toContainText("Superman");
    const editButton = spamRow.getByRole("button", { name: labels.edit });
    await editButton.click();
    const editor = spamRow.getByRole("textbox", { name: labels.content });
    await expect(section.getByRole("textbox", { name: labels.content })).toHaveCount(1);
    await expect(bullyingRow.getByRole("textbox", { name: labels.content })).toHaveCount(0);
    await editor.fill("Edited review text");
    await spamRow.getByRole("button", { name: labels.save, exact: true }).click();
    await expect(spamRow.locator("p").first()).toContainText("Edited review text");
    await expect(rows).toHaveCount(2);
    await expect(spamRow).toContainText(labels.spam);
    await expect(bullyingRow).toContainText(labels.bullying);
    await expect(bullyingRow.locator("p").first()).toContainText("Edited review text");
    await expect(editButton).toBeFocused();
  }
  expect(updateRequests).toBe(2);
  expect(duplicateKeyWarnings).toEqual([]);
});

test("a delayed edit failure does not leak into a newly selected review filter", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900010, username: "admin-fixture", role: "ADMIN", displayName: "Admin Fixture",
    email: "admin@example.invalid", avatarUrl: null, isActive: true, isHq: false,
  } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "admin-review-edit-race" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  const review = {
    id: 900021, movieId: 77, movieTitle: "Superman", moviePhotoUrl: null,
    userId: 900011, username: "CineMindset", content: "Original review text",
    rating: 4, isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2025-12-10T12:00:00Z",
  };
  let startPatch!: () => void;
  let finishPatch!: () => void;
  const patchStarted = new Promise<void>(resolve => { startPatch = resolve; });
  const patchRelease = new Promise<void>(resolve => { finishPatch = resolve; });

  await page.route("**/api/admin/reviews**", async route => {
    if (route.request().method() === "PATCH") {
      startPatch();
      await patchRelease;
      await route.fulfill({ status: 500, body: "write failed" });
      return;
    }
    const hidden = new URL(route.request().url()).searchParams.get("hidden") === "true";
    await route.fulfill({ json: {
      content: hidden ? [] : [review], totalPages: hidden ? 0 : 1,
      totalElements: hidden ? 0 : 1, number: 0, size: 50,
    } });
  });

  await page.goto("/uk/admin?view=reviews");
  const section = page.getByRole("region", { name: "Огляди" });
  const row = section.getByRole("listitem");
  await row.getByRole("button", { name: "Редагувати текст" }).click();
  await section.getByRole("textbox", { name: "Текст огляду" }).fill("Pending edit");
  await row.getByRole("button", { name: "Зберегти", exact: true }).click();
  await patchStarted;

  await section.getByRole("combobox", { name: "Видимість" }).selectOption("hidden");
  await expect(section.getByRole("listitem")).toHaveCount(0);
  finishPatch();
  await expect(section.getByRole("alert")).toHaveCount(0);
});
