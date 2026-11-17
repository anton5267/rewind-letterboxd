import { expect, test } from "@playwright/test";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

for (const language of ["uk", "en"] as const) {
  test(`profile website loads, saves and clears in ${language}`, async ({ context, page }) => {
    await installHostedAuthFixture(context);
    const profile: Record<string, unknown> = {
      id: 7, username: "website-fixture", displayName: "Website reader", email: "fixture@example.invalid",
      role: "USER", avatarUrl: null, bannerUrl: null, givenName: "Reader", familyName: "Fixture",
      bio: "", location: "Berlin", website: "https://example.com/", pronoun: "", replyPreference: "ANYONE",
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
          const body = request.postDataJSON() as Record<string, unknown>;
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
    const website = page.locator("#settings-profile-website");
    const location = page.locator("#settings-profile-location");
    const save = page.locator('#settings-form-profile button[type="submit"]');
    await expect(website).toHaveValue("https://example.com/");
    const desktopLocation = await location.boundingBox();
    const desktopWebsite = await website.boundingBox();
    expect(desktopLocation).not.toBeNull();
    expect(desktopWebsite).not.toBeNull();
    expect(desktopWebsite!.y).toBeCloseTo(desktopLocation!.y, 0);
    expect(desktopWebsite!.x).toBeGreaterThan(desktopLocation!.x);

    await website.fill("https://rewind.example/");
    await save.click();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toMatchObject({ website: "https://rewind.example/" });
    await page.reload();
    await expect(website).toHaveValue("https://rewind.example/");

    await page.setViewportSize({ width: 393, height: 852 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);

    await website.fill("");
    await page.locator('button[form="settings-form-profile"]').click();
    await expect.poll(() => writes.length).toBe(2);
    expect(writes[1]).toMatchObject({ website: "" });
    await page.reload();
    await expect(website).toHaveValue("");
  });
}


