import { expect, test } from "@playwright/test";

const owner = { id: 94110, username: "emma-cerys", displayName: "Emma Cerys", role: "USER", email: "emma@example.invalid" };
const profile = {
  ...owner, avatarUrl: null, bannerUrl: null,
  bio: "Obsessed with great directing, bold storytelling, and films that stick with you long after the credits roll.",
  location: "USA", supabaseLinked: false,
  stats: { ratings: 212, reviews: 17, watched: 212, watchlist: 32, favorites: 24 },
  lists: [], recentRatings: [], recentReviews: [],
};
const members = Array.from({ length: 16 }, (_, index) => ({
  id: 94200 + index, username: `member-${index + 1}`, displayName: `Member ${String(index + 1).padStart(2, "0")}`,
  avatarUrl: null, watchedCount: 142 - index, listCount: index % 9, likes: 87 - index,
}));

test("READY own Following and Followers desktop frames show sixteen metric-backed rows", async ({ page }) => {
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: owner });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 204 });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/profile/me/social-links") return route.fulfill({ json: [] });
    if (/^\/api\/users\/\d+\/(following|followers)$/.test(pathname)) {
      return route.fulfill({ json: { content: members, totalPages: 2, totalElements: 32, number: 0, size: 16 } });
    }
    if (/^\/api\/users\/\d+\/follow-status$/.test(pathname)) return route.fulfill({ json: { following: true, followers: 12, followingCount: 9 } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 16 } });
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const view of ["following", "followers"] as const) {
    await page.goto(`/en/profile?view=${view}`);
    const section = page.locator(`#profile-${view}`);
    await expect(section).toHaveAttribute("aria-busy", "false");
    await expect(section.locator("[data-network-member-id]")).toHaveCount(16);
    for (const member of members) {
      const row = section.locator(`[data-network-member-id="${member.id}"]`);
      await expect(row.getByRole("group")).toBeVisible();
      await expect(row.getByRole("group").locator("img")).toHaveCount(3);
    }
    await expect(section.getByRole("navigation")).toBeVisible();
    const geometry = await page.evaluate((id) => {
      const rect = (element: Element | null) => {
        if (!element) return null;
        const box = element.getBoundingClientRect();
        return { x: box.x, y: box.y + window.scrollY, width: box.width, height: box.height };
      };
      const section = document.querySelector<HTMLElement>(`#profile-${id}`);
      return {
        heading: rect(section?.querySelector("h2") ?? null),
        firstRow: rect(section?.querySelector("[data-network-member-id]") ?? null),
        lastRow: rect(section?.querySelector("[data-network-member-id]:last-child") ?? null),
        pagination: rect(section?.querySelector("nav") ?? null),
        footer: rect(document.querySelector("footer")),
        width: document.documentElement.scrollWidth,
      };
    }, view);
    expect(geometry.width).toBe(1440);
    console.log(`OWN_PROFILE_${view.toUpperCase()}_FIGMA_GEOMETRY`, JSON.stringify(geometry));
    await page.screenshot({ path: `../artifacts/visual-audit-20261124/profile/rewind-own-${view}-en-desktop-1440.png`, fullPage: true });
  }
});
