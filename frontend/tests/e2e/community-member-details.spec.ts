import { expect, test } from "@playwright/test";

const films = Array.from({ length: 4 }, (_, index) => ({ id: index + 1, title: `Favorite film ${index + 1}`, photoUrl: `https://images.example.invalid/film-${index}.png`, rating: null, releaseDate: null }));
const member = { id: 11, username: "member", displayName: "Ada Finch", avatarUrl: "https://images.example.invalid/avatar.png",
  watchedCount: 1380, reviewCount: 1621, listCount: 3, likes: 87, followerCount: 12, followingCount: 98, favoriteMovies: films };
const zero = { ...member, id: 12, username: "empty", displayName: "Empty member", watchedCount: 0, reviewCount: 0, listCount: 0, likes: 0, favoriteMovies: [] };
const legacy = { id: 13, username: "legacy", displayName: "Legacy member", avatarUrl: null };

for (const lang of ["uk", "en"] as const) {
  test(`Community displays public member details and source-scale imagery without inventing legacy values in ${lang}`, async ({ context, page }) => {
    const queries: string[] = [];
    await context.route("https://images.example.invalid/**", route => route.fulfill({ contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aAZkAAAAASUVORK5CYII=", "base64") }));
    await context.route(url => url.pathname.startsWith("/api/"), route => {
      const url = new URL(route.request().url());
      if (url.pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
      if (url.pathname === "/api/users/hq") return route.fulfill({ json: { content: [member, zero, legacy, { ...member, id: 14 }, { ...member, id: 15 }], totalPages: 1, totalElements: 5, number: 0 } });
      if (url.pathname === "/api/users/popular-reviewers") return route.fulfill({ json: [member] });
      if (url.pathname === "/api/users/directory") {
        const term = url.searchParams.get("q") ?? ""; queries.push(term);
        const content = [member, zero, legacy].filter(user => user.displayName.toLowerCase().includes(term.toLowerCase()));
        return route.fulfill({ json: { content, totalPages: 1, totalElements: content.length, number: 0 } });
      }
      return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } });
    });
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto(`/${lang}/community`);
    const showcase = page.locator('[data-community-section="hq"]');
    const directory = page.locator('[data-community-section="directory"]');
    const card = showcase.locator('[data-network-member-id="11"]');
    const avatar = card.locator("img").first();
    await expect(avatar).toBeVisible();
    expect((await avatar.boundingBox())?.width).toBe(194);
    expect((await avatar.boundingBox())?.height).toBe(194);
    const showcasePositions = await showcase.locator('[data-network-member-id]').evaluateAll(elements => elements.map(element => ({x: element.getBoundingClientRect().x,y: element.getBoundingClientRect().y})));
    expect(new Set(showcasePositions.map(position => position.y)).size).toBe(1);
    expect(showcasePositions[4].x - showcasePositions[0].x).toBeGreaterThan(900);
    await expect(card.getByText(lang === "uk" ? /1\s380 фільмів, 1\s621 оглядів/ : "1,380 films, 1,621 reviews")).toBeVisible();
    const favorites = card.getByRole("link", { name: new RegExp(`^${lang === "uk" ? "Улюблені фільми" : "Favorite films"}`) });
    await expect(favorites).toHaveAttribute("href", `/${lang}/users/11?view=collection&collection=favorites#public-profile-collections`);
    await expect(favorites.locator("img")).toHaveCount(4);
    expect((await favorites.boundingBox())?.height).toBe(68);
    expect((await favorites.locator("img").first().boundingBox())?.width).toBeCloseTo(44.75, 1);
    const stats = directory.locator('[data-network-member-id="11"]').getByRole("group");
    await expect(stats).toContainText("1380"); await expect(stats).toContainText("87");
    await expect(directory.locator('[data-network-member-id="11"]')).toContainText(lang === "uk" ? "Підписників: 12 · Підписок: 98" : "12 followers, following 98");
    await expect(directory.locator('[data-network-member-id="12"]').getByRole("group")).toContainText("0");
    await expect(directory.locator('[data-network-member-id="13"]').getByRole("group")).toHaveCount(0);
    await expect(showcase.locator('[data-network-member-id="13"]').getByRole("link", { name: /Favorite films|Улюблені фільми/ })).toHaveCount(0);
    await test.info().attach("community-desktop", { body: await page.screenshot({ path: test.info().outputPath("community-desktop.png"), fullPage: true }), contentType: "image/png" });
    for (const width of [768, 393, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      const size = await avatar.boundingBox();
      expect(Math.abs(size!.width - size!.height)).toBeLessThan(1);
      await expect(stats).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }
    await page.setViewportSize({ width: 393, height: 1000 });
    expect((await avatar.boundingBox())?.width).toBeCloseTo(78.25, 1);
    expect((await favorites.locator("img").first().boundingBox())?.height).toBe(43);
    expect((await favorites.boundingBox())?.height).toBe(44);
    await test.info().attach("community-phone", { body: await page.screenshot({ path: test.info().outputPath("community-phone.png"), fullPage: true }), contentType: "image/png" });
    const search = directory.getByRole("textbox");
    await search.fill("Ada"); await directory.getByRole("button", { name: lang === "uk" ? "Пошук" : "Search", exact: true }).click();
    await expect.poll(() => queries.at(-1)).toBe("Ada");
    await expect(directory.locator('[data-network-member-id]')).toHaveCount(1);
    await directory.getByRole("link", { name: "Follow: Ada Finch", exact: true }).or(directory.getByRole("link", { name: "Підписатися: Ada Finch", exact: true })).click();
    await expect(page).toHaveURL(new RegExp(`/${lang}/login/?$`));
  });
}
