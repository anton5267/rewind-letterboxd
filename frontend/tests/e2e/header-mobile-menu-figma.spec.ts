import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

for (const language of ["uk", "en"] as const) {
  for (const authenticated of [false, true]) {
    test(`mobile More menu matches Figma for ${authenticated ? "admin" : "guest"} in ${language}`, async ({ context, page }) => {
      await installHostedAuthFixture(context);
      let authenticatedSession = false;
      await context.route("**/api/users/me", route => {
        return authenticatedSession
          ? route.fulfill({ json: { id: 7, username: "figma-admin", role: "ADMIN" } })
          : route.fulfill({ status: 401, json: {} });
      });
      await context.route("**/api/auth/login", route => {
        authenticatedSession = true;
        return route.fulfill({ status: 200, json: {} });
      });
      await context.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "fixture-csrf-token" } }));
      await context.route("**/auth/v1/token**", route => {
        authenticatedSession = true;
        return route.fallback();
      });
      await context.route("**/unread-count", route => route.fulfill({ json: { count: 0 } }));

      await page.setViewportSize({ width: 393, height: 852 });
      if (authenticated) await signInHostedFixture(page, language);
      await page.goto(`/${language}/journal`);
      const menuButton = page.getByRole("banner").getByRole("button", { name: language === "uk" ? "Меню" : "Menu" });
      expect(await menuButton.boundingBox()).toMatchObject({ x: 333, y: 10, width: 44, height: 44 });
      expect(await menuButton.evaluate(element => {
        const ring = getComputedStyle(element, "::before");
        return { width: ring.width, height: ring.height };
      })).toEqual({ width: "40px", height: "40px" });
      await menuButton.click();

      const menu = page.locator("#mobile-more-menu");
      await expect(menu).toBeVisible();
      const box = await menu.boundingBox();
      expect(box).toMatchObject({ x: 12, y: 74, width: 369 });
      expect(await menu.evaluate(element => getComputedStyle(element).borderRadius)).toBe("20px");
      await expect(menu.locator("a")).toHaveCount(authenticated ? 7 : 6);
      await expect(menu.locator("button")).toHaveCount(authenticated ? 1 : 0);
      await expect(menu.locator(`a[href="/${language}/admin"]`)).toHaveCount(authenticated ? 1 : 0);
      const mobileNavigation = page.getByRole("navigation", { name: language === "uk" ? "Головна навігація" : "Main navigation" }).last();
      expect(await mobileNavigation.boundingBox()).toMatchObject({ x: 0, y: 760, width: 393, height: 92 });
      const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261125/header-menus");
      mkdirSync(captureDirectory, { recursive: true });
      await page.screenshot({ path: resolve(captureDirectory, `mobile-menu-${language}-${authenticated ? "admin" : "guest"}.png`) });
    });
  }
}
