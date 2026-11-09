import { expect, test, type Page } from "@playwright/test";

const list = { id: 98001, name: "Keyboard list", description: "", listType: "CUSTOM", isPublic: false, tags: [] as string[] };
const pageOfLists = { content: [list], totalPages: 1, totalElements: 1, number: 0, size: 12 };

async function prepare(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/users/me", route => route.fulfill({ json: { id: 980, username: "list-owner", role: "USER" } }));
  await page.route("**/api/lists/my/page**", route => route.fulfill({ json: pageOfLists }));
  await page.route("**/api/lists/my", route => route.fulfill({ json: [list] }));
}

test("linked list load retry restores focus on failure and focuses the title after recovery", async ({ page }) => {
  await prepare(page);
  let attempts = 0;
  await page.route("**/api/lists/my", route => {
    attempts += 1;
    return attempts < 3 ? route.fulfill({ status: 503, json: {} }) : route.fulfill({ json: [list] });
  });
  await page.goto("/uk/lists?list=98001&mode=view");
  const retry = page.getByRole("button", { name: "Спробувати ще", exact: true });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  const retryAfterFailure = page.getByRole("button", { name: "Спробувати ще", exact: true });
  await expect(retryAfterFailure).toBeFocused();
  await retryAfterFailure.press("Enter");
  await expect(page.getByRole("heading", { name: "Keyboard list", level: 2 })).toBeFocused();
  expect(attempts).toBe(3);
});

test("draft film search retry restores focus on repeated error and to the query after recovery", async ({ page }) => {
  await prepare(page);
  let attempts = 0;
  await page.route("**/api/movies/search?**", route => {
    if (new URL(route.request().url()).searchParams.get("q") !== "retry movie") return route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 8 } });
    attempts += 1;
    return attempts < 3
      ? route.fulfill({ status: 503, json: {} })
      : route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 8 } });
  });
  await page.goto("/uk/lists");
  await page.getByRole("button", { name: "Додати фільм", exact: true }).click();
  const query = page.getByRole("searchbox", { name: "Пошук фільмів" });
  await query.fill("retry movie");
  const retry = page.getByRole("button", { name: "Спробувати ще", exact: true });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  const retryAfterFailure = page.getByRole("button", { name: "Спробувати ще", exact: true });
  await expect(retryAfterFailure).toBeFocused();
  await retryAfterFailure.press("Enter");
  await expect(query).toBeFocused();
  expect(attempts).toBe(3);
});

test("selected list items retry restores focus on repeated error and to the title after recovery", async ({ page }) => {
  await prepare(page);
  let attempts = 0;
  await page.route("**/api/lists/98001/items", route => {
    attempts += 1;
    return attempts < 3 ? route.fulfill({ status: 503, json: {} }) : route.fulfill({ json: [] });
  });
  await page.goto("/uk/lists?list=98001&mode=edit");
  const retry = page.getByRole("button", { name: "Спробувати ще", exact: true });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  const retryAfterFailure = page.getByRole("button", { name: "Спробувати ще", exact: true });
  await expect(retryAfterFailure).toBeFocused();
  await retryAfterFailure.press("Enter");
  await expect(page.getByRole("heading", { name: "Keyboard list", level: 2 })).toBeFocused();
  expect(attempts).toBe(3);
});

test("my lists catalog retry restores focus on repeated error and to its heading after recovery", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/users/me", route => route.fulfill({ json: { id: 980, username: "list-owner", role: "USER" } }));
  let attempts = 0;
  await page.route("**/api/lists/my/page**", route => {
    attempts += 1;
    return attempts < 3
      ? route.fulfill({ status: 503, json: {} })
      : route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 12 } });
  });
  await page.route("**/api/lists/my", route => route.fulfill({ json: [list] }));
  await page.route("**/api/lists/98001/items", route => route.fulfill({ json: [] }));
  await page.goto("/uk/lists?list=98001&mode=edit");
  const retry = page.locator('[aria-labelledby="my-lists-heading"]').getByRole("button", { name: "Спробувати ще", exact: true });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  const retryAfterFailure = page.locator('[aria-labelledby="my-lists-heading"]').getByRole("button", { name: "Спробувати ще", exact: true });
  await expect(retryAfterFailure).toBeFocused();
  await retryAfterFailure.press("Enter");
  await expect(page.locator('[aria-labelledby="my-lists-heading"] h2')).toBeFocused();
  expect(attempts).toBe(3);
});

test("my lists catalog retry does not steal focus after the user tabs during a delayed response", async ({ page }) => {
  await prepare(page);
  let attempts = 0;
  let releaseResponse = () => {};
  const responseReady = new Promise<void>(resolve => { releaseResponse = resolve; });
  await page.route("**/api/lists/my/page**", async route => {
    attempts += 1;
    if (attempts === 1) return route.fulfill({ status: 503, json: {} });
    await responseReady;
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 12 } });
  });
  await page.route("**/api/lists/98001/items", route => route.fulfill({ json: [] }));
  await page.goto("/uk/lists?list=98001&mode=edit");
  const retry = page.locator('[aria-labelledby="my-lists-heading"]').getByRole("button", { name: "Спробувати ще", exact: true });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect(page.locator('[aria-labelledby="my-lists-heading"] [role="status"]')).toBeVisible();
  await page.keyboard.press("Tab");
  const tabTarget = await page.evaluateHandle(() => document.activeElement);
  releaseResponse();
  await expect(page.locator('[aria-labelledby="my-lists-heading"] h2')).toBeVisible();
  expect(await page.locator(":focus").evaluate((active, expected) => active === expected, tabTarget)).toBe(true);
  expect(attempts).toBe(2);
});
