import { expect, test } from "@playwright/test";
import { adminMovieFixture } from "./fixtures/admin-movie";

for (const language of ["uk", "en"] as const) {
  test(`Admin entry keeps its localized title and release-date payload in ${language}`, async ({ page }) => {
    await adminMovieFixture(page);
    const creates: Record<string, unknown>[] = [];
    await page.route("**/api/admin/movies", async route => {
      if (route.request().method() !== "POST") return route.fallback();
      const body = route.request().postDataJSON();
      creates.push(body);
      await route.fulfill({ json: { id: 940002, ...body, published: true } });
    });
    const labels = language === "uk"
      ? { admin: "Панель адміністратора", add: "Додати фільм", title: "Назва фільму", date: "Дата виходу", plot: "Опис", create: "Створити", reviews: "Огляди" }
      : { admin: "Admin dashboard", add: "Add film", title: "Film title", date: "Release date", plot: "Description", create: "Create", reviews: "Reviews" };
    await page.goto(`${language}/admin?view=movies`);
    await expect(page.locator("#admin-dashboard-title")).toHaveText("movie-controls-admin");
    await expect(page).toHaveTitle(`${labels.admin} | REWIND`);
    const add = page.locator("summary").filter({ hasText: labels.add });
    const editor = page.locator("details").filter({ has: add });
    await add.click();
    await page.getByLabel(labels.date, { exact: true }).fill("2024-02-29");
    await page.getByLabel(labels.title, { exact: true }).fill("Controlled date fixture");
    await page.getByLabel(labels.plot, { exact: true }).fill("Changing another field preserves the selected date.");
    await expect(page.getByLabel(labels.date, { exact: true })).toHaveValue("2024-02-29");
    await page.getByRole("button", { name: labels.create, exact: true }).click();
    await expect.poll(() => creates.length).toBe(1);
    expect(creates[0]).toMatchObject({ title: "Controlled date fixture", releaseDate: "2024-02-29" });
    await expect(editor).toHaveJSProperty("open", false);
    await add.click();
    await expect(page.getByLabel(labels.date, { exact: true })).toHaveValue("");
    await page.getByLabel(labels.title, { exact: true }).fill("Controlled undated fixture");
    await page.getByRole("button", { name: labels.create, exact: true }).click();
    await expect.poll(() => creates.length).toBe(2);
    expect(creates[1]).toMatchObject({ title: "Controlled undated fixture", releaseDate: null });
    await expect(editor).toHaveJSProperty("open", false);
    const navigation = page.getByRole("navigation", { name: labels.admin, exact: true });
    await navigation.getByRole("link", { name: labels.reviews, exact: true }).click();
    await expect(page).toHaveTitle(`${labels.admin} | REWIND`);
    await page.goBack();
    await expect(page).toHaveTitle(`${labels.admin} | REWIND`);
  });
}
