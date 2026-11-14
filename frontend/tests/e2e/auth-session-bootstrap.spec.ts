import { expect, test } from "@playwright/test";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

for (const [language, role] of [["uk", "ADMIN"], ["en", "USER"]] as const) {
  test(`expired stored session waits for the ${role} profile before routing in ${language}`, async ({ context, page }) => {
    await installHostedAuthFixture(context);
    let holdProfile = false;
    let profileStarted!: () => void;
    let releaseProfile!: () => void;
    const started = new Promise<void>(resolve => { profileStarted = resolve; });
    const released = new Promise<void>(resolve => { releaseProfile = resolve; });
    const adminRequests: string[] = [];
    const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0 };
    await context.route(url => url.pathname.startsWith("/api/"), async route => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/api/users/me") {
        if (holdProfile) {
          profileStarted();
          await released;
        }
        return route.fulfill({ json: { id: 7, username: "bootstrap-fixture", role } });
      }
      if (path.startsWith("/api/admin/")) adminRequests.push(path);
      if (path.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
      if (path === "/api/genres" || path === "/api/admin/settings") return route.fulfill({ json: [] });
      if (path === "/api/admin/movies/tmdb-quality") return route.fulfill({ json: {
        totalMovies: 0, tmdbLinkedMovies: 0, completeTmdbMovies: 0, missingPoster: 0,
        missingBackdrop: 0, missingPlot: 0, missingRuntime: 0, missingTrailer: 0,
        missingTmdbRating: 0, missingOriginalLanguage: 0, linkedCoveragePercent: 0, metadataCompletenessPercent: 0,
      } });
      return route.fulfill({ json: emptyPage });
    });
    try {
      await page.setViewportSize(language === "uk" ? { width: 1440, height: 1000 } : { width: 393, height: 852 });
      await signInHostedFixture(page, language);
      await page.evaluate(() => {
        const key = Object.keys(localStorage).find(key => /^sb-.*-auth-token$/.test(key));
        if (!key) throw new Error("The fixture did not establish its stored session");
        const session = JSON.parse(localStorage.getItem(key)!);
        if (!session.access_token.startsWith("fixture-access-")) throw new Error("Expected only the synthetic fixture session");
        session.expires_at = Math.floor(Date.now() / 1000) - 3600;
        localStorage.setItem(key, JSON.stringify(session));
      });
      adminRequests.length = 0;
      holdProfile = true;
      await page.goto(`/${language}/admin?view=movies`);
      await started;
      await expect(page).toHaveURL(new RegExp(`/${language}/admin\\?view=movies$`));
      await expect(page.locator("#admin-dashboard-loading-title")).toBeVisible();
      expect(adminRequests).toEqual([]);
      releaseProfile();
      if (role === "ADMIN") {
        await expect(page.getByRole("region", { name: "База фільмів", exact: true })).toBeVisible();
        await expect.poll(() => adminRequests.some(path => path.startsWith("/api/admin/movies"))).toBe(true);
      } else {
        await expect(page).toHaveURL(new RegExp(`/${language}/home/?$`));
        expect(adminRequests).toEqual([]);
      }
    } finally {
      releaseProfile();
    }
  });
}
