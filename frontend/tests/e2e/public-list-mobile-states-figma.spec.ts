import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const list = {
  id: 991,
  name: "Sample list",
  description: "A small film collection.",
  listType: "CUSTOM",
  isPublic: true,
  isRanked: false,
  ownerId: 7,
  ownerUsername: "sample-owner",
  ownerAvatarUrl: null,
  tags: [],
  likeCount: 0,
  movies: [],
};

for (const lang of ["uk", "en"] as const) {
  test(`public list load error matches the mobile Figma card (${lang})`, async ({ page }) => {
    let attempts = 0;
    await page.route(/^https?:\/\/[^/]+\/api\//, route => {
      const { pathname } = new URL(route.request().url());
      if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
      if (pathname === "/api/lists/public/991") {
        attempts++;
        return attempts === 1
          ? route.fulfill({ status: 503, json: {} })
          : route.fulfill({ json: list });
      }
      return route.fulfill({ json: [] });
    });

    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(`/${lang}/lists/public/991`);
    const alert = page.getByRole("alert");
    await expect(alert).toContainText(lang === "uk" ? "Не вдалося завантажити публічний список." : "Could not load the public list.");
    await expect.poll(async () => alert.boundingBox()).toMatchObject({ x: 16, y: 104, width: 361, height: lang === "uk" ? 130 : 78 });
    const retry = alert.getByRole("button", { name: lang === "uk" ? "Спробувати ще" : "Retry" });
    await expect.poll(async () => retry.boundingBox()).toMatchObject(lang === "uk"
      ? { x: 33, y: 173, width: 136, height: 44 }
      : { x: 277, y: 120, width: 70, height: 44 });
    const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261124/public-list");
    await mkdir(captureDirectory, { recursive: true });
    await page.screenshot({ path: resolve(captureDirectory, `rewind-public-list-error-${lang}-mobile-393.png`) });
    await retry.click();
    const heading = page.getByRole("heading", { name: "Sample list" });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  });
}

test("public list skeleton matches the mobile Figma loading geometry", async ({ page }) => {
  let release = () => {};
  const gate = new Promise<void>(resolveGate => { release = resolveGate; });
  await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/lists/public/992") {
      await gate;
      return route.fulfill({ json: { ...list, id: 992 } });
    }
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/lists/public/992");
  const main = page.locator('main[aria-labelledby="public-list-state-title"][aria-busy="true"]');
  const title = main.locator("[data-public-list-skeleton-title]");
  const metadata = main.locator("[data-public-list-skeleton-metadata]");
  const posters = main.locator("[data-public-list-skeleton-poster]");
  await expect.poll(async () => title.boundingBox()).toMatchObject({ x: 16, y: 190, width: 234, height: 65 });
  await expect.poll(async () => metadata.boundingBox()).toMatchObject({ x: 16, y: 275, width: 144, height: 20 });
  await expect(posters).toHaveCount(6);
  await expect.poll(async () => posters.nth(0).boundingBox()).toMatchObject({ x: 16, y: 417, width: 79, height: 116 });
  await expect.poll(async () => posters.nth(1).boundingBox()).toMatchObject({ x: 110, y: 417, width: 79, height: 116 });
  await expect.poll(async () => posters.nth(4).boundingBox()).toMatchObject({ x: 16, y: 552, width: 79, height: 116 });
  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261124/public-list");
  await mkdir(captureDirectory, { recursive: true });
  await page.screenshot({ path: resolve(captureDirectory, "rewind-public-list-loading-en-mobile-393.png") });
  release();
  await expect(page.getByRole("heading", { name: "Sample list" })).toBeVisible();
});
