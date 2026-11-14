import { expect, test, type BrowserContext } from "@playwright/test";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

const empty = { content: [], number: 0, totalElements: 0, totalPages: 0 };
const initialIds = [101, 102, 109, 103, 104, 105, 106];
const movie = (id: number) => ({ id, title: `Film ${id}`, photoUrl: null, releaseDate: "2020-01-01", rating: 4 });

async function installOrderFixture(context: BrowserContext, options: { delay?: "write"; fail?: boolean; commitThenFailOnce?: boolean } = {}) {
  await installHostedAuthFixture(context);
  const orders = new Map([[7, [...initialIds]], [6, [...initialIds]]]);
  const writes: { actor: number; movieId: number; targetMovieId: number; placement: "before" | "after"; expectedUserId: number }[] = [];
  let started = false;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let failOnce = options.commitThenFailOnce ?? false;
  await context.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const actor = request.headers().authorization?.endsWith("6") ? 6 : 7;
    const order = orders.get(actor)!;
    if (path === "/api/users/me") return route.fulfill({ json: { id: actor, username: `reader-${actor}`, role: "USER" } });
    if (path === "/api/profile/me") return route.fulfill({ json: {
      id: actor, username: `reader-${actor}`, displayName: `Reader ${actor}`,
      email: "fixture@example.invalid", role: "USER", avatarUrl: null, bannerUrl: null, supabaseLinked: true,
      stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 6 },
      lists: [{ id: actor * 10, name: "Favorites", listType: "FAVORITES", isPublic: false }],
      recentRatings: [], recentReviews: [],
    } });
    if (path === "/api/profile/me/favorites") return route.fulfill({ json: {
      ...empty, content: order.filter(id => id !== 109).map(movie), totalElements: 6, totalPages: 1,
    } });
    if (path === "/api/profile/me/favorites/order" && request.method() === "PUT") {
      const move = request.postDataJSON() as typeof writes[number];
      writes.push({ ...move, actor });
      if (actor === 7 && options.delay === "write") { started = true; await gate; }
      if (move.expectedUserId !== actor) return route.fulfill({ status: 409, json: {} });
      if (options.fail) return route.fulfill({ status: 503, json: {} });
      const source = order.indexOf(move.movieId);
      const target = order.indexOf(move.targetMovieId);
      if (source < 0 || target < 0) return route.fulfill({ status: 404, json: {} });
      const next = order.filter(id => id !== move.movieId);
      next.splice(next.indexOf(move.targetMovieId) + (move.placement === "after" ? 1 : 0), 0, move.movieId);
      orders.set(actor, next);
      if (failOnce) { failOnce = false; return route.fulfill({ status: 503, json: {} }); }
      return route.fulfill({ status: 204 });
    }
    if (path.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (path.endsWith("/social-links") || path === "/api/lists/my") return route.fulfill({ json: [] });
    return route.fulfill({ json: empty });
  });
  return { orders, writes, release, started: () => started };
}

const sectionSelector = 'section[aria-labelledby="settings-favorites-title"]';
const visibleIds = (order: number[]) => order.filter(id => id !== 109).slice(0, 4).map(String);

