import { expect, test } from "@playwright/test";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

for (const language of ["uk", "en"] as const) {
  test(`settings toolbar separates its title and actions in ${language}`, async ({ context, page }) => {
    await installHostedAuthFixture(context);
    const writes: string[] = [];
    const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0 };
    await context.route(url => url.pathname.startsWith("/api/"), route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (request.method() !== "GET") {
        writes.push(request.method() + " " + path);
        return route.abort();
      }
      if (path === "/api/users/me") return route.fulfill({ json: { id: 7, username: "toolbar-reader", role: "USER" } });
      if (path === "/api/profile/me") return route.fulfill({ json: {
        id: 7, username: "toolbar-reader", displayName: null, email: "fixture@example.invalid", role: "USER",
        avatarUrl: null, bannerUrl: null, bio: null, supabaseLinked: true, lists: [], recentRatings: [], recentReviews: [],
        stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
      } });
      if (path.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
      if (path.endsWith("/social-links") || path === "/api/lists/my") return route.fulfill({ json: [] });
      if (path === "/api/newsletter/subscription") return route.fulfill({ json: { subscribed: false } });
      return route.fulfill({ json: emptyPage });
    });
    await page.setViewportSize({ width: 393, height: 852 });
    await signInHostedFixture(page, language);
    const toolbar = page.locator("#account-settings-mobile-title").locator("..");
    for (const tab of ["avatar", "profile", "authentication", "connections"]) {
      await page.goto(`${language}/profile?settings=${tab}`);
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
      for (const width of [393, 360, 320, 767]) {
        await page.setViewportSize({ width, height: 852 });
        await expect(toolbar).toBeVisible();
        const geometry = await toolbar.evaluate(element => {
          const textBounds = (node: Element) => {
            const range = document.createRange();
            range.selectNodeContents(node);
            const box = range.getBoundingClientRect();
            return { left: box.left, right: box.right };
          };
          const title = element.querySelector("h2")!.getBoundingClientRect();
          return {
            cancel: textBounds(element.firstElementChild!), action: textBounds(element.lastElementChild!),
            title: { left: title.left, right: title.right, center: title.x + title.width / 2 },
            actionHeight: element.lastElementChild!.getBoundingClientRect().height,
            cancelTargetRight: element.firstElementChild!.getBoundingClientRect().right,
            actionTargetLeft: element.lastElementChild!.getBoundingClientRect().left,
          };
        });
        expect(geometry.title.left - geometry.cancel.right).toBeGreaterThanOrEqual(8);
        expect(geometry.action.left - geometry.title.right).toBeGreaterThanOrEqual(8);
        expect(geometry.title.left - geometry.cancelTargetRight).toBeGreaterThanOrEqual(8);
        expect(geometry.actionTargetLeft - geometry.title.right).toBeGreaterThanOrEqual(8);
        expect(geometry.title.center).toBeCloseTo(width / 2, 0);
        expect(geometry.action.right).toBeCloseTo(width - 16, 0);
        expect(geometry.actionHeight).toBeGreaterThanOrEqual(44);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      }
      const action = toolbar.locator(":scope > :last-child");
      if (tab === "avatar") await expect(action).toHaveAttribute("href", `/${language}/profile`);
      else await expect(action).toHaveAttribute("form", `settings-form-${tab}`);
      await toolbar.getByRole("link").first().focus();
      await page.keyboard.press("Tab");
      await expect(action).toBeFocused();
      await expect(action).toHaveCSS("outline-style", "solid");
      if (tab === "avatar") {
        await page.setViewportSize({ width: 393, height: 852 });
        await page.screenshot({ path: test.info().outputPath(`toolbar-${language}.png`) });
      }
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(toolbar).toBeHidden();
    await expect(page.locator("#account-settings-title")).toBeVisible();
    expect(writes).toEqual([]);
  });
}
