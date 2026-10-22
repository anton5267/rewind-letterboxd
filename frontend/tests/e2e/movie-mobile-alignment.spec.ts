import { expect, test, type Page } from "@playwright/test";

const movieId = 975001;
const title = `A long film title ${"without-a-convenient-word-boundary".repeat(5)}`;
const plot = `${"A supplied plot remains readable in full after its compact hero preview. ".repeat(50)}The final sentence must remain available.`;
const similarMovies = Array.from({ length: 6 }, (_, index) => ({
  id: movieId + index + 1,
  title: `Similar film ${index + 1} ${"with-a-long-title".repeat(5)}`,
  photoUrl: null, releaseDate: "2001-01-01", rating: 4,
}));

async function fixture(page: Page, empty = false) {
  const writes: string[] = [];
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "movie-alignment-csrf" }, headers: { "Set-Cookie": "XSRF-TOKEN=movie-alignment-csrf; Path=/; SameSite=Lax" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (request.method() !== "GET") { writes.push(`${request.method()} ${pathname}`); return route.abort(); }
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (pathname === `/api/movies/${movieId}/details`) return route.fulfill({ json: {
      id: movieId, title, shortPlot: empty ? null : plot, photoUrl: null, backdropUrl: null,
      releaseDate: "2001-01-01", durationMinutes: 120, ageRating: "12+", rating: 4,
      trailerUrl: null, genres: [], actors: [], directors: [], producers: [], externalRatings: [],
      similarMovies: empty ? [] : similarMovies, myFlags: null,
    } });
    if (pathname === `/api/movies/${movieId}/reviews`) return route.fulfill({ json: { content: [], number: 0, size: 10, totalElements: 0, totalPages: 0, first: true, last: true } });
    return route.fulfill({ status: 404, json: {} });
  });
  return { writes, pageErrors };
}

async function ready(page: Page, lang: "uk" | "en") {
  await page.goto(`/${lang}/films/${movieId}`);
  await expect(page.locator("#movie-title")).toHaveText(title);
  await expect(page.locator('main[aria-busy="true"], main [aria-busy="true"]')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}

async function noPageOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
}

