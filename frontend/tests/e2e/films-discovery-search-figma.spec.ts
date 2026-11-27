import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const suggestions = [
  { id: 99101, title: "Dune", releaseDate: "2021-10-22", rating: 8.0, photoUrl: null },
  { id: 99102, title: "Dune: Part Two", releaseDate: "2024-02-27", rating: 8.2, photoUrl: null },
  { id: 99103, title: "Dune", releaseDate: "1984-12-14", rating: 6.3, photoUrl: null },
];

test("Films Discovery search matches the Figma pill and shows API-backed film suggestions", async ({ page }) => {
  const filmQueries: string[] = [];
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "films-search-figma" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/genres", route => route.fulfill({ json: [] }));
  await page.route("**/api/reviews/recent**", route => route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } }));
  await page.route("**/api/reviews/popular**", route => route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } }));
  await page.route("**/api/lists/public/team", route => route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } }));
  await page.route("**/api/movies/search**", route => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get("q") ?? "";
    filmQueries.push(query);
    const content = query.toLowerCase() === "dune" ? suggestions : [];
    return route.fulfill({ json: { content, number: 0, size: 3, totalPages: content.length ? 1 : 0, totalElements: content.length } });
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en/films/discover");
  const search = page.locator("#discover-film-query");
  const field = page.locator("form[class*='movieSearch']");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  const fieldBox = await field.boundingBox();
  expect(fieldBox?.width).toBe(251);
  expect(fieldBox?.height).toBe(49);
  await expect(search).toHaveCSS("font-size", "18px");
  await expect(field.locator("button img")).toHaveJSProperty("naturalWidth", 31);

  await search.fill("Dune");
  const listbox = page.getByRole("listbox");
  await expect(search).toHaveAttribute("aria-expanded", "true");
  await expect(listbox).toBeVisible();
  await expect(listbox.getByRole("option")).toHaveText(["Dune (2021)", "Dune: Part Two (2024)", "Dune (1984)"]);
  expect(filmQueries.some(query => query.toLowerCase() === "dune")).toBe(true);
  const listBox = await listbox.boundingBox();
  expect(listBox?.width).toBe(251);
  expect(listBox?.height).toBe(136);
  const evidenceDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261126/films-discovery-search");
  await mkdir(evidenceDirectory, { recursive: true });
  await page.screenshot({ path: resolve(evidenceDirectory, "films-discovery-dune-suggestions-en-desktop-1440.png"), fullPage: false });
  await search.press("ArrowDown");
  await expect(search).toHaveAttribute("aria-activedescendant", "discover-film-suggestion-99101");
  await expect(listbox.getByRole("option").first()).toHaveAttribute("aria-selected", "true");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/en\/films\/99101$/);
});
