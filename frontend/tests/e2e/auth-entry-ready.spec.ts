import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("Auth Entry READY desktop and phone route renders the existing entry flow", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "auth-entry-ready" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261101/auth-entry-refresh");
  await mkdir(captureDirectory, { recursive: true });
  for (const locale of ["uk", "en"] as const) {
    const createAccountLabel = locale === "uk" ? "Створити акаунт" : "Create your account";
    const loginLabel = locale === "uk" ? "Увійти" : "Log in";
    for (const width of [320, 393, 600, 720, 768, 1024, 1440]) {
      const height = width === 1440 ? 1614 : width === 393 ? 852 : 900;
      await page.setViewportSize({ width, height });
      await page.goto(`/${locale}/auth`);
      const entry = page.getByRole("main", { name: locale === "uk" ? "Привіт!" : "Hi there!" });
      await expect(entry).toBeVisible();
      const createAccount = entry.getByRole("link", { name: createAccountLabel });
      await expect(createAccount).toHaveAttribute("href", `/${locale}/register`);
      await expect(entry.getByRole("link", { name: loginLabel })).toHaveAttribute("href", `/${locale}/login`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      if (locale === "uk" && width === 1440) {
      const card = entry.locator("section").first();
      await expect(card).toHaveCSS("width", "1198px");
      await expect(card).toHaveCSS("min-height", "873px");
      const cardBox = await card.boundingBox();
      const footerBox = await page.locator("footer").boundingBox();
      expect(cardBox).not.toBeNull();
      expect(footerBox).not.toBeNull();
      expect(Math.abs(cardBox!.x - 121)).toBeLessThanOrEqual(1);
      expect(Math.abs(cardBox!.y - 316)).toBeLessThanOrEqual(1);
      expect(Math.abs(footerBox!.y - 1349)).toBeLessThanOrEqual(1);
      }
      if ((locale === "uk" && width === 1440) || (locale === "en" && width === 393)) {
        await page.screenshot({ path: resolve(captureDirectory, `auth-entry-${locale}-${width}-source.png`), fullPage: true });
      }
      await createAccount.click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/register$`));
      await page.goto(`/${locale}/auth`);
      await page.getByRole("main", { name: locale === "uk" ? "Привіт!" : "Hi there!" }).getByRole("link", { name: loginLabel }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/login$`));
    }
  }
});
