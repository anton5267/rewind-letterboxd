import { expect, test } from "@playwright/test";
import { adminMovieFixture } from "./fixtures/admin-movie";

for (const locale of ["uk", "en"] as const) {
  test(`Admin edits an unpublished film through protected details in ${locale}`, async ({ page }) => {
    await page.setViewportSize(locale === "uk" ? { width: 1440, height: 1000 } : { width: 393, height: 852 });
    const publicDetailRequests: string[] = [];
    await page.route("**/api/movies/*/details", route => {
      publicDetailRequests.push(route.request().url());
      return route.fulfill({ status: 404, json: { message: "Not found" } });
    });
    const { movie, writes } = await adminMovieFixture(page, { published: false });
    await page.goto(`/${locale}/admin?view=movies`);
    const movies = page.getByRole("region", { name: locale === "uk" ? "База фільмів" : "Film database", exact: true });
    const row = movies.getByRole("listitem").filter({ hasText: movie.title });
    const edit = locale === "uk" ? "Редагувати" : "Edit";
    await row.getByRole("button", { name: edit, exact: true }).click();
    const title = movies.getByRole("textbox", { name: locale === "uk" ? "Назва фільму" : "Film title", exact: true });
    await expect(title).toHaveValue(movie.title);
    await title.fill("Updated unpublished film");
    await movies.getByRole("button", { name: locale === "uk" ? "Зберегти" : "Save", exact: true }).click();
    const updated = movies.getByRole("listitem").filter({ hasText: "Updated unpublished film" });
    await expect(updated).toContainText(locale === "uk" ? "Не опубліковано" : "Unpublished");
    await expect(updated.getByRole("button", { name: edit, exact: true })).toBeFocused();
    expect(movie.published).toBe(false);
    expect(writes).toHaveLength(1);
    expect(writes[0].path).toBe(`/api/admin/movies/${movie.id}`);
    expect(writes[0].data).toMatchObject({ title: "Updated unpublished film", genreIds: [7] });
    expect(publicDetailRequests).toEqual([]);
  });
}
