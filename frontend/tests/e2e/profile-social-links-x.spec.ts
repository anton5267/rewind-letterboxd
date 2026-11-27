import { expect, test } from "@playwright/test";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

const owner = { id: 95140, username: "social-links-owner", role: "USER", displayName: "Social Links Owner", avatarUrl: null };
const profile = {
  ...owner,
  email: "social-links-owner@example.invalid",
  stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
  socialLinks: [], lists: [], recentRatings: [], recentReviews: [],
};

for (const locale of ["uk", "en"] as const) test(`${locale} profile settings save, reload, and display an X link`, async ({ context, page }) => {
  let savedLinks: { platform: string; url: string }[] = [];
  let finishSave: (() => void) | undefined;
  let failNextSave = false;
  await installHostedAuthFixture(context);
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: owner });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/profile/me/social-links") {
      if (route.request().method() === "PUT") {
        if (failNextSave) {
          failNextSave = false;
          return route.fulfill({ status: 503, json: {} });
        }
        savedLinks = route.request().postDataJSON() as typeof savedLinks;
        await new Promise<void>(resolve => { finishSave = resolve; });
        return route.fulfill({ json: savedLinks });
      }
      return route.fulfill({ json: savedLinks });
    }
    if (pathname === "/api/profile/me/favorites" || pathname.endsWith("/ratings") || pathname.endsWith("/reviews")) {
      return route.fulfill({ json: { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 } });
    }
    if (pathname.endsWith("/activity") || pathname.endsWith("/following") || pathname.endsWith("/followers")) {
      return route.fulfill({ json: { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 } });
    }
    if (pathname === "/api/lists/my") return route.fulfill({ json: [] });
    if (pathname.endsWith("unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 393, height: 852 });
  await signInHostedFixture(page, locale);
  await page.goto(`/${locale}/profile?settings=connections`);
  const form = page.locator("#settings-form-connections");
  await expect(form).toBeVisible();
  await form.getByRole("button", { name: locale === "uk" ? "Підключити X" : "Connect X" }).click();
  await expect(form.getByLabel("X URL")).toBeVisible();
  await form.locator("#social-link-x").fill("https://x.com/social-links-owner");
  const save = page.waitForResponse(response => new URL(response.url()).pathname === "/api/profile/me/social-links" && response.request().method() === "PUT");
  await page.locator('button[form="settings-form-connections"]').click();
  const savingButton = page.locator('button[form="settings-form-connections"]');
  await expect(form).toHaveAttribute("aria-busy", "true");
  await expect(savingButton).toBeDisabled();
  await expect(savingButton).toHaveText(locale === "uk" ? "Збереження…" : "Saving…");
  finishSave?.();
  expect((await save).status()).toBe(200);
  const success = page.getByRole("status").filter({ hasText: locale === "uk" ? "Соціальні посилання збережено." : "Social links saved." });
  await expect(success).toBeVisible();
  await expect(success).toHaveCSS("background-color", "rgb(29, 71, 40)");
  await expect(success).toHaveCSS("color", "rgb(216, 255, 216)");
  expect(savedLinks).toEqual([{ platform: "x", url: "https://x.com/social-links-owner" }]);
  failNextSave = true;
  await form.locator("#social-link-x").fill("https://x.com/failed-save");
  const failedSave = page.waitForResponse(response => new URL(response.url()).pathname === "/api/profile/me/social-links" && response.request().method() === "PUT");
  await page.locator('button[form="settings-form-connections"]').click();
  expect((await failedSave).status()).toBe(503);
  const failure = page.getByRole("alert").filter({ hasText: locale === "uk" ? "Не вдалося зберегти соціальні посилання." : "Could not save social links." });
  await expect(failure).toBeVisible();
  await expect(failure).toHaveCSS("background-color", "rgb(74, 31, 36)");
  await expect(failure).toHaveCSS("color", "rgb(255, 210, 210)");
  await page.reload();
  await form.getByRole("button", { name: locale === "uk" ? /Змінити посилання/ : /Edit link/ }).click();
  await expect(form.locator("#social-link-x")).toHaveValue("https://x.com/social-links-owner");
  await page.goto(`/${locale}/profile`);
  await expect(page.locator('main nav a[href="https://x.com/social-links-owner"]')).toHaveAttribute("aria-label", "X");
  await expect(page.locator('main nav a[href="https://x.com/social-links-owner"] i')).toHaveClass(/fa-x-twitter/);
});
