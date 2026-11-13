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
  test(`profile bio can be edited and appears publicly in ${lang}`, async ({ page }, testInfo) => {
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
    const pronounLabel = lang === "uk" ? "Займенник" : "Pronoun";
    const pronounInput = page.getByRole("combobox", { name: pronounLabel, exact: true });
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
    const bioTrigger = page.getByRole("button", { name: label, exact: true });
    const bioDialog = page.getByRole("dialog", { name: label, exact: true });
    const bioEditor = bioDialog.getByRole("textbox", { name: label, exact: true });
    const cancelBio = bioDialog.getByRole("button", { name: lang === "uk" ? "Скасувати" : "Cancel", exact: true });
    const doneBio = bioDialog.getByRole("button", { name: lang === "uk" ? "Готово" : "Done", exact: true });
    await bioTrigger.click();
    await expect(bioEditor).toBeFocused();
    await expect(bioEditor).toHaveValue(updatedBio);
    await expect(bioEditor).toHaveAttribute("maxlength", "500");
    await bioDialog.getByRole("heading", { name: label, exact: true }).click();
    await bioDialog.screenshot({ path: testInfo.outputPath("bio-editor.png") });
    await page.setViewportSize({ width: 320, height: 568 });
    const bioTitleBounds = await bioDialog.getByRole("heading", { name: label, exact: true }).boundingBox();
    const bioCancelBounds = await cancelBio.boundingBox();
    const bioDoneBounds = await doneBio.boundingBox();
    expect(bioCancelBounds!.x + bioCancelBounds!.width).toBeLessThanOrEqual(bioTitleBounds!.x);
    expect(bioDoneBounds!.x).toBeGreaterThanOrEqual(bioTitleBounds!.x + bioTitleBounds!.width);
    await page.setViewportSize({ width: 393, height: 852 });
    await bioEditor.fill("x".repeat(501));
    await expect(bioEditor).toHaveValue("x".repeat(500));
    await cancelBio.click();
    await expect(bioDialog).toHaveCount(0);
    await expect(bioTrigger).toBeFocused();
    await bioTrigger.click();
    await expect(bioEditor).toHaveValue(updatedBio);
    await bioEditor.fill("Discard this edit on Escape.");
    await page.keyboard.press("Escape");
    await expect(bioTrigger).toBeFocused();
    await bioTrigger.click();
    await expect(bioEditor).toHaveValue(updatedBio);
    await bioEditor.fill("Discard this edit on desktop resize.");
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(bioDialog).toHaveCount(0);
    await expect(textarea).toHaveValue(updatedBio);
    await page.setViewportSize({ width: 393, height: 852 });
    await bioTrigger.click();
    const mobileBio = "Edited from the phone profile editor.";
    await bioEditor.fill(mobileBio);
    await doneBio.click();
    await expect(bioTrigger).toBeFocused();
    expect(patchBody).toMatchObject({ bio: updatedBio });
    const pronounTrigger = page.getByRole("button", { name: pronounLabel, exact: true });
    await expect(pronounTrigger).toContainText("She / her");
    await pronounTrigger.click();
    const pronounDialog = page.getByRole("dialog", { name: pronounLabel, exact: true });
    await expect(pronounDialog).toBeVisible();
    await expect(pronounDialog.getByRole("radio")).toHaveCount(10);
    await expect(pronounDialog.getByRole("radio", { name: "She / her", exact: true })).toBeChecked();
    for (const image of await pronounDialog.locator("img").all()) {
      await expect(image).toHaveJSProperty("complete", true);
      expect(await image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    await pronounDialog.screenshot({ path: testInfo.outputPath("pronoun-selector.png") });
    const backButton = pronounDialog.getByRole("button", { name: lang === "uk" ? "Налаштування" : "Settings", exact: true });
    await expect(backButton).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(pronounDialog.getByRole("radio", { name: "She / her", exact: true })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(pronounDialog.getByRole("radio", { name: "She / their", exact: true })).toBeChecked();
    await page.keyboard.press("Escape");
    await expect(pronounDialog).toHaveCount(0);
    await expect(pronounTrigger).toBeFocused();
    await pronounTrigger.click();
    await pronounDialog.getByRole("radio", { name: "They / their", exact: true }).check();
    await expect(pronounDialog.getByRole("radio", { name: "They / their", exact: true })).toBeChecked();
    expect(patchBody).toMatchObject({ pronoun: "She / her" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(pronounDialog).toHaveCount(0);
    await expect(pronounInput).toBeVisible();
    await expect(pronounInput).toHaveValue("They / their");
    await page.setViewportSize({ width: 393, height: 852 });
    await pronounTrigger.click();
    await page.setViewportSize({ width: 320, height: 568 });
    const backBounds = await backButton.boundingBox();
    const titleBounds = await pronounDialog.getByRole("heading", { name: pronounLabel, exact: true }).boundingBox();
    expect(backBounds!.x + backBounds!.width).toBeLessThanOrEqual(titleBounds!.x);
    await pronounDialog.getByRole("radio", { name: lang === "uk" ? "Не вказано" : "Not specified", exact: true }).check();
    await backButton.click();
    await expect(pronounTrigger).toBeFocused();
    await expect(pronounTrigger).toHaveAttribute("aria-expanded", "false");
    await locationInput.fill("");
    await page.locator('button[form="settings-form-profile"]').click();
    await expect(page.getByText(successLabel, { exact: true })).toBeVisible();
    expect(patchBody).toMatchObject({ bio: mobileBio, location: "", pronoun: "" });
    await page.reload();
    await expect(locationInput).toHaveValue("");
    await expect(pronounTrigger).toContainText(lang === "uk" ? "Не вказано" : "Not specified");
    await bioTrigger.click();
    await expect(bioEditor).toHaveValue(mobileBio);
    await cancelBio.click();
    await page.goto(`/${lang}/users/${userId}`);
    await expect(page.getByText(mobileBio, { exact: true })).toBeVisible();
  });
}
