import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

const favorite = { id: 980110, title: "Shared favorite", photoUrl: null, releaseDate: "2020-01-01", rating: 4 };
const emptyPage = { content: [], number: 0, totalElements: 0, totalPages: 0 };

async function installFixture(context: BrowserContext, delayed: boolean, fail = false, failCollectionOnce = false) {
  const favorites = new Set([6, 7]);
  const deletions: number[] = [];
  let release!: () => void;
  const responseGate = new Promise<void>(resolve => { release = resolve; });
  await installHostedAuthFixture(context);
  await context.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const actor = request.headers().authorization?.endsWith("6") ? 6 : 7;
    if (path === "/api/users/me") {
      return route.fulfill({ json: { id: actor, username: `reader-${actor}`, role: "USER" } });
    }
    if (path === "/api/profile/me") {
      return route.fulfill({ json: {
        id: actor, username: `reader-${actor}`, displayName: `Reader ${actor}`,
        email: "fixture@example.invalid", role: "USER", avatarUrl: null, bannerUrl: null,
        bio: null, supabaseLinked: true, replyPreference: "ANYONE",
        stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: favorites.has(actor) ? 1 : 0 },
        lists: [], recentRatings: [], recentReviews: [],
      } });
    }
    if (path === "/api/profile/me/favorites") {
      if (failCollectionOnce) {
        failCollectionOnce = false;
        return route.fulfill({ status: 503, json: {} });
      }
      return route.fulfill({ json: {
        ...emptyPage, content: favorites.has(actor) ? [favorite] : [],
        totalElements: favorites.has(actor) ? 1 : 0, totalPages: favorites.has(actor) ? 1 : 0,
      } });
    }
    if (path === `/api/movies/${favorite.id}/favorite` && request.method() === "DELETE") {
      deletions.push(actor);
      if (delayed) await responseGate;
      if (fail) return route.fulfill({ status: 503, json: {} });
      favorites.delete(actor);
      return route.fulfill({ status: 204 });
    }
    if (path.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (path.endsWith("social-links") || path === "/api/lists/my") return route.fulfill({ json: [] });
    if (path === "/api/newsletter/subscription") return route.fulfill({ json: { subscribed: false } });
    return route.fulfill({ json: emptyPage });
  });
  return { release, deletions };
}

async function login(page: Page, language: "uk" | "en") {
  await signInHostedFixture(page, language);
  await page.goto(`/${language}/profile?settings=profile`);
  await expect(page.locator("#profile-display-name")).toHaveValue("Reader 7");
}

for (const language of ["uk", "en"] as const) {
  for (const outcome of ["success", "failure"] as const) {
    test(`late favorite removal ${outcome} stays with its original account in ${language}`, async ({ context, page }) => {
      const state = await installFixture(context, true, outcome === "failure");
      try {
        await login(page, language);
        const section = page.locator('section[aria-labelledby="settings-favorites-title"]');
        await section.locator("[data-favorite-remove]").click();
        await expect.poll(() => state.deletions).toEqual([7]);

        // Cross-tab Auth keeps the original Profile mounted while its actor changes.
        const other = await context.newPage();
        await other.goto("/en/email-action/#rewind_action=signup&type=email&token_hash=fixture-next-account");
        await other.getByRole("button", { name: "Confirm email", exact: true }).click();
        await expect(other).toHaveURL(/\/en\/films\/?$/);
        const draft = page.locator("#profile-display-name");
        await expect(draft).toHaveValue("Reader 6");
        await expect(section.getByRole("link", { name: favorite.title, exact: true })).toBeVisible();
        await expect(section.locator("[data-favorite-remove]")).toBeEnabled();
        await draft.fill("Current reader draft");
        await draft.focus();

        const response = page.waitForResponse(r => r.request().method() === "DELETE"
          && new URL(r.url()).pathname === `/api/movies/${favorite.id}/favorite`);
        state.release();
        await (await response).finished();
        await page.waitForLoadState("networkidle");
        await expect(section.getByRole("link", { name: favorite.title, exact: true })).toBeVisible();
        await expect(section.locator("[data-favorite-remove]")).toBeEnabled();
        await expect(draft).toHaveValue("Current reader draft");
        await expect(draft).toBeFocused();
        await expect(page.locator("#profile-action-error")).toHaveCount(0);
        await expect(page.locator('p[role="status"]')).toHaveCount(0);
      } finally {
        state.release();
      }
    });
  }

  test(`current-account favorite removal still updates the profile in ${language}`, async ({ context, page }) => {
    const state = await installFixture(context, false, false, language === "uk");
    await page.setViewportSize({ width: language === "uk" ? 1440 : 393, height: 1000 });
    await login(page, language);
    const section = page.locator('section[aria-labelledby="settings-favorites-title"]');
    if (language === "uk") {
      const retry = section.locator("[data-retry-button]");
      await expect(retry).toBeVisible();
      await retry.click();
      await expect(section.getByRole("heading")).toBeFocused();
    }
    const remove = section.locator("[data-favorite-remove]");
    const icon = remove.locator("img");
    await expect(icon).toHaveAttribute("src", "/images/profile-favorite-remove.png");
    await expect(icon).toHaveJSProperty("naturalWidth", 96);
    const targetBox = (await remove.boundingBox())!;
    const badgeBox = (await remove.locator("span[aria-hidden]").boundingBox())!;
    const iconBox = (await icon.boundingBox())!;
    const posterBox = (await section.getByRole("link", { name: favorite.title, exact: true }).boundingBox())!;
    expect(targetBox.width).toBeCloseTo(44, 0);
    expect(targetBox.height).toBeCloseTo(44, 0);
    expect(badgeBox.width).toBeCloseTo(16, 0);
    expect(badgeBox.height).toBeCloseTo(16, 0);
    expect(iconBox.width).toBeCloseTo(12, 0);
    expect(iconBox.height).toBeCloseTo(12, 0);
    expect(badgeBox.y - posterBox.y).toBeCloseTo(4, 0);
    expect(posterBox.x + posterBox.width - badgeBox.x - badgeBox.width).toBeCloseTo(4, 0);
    await remove.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(remove).toBeFocused();
    await expect(remove).toHaveCSS("outline-style", "solid");
    await page.screenshot({ path: test.info().outputPath("favorite-settings.png"), fullPage: true });
    await remove.click();
    await expect(section.getByRole("link", { name: favorite.title, exact: true })).toHaveCount(0);
    await expect(section.getByRole("heading")).toBeFocused();
    await expect(page.locator('p[role="status"]')).toBeVisible();
    expect(state.deletions).toEqual([7]);
    await page.reload();
    await expect(page.locator("#profile-display-name")).toHaveValue("Reader 7");
    await expect(section.getByRole("link", { name: favorite.title, exact: true })).toHaveCount(0);
  });
}
