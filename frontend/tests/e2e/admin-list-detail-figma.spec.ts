import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("Admin list editor matches Figma and supports the reported-list workflow", async ({ page }) => {
  const admin = { id: 960001, username: "Lola James", displayName: "Lola James", role: "ADMIN", email: "admin@example.invalid", avatarUrl: "https://fixtures.example.test/admin-review-receipt-avatar.png", isActive: true, isHq: false };
  let list = {
    id: 960023, userId: 960071, username: "FilmOracle", email: "oracle@example.invalid", ownerIsActive: true,
    name: "Christopher Nolan Best Films", description: "A collection of Christopher Nolan's mind-bending, time-twisting, reality-shifting films from ground-pounding psychological thrillers to epic cosmic blockbusters.\n\nStories that challenge perception, reward rewatching, and redefine modern cinema.",
    listType: "CUSTOM", isPublic: true, itemCount: 4, createdAt: "2025-12-02T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z",
    featuredPosition: null, featuredCategory: null, likeCount: 14, reportCount: 9,
    report: { id: 960091, reason: "SPAM", createdAt: "2026-11-20T10:00:00Z" },
    films: Array.from({ length: 4 }, (_, index) => ({ id: 960081 + index, title: ["Oppenheimer", "The Dark Knight", "Inception", "Interstellar"][index], releaseDate: "2025-01-01", rating: 4.5, photoUrl: `https://fixtures.example.test/list-film-${index + 1}.png` })),
    history: [{ id: 1, adminId: 960001, action: "LIST_UPDATED", targetType: "LIST", targetId: 960023, metadata: "name changed", createdAt: "2026-11-22T12:00:00Z" }],
  };
  const requestedMethods: string[] = [];
  let failNextSave = false;
  await page.route("https://fixtures.example.test/admin-review-receipt-avatar.png", route => route.fulfill({ path: resolve(process.cwd(), "tests/e2e/fixtures/admin-review-receipt-avatar.png") }));
  await page.route("https://fixtures.example.test/list-film-*.png", route => {
    const index = Number(new URL(route.request().url()).pathname.match(/(\d+)\.png$/)?.[1] ?? 1);
    return route.fulfill({ path: resolve(process.cwd(), `tests/e2e/fixtures/public-list-detail-figma/nolan-${String(index).padStart(2, "0")}.png`) });
  });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const { pathname, searchParams } = new URL(route.request().url());
    const method = route.request().method();
    if (pathname === "/api/users/me") return route.fulfill({ json: admin });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "admin-list-detail" } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/admin/dashboard") return route.fulfill({ json: { users: 12, activeUsers: 10, hqUsers: 1, movies: 50, reviews: 20, hiddenReviews: 1 } });
    if (pathname === "/api/admin/settings") return route.fulfill({ json: [] });
    if (pathname === "/api/admin/lists/960023" && method === "GET") {
      if (searchParams.get("reportId") && Number(searchParams.get("reportId")) !== list.report.id) return route.fulfill({ status: 404, json: { message: "Report not found" } });
      return route.fulfill({ json: list });
    }
    if (pathname === "/api/admin/lists/960023" && method === "PATCH") {
      requestedMethods.push("PATCH list text");
      if (failNextSave) { failNextSave = false; return route.fulfill({ status: 500, json: { message: "Save failed" } }); }
      list = { ...list, ...route.request().postDataJSON() };
      return route.fulfill({ json: list });
    }
    if (pathname === "/api/admin/lists/960023/visibility" && method === "PUT") {
      list = { ...list, isPublic: searchParams.get("visible") === "true" };
      return route.fulfill({ json: { ...list } });
    }
    if (pathname === "/api/admin/lists/960023/items" && method === "POST") {
      requestedMethods.push("POST list item");
      const movieId = route.request().postDataJSON().movieId;
      list = { ...list, itemCount: list.itemCount + 1, films: [...list.films, { id: movieId, title: "Dunkirk", releaseDate: "2017-07-21", rating: 4.2, photoUrl: null }] };
      return route.fulfill({ json: list });
    }
    if (pathname === "/api/admin/movies" && method === "GET") return route.fulfill({ json: { content: [{ id: 960088, title: "Dunkirk", releaseDate: "2017-07-21", rating: 4.2, photoUrl: null, published: true }], totalPages: 1, totalElements: 1, number: 0 } });
    if (pathname === "/api/admin/reported-lists/960091/dismiss" && method === "POST") {
      requestedMethods.push("POST resolve report");
      list = { ...list, report: null, reportCount: 0 };
      return route.fulfill({ status: 204 });
    }
    if (pathname === "/api/admin/users/960071/deactivate" && method === "POST") { requestedMethods.push("POST block owner"); list = { ...list, ownerIsActive: false }; return route.fulfill({ status: 204 }); }
    if (pathname === "/api/admin/lists/960023" && method === "DELETE") { requestedMethods.push("DELETE list"); return route.fulfill({ status: 204 }); }
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 50 } });
  });

  await mkdir(resolve(process.cwd(), "../artifacts/visual-audit-20261126/admin-list-moderation"), { recursive: true });
  await page.setViewportSize({ width: 1440, height: 2815 });
  list = { ...list, report: null, reportCount: 0 };
  await page.goto("/en/admin?view=list-detail&listId=960023");
  const regularEditor = page.getByRole("region", { name: "Edit List" });
  await expect(regularEditor).toBeVisible();
  await expect(regularEditor.getByRole("heading", { name: "Author of the List" })).toBeVisible();
  await expect(regularEditor.getByRole("heading", { name: "Year" })).toBeVisible();
  await expect(regularEditor.getByRole("heading", { name: "Status" })).toBeVisible();
  await expect(regularEditor.getByRole("heading", { name: "Likes" })).toHaveCount(0);
  await expect(regularEditor.getByRole("heading", { name: "Reported Reason" })).toHaveCount(0);
  await expect(regularEditor.getByText("Christopher Nolan Best Films", { exact: true })).toBeVisible();
  const regularCard = regularEditor.locator("[class*='card']");
  expect((await regularCard.boundingBox())?.x).toBe(120);
  expect((await regularCard.boundingBox())?.y).toBeCloseTo(1218, 0);
  expect((await regularCard.boundingBox())?.height).toBeCloseTo(1019, 0);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261126/admin-list-moderation/edit-list-en-desktop-1440.png"), fullPage: false });

  list = { ...list, report: { id: 960091, reason: "SPAM", createdAt: "2026-11-20T10:00:00Z" }, reportCount: 9 };
  await page.goto("/en/admin?view=list-detail&listId=960023&reportId=960091");
  const detail = page.getByRole("region", { name: "Edit Reported List" });
  await expect(detail).toBeVisible();
  await expect(detail.getByText("FilmOracle", { exact: true })).toBeVisible();
  await expect(detail.getByText("Christopher Nolan Best Films", { exact: true })).toBeVisible();
  await expect(detail.getByText("Spam", { exact: true })).toBeVisible();
  await expect(detail.getByText("9", { exact: true })).toBeVisible();
  await expect(detail.getByRole("img", { name: "Oppenheimer" })).toBeVisible();
  const posterImages = detail.locator("[class*='posterRow'] img");
  const firstPoster = await posterImages.nth(0).boundingBox();
  const secondPoster = await posterImages.nth(1).boundingBox();
  const lastPoster = await posterImages.nth(3).boundingBox();
  const addFilmButton = await detail.getByRole("button", { name: "Add film" }).boundingBox();
  expect(firstPoster?.width).toBe(120);
  expect(firstPoster?.height).toBe(180);
  expect((secondPoster?.x ?? 0) - (firstPoster?.x ?? 0)).toBe(59);
  expect((addFilmButton?.x ?? 0) - ((lastPoster?.x ?? 0) + (lastPoster?.width ?? 0))).toBe(88);
  expect(addFilmButton?.width).toBe(69);
  expect((addFilmButton?.y ?? 0) + (addFilmButton?.height ?? 0) / 2).toBeCloseTo((firstPoster?.y ?? 0) + (firstPoster?.height ?? 0) / 2, 0);
  const card = detail.locator("[class*='card']");
  expect((await card.boundingBox())?.x).toBe(120);
  expect((await card.boundingBox())?.y).toBeCloseTo(1218, 0);
  expect((await card.boundingBox())?.height).toBeCloseTo(1172, 0);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261126/admin-list-moderation/reported-list-en-desktop-1440.png"), fullPage: false });

  await detail.getByRole("button", { name: "Change Text" }).click();
  await detail.getByRole("textbox", { name: "List name" }).fill("Nolan essentials");
  await detail.getByRole("textbox", { name: "List Text" }).fill("Edited list description");
  await detail.getByRole("button", { name: "Save changes" }).click();
  await expect(detail.getByRole("textbox", { name: "List Text" })).toHaveValue("Edited list description");
  expect(requestedMethods).toContain("PATCH list text");
  await page.reload();
  await expect(page.getByRole("region", { name: "Edit Reported List" }).getByRole("textbox", { name: "List Text" })).toHaveValue("Edited list description");

  await page.getByRole("button", { name: "Change Text" }).click();
  await page.getByRole("textbox", { name: "List Text" }).fill("This save will fail");
  failNextSave = true;
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Could not save the list.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "List Text" })).toHaveValue("This save will fail");
  await page.getByRole("button", { name: "Cancel" }).click();

  await detail.getByRole("button", { name: "Add film" }).click();
  const picker = page.getByRole("dialog", { name: "Add a film" });
  await picker.getByRole("searchbox", { name: "Search films" }).fill("Dunkirk");
  await picker.getByRole("button", { name: /Dunkirk/ }).click();
  await expect(detail.getByRole("img", { name: "Dunkirk" })).toBeVisible();
  expect(requestedMethods).toContain("POST list item");

  await detail.getByRole("button", { name: "Mark report resolved" }).click();
  await expect(detail.getByText("The list report has been resolved.")).toBeVisible();
  expect(requestedMethods).toContain("POST resolve report");

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/uk/admin?view=list-detail&listId=960023");
  const mobile = page.getByRole("region", { name: "Редагування списку" });
  await expect(mobile).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
  page.once("dialog", dialog => dialog.accept());
  await mobile.getByRole("button", { name: "Заблокувати автора" }).click();
  await expect(page.getByText("Автора списку заблоковано.")).toBeVisible();
  expect(requestedMethods).toContain("POST block owner");
  await page.goto("/en/admin?view=list-detail&listId=960023");
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Delete List" }).click();
  await expect(page.getByText("The list has been deleted.")).toBeVisible();
  expect(requestedMethods).toContain("DELETE list");
});
