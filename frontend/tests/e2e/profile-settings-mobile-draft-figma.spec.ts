import { expect, test } from "@playwright/test";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

const poster = "https://images.example.invalid/poster.png";
const profile = {
  id: 7, username: "simchuk", displayName: "Emma Cerys", email: "emmacerys@gmail.com",
  avatarUrl: poster, bannerUrl: poster, bio: "Obsessed with great directing, bold storytelling, and films that stick with you long after the credits roll.",
  location: "USA", website: "", pronoun: "She / her", role: "USER", replyPreference: "ANYONE", pinnedListId: null,
  supabaseLinked: true, lists: [], recentRatings: [], recentReviews: [],
  stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 4 },
};
const favorites = {
  content: ["Babylon", "The Holiday", "Whiplash", "Dead Poets Society"].map((title, index) => ({
    id: index + 1, title, releaseDate: null, rating: null, photoUrl: poster,
  })),
  number: 0, size: 24, totalPages: 1, totalElements: 4,
};

for (const locale of ["uk", "en"] as const) test(`${locale} mobile Profile settings matches the manual-social-links Figma frame`, async ({ context, page }) => {
  await installHostedAuthFixture(context);
  await context.route("https://images.example.invalid/**", route => route.fulfill({
    contentType: "image/png",
    body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aAZkAAAAASUVORK5CYII=", "base64"),
  }));
  await context.route(url => url.pathname.startsWith("/api/"), route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/users/me") return route.fulfill({ json: { id: 7, username: "simchuk", role: "USER" } });
    if (path === "/api/profile/me") return route.fulfill({ json: profile });
    if (path === "/api/profile/me/favorites") return route.fulfill({ json: favorites });
    if (path === "/api/profile/me/social-links") return route.fulfill({ json: [{ platform: "instagram", url: "https://instagram.com/example" }] });
    if (path.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (path === "/api/newsletter/subscription") return route.fulfill({ json: { subscribed: false } });
    if (path === "/api/lists/my") return route.fulfill({ json: [] });
    return route.fulfill({ json: { content: [], number: 0, size: 24, totalPages: 0, totalElements: 0 } });
  });

  await page.setViewportSize({ width: 393, height: 1950 });
  await signInHostedFixture(page, locale);
  await page.goto(`/${locale}/profile?settings=profile`);
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  const form = page.locator('form[aria-labelledby="social-links-settings"]');
  await expect(form).toBeVisible();
  const y = async (selector: string) => (await page.locator(selector).boundingBox())?.y ?? NaN;
  expect(await y("#profile-identity-form-title")).toBeCloseTo(147, 0);
  expect(await y("#settings-favorites-title")).toBeCloseTo(653, 0);
  expect(await y("[data-profile-favorite-posters]")).toBeCloseTo(712, 0);
  expect(await y("[data-profile-favorite-instructions]")).toBeCloseTo(838, 0);
  expect(await y("#settings-avatar-title")).toBeCloseTo(895, 0);
  expect(await y("[data-profile-media-panel=avatar] [data-profile-media-preview]")).toBeCloseTo(954, 0);
  expect(await y("[data-profile-media-panel=avatar] [data-profile-media-actions]")).toBeCloseTo(1133, 0);
  expect(await y("#settings-banner-title")).toBeCloseTo(1207, 0);
  expect(await y("[data-profile-media-panel=banner] [data-profile-media-preview]")).toBeCloseTo(1266, 0);
  expect(await y("[data-profile-media-panel=banner] [data-profile-media-actions]")).toBeCloseTo(1444, 0);
  await expect(form.locator("label:visible")).toHaveText(["Instagram", "TikTok", "Letterboxd"]);
  const heading = page.locator("#social-links-settings");
  const fields = ["instagram", "tiktok", "letterboxd"].map(platform => page.locator(`#social-link-${platform}`));
  const save = form.locator("button[type=submit]");

  expect((await heading.boundingBox())?.y).toBeCloseTo(1520, 0);
  for (const [index, y] of [1592, 1684, 1776].entries()) expect((await fields[index].boundingBox())?.y).toBeCloseTo(y, 0);
  expect((await save.boundingBox())?.y).toBeCloseTo(1820, 0);

  await page.screenshot({ path: `../artifacts/visual-audit-20261125/profile-settings/manual-social-links-${locale}-mobile-393x1950.png`, fullPage: true });
});
