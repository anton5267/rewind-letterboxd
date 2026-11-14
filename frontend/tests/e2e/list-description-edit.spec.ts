import { expect, test, type Page } from "@playwright/test";

async function fixture(page: Page, description: string | null, failFirst = false) {
  const list = { id: 98051, name: "Description fixture", description, listType: "CUSTOM", isPublic: false, isRanked: false, replyPreference: null, tags: [] };
  const writes: Record<string, unknown>[] = [];
  await page.route(url => url.pathname.startsWith("/api/"), route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === "/api/users/me") return route.fulfill({ json: { id: 98041, username: "description-reader", role: "USER" } });
    if (path === "/api/auth/csrf") return route.fulfill({ json: { token: "description-fixture" } });
    if (path.endsWith("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (path === "/api/lists/my") return route.fulfill({ json: [list] });
    if (path === "/api/lists/my/page") return route.fulfill({ json: { content: [list], number: 0, size: 12, totalPages: 1, totalElements: 1 } });
    if (path === "/api/lists/98051/items") return route.fulfill({ json: [] });
    if (path === "/api/lists/98051" && request.method() === "PATCH") {
      const body = request.postDataJSON();
      writes.push(body);
      if (failFirst && writes.length === 1) return route.fulfill({ status: 503, json: {} });
      // Match the established Spring and Edge PATCH semantics.
      if (typeof body.description === "string") list.description = body.description;
      list.name = body.name ?? list.name;
      list.isPublic = body.isPublic ?? list.isPublic;
      list.isRanked = body.isRanked ?? list.isRanked;
      return route.fulfill({ json: list });
    }
    return route.fulfill({ json: [] });
  });
  return { list, writes };
}

for (const language of ["uk", "en"] as const) {
  const copy = language === "uk" ? { save: "Зберегти", saved: "Збережено." } : { save: "Save", saved: "Saved." };

  test(`list descriptions clear, retain failed drafts and accept replacement text in ${language}`, async ({ page }) => {
    const state = await fixture(page, "Original description", true);
    await page.setViewportSize({ width: language === "uk" ? 1440 : 393, height: 900 });
    await page.goto(`/${language}/lists?list=98051&mode=edit`);
    const description = page.locator('[data-list-field="description"]');
    await expect(description).toHaveValue("Original description");
    await description.fill("");
    await page.getByRole("button", { name: copy.save, exact: true }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(description).toHaveValue("");
    expect(state.writes[0].description).toBe("");
    expect(state.list.description).toBe("Original description");
    await page.getByRole("button", { name: copy.save, exact: true }).click();
    await expect(page.getByText(copy.saved, { exact: true })).toBeVisible();
    expect(state.list.description).toBe("");
    await page.reload();
    await expect(description).toHaveValue("");
    await description.fill("  Updated description  ");
    await page.getByRole("button", { name: copy.save, exact: true }).click();
    await expect(description).toHaveValue("Updated description");
    expect(state.writes.map(body => body.description)).toEqual(["", "", "Updated description"]);
    await page.reload();
    await expect(description).toHaveValue("Updated description");
  });

  test(`an unchanged empty description preserves its nullable value in ${language}`, async ({ page }) => {
    const state = await fixture(page, null);
    await page.setViewportSize({ width: language === "uk" ? 393 : 1440, height: 900 });
    await page.goto(`/${language}/lists?list=98051&mode=edit`);
    const description = page.locator('[data-list-field="description"]');
    await expect(description).toHaveValue("");
    await page.locator('[data-list-field="name"]').fill("Renamed collection");
    await page.getByRole("button", { name: copy.save, exact: true }).click();
    await expect(page.getByText(copy.saved, { exact: true })).toBeVisible();
    expect(state.writes).toHaveLength(1);
    expect(Object.hasOwn(state.writes[0], "description")).toBe(false);
    expect(state.list.description).toBeNull();
    await page.reload();
    await expect(description).toHaveValue("");
    await expect(page.locator('[data-list-field="name"]')).toHaveValue("Renamed collection");
  });
}
