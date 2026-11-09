import { expect, test } from "@playwright/test";

test("public list detail keeps retry focused after repeated failure and focuses the heading after recovery", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/lists/public/985000", route => {
    attempts += 1;
    return attempts < 3
      ? route.fulfill({ status: 503, json: {} })
      : route.fulfill({ json: {
        id: 985000,
        name: "Retry focus list",
        description: "List loaded after retry.",
        ownerId: 985001,
        ownerUsername: "FilmOracle",
        ownerAvatarUrl: null,
        tags: [],
        likeCount: 0,
        movies: [],
      } });
  });

  await page.goto("/en/lists/public/985000");
  const retry = page.getByRole("button", { name: "Retry", exact: true });
  await expect(retry).toBeVisible();
  await retry.click();
  const retryAfterFailure = page.getByRole("button", { name: "Retry", exact: true });
  await expect(retryAfterFailure).toBeFocused();
  await retryAfterFailure.press("Enter");
  await expect(page.getByRole("heading", { name: "Retry focus list", level: 1 })).toBeFocused();
  expect(attempts).toBe(3);
});
