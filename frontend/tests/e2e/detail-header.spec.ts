import { expect, test, type Page } from "@playwright/test";

const movieId = 976001;
const reviewId = 976002;
const film = { id: movieId, title: "Contextual navigation film", releaseDate: "2021-01-01", durationMinutes: 120, ageRating: "12+", photoUrl: null, backdropUrl: null, trailerUrl: null };
const emptyPage = { content: [], number: 0, size: 12, totalElements: 0, totalPages: 0, first: true, last: true };

async function fixture(page: Page) {
  const writes: string[] = [];
  await page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const request = route.request(), pathname = new URL(request.url()).pathname;
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "detail-header-csrf" }, headers: { "Set-Cookie": "XSRF-TOKEN=detail-header-csrf; Path=/; SameSite=Lax" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (request.method() !== "GET") { writes.push(`${request.method()} ${pathname}`); return route.abort(); }
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (pathname === `/api/movies/${movieId}/details`) return route.fulfill({ json: { ...film, shortPlot: "A film from the API.", rating: 4, genres: [], actors: [], directors: [], producers: [], externalRatings: [], similarMovies: [], myFlags: null } });
    if (pathname === `/api/reviews/${reviewId}`) return route.fulfill({ json: { id: reviewId, content: "A complete API review.", rating: 4, createdAt: "2026-10-20T10:00:00Z", author: { id: 976003, username: "reader", displayName: null, avatarUrl: null }, movie: film, likes: 0, likedBy: [] } });
    if (pathname === "/api/genres") return route.fulfill({ json: [] });
    return route.fulfill({ json: emptyPage });
  });
  return writes;
}

for (const sample of [
  { width: 320, lang: "en", route: `films/${movieId}`, heading: "#movie-title", back: "Films", backRoute: "/en/films", nav: "Main navigation" },
  { width: 393, lang: "uk", route: `reviews/${reviewId}`, heading: "#review-title", back: "Назад до фільму", backRoute: `/uk/films/${movieId}`, nav: "Головна навігація" },
]) {
  test(`mobile ${sample.route.split("/")[0]} keeps contextual back and bottom navigation clickable at ${sample.width}px`, async ({ page }) => {
    await page.setViewportSize({ width: sample.width, height: 700 });
    const writes = await fixture(page);
    await page.goto(`/${sample.lang}/${sample.route}`);
    await expect(page.locator(sample.heading)).toBeVisible();
    await expect(page.locator('main[aria-busy="true"], main [aria-busy="true"]')).toHaveCount(0);
    await expect(page.locator('header img[alt="REWIND"]')).toBeHidden();
    const bottom = page.getByRole("navigation", { name: sample.nav, exact: true });
    await expect(bottom).toBeVisible();
    await expect(bottom.getByRole("link")).toHaveCount(5);
    const back = page.getByRole("main").getByRole("link", { name: sample.back, exact: true });
    // The point stays inside the rounded control while overlapping the transparent fixed header.
    await back.click({ position: { x: 8, y: 8 } });
    await expect(page).toHaveURL(new RegExp(`${sample.backRoute}$`));
    await bottom.locator(`a[href="/${sample.lang}/films"]`).click();
    await expect(page).toHaveURL(new RegExp(`/${sample.lang}/films$`));
    await expect(page.locator("#films-page-title")).toBeVisible();
    await expect(page.locator('header img[alt="REWIND"]')).toBeHidden();
    await expect(page.getByRole("banner").getByRole("button", { name: sample.lang === "en" ? "Menu" : "Меню", exact: true })).toBeHidden();
    expect(writes).toEqual([]);
  });
}

test("tablet Details preserves the regular header and its primary navigation", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  const writes = await fixture(page);
  await page.goto(`/en/films/${movieId}`);
  await expect(page.locator("#movie-title")).toBeVisible();
  await expect(page.locator('header img[alt="REWIND"]')).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation", exact: true })).toBeVisible();
  expect(writes).toEqual([]);
});

for (const language of ["uk", "en"] as const) {
  test(`desktop header keeps the source background behind interactive controls in ${language}`, async ({ page }, testInfo) => {
    const writes = await fixture(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${language}/films/${movieId}`);
    await expect(page.locator("#movie-title")).toBeVisible();
    const header = page.locator("header");

    for (const width of [1440, 1024, 768]) {
      await page.setViewportSize({ width, height: 900 });
      const surface = await header.evaluate(element => {
        const style = getComputedStyle(element);
        const layer = getComputedStyle(element, "::before");
        const box = element.getBoundingClientRect();
        return {
          background: style.backgroundColor,
          backdrop: style.backdropFilter,
          layerContent: layer.content,
          layerPosition: layer.position,
          layerBackground: layer.backgroundColor,
          layerBackdrop: layer.backdropFilter,
          layerFilter: layer.filter,
          layerPointerEvents: layer.pointerEvents,
          layerZIndex: layer.zIndex,
          height: box.height,
          viewportWidth: document.documentElement.clientWidth,
          documentWidth: document.documentElement.scrollWidth,
        };
      });
      expect(surface.background).toBe("rgba(0, 0, 0, 0)");
      expect(surface.backdrop).toBe("none");
      expect(surface.layerContent).toBe('""');
      expect(surface.layerPosition).toBe("absolute");
      expect(surface.layerBackground).toBe("rgba(0, 0, 0, 0.05)");
      expect(surface.layerBackdrop).toBe("blur(5px)");
      expect(surface.layerFilter).toBe("blur(50px)");
      expect(surface.layerPointerEvents).toBe("none");
      expect(surface.layerZIndex).toBe("-1");
      expect(surface.height).toBe(106);
      expect(surface.documentWidth).toBeLessThanOrEqual(surface.viewportWidth);

      const account = header.getByRole("button", { name: language === "uk" ? "Акаунт" : "Account", exact: true });
      await account.click();
      await expect(account).toHaveAttribute("aria-expanded", "true");
      await expect(header.locator(`#desktop-account-links a[href="/${language}/login"]`)).toBeVisible();
      await account.press("Escape");
      await expect(account).toHaveAttribute("aria-expanded", "false");
      await expect(account).toBeFocused();
    }

    await page.setViewportSize({ width: 393, height: 852 });
    expect(await header.evaluate(element => getComputedStyle(element, "::before").content)).toBe("none");
    const bottomNav = page.getByRole("navigation", { name: language === "uk" ? "Головна навігація" : "Main navigation", exact: true });
    const bounds = await bottomNav.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y + bounds!.height).toBeCloseTo(852, 0);
    await expect(bottomNav.getByRole("link")).toHaveCount(5);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: testInfo.outputPath(`desktop-header-${language}.png`) });
    expect(writes).toEqual([]);
  });
}
