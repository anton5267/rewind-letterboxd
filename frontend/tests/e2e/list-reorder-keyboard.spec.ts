import { expect, test } from "@playwright/test";

test("owner reorders list films with the keyboard and persists the new order", async ({ page }) => {
  const owner = { id: 98001, username: "list-reorder-owner", role: "USER" };
  const list = { id: 98021, name: "Fixture custom list", description: null, listType: "CUSTOM", isPublic: false, tags: [] };
  const movies = [
    { id: 98011, title: "Arrival", releaseDate: "2016-11-11", rating: 7.9, photoUrl: null },
    { id: 98012, title: "Moonlight", releaseDate: "2016-10-21", rating: 7.4, photoUrl: null },
  ];
  let items = movies.map((movie, index) => ({ id: 98101 + index, position: index, movie }));
  const savedOrders: number[][] = [];
  let failNextReorder = true;

  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    if (pathname === "/api/users/me") return route.fulfill({ json: owner });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "list-reorder-keyboard" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/lists/my") return route.fulfill({ json: [list] });
    if (pathname === "/api/lists/my/page") return route.fulfill({ json: { content: [list], totalPages: 1, totalElements: 1, number: 0, size: 12 } });
    if (pathname === "/api/lists/98021/items" && request.method() === "GET") return route.fulfill({ json: items });
    if (pathname === "/api/lists/98021/items/reorder" && request.method() === "PUT") {
      const { orderedItemIds } = request.postDataJSON() as { orderedItemIds: number[] };
      savedOrders.push(orderedItemIds);
      if (failNextReorder) {
        failNextReorder = false;
        return route.fulfill({ status: 503, json: {} });
      }
      items = orderedItemIds.map((id, position) => ({ ...items.find(item => item.id === id)!, position }));
      return route.fulfill({ status: 200, body: "" });
    }
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 393, height: 844 });
  await page.goto("/uk/lists?list=98021&mode=edit");
  const first = page.getByRole("button", { name: "Змінити порядок: Arrival" });
  await expect(first).toBeVisible();
  await expect(page.getByRole("button", { name: "Змінити порядок: Moonlight" })).toBeVisible();
  await first.focus();
  await first.press("ArrowDown");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect.poll(async () => page.locator('button[aria-label^="Змінити порядок:"]').evaluateAll(buttons => buttons.map(button => button.getAttribute("aria-label"))))
    .toEqual(["Змінити порядок: Arrival", "Змінити порядок: Moonlight"]);
  await expect(first).toBeFocused();
  await expect.poll(() => savedOrders).toEqual([[98102, 98101]]);
  await first.press("ArrowDown");

  await expect.poll(() => savedOrders).toEqual([[98102, 98101], [98102, 98101]]);
  await expect.poll(async () => page.locator('button[aria-label^="Змінити порядок:"]').evaluateAll(buttons => buttons.map(button => button.getAttribute("aria-label"))))
    .toEqual(["Змінити порядок: Moonlight", "Змінити порядок: Arrival"]);
  await expect(first).toBeFocused();
  await page.screenshot({ path: "../artifacts/functional-audit-20261103/list-reorder/list-reorder-uk-393-fixture.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "../artifacts/functional-audit-20261103/list-reorder/list-reorder-uk-1440-fixture.png", fullPage: true });
});
