import { expect, test } from "@playwright/test";

const userId = 981000;
const originalBio = "A short original profile note.";
const updatedBio = "I love thoughtful stories and talking about films.";
const socialLinks = [
  { platform: "website", url: "https://rewind-profile.example.invalid/" },
  { platform: "instagram", url: "https://www.instagram.com/rewind_profile" },
  { platform: "tiktok", url: "javascript:alert(1)" },
];
const emptyPage = { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 };

for (const { lang, label, saveLabel, successLabel } of [
  { lang: "uk", label: "Про себе", saveLabel: "Зберегти", successLabel: "Профіль оновлено." },
  { lang: "en", label: "About me", saveLabel: "Save", successLabel: "Profile updated." },
] as const) {
  test(`profile bio can be edited and appears publicly in ${lang}`, async ({ page }) => {
    let bio: string | null = originalBio;
    let patchBody: Record<string, unknown> | null = null;

    await page.route(url => url.pathname.startsWith("/api/"), async route => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;

      if (pathname === "/api/users/me") {
        return route.fulfill({ json: { id: userId, username: "bio-reader", role: "USER" } });
      }

      if (pathname === "/api/profile/me" && request.method() === "GET") {
        return route.fulfill({ json: {
          id: userId,
          username: "bio-reader",
          displayName: "Bio Reader",
          email: "bio-reader@example.invalid",
          role: "USER",
          avatarUrl: null,
          bio,
          supabaseLinked: true,
          stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
          lists: [],
          recentRatings: [],
          recentReviews: [],
        } });
      }

      if (pathname === "/api/profile/me" && request.method() === "PATCH") {
        patchBody = request.postDataJSON() as Record<string, unknown>;
        bio = typeof patchBody.bio === "string" ? patchBody.bio : bio;
        return route.fulfill({ json: {
          id: userId,
          username: "bio-reader",
          displayName: "Bio Reader",
          email: "bio-reader@example.invalid",
          role: "USER",
          avatarUrl: null,
          bio,
          supabaseLinked: true,
          stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
          lists: [],
          recentRatings: [],
          recentReviews: [],
        } });
      }

      if (pathname === `/api/users/${userId}/profile`) {
        return route.fulfill({ json: {
          id: userId,
          username: "bio-reader",
          displayName: "Bio Reader",
          avatarUrl: null,
          bio,
          hq: false,
          stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
          ratingDistribution: [],
          socialLinks,
          lists: [],
          recentReviews: [],
        } });
      }

      if (pathname === "/api/profile/me/social-links" || pathname.endsWith("/social-links")) {
        return route.fulfill({ json: socialLinks });
      }
      if (pathname === "/api/users/me" && request.method() !== "GET") {
        return route.fulfill({ status: 405, json: {} });
      }
      return route.fulfill({ json: emptyPage });
    });

    await page.goto(`/${lang}/profile?settings=profile`);
    const textarea = page.getByLabel(label);
    await expect(textarea).toHaveValue(originalBio);
    await expect(textarea).toHaveAttribute("maxlength", "500");
    await textarea.fill(updatedBio);

    const profileForm = page.locator("#settings-form-profile");
    await profileForm.getByRole("button", { name: saveLabel, exact: true }).click();
    await expect(page.getByText(successLabel, { exact: true })).toBeVisible();
    expect(patchBody).toMatchObject({ displayName: "Bio Reader", bio: updatedBio });

    await page.goto(`/${lang}/profile`);
    await expect(page.getByRole("region", { name: "Bio Reader", exact: true }).getByText(updatedBio, { exact: true })).toBeVisible();
    const ownLinks = page.getByRole("region", { name: "Bio Reader", exact: true }).getByRole("navigation").getByRole("link");
    await expect(ownLinks).toHaveCount(2);
    await expect(ownLinks.first()).toHaveAttribute("href", socialLinks[0].url);
    await expect(ownLinks.first()).toHaveAttribute("rel", "noopener noreferrer");
    const ownHero = page.getByRole("region", { name: "Bio Reader", exact: true });
    const metrics = await ownHero.locator("dl").boundingBox();
    const edit = await ownHero.getByRole("button", { name: /редагувати профіль|edit profile/i }).boundingBox();
    expect(edit!.y).toBeGreaterThanOrEqual(metrics!.y + metrics!.height);

    await page.goto(`/${lang}/users/${userId}`);
    await expect(page.getByText(updatedBio, { exact: true })).toBeVisible();
    await expect(page.getByText(updatedBio, { exact: true })).toHaveCSS("font-size", "24px");
    const publicLinks = page.getByRole("region", { name: "Bio Reader", exact: true }).getByRole("navigation").getByRole("link");
    await expect(publicLinks).toHaveCount(2);
    await page.setViewportSize({ width: 393, height: 852 });
    await expect(page.getByText(updatedBio, { exact: true })).toHaveCSS("font-size", "12px");
    await expect(publicLinks.first()).toBeVisible();
  });
}
