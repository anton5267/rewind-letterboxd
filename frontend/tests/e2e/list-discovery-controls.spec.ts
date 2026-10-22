import { expect, test } from "@playwright/test";
import { cleanupDisposableAccount } from "./helpers";

test("tag conflicts use the real recent feed and preserve browser history", async ({ page, baseURL }) => {
  test.setTimeout(60_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = `tag${suffix.slice(-12)}`;
  const email = `${username}@example.invalid`;
  const password = "E2e-password-123!";
  const tag = `tag${suffix}`.padEnd(50, "x");
  const listName = `Tagged list ${suffix}`;
  const otherListName = `Unrelated list ${suffix}`;
  const csrfHeaders = async () => {
    expect((await page.request.get("/api/auth/csrf")).ok()).toBe(true);
    const cookie = (await page.context().cookies()).find(item => item.name === "XSRF-TOKEN");
    expect(cookie).toBeTruthy();
    return { "X-XSRF-TOKEN": decodeURIComponent(cookie!.value) };
  };
  expect((await page.request.post("/api/auth/register", {
    headers: await csrfHeaders(), data: { username, email, password },
  })).ok()).toBe(true);

  try {
    expect((await page.request.post("/api/auth/login", {
      headers: await csrfHeaders(), data: { email, password },
    })).ok()).toBe(true);
    for (const [name, tags] of [[listName, [tag]], [otherListName, []]] as const) {
      expect((await page.request.post("/api/lists", {
        headers: await csrfHeaders(), data: { name, description: "Disposable tag filter check", isPublic: true, tags },
      })).ok()).toBe(true);
    }

    const feedRequests: URL[] = [];
    page.on("request", request => {
      const url = new URL(request.url());
      if (/^\/api\/lists\/public(?:\/(?:popular|recently-liked|team))?$/.test(url.pathname)) feedRequests.push(url);
    });

    for (const [feed, lang, width] of [["popular", "uk", 320], ["recently-liked", "en", 393], ["team", "uk", 768]] as const) {
      await page.setViewportSize({ width, height: 900 });
      const previousUrl = `/${lang}/lists/discover?feed=${feed}`;
      await page.goto(previousUrl);
      await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
      const before = feedRequests.length;
      const taggedResponse = page.waitForResponse(response => {
        const url = new URL(response.url());
        return url.pathname === "/api/lists/public" && url.searchParams.get("tag") === tag;
      });
      await page.goto(`/${lang}/lists/discover?feed=${feed}&tag=${tag}&source=external#lists-grid-heading`);
      expect((await taggedResponse).ok()).toBe(true);
      await expect(page).toHaveURL(new RegExp(`/${lang}/lists/discover\\?feed=recent&tag=${tag}&source=external#lists-grid-heading$`));
      await expect(page.getByRole("heading", { name: listName })).toBeVisible();
      await expect(page.getByRole("heading", { name: otherListName })).toHaveCount(0);
      expect(feedRequests.slice(before).length).toBeGreaterThan(0);
      expect(feedRequests.slice(before).every(url => url.pathname === "/api/lists/public" && url.searchParams.get("tag") === tag)).toBe(true);
      await page.getByRole("heading", { name: listName }).getByRole("link").click();
      await expect(page).toHaveURL(/\/lists\/public\/\d+$/);
      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`feed=recent&tag=${tag}&source=external#lists-grid-heading$`));
      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`${previousUrl.replace("?", "\\?")}$`));
    }
  } finally {
    await cleanupDisposableAccount(baseURL, email, password);
  }
});

test("long list tags fit mobile and desktop widths on the real API", async ({ page }) => {
  const tag = "a".repeat(50);
  for (const width of [320, 393, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const response = page.waitForResponse(item => {
      const url = new URL(item.url());
      return url.pathname === "/api/lists/public" && url.searchParams.get("tag") === tag;
    });
    await page.goto(`/uk/lists/discover?feed=recent&tag=${tag}`);
    expect((await response).ok()).toBe(true);
    const filter = page.locator("section[aria-labelledby='lists-grid-heading'] > div > span");
    await expect(filter).toHaveText(`#${tag}`);
    const bounds = await filter.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, viewport: innerWidth, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    expect(bounds.left).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual(bounds.viewport + 1);
    expect(bounds.overflow, `List tag at ${width}px must not overflow`).toBeLessThanOrEqual(1);
  }
});

test("unfiltered public list feed selection keeps its real API endpoint", async ({ page }) => {
  for (const feed of ["recent", "popular", "recently-liked", "team"]) {
    const endpoint = feed === "recent" ? "/api/lists/public" : `/api/lists/public/${feed}`;
    const response = page.waitForResponse(item => new URL(item.url()).pathname === endpoint);
    await page.goto(`/en/lists/discover?feed=${feed}`);
    const result = await response;
    expect(result.ok()).toBe(true);
    expect(new URL(result.url()).searchParams.has("tag")).toBe(false);
    await expect(page).toHaveURL(new RegExp(`feed=${feed}$`));
    await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
    await expect(page.getByRole("alert")).toHaveCount(0);
  }
});

test("public lists landing follows the Figma section layout without a duplicate feed rail", async ({ page }) => {
  for (const width of [393, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/en/lists/discover");
    const main = page.getByRole("main");
    await expect(main).toHaveAttribute("aria-busy", "false");
    await expect(main.getByRole("navigation", { name: "List feeds", exact: true })).toHaveCount(0);
    for (const [href, expectedCount] of [
      ["/en/lists/discover?feed=team", 1],
      ["/en/lists/discover?feed=popular", 1],
      ["/en/lists/discover?feed=recently-liked", 1],
      ["/en/lists/discover?feed=recent", 2],
    ] as const) {
      await expect(main.locator(`a[href="${href}"]`).filter({ hasText: "View all" })).toHaveCount(expectedCount);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `Public lists landing must not overflow at ${width}px`).toBeLessThanOrEqual(1);
  }
});