for (const { width, lang } of [{ width: 320, lang: "en" }, { width: 393, lang: "uk" }] as const) {
  test(`mobile movie ${width}px keeps complete plot, reading order and every horizontal recommendation keyboard-accessible`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    const state = await fixture(page);
    await ready(page, lang);
    const hero = page.locator('section[aria-labelledby="movie-title"]');
    expect((await hero.boundingBox())!.y).toBe(0);
    const posterBox = await hero.locator('[class*="posterFrame"]').boundingBox();
    expect(posterBox!.x).toBe(width === 393 ? 16 : 12);
    expect(posterBox!.y).toBe(width === 393 ? 245 : 228);
    expect(posterBox!.width).toBe(width === 393 ? 120 : 96);
    expect(posterBox!.height).toBe(width === 393 ? 180 : 144);
    const titleBox = await page.locator("#movie-title").boundingBox();
    expect(titleBox!.x).toBe(width === 393 ? 156 : 120);
    expect(titleBox!.y).toBe(width === 393 ? 270 : 253);
    const backBox = await hero.getByRole("link", { name: lang === "uk" ? "Фільми" : "Films", exact: true }).boundingBox();
    expect(backBox!.y).toBe(50);
    expect(backBox!.width).toBeGreaterThanOrEqual(44);
    expect(backBox!.height).toBeGreaterThanOrEqual(44);
    const preview = hero.getByText(plot, { exact: true });
    const storyline = page.locator('section[aria-labelledby="storyline-title"]');
    const fullPlot = storyline.getByText(plot, { exact: true });
    await expect(storyline).toBeVisible();
    await expect(fullPlot).toHaveText(plot);
    expect(await page.locator("#movie-title").evaluate(element => getComputedStyle(element).fontSize)).toBe("26px");
    const previewGeometry = await preview.evaluate(element => ({
      fontSize: getComputedStyle(element).fontSize,
      lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
      clamp: getComputedStyle(element).webkitLineClamp,
      height: element.getBoundingClientRect().height,
      fullHeight: element.scrollHeight,
    }));
    expect(previewGeometry.fontSize).toBe("12px");
    expect(previewGeometry.clamp).toBe("6");
    expect(previewGeometry.height).toBeLessThanOrEqual(previewGeometry.lineHeight * 6 + 1);
    expect(previewGeometry.fullHeight).toBeGreaterThan(previewGeometry.height);
    expect(await fullPlot.evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1);
    const order = await page.locator('main section[aria-labelledby]').evaluateAll(elements => elements.map(element => element.getAttribute("aria-labelledby")));
    expect(order.slice(order.indexOf("reviews-title"), order.indexOf("reviews-title") + 3)).toEqual(["reviews-title", "similar-title", "storyline-title"]);

    const similar = page.locator('section[aria-labelledby="similar-title"]');
    const links = similar.getByRole("link");
    await expect(links).toHaveCount(similarMovies.length);
    const rail = links.first().locator("..");
    expect(await rail.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
    await links.first().focus();
    for (let index = 1; index < similarMovies.length; index++) {
      await page.keyboard.press("Tab");
      await expect(links.nth(index)).toBeFocused();
    }
    await expect.poll(() => rail.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
    const railBox = await rail.boundingBox(), lastBox = await links.last().boundingBox();
    expect(lastBox!.x).toBeGreaterThanOrEqual(railBox!.x);
    expect(lastBox!.x + lastBox!.width).toBeLessThanOrEqual(railBox!.x + railBox!.width + 1);
    expect(await links.last().evaluate(element => getComputedStyle(element).outlineStyle)).toBe("solid");
    await noPageOverflow(page);
    expect(state.writes).toEqual([]);
    expect(state.pageErrors).toEqual([]);
  });
}

test("desktop movie retains its full hero plot and six-column recommendation layout", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const state = await fixture(page);
  await ready(page, "en");
  const hero = page.locator('section[aria-labelledby="movie-title"]');
  await expect(hero).toHaveCSS("min-height", "1118px");
  await expect(hero).toHaveCSS("border-radius", "0px");
  const poster = await hero.locator('[class*="posterFrame"]').boundingBox();
  expect(poster?.width).toBeCloseTo(275, 0);
  await expect(page.locator("#mobile-rating-title")).toBeVisible();
  const preview = hero.getByText(plot, { exact: true });
  expect(await preview.evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1);
  await expect(page.locator('section[aria-labelledby="storyline-title"]')).toBeHidden();
  const links = page.locator('section[aria-labelledby="similar-title"]').getByRole("link");
  const boxes = await links.evaluateAll(elements => elements.map(element => ({ x: element.getBoundingClientRect().x, y: element.getBoundingClientRect().y })));
  expect(boxes).toHaveLength(6);
  expect(new Set(boxes.map(box => box.y)).size).toBe(1);
  expect(boxes.every((box, index) => index === 0 || box.x > boxes[index - 1].x)).toBe(true);
  await noPageOverflow(page);
  expect(state.writes).toEqual([]);
  expect(state.pageErrors).toEqual([]);
});

test("missing API plot does not create a storyline or invented recommendation content", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 700 });
  const state = await fixture(page, true);
  await ready(page, "en");
  await expect(page.locator("#storyline-title")).toHaveCount(0);
  const similar = page.locator('section[aria-labelledby="similar-title"]');
  await expect(similar.getByRole("link")).toHaveCount(0);
  await expect(similar.getByText("No similar films found yet.", { exact: true })).toBeVisible();
  await noPageOverflow(page);
  expect(state.writes).toEqual([]);
  expect(state.pageErrors).toEqual([]);
});
