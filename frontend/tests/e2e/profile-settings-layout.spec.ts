import { expect, test } from "@playwright/test";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

for (const language of ["uk", "en"] as const) {
  test(`profile settings use source desktop columns and preserve phone drafts in ${language}`, async ({ context, page }) => {
    await installHostedAuthFixture(context);
    const profile = {
      id: 7, username: "layout-fixture", displayName: "Profile reader", email: "fixture@example.invalid",
      role: "USER", avatarUrl: null, bannerUrl: null, givenName: "Reader", familyName: "Fixture",
      bio: "Initial biography", location: "Berlin", pronoun: "They / their", replyPreference: "ANYONE",
      pinnedListId: null, supabaseLinked: true, lists: [], recentRatings: [], recentReviews: [],
      stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
    };
    const writes: Record<string, unknown>[] = [];
    await context.route(url => url.pathname.startsWith("/api/"), route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (path === "/api/users/me") return route.fulfill({ json: { id: 7, username: profile.username, role: "USER" } });
      if (path === "/api/profile/me") {
        if (request.method() === "PATCH") {
          const body = request.postDataJSON();
          writes.push(body);
          Object.assign(profile, body);
        }
        return route.fulfill({ json: profile });
      }
      if (path.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
      if (path.endsWith("/social-links") || path === "/api/lists/my") return route.fulfill({ json: [] });
      return route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0 } });
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await signInHostedFixture(page, language);
    await page.goto(`/${language}/profile?settings=profile`);
    const form = page.locator("#settings-form-profile");
    await expect(form.locator("#profile-display-name")).toHaveValue(profile.displayName);
    const back = page.getByRole("link", { name: language === "uk" ? "До профілю" : "Back to profile", exact: true });
    await expect(back.locator("img")).toHaveAttribute("src", "/images/profile-pronoun-back.png");
    await expect(back.locator("img")).toHaveJSProperty("naturalWidth", 96);
    const backBox = await back.locator("img").boundingBox();
    expect(backBox!.width).toBeCloseTo(30, 0);
    expect(backBox!.height).toBeCloseTo(30, 0);
    await expect(form.getByRole("heading")).toHaveCSS("font-weight", "700");
    const settingsNavigation = page.getByRole("navigation", { name: language === "uk" ? "Налаштування акаунта" : "Account Settings", exact: true });
    await expect(settingsNavigation.getByRole("link").first()).toHaveCSS("font-weight", "500");
    const heroDescription = page.locator('main[aria-labelledby="account-settings-title"] > header > p');
    await expect(heroDescription).toHaveCSS("font-weight", "500");
    await expect(heroDescription).toHaveCSS("color", "rgb(126, 126, 126)");
    const geometry = await form.evaluate(form => {
      const rect = (element: Element | null) => {
        const box = element!.getBoundingClientRect();
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      };
      const bio = form.querySelector("textarea")!;
      const bioStyle = getComputedStyle(bio);
      return {
        form: rect(form), username: rect(form.querySelector("#settings-username")), bio: rect(bio),
        displayName: rect(form.querySelector("#profile-display-name")),
        email: rect(form.querySelector("#settings-email")),
        pronoun: rect(form.querySelector("select")),
        location: rect(form.querySelector("#settings-profile-location")),
        replies: rect(form.querySelectorAll("select")[1]),
        pronounHint: rect(form.querySelector("select")!.parentElement!.querySelector("p")),
        repliesHint: rect(form.querySelectorAll("select")[1].parentElement!.querySelector("p")),
        save: rect(form.querySelector('button[type="submit"]')),
        givenName: rect(form.querySelector('input[autocomplete="given-name"]')),
        familyName: rect(form.querySelector('input[autocomplete="family-name"]')),
        biography: { radius: bioStyle.borderRadius, padding: bioStyle.padding, fontSize: bioStyle.fontSize },
      };
    });
    expect(geometry.form.width).toBeCloseTo(1200, 0);
    expect(geometry.username.x).toBeCloseTo(120, 0);
    expect(geometry.username.width).toBeCloseTo(282, 0);
    expect(geometry.displayName.width).toBeCloseTo(282, 0);
    expect(geometry.displayName.x - geometry.username.x - geometry.username.width).toBeCloseTo(24, 0);
    expect(geometry.displayName.y).toBeCloseTo(geometry.username.y, 0);
    expect(geometry.email.height).toBeCloseTo(79, 0);
    expect(geometry.pronoun.width).toBeCloseTo(300, 0);
    expect(geometry.replies.width).toBeCloseTo(300, 0);
    expect(geometry.pronoun.height).toBeCloseTo(79, 0);
    expect(geometry.replies.height).toBeCloseTo(79, 0);
    expect(geometry.pronounHint.x - geometry.pronoun.x - geometry.pronoun.width).toBeCloseTo(18, 0);
    expect(geometry.repliesHint.x - geometry.replies.x - geometry.replies.width).toBeCloseTo(18, 0);
    expect(geometry.pronounHint.y).toBeGreaterThanOrEqual(geometry.pronoun.y);
    expect(geometry.repliesHint.y).toBeGreaterThanOrEqual(geometry.replies.y);
    expect(geometry.email.y).toBeCloseTo(geometry.pronoun.y, 0);
    expect(geometry.location.y).toBeCloseTo(geometry.replies.y, 0);
    expect(geometry.givenName.y).toBeLessThan(geometry.email.y);
    expect(geometry.email.y).toBeLessThan(geometry.location.y);
    expect(geometry.save.y).toBeGreaterThan(geometry.location.y + geometry.location.height);
    expect(geometry.givenName.width).toBeCloseTo(290, 0);
    expect(geometry.familyName.x - geometry.givenName.x - geometry.givenName.width).toBeCloseTo(8, 0);
    expect(geometry.bio.x).toBeCloseTo(732, 0);
    expect(geometry.bio.width).toBeCloseTo(588, 0);
    expect(geometry.bio.height).toBeCloseTo(255, 0);
    expect(geometry.bio.y).toBeCloseTo(geometry.username.y, 0);
    expect(geometry.biography).toEqual({ radius: "37px", padding: "20px 30px", fontSize: "22px" });
    const pronoun = form.locator("select").nth(0);
    const replies = form.locator("select").nth(1);
    const pronounExample = pronoun.locator("..").locator("p");
    const repliesHint = replies.locator("..").locator("p");
    await expect(pronounExample).toContainText(profile.displayName);
    for (const value of ["They / their", "He / his", "He / their", "She / her", "She / their", "Xe / xyr", "Ze / hir", "Ze / zir", "It / its"]) {
      await pronoun.selectOption(value);
      await expect(pronounExample.locator('span[lang="en"]')).toHaveText(`Added Pride to ${value.split(" / ")[1]} watchlist.`);
    }
    await pronoun.selectOption("");
    await expect(pronounExample).toHaveText(language === "uk" ? "Оберіть займенник для прикладу вживання." : "Select a pronoun to preview its use.");
    await pronoun.selectOption("They / their");
    await replies.selectOption("FOLLOWED");
    expect((await replies.boundingBox())!.width).toBeCloseTo(588, 0);
    expect((await repliesHint.boundingBox())!.y).toBeGreaterThan((await replies.boundingBox())!.y + 79);
    for (const value of ["SELF", "ANYONE"]) {
      await replies.selectOption(value);
      expect((await replies.boundingBox())!.width).toBeCloseTo(300, 0);
      expect((await repliesHint.boundingBox())!.x - (await replies.boundingBox())!.x).toBeCloseTo(318, 0);
    }
    await form.locator('input[autocomplete="family-name"]').focus();
    await page.keyboard.press("Tab");
    await expect(form.locator("#settings-email")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(form.locator("#settings-profile-location")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(form.locator("textarea")).toBeFocused();
    await expect(form.locator("textarea")).toHaveCSS("outline-style", "solid");
    await expect(form.locator("textarea")).toHaveCSS("outline-width", "2px");
    await expect(form.locator("textarea")).toHaveCSS("outline-color", "rgb(212, 168, 95)");
    await expect(form.locator("textarea")).toHaveCSS("outline-offset", "3px");
    await expect(form.locator("textarea")).toHaveCSS("scroll-margin-block-start", "120px");
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: test.info().outputPath("desktop-settings.png"), fullPage: true });
    await form.locator("#profile-display-name").fill("Updated reader");
    await expect(pronounExample).toContainText("Updated reader");
    await form.locator('input[autocomplete="given-name"]').fill("Updated given name");
    await form.locator("textarea").fill("Saved across viewport changes");
    for (const width of [1024, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(form.locator("#profile-display-name")).toHaveValue("Updated reader");
      if (width === 1024) {
        expect((await pronoun.boundingBox())!.width).toBeCloseTo(300, 0);
        const exampleBox = (await pronounExample.boundingBox())!;
        expect(exampleBox.width).toBeGreaterThan(0);
        expect(exampleBox.x + exampleBox.width).toBeLessThanOrEqual(width);
        await form.locator("#profile-display-name").fill("A reader with a long display name for the pronoun example");
        await expect(pronounExample).toContainText("A reader with a long display name");
        expect((await pronoun.boundingBox())!.height).toBeCloseTo(79, 0);
        await form.locator("#profile-display-name").fill("Updated reader");
        await replies.selectOption("FOLLOWED");
        const repliesBox = (await replies.boundingBox())!;
        expect(repliesBox.width).toBeGreaterThan(300);
        expect(repliesBox.x + repliesBox.width).toBeLessThanOrEqual(width);
        await page.screenshot({ path: test.info().outputPath("tablet-followed-settings.png"), fullPage: true });
        await replies.selectOption("ANYONE");
      } else {
        await expect(pronounExample).toBeHidden();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
    for (const width of [393, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(form.locator("#profile-display-name")).toHaveValue("Updated reader");
      await expect(form.locator('input[autocomplete="given-name"]')).toHaveValue("Updated given name");
      const bioTrigger = form.getByRole("button", { name: language === "uk" ? "Про себе" : "About me", exact: true });
      const emailBox = await form.locator("#settings-email").boundingBox();
      const locationBox = await form.locator("#settings-profile-location").boundingBox();
      const bioBox = await bioTrigger.boundingBox();
      expect(emailBox!.y).toBeLessThan(locationBox!.y);
      expect(locationBox!.y).toBeLessThan(bioBox!.y);
      await bioTrigger.click();
      await expect(page.getByRole("dialog").getByRole("textbox")).toHaveValue("Saved across viewport changes");
      await page.keyboard.press("Escape");
      await expect(bioTrigger).toBeFocused();
      if (width === 393) await page.screenshot({ path: test.info().outputPath("phone-settings.png"), fullPage: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
    await page.locator('button[form="settings-form-profile"]').click();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toMatchObject({ displayName: "Updated reader", givenName: "Updated given name", familyName: "Fixture", bio: "Saved across viewport changes", location: "Berlin", pronoun: "They / their", replyPreference: "ANYONE" });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.reload();
    await expect(form.locator("#profile-display-name")).toHaveValue("Updated reader");
    await expect(form.locator("textarea")).toHaveValue("Saved across viewport changes");
  });
}