test("favorite keyboard and mouse order persists with all hidden and trailing items in uk", async ({ context, page }) => {
  const state = await installOrderFixture(context, { commitThenFailOnce: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await signInHostedFixture(page, "uk");
  await page.goto("/uk/profile?settings=profile");
  const section = page.locator(sectionSelector);
  const handles = section.locator("[data-list-reorder-item]");
  await expect(handles).toHaveCount(4);
  await section.locator('[data-list-reorder-item="101"]').press("ArrowDown");
  await expect.poll(() => state.writes.length).toBe(1);
  await expect(handles).toHaveCount(4);
  await expect(section.locator('[data-list-reorder-item="101"]')).toBeFocused();
  expect(state.writes[0]).toEqual({ actor: 7, movieId: 101, targetMovieId: 102, placement: "after", expectedUserId: 7 });
  await expect(page.locator("#profile-action-error")).toBeVisible();
  expect(await section.locator("li").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-list-item-id")))).toEqual(visibleIds(state.orders.get(7)!));
  await section.locator('[data-list-reorder-item="101"]').press("ArrowUp");
  await expect.poll(() => state.writes.length).toBe(2);
  await expect(page.locator("#profile-action-error")).toHaveCount(0);
  await expect(section.locator('[data-list-reorder-item="101"]')).toBeFocused();
  await section.getByRole("link", { name: "Film 101", exact: true }).dragTo(section.getByRole("link", { name: "Film 103", exact: true }));
  await expect.poll(() => state.writes.length).toBe(3);
  await expect(handles).toHaveCount(4);
  await page.reload();
  await expect(handles).toHaveCount(4);
  expect(await section.locator("li").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-list-item-id")))).toEqual(visibleIds(state.orders.get(7)!));
  expect(state.orders.get(7)).toContain(109);
  expect(state.orders.get(7)).toHaveLength(7);
  await page.screenshot({ path: test.info().outputPath("favorite-order-desktop.png"), fullPage: true });
});

test("favorite touch drag saves on phone and retains the 44px controls in en", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 393, height: 900 }, hasTouch: true, isMobile: true });
  try {
    const state = await installOrderFixture(context);
    const page = await context.newPage();
    await signInHostedFixture(page, "en");
    await page.goto("/en/profile?settings=profile");
    const section = page.locator(sectionSelector);
    const handle = section.locator('[data-list-reorder-item="101"]');
    await handle.scrollIntoViewIfNeeded();
    const from = (await handle.boundingBox())!;
    const to = (await section.locator('[data-list-item-id="103"]').boundingBox())!;
    await expect(handle.locator("img")).toHaveAttribute("src", "/images/list-entry-drag.png");
    await expect(handle.locator("img")).toHaveJSProperty("naturalWidth", 96);
    const grip = (await handle.locator("img").boundingBox())!;
    expect(grip.width).toBe(31);
    expect(grip.height).toBe(31);
    expect(from.width).toBe(44);
    expect(from.height).toBe(44);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from.x + 22, y: from.y + 22 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: to.x + to.width / 2, y: to.y + to.height / 2 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => state.writes.length).toBe(1);
    await expect(section.locator("[data-list-reorder-item]")).toHaveCount(4);
    expect(await section.locator("li").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-list-item-id")))).toEqual(visibleIds(state.orders.get(7)!));
    await page.reload();
    await expect(section.locator("[data-list-reorder-item]")).toHaveCount(4);
    expect(await section.locator("li").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-list-item-id")))).toEqual(visibleIds(state.orders.get(7)!));
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: test.info().outputPath("favorite-order-phone.png"), fullPage: true });
  } finally { await context.close(); }
});

for (const scenario of ["write", "write-failure"] as const) {
  test(`late favorite reorder ${scenario} stays with its original viewer`, async ({ context, page }) => {
    const state = await installOrderFixture(context, { delay: "write", fail: scenario === "write-failure" });
    try {
      await signInHostedFixture(page, "en");
      await page.goto("/en/profile?settings=profile");
      const section = page.locator(sectionSelector);
      await section.locator('[data-list-reorder-item="101"]').press("ArrowDown");
      await expect.poll(state.started).toBe(true);
      const other = await context.newPage();
      await other.goto("/en/email-action/#rewind_action=signup&type=email&token_hash=fixture-next-account");
      await other.getByRole("button", { name: "Confirm email", exact: true }).click();
      await expect(page.locator("#profile-display-name")).toHaveValue("Reader 6");
      await expect(section.locator("[data-list-reorder-item]")).toHaveCount(4);
      await page.locator("#profile-display-name").fill("Current reader draft");
      await page.locator("#profile-display-name").focus();
      state.release();
      await page.waitForLoadState("networkidle");
      expect(state.writes.every(write => write.actor === 7)).toBe(true);
      expect(state.writes).toHaveLength(1);
      expect(state.orders.get(6)).toEqual(initialIds);
      await expect(page.locator("#profile-display-name")).toHaveValue("Current reader draft");
      await expect(page.locator("#profile-display-name")).toBeFocused();
      await expect(page.locator("#profile-action-error")).toHaveCount(0);
      await expect(section.locator("[data-list-reorder-item]")).toHaveCount(4);
    } finally { state.release(); }
  });
}
