import { expect, test } from "@playwright/test";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

const poster = "https://images.example.invalid/poster.png";
const profile = {
  id: 7, username: "simchuk", displayName: "Emma Cerys", email: "emmacerys@gmail.com",
  avatarUrl: poster, bannerUrl: poster, bio: "A profile used for local Figma parity checks.",
  location: "USA", website: "", pronoun: "She / her", role: "USER", replyPreference: "ANYONE", pinnedListId: null,
  supabaseLinked: true, lists: [], recentRatings: [], recentReviews: [],
  stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
};

test("mobile social-link save feedback stays beside its form and follows Figma status colors", async ({ context, page }) => {
  let failSave = false;
  await installHostedAuthFixture(context);
  await context.route("https://images.example.invalid/**", route => route.fulfill({
    contentType: "image/png",
    body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aAZkAAAAASUVORK5CYII=", "base64"),
  }));
  await context.route(url => url.pathname.startsWith("/api/"), route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: 7, username: "simchuk", role: "USER" } });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/profile/me/favorites") return route.fulfill({ json: { content: [], number: 0, size: 24, totalPages: 0, totalElements: 0 } });
    if (pathname === "/api/profile/me/social-links") {
      if (route.request().method() === "PUT" && failSave) return route.fulfill({ status: 500, json: {} });
      if (route.request().method() === "PUT") return route.fulfill({ json: [{ platform: "instagram", url: "https://instagram.com/example" }] });
      return route.fulfill({ json: [{ platform: "instagram", url: "https://instagram.com/example" }] });
    }
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/newsletter/subscription") return route.fulfill({ json: { subscribed: false } });
    if (pathname === "/api/lists/my") return route.fulfill({ json: [] });
    return route.fulfill({ json: { content: [], number: 0, size: 24, totalPages: 0, totalElements: 0 } });
  });

  await page.setViewportSize({ width: 393, height: 1950 });
  await signInHostedFixture(page, "uk");
  await page.goto("/uk/profile?settings=profile");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  const form = page.locator('form[aria-labelledby="social-links-settings"]');
  await expect(form).toBeVisible();
  await form.locator("#social-link-instagram").fill("https://instagram.com/new-account");
  await form.locator("button[type=submit]").click();
  const success = form.getByRole("status");
  await expect(success).toHaveText("Соціальні посилання збережено.");
  await expect(success).toBeFocused();
  expect((await success.boundingBox())?.width).toBe(325);
  expect((await success.boundingBox())?.height).toBe(41);
  await expect(success).toHaveCSS("background-color", "rgb(29, 71, 40)");
  expect(await page.locator("main [data-settings-feedback]").count()).toBe(1);

  failSave = true;
  await form.locator("#social-link-instagram").fill("https://instagram.com/failing-account");
  await form.locator("button[type=submit]").click();
  const failure = form.getByRole("alert");
  await expect(failure).toHaveText("Не вдалося зберегти соціальні посилання.");
  await expect(failure).toBeFocused();
  expect((await failure.boundingBox())?.width).toBe(325);
  expect((await failure.boundingBox())?.height).toBe(41);
  await expect(failure).toHaveCSS("background-color", "rgb(74, 31, 36)");
});

test("mobile hosted Social Links load failure matches the Figma retry card", async ({ context, page }) => {
  await installHostedAuthFixture(context);
  await context.route(url => url.pathname.startsWith("/api/"), route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: 7, username: "simchuk", role: "USER" } });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/profile/me/favorites") return route.fulfill({ json: { content: [], number: 0, size: 24, totalPages: 0, totalElements: 0 } });
    if (pathname === "/api/profile/me/social-links") return route.fulfill({ status: 503, json: {} });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/newsletter/subscription") return route.fulfill({ json: { subscribed: false } });
    if (pathname === "/api/lists/my") return route.fulfill({ json: [] });
    return route.fulfill({ json: { content: [], number: 0, size: 24, totalPages: 0, totalElements: 0 } });
  });

  await page.setViewportSize({ width: 393, height: 1000 });
  await signInHostedFixture(page, "uk");
  await page.goto("/uk/profile?settings=connections");
  const notice = page.locator('main [role="alert"]').filter({ hasText: "Не вдалося завантажити соціальні посилання." });
  await expect(notice.getByRole("button", { name: "Спробувати ще" })).toBeVisible();
  await expect(notice).toHaveCSS("width", "333px");
  await expect(notice).toHaveCSS("height", "112px");
  await expect(notice).toHaveCSS("border-radius", "8px");
  await expect(notice).toHaveCSS("background-color", "rgb(74, 31, 36)");
  await expect(notice.locator("span")).toHaveCSS("width", "305px");
  await expect(notice.getByRole("button", { name: "Спробувати ще" })).toHaveCSS("min-height", "44px");
});
