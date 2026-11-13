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
    let location: string | null = null;
    let pronoun: string | null = null;
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
          bio, location, pronoun,
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
        if (Object.hasOwn(patchBody, "location")) location = String(patchBody.location ?? "").trim() || null;
        if (Object.hasOwn(patchBody, "pronoun")) pronoun = String(patchBody.pronoun ?? "").trim() || null;
        return route.fulfill({ json: {
          id: userId,
          username: "bio-reader",
          displayName: "Bio Reader",
          email: "bio-reader@example.invalid",
          role: "USER",
          avatarUrl: null,
          bio, location, pronoun,
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
          bio, location, pronoun,
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
    const locationInput = page.getByLabel(lang === "uk" ? "Місце проживання" : "Location", { exact: true });
    const pronounInput = page.getByLabel(lang === "uk" ? "Займенник" : "Pronoun", { exact: true });
    await expect(pronounInput.getByRole("option")).toHaveCount(10);
    await locationInput.fill(" Berlin ");
    await pronounInput.selectOption("She / her");

    const profileForm = page.locator("#settings-form-profile");
    await profileForm.getByRole("button", { name: saveLabel, exact: true }).click();
    await expect(page.getByText(successLabel, { exact: true })).toBeVisible();
    expect(patchBody).toMatchObject({ displayName: "Bio Reader", bio: updatedBio, location: "Berlin", pronoun: "She / her" });

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
    await expect(page.getByLabel(lang === "uk" ? "Місце проживання" : "Location", { exact: true })).toHaveText("Berlin");
    await page.goto(`/${lang}/profile?settings=profile`);
    await expect(locationInput).toHaveValue("Berlin");
    await expect(pronounInput).toHaveValue("She / her");
    await locationInput.fill("");
    await pronounInput.selectOption("");
    await page.locator('button[form="settings-form-profile"]').click();
    await expect(page.getByText(successLabel, { exact: true })).toBeVisible();
    expect(patchBody).toMatchObject({ location: "", pronoun: "" });
    await page.reload();
    await expect(locationInput).toHaveValue("");
    await expect(pronounInput).toHaveValue("");
  });
}
