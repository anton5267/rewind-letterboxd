import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

const evidenceDir = resolve(process.cwd(), "../artifacts/visual-audit-20261125/profile-settings");
const near = (actual: number | undefined, expected: number, tolerance = 4) => {
  expect(actual).toBeDefined();
  expect(Math.abs(actual! - expected)).toBeLessThanOrEqual(tolerance);
};

for (const lang of ["uk", "en"] as const) {
  const text = lang === "uk"
    ? { back: "Назад", auth: "Автентифікація", password: "Зміна пароля", current: "Поточний пароль", new: "Новий пароль", confirm: "Підтвердіть новий пароль", linkTitle: "Підключити Supabase Auth", linked: "Ваш обліковий запис уже підключено.", connect: "Надіслати лист підтвердження" }
    : { back: "Back", auth: "Authentication", password: "Change password", current: "Current password", new: "New password", confirm: "Confirm new password", linkTitle: "Connect Supabase Auth", linked: "Your account is already connected.", connect: "Send confirmation email" };

  for (const linked of [true, false]) {
    const height = linked ? 852 : 950;
    const state = linked ? "connected" : "link-available";
    test(`${lang} mobile authentication settings ${state} matches Figma`, async ({ context, page }) => {
      await installHostedAuthFixture(context);
      await installSettingsApiFixture(context, linked);
      await page.setViewportSize({ width: 393, height });
      await signInHostedFixture(page, lang);
      await page.goto(`/${lang}/profile?settings=authentication`);
      const main = page.locator("main");
      await expect(main).toHaveAttribute("aria-busy", "false");
      await page.locator("#account-settings-mobile-title").evaluate(node => (node as HTMLElement).blur());
      await mkdir(evidenceDir, { recursive: true });
      await page.screenshot({ path: resolve(evidenceDir, `authentication-${lang}-${state}-393x${height}.png`), fullPage: true });

      const toolbarTitle = page.locator("#account-settings-mobile-title");
      const settingsHeading = main.getByRole("heading", { name: text.auth, exact: true });
      const passwordHeading = main.getByRole("heading", { name: text.password, exact: true });
      near((await toolbarTitle.boundingBox())?.y, 49);
      near((await settingsHeading.boundingBox())?.x, 24);
      near((await settingsHeading.boundingBox())?.y, 102);
      near((await passwordHeading.boundingBox())?.y, 169);
      near((await page.locator("#profile-current-password").boundingBox())?.y, 233);
      near((await page.locator("#profile-current-password").boundingBox())?.height, 48);
      near((await page.locator("#profile-new-password").boundingBox())?.y, 320);
      near((await page.locator("#profile-confirm-new-password").boundingBox())?.y, 407);

      const linkHeading = main.getByRole("heading", { name: text.linkTitle, exact: true });
      near((await linkHeading.boundingBox())?.y, 618);
      if (linked) {
        const status = main.getByText(text.linked, { exact: true });
        await expect(status).toBeVisible();
        near((await status.boundingBox())?.y, 655);
        near((await status.boundingBox())?.height, 76);
      } else {
        const description = main.getByText(lang === "uk" ? "Поточний пароль допоможе створити захищений акаунт. Надішлемо лист на email для підтвердження. Профіль, роль і дані REWIND не зміняться." : "We will use your current password to create a secure hosted account and email you a confirmation link. Your REWIND profile, role, and data will stay unchanged.", { exact: true });
        await expect(description).toBeVisible();
        near((await description.boundingBox())?.y, 655);
        near((await page.locator("#supabase-link-current-password").boundingBox())?.y, 770);
        near((await page.locator("#settings-form-supabase-link button").boundingBox())?.y, 829);
      }
      await expect(page.locator("footer")).toBeHidden();
      await expect(page.locator("body")).toHaveCSS("padding-bottom", "0px");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
    });
  }
}

for (const lang of ["uk", "en"] as const) {
  for (const outcome of ["error", "success"] as const) {
    test(`${lang} mobile account-link ${outcome} notice matches Figma`, async ({ context, page }) => {
      await installHostedAuthFixture(context);
      await installSettingsApiFixture(context, false, outcome === "error" ? 503 : 200);
      await page.setViewportSize({ width: 393, height: 852 });
      await signInHostedFixture(page, lang);
      await page.goto(`/${lang}/profile?settings=authentication`);
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
      await page.locator("#supabase-link-current-password").fill("fixture-current-password");
      await page.locator("#settings-form-supabase-link button").click();

      const notice = outcome === "error" ? page.locator("#profile-action-error") : page.getByRole("status");
      const expectedText = outcome === "error"
        ? lang === "uk" ? "Не вдалося почати підключення. Перевірте пароль і спробуйте пізніше." : "Could not start account linking. Check your password and try again later."
        : lang === "uk" ? "Лист надіслано. Підтвердьте email за посиланням, а потім завершіть підключення." : "Email sent. Confirm your address using the link, then finish connecting your account.";
      await expect(notice).toHaveText(expectedText);
      const bounds = await notice.boundingBox();
      near(bounds?.x, 24);
      near(bounds?.width, 345);
      near(bounds?.height, 68, 5);
      await expect(notice).toHaveCSS("font-size", "14px");
      await expect(notice).toHaveCSS("line-height", "16px");
      await expect(notice).toHaveCSS("border-radius", "8px");
      await expect(notice).toHaveCSS("background-color", outcome === "error" ? "rgb(74, 31, 36)" : "rgb(28, 71, 41)");
      await expect(notice).toHaveCSS("color", outcome === "error" ? "rgb(255, 209, 209)" : "rgb(217, 255, 217)");
      await mkdir(evidenceDir, { recursive: true });
      await page.screenshot({ path: resolve(evidenceDir, `authentication-${lang}-link-${outcome}-notice-393.png`), fullPage: true });
    });
  }
}

async function installSettingsApiFixture(context: BrowserContext, linked: boolean, linkStatus = 200) {
  const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0 };
  await context.route(url => url.pathname.startsWith("/api/"), route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/users/me") return route.fulfill({ json: { id: 7, username: "settings-reader", role: "USER" } });
    if (path === "/api/profile/me") return route.fulfill({ json: {
      id: 7, username: "settings-reader", displayName: null, email: "fixture@example.invalid", role: "USER",
      avatarUrl: null, bannerUrl: null, bio: null, supabaseLinked: linked, lists: [], recentRatings: [], recentReviews: [],
      stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
    } });
    if (path.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (path.endsWith("/social-links") || path === "/api/lists/my") return route.fulfill({ json: [] });
    if (path === "/api/newsletter/subscription") return route.fulfill({ json: { subscribed: false } });
    if (path === "/api/auth/supabase-link/start") return route.fulfill({ status: linkStatus, json: linkStatus < 400 ? { confirmationRequired: true } : { message: "Fixture error" } });
    return route.fulfill({ json: emptyPage });
  });
}
