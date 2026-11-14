import { expect, test } from "@playwright/test";
import { adminMovieFixture } from "./fixtures/admin-movie";

for (const width of [1440, 393]) {
  test(`Admin preserves an omitted original language on an unrelated edit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const { movie, movies, writes } = await adminMovieFixture(page, { details: { originalLanguage: undefined } });
    const row = movies.getByRole("listitem").filter({ hasText: movie.title });
    await row.getByRole("button", { name: "Edit", exact: true }).click();
    await expect(movies.getByRole("textbox", { name: /^Original language/ })).toHaveValue("");
    await movies.locator('input[required][maxlength="255"]').fill("Updated title");
    await movies.getByRole("button", { name: "Save", exact: true }).click();
    await expect.poll(() => writes.filter(write => write.path === `/api/admin/movies/${movie.id}`).length).toBe(1);
    const update = writes.find(write => write.path === `/api/admin/movies/${movie.id}`)?.data;
    expect(update).toMatchObject({ title: "Updated title" });
    expect(Object.hasOwn(update as object, "originalLanguage")).toBe(false);
    await expect(movies.getByRole("listitem").filter({ hasText: "Updated title" })).toBeVisible();
  });

  test(`Admin can supply or explicitly clear original language at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const { movie, movies, writes } = await adminMovieFixture(page, { details: { originalLanguage: undefined } });
    const row = movies.getByRole("listitem").filter({ hasText: movie.title });
    const language = movies.getByRole("textbox", { name: /^Original language/ });
    for (const { edits, expected } of [
      { edits: ["FR"], expected: "fr" },
      { edits: ["de", ""], expected: null },
    ]) {
      await row.getByRole("button", { name: "Edit", exact: true }).click();
      await expect(language).toHaveValue("");
      for (const value of edits) await language.fill(value);
      const before = writes.length;
      await movies.getByRole("button", { name: "Save", exact: true }).click();
      await expect.poll(() => writes.length).toBe(before + 1);
      expect(writes.at(-1)?.data).toMatchObject({ originalLanguage: expected });
      await expect(row.getByRole("button", { name: "Edit", exact: true })).toBeFocused();
    }
  });

  test(`Admin retains an explicit null original language at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const { movie, movies, writes } = await adminMovieFixture(page, { details: { originalLanguage: null } });
    await movies.getByRole("listitem").filter({ hasText: movie.title }).getByRole("button", { name: "Edit", exact: true }).click();
    await expect(movies.getByRole("textbox", { name: /^Original language/ })).toHaveValue("");
    await movies.getByRole("button", { name: "Save", exact: true }).click();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0].data).toMatchObject({ originalLanguage: null });
  });
}
