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
    const geometry = await form.evaluate(form => {
      const rect = (element: Element | null) => {
        const box = element!.getBoundingClientRect();
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      };
      const bio = form.querySelector("textarea")!;
      const bioStyle = getComputedStyle(bio);
      return {
        form: rect(form), username: rect(form.querySelector("#settings-username")), bio: rect(bio),
        givenName: rect(form.querySelector('input[autocomplete="given-name"]')),
        familyName: rect(form.querySelector('input[autocomplete="family-name"]')),
        biography: { radius: bioStyle.borderRadius, padding: bioStyle.padding, fontSize: bioStyle.fontSize },
      };
    });
    expect(geometry.form.width).toBeCloseTo(1200, 0);
    expect(geometry.username.x).toBeCloseTo(120, 0);
    expect(geometry.username.width).toBeCloseTo(588, 0);
    expect(geometry.givenName.width).toBeCloseTo(290, 0);
    expect(geometry.familyName.x - geometry.givenName.x - geometry.givenName.width).toBeCloseTo(8, 0);
    expect(geometry.bio.x).toBeCloseTo(732, 0);
    expect(geometry.bio.width).toBeCloseTo(588, 0);
    expect(geometry.bio.height).toBeCloseTo(255, 0);
    expect(geometry.bio.y).toBeCloseTo(geometry.username.y, 0);
    expect(geometry.biography).toEqual({ radius: "37px", padding: "20px 30px", fontSize: "22px" });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: test.info().outputPath("desktop-settings.png"), fullPage: true });
    await form.locator("#profile-display-name").fill("Updated reader");
    await form.locator('input[autocomplete="given-name"]').fill("Updated given name");
    await form.locator("textarea").fill("Saved across viewport changes");
    for (const width of [1024, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(form.locator("#profile-display-name")).toHaveValue("Updated reader");
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
    for (const width of [393, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(form.locator("#profile-display-name")).toHaveValue("Updated reader");
      await expect(form.locator('input[autocomplete="given-name"]')).toHaveValue("Updated given name");
      const bioTrigger = form.getByRole("button", { name: language === "uk" ? "Про себе" : "About me", exact: true });
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
