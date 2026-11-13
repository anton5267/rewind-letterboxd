import { expect, test, type Page } from "@playwright/test";

const user = { id: 988101, username: "reply-preference-reader", role: "USER" };
const movie = { id: 988102, title: "Preference Fixture Film", year: 2026, photoUrl: null, rating: null };
const emptyPage = { content: [], number: 0, size: 12, totalPages: 0, totalElements: 0 };

async function installFixture(page: Page) {
  let replyPreference: string | undefined;
  let favoritePresent = true;
  const patches: Record<string, unknown>[] = [];
  const profile = () => ({
    ...user,
    displayName: "Reply Preference Reader",
    email: "reply-preference-reader@example.invalid",
    avatarUrl: null,
    bio: null,
    location: null,
    pronoun: null,
    ...(replyPreference === undefined ? {} : { replyPreference }),
    supabaseLinked: true,
    stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: favoritePresent ? 1 : 0 },
    lists: [], recentRatings: [], recentReviews: [],
  });

  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === "/api/users/me") return route.fulfill({ json: user });
    if (pathname === "/api/profile/me" && request.method() === "PATCH") {
      const body = request.postDataJSON() as Record<string, unknown>;
      patches.push(body);
      replyPreference = String(body.replyPreference);
      return route.fulfill({ json: profile() });
    }
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile() });
    if (pathname === `/api/movies/${movie.id}/favorite` && request.method() === "DELETE") {
      favoritePresent = false;
      return route.fulfill({ status: 204 });
    }
    if (pathname === "/api/profile/me/favorites") return route.fulfill({ json: {
      ...emptyPage, content: favoritePresent ? [movie] : [], totalPages: favoritePresent ? 1 : 0, totalElements: favoritePresent ? 1 : 0,
    } });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "reply-preference-fixture-csrf" } });
    if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (["/ratings", "/reviews", "/activity", "/following", "/followers"].some(suffix => pathname.endsWith(suffix))) {
      return route.fulfill({ json: emptyPage });
    }
    return route.fulfill({ json: [] });
  });
  return patches;
}

for (const lang of ["uk", "en"] as const) {
  const copy = lang === "uk" ? {
    label: "Хто може відповідати", anyone: "Усі", followed: "Друзі (на кого ви підписані)", self: "Лише ви",
    settings: "Налаштування", save: "Зберегти", hint: "Застосовується до нових коментарів під вашими оглядами.",
  } : {
    label: "Allow replies from", anyone: "Anyone", followed: "Friends (people you follow)", self: "You",
    settings: "Settings", save: "Save", hint: "Applies to new comments on your reviews.",
  };

  test(`profile reply preference preserves drafts and saves across desktop and phone in ${lang}`, async ({ page }, testInfo) => {
    const patches = await installFixture(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/${lang}/profile?settings=profile`);
    const select = page.getByRole("combobox", { name: copy.label, exact: true });
    await expect(select).toHaveValue("ANYONE");
    await expect(select.getByRole("option")).toHaveCount(3);
    await select.selectOption("FOLLOWED");
    await page.locator("[data-favorite-remove]").click();
    await expect(page.locator("[data-favorite-remove]")).toHaveCount(0);
    await expect(select).toHaveValue("FOLLOWED");
    expect(patches).toEqual([]);

    await page.locator("#settings-form-profile").getByRole("button", { name: copy.save, exact: true }).click();
    await expect.poll(() => patches.length).toBe(1);
    expect(patches[0]).toMatchObject({ replyPreference: "FOLLOWED" });
    await page.reload();
    await expect(select).toHaveValue("FOLLOWED");

    await page.setViewportSize({ width: 393, height: 852 });
    const trigger = page.getByRole("button", { name: copy.label, exact: true });
    await expect(trigger).toContainText(copy.followed);
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: copy.label, exact: true });
    const back = dialog.getByRole("button", { name: copy.settings, exact: true });
    await expect(back).toBeFocused();
    await expect(dialog.getByRole("radio")).toHaveCount(3);
    await expect(dialog.getByText(copy.hint, { exact: true })).toBeVisible();
    await expect(dialog.getByRole("radio", { name: copy.followed, exact: true })).toBeChecked();
    await expect(dialog.getByRole("heading")).toHaveCSS("font-size", "16px");
    const option = dialog.getByRole("radio", { name: copy.anyone, exact: true }).locator("..");
    expect((await option.boundingBox())!.height).toBe(45);
    for (const image of await dialog.locator("img").all()) {
      await expect(image).toHaveJSProperty("complete", true);
      expect(await image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    await dialog.screenshot({ path: testInfo.outputPath("reply-preference-selector.png") });
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.getByRole("radio", { name: copy.followed, exact: true })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(dialog.getByRole("radio", { name: copy.self, exact: true })).toBeChecked();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toContainText(copy.self);
    expect(patches).toHaveLength(1);

    await trigger.click();
    await dialog.getByRole("radio", { name: copy.anyone, exact: true }).check();
    await back.click();
    await expect(trigger).toBeFocused();
    await expect(trigger).toContainText(copy.anyone);
    expect(patches).toHaveLength(1);

    await page.setViewportSize({ width: 767, height: 852 });
    await trigger.click();
    await dialog.getByRole("radio", { name: copy.self, exact: true }).check();
    await page.setViewportSize({ width: 768, height: 852 });
    await expect(dialog).toHaveCount(0);
    await expect(select).toBeVisible();
    await expect(select).toHaveValue("SELF");
    await expect(page.locator("#root")).not.toHaveAttribute("inert", "");
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
    expect(patches).toHaveLength(1);

    await page.setViewportSize({ width: 320, height: 568 });
    await trigger.click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    const titleBounds = await dialog.getByRole("heading").boundingBox();
    const backBounds = await back.boundingBox();
    expect(backBounds!.x + backBounds!.width).toBeLessThanOrEqual(titleBounds!.x);
    await back.click();
    await page.locator('button[form="settings-form-profile"]').click();
    await expect.poll(() => patches.length).toBe(2);
    expect(patches[1]).toMatchObject({ replyPreference: "SELF" });
    await page.reload();
    await expect(trigger).toContainText(copy.self);
    await trigger.click();
    await expect(dialog.getByRole("radio", { name: copy.self, exact: true })).toBeChecked();
    await back.click();
  });
}
