import { expect, test } from "@playwright/test";

// Controlled API responses exercise the carousel independently of shared dev data.
const movies = [1, 2, 3].map(id => ({ id, title: `Preview film ${id}`, photoUrl: null, releaseDate: null, rating: null }));
const lists = [1, 2, 3].map(id => ({
  id: 900_000 + id,
  name: `Public list ${id}`,
  description: `List description ${id}`,
  ownerId: 800_000 + id,
  ownerUsername: `list-owner-${id}`,
  tags: [],
  itemCount: id === 1 ? 3 : id === 2 ? 1 : 0,
  likeCount: 0,
  previewMovies: id === 1 ? movies : id === 2 ? movies.slice(0, 1) : [],
}));

test("Home lists remain reachable by keyboard across the scrollable poster cards", async ({ page }) => {
  await page.route("**/api/lists/public/popular?**", route => route.fulfill({ json: { content: lists, totalElements: 3, totalPages: 1, number: 0, size: 4 } }));
  await page.route(`**/api/lists/public/${lists[1].id}`, route => route.fulfill({ json: { ...lists[1], ownerAvatarUrl: null, movies: movies.slice(0, 1) } }));

  for (const width of [320, 393, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/en/home");
    const panel = page.getByRole("region", { name: "Public lists", exact: true });
    await expect(panel).toHaveAttribute("aria-busy", "false");
    const cards = panel.locator("article");
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0).getByRole("img")).toHaveText(movies.map(movie => movie.title).join(""));
    await expect(cards.nth(1).getByRole("img")).toHaveText(movies[0].title);
    await expect(cards.nth(2).getByRole("img")).toHaveText(lists[2].name);

    await cards.nth(0).getByRole("link", { name: lists[0].name, exact: true }).first().focus();
    await page.keyboard.press("Tab"); // Title of the first list.
    await page.keyboard.press("Tab"); // Owner of the first list.
    await page.keyboard.press("Tab"); // Poster of the next list scrolls into view.
    const nextPoster = cards.nth(1).getByRole("link", { name: lists[1].name, exact: true }).first();
    await expect(nextPoster).toBeFocused();
    await expect.poll(() => nextPoster.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const group = element.closest('[role="group"]')!.getBoundingClientRect();
      return rect.left >= group.left && rect.right <= group.right;
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    await expect(panel.getByRole("link", { name: "View all", exact: true })).toHaveAttribute("href", "/en/lists/discover?feed=popular");
  }

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`/en/lists/public/${lists[1].id}`);
  await expect(page.getByRole("heading", { level: 1, name: lists[1].name, exact: true })).toBeVisible();
});

test("Home list feed keeps retry and honest empty states", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/lists/public/popular?**", route => {
    attempts += 1;
    return attempts === 1 ? route.fulfill({ status: 503, json: {} })
      : route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 4 } });
  });
  await page.goto("/en/home");
  const panel = page.getByRole("region", { name: "Public lists", exact: true });
  await expect(panel.getByRole("alert")).toBeVisible();
  await panel.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(panel).toHaveAttribute("aria-busy", "false");
  await expect(panel.locator("article")).toHaveCount(0);
  await expect(panel.getByRole("alert")).toHaveCount(0);
  await expect(panel.getByText("No public lists yet.", { exact: true })).toBeVisible();
  expect(attempts).toBe(2);
});
