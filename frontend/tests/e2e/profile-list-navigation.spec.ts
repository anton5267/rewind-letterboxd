import { expect, test } from "@playwright/test";

for (const language of ["uk", "en"] as const) {
  test(`profile cards open their selected private or public list in ${language}`, async ({ page }) => {
    const user = { id: 98027, username: "list-navigation", role: "USER", displayName: "List Navigation" };
    const lists = [
      { id: 98024, name: "Watchlist", listType: "WATCHLIST", isPublic: false },
      { id: 98025, name: "Watched", listType: "WATCHED", isPublic: false },
      { id: 98026, name: "Favorites", listType: "FAVORITES", isPublic: false },
      { id: 98051, name: "Private collection", listType: "CUSTOM", isPublic: false },
      { id: 98052, name: "Public collection", listType: "CUSTOM", isPublic: true },
    ].map(list => ({ ...list, description: null, isRanked: true, tags: [] }));
    const emptyPage = { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 };
    const profile = {
      ...user, email: "list-navigation@example.invalid", avatarUrl: null,
      stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
      ratingDistribution: [], socialLinks: [], lists, recentRatings: [], recentReviews: [],
    };
    const movie = { id: 98009, title: "Navigation film", releaseDate: "2026-01-01", rating: null, photoUrl: null };
    const writes: string[] = [];
    await page.route(url => url.pathname.startsWith("/api/"), route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (request.method() !== "GET") {
        writes.push(`${request.method()} ${path}`);
        return route.fulfill({ status: 405, json: {} });
      }
      if (path === "/api/users/me") return route.fulfill({ json: user });
      if (path === "/api/profile/me") return route.fulfill({ json: profile });
      if (path === "/api/profile/me/social-links") return route.fulfill({ json: [] });
      if (path === "/api/lists/my") return route.fulfill({ json: lists });
      if (path === "/api/lists/my/page") return route.fulfill({ json: { ...emptyPage, content: lists, totalPages: 1, totalElements: lists.length } });
      if (/^\/api\/lists\/\d+\/items$/.test(path)) {
        return route.fulfill({ json: [{ id: 98001, position: 1, movie }] });
      }
      if (path === "/api/lists/public/98052") {
        return route.fulfill({ json: { ...lists[4], ownerId: user.id, ownerUsername: user.username, ownerAvatarUrl: null, likeCount: 0, movies: [movie] } });
      }
      if (path.endsWith("/like-status")) return route.fulfill({ json: { liked: false, likes: 0 } });
      if (path.endsWith("unread-count")) return route.fulfill({ json: { count: 0 } });
      if (path.endsWith("/activity") || path.endsWith("/following") || path.endsWith("/followers")) return route.fulfill({ json: emptyPage });
      if (path.startsWith("/api/profile/me/")) return route.fulfill({ json: emptyPage });
      return route.fulfill({ json: [] });
    });

    await page.setViewportSize({ width: language === "uk" ? 1440 : 393, height: 900 });
    for (const list of lists) {
      for (const entry of ["heading", "posters"] as const) {
        await page.goto(`/${language}/profile?view=lists`);
        const card = page.locator(`[data-profile-list-id="${list.id}"]`);
        const expectedPath = list.isPublic ? `/${language}/lists/public/${list.id}` : `/${language}/lists?list=${list.id}`;
        const link = entry === "heading"
          ? card.getByRole("heading", { name: list.name, exact: true }).getByRole("link")
          : card.locator(`[data-profile-list-posters="${list.id}"]`);
        await expect(link).toHaveAttribute("href", expectedPath);
        await link.click();
        await expect(page).toHaveURL(new RegExp(`${expectedPath.replace("?", "\\?")}$`));
        await expect(page.getByRole("heading", { name: list.name, exact: true })).toBeVisible();
        await expect(page.locator(`a[href="/${language}/films/${movie.id}"]`).first()).toBeVisible();
        if (!list.isPublic) await expect(page.locator("#new-list-name")).toHaveCount(0);
      }
    }
    expect(writes).toEqual([]);
  });
}
