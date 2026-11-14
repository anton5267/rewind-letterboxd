import { expect, test } from "@playwright/test";

const icons = [
  { name: "home", file: "mobile-nav-home.png", width: 30, height: 30 },
  { name: "search", file: "mobile-nav-search.png", width: 24, height: 24 },
  { name: "add", file: "mobile-nav-add.svg", width: 30, height: 30 },
  { name: "journal", file: "mobile-nav-journal.svg", width: 27, height: 30 },
  { name: "profile", file: "mobile-nav-profile.svg", width: 30, height: 30 },
];

for (const language of ["uk", "en"] as const) {
  for (const member of [false, true]) {
    test("mobile navigation matches source assets for " + language + (member ? " member" : " guest"), async ({ page, baseURL }) => {
      const writes: string[] = [];
      const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0 };
      await page.route(url => url.pathname.startsWith("/api/"), route => {
        const request = route.request();
        const path = new URL(request.url()).pathname;
        if (path === "/api/auth/csrf") return route.fulfill({ json: { token: "navigation-fixture" } });
        if (path === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
        if (request.method() !== "GET") {
          writes.push(request.method() + " " + path);
          return route.abort();
        }
        if (path === "/api/users/me") return route.fulfill(member
          ? { json: { id: 7, username: "navigation-member", role: "USER" } }
          : { status: 401, json: {} });
        if (path.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
        if (path.includes("/genres") || path.includes("/tags/") || path.includes("popular-reviewers")) return route.fulfill({ json: [] });
        return route.fulfill({ json: emptyPage });
      });
      const navigationName = language === "uk" ? "Головна навігація" : "Main navigation";
      await page.setViewportSize({ width: 393, height: 852 });
      await page.goto(language + "/home");
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
      const nav = page.getByRole("navigation", { name: navigationName, exact: true });
      await expect(nav).toBeVisible();
      await expect(nav.locator("[data-mobile-nav-icon]")).toHaveCount(5);
      for (const width of [393, 320]) {
        await page.setViewportSize({ width, height: 852 });
        const bounds = await nav.evaluate(element => {
          const box = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return { x: box.x, width: box.width, height: box.height, bottom: box.bottom,
            radius: style.borderTopLeftRadius, paddingTop: style.paddingTop, paddingBottom: style.paddingBottom };
        });
        expect(bounds.x).toBeCloseTo(0, 0);
        expect(bounds.width).toBeCloseTo(width, 0);
        expect(bounds.height).toBeCloseTo(92, 0);
        expect(bounds.bottom).toBeCloseTo(852, 0);
        expect(bounds.radius).toBe("20px");
        expect(bounds.paddingTop).toBe("5px");
        expect(bounds.paddingBottom).toBe("34px");
        await expect(nav.getByRole("link")).toHaveCount(5);
        await expect(nav.getByRole("link").first()).toHaveCSS("font-weight", "400");
        for (const icon of icons) {
          const slot = nav.locator('[data-mobile-nav-icon="' + icon.name + '"]');
          const image = slot.locator("img");
          await expect(image).toHaveAttribute("alt", "");
          await expect(image).toHaveAttribute("draggable", "false");
          await expect(image).toHaveAttribute("src", new RegExp("/images/" + icon.file.replace(".", "\\.") + "$"));
          await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
          const size = await image.boundingBox();
          expect(size!.width).toBeCloseTo(icon.width, 0);
          expect(size!.height).toBeCloseTo(icon.height, 0);
          const target = await slot.locator("..").boundingBox();
          expect(target!.height).toBeCloseTo(53, 0);
          expect(target!.width).toBeCloseTo(Math.min(70, (width - 24) / 5), 0);
        }
        const routes = ["home", "search", "films", "journal", member ? "profile" : "auth"];
        for (let index = 0; index < routes.length; index++) {
          await expect(nav.getByRole("link").nth(index)).toHaveAttribute("href", new URL(language + "/" + routes[index], baseURL).pathname);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
        if (width === 393) await nav.screenshot({ path: test.info().outputPath("navigation.png") });
      }
      await nav.getByRole("link").first().focus();
      await page.keyboard.press("Tab");
      const search = nav.getByRole("link").nth(1);
      await expect(search).toBeFocused();
      await expect(search).toHaveCSS("outline-style", "solid");
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new URL(language + "/search", baseURL).href);
      await expect(page.locator("#global-search-query")).toBeVisible();
      expect(writes).toEqual([]);
    });
  }
}
