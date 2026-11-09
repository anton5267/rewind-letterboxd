import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

test("Home live film rails show real titles and either loaded posters or readable fallbacks", async ({ page }) => {
  // A disposable USER identity selects the member Home variant; all catalog
  // and poster data still comes from the live Compose API.
  await page.route("**/api/users/me", route => route.fulfill({ json: { id: 700001, username: "home-catalog-check", role: "USER" } }));
  for (const view of [
    { locale: "uk", width: 1440, height: 1000 },
    { locale: "en", width: 393, height: 852 },
  ] as const) {
    await page.setViewportSize({ width: view.width, height: view.height });
    await page.goto(`/${view.locale}/home`);
    await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");

    // The live catalog has no public lists or journal articles right now; do
    // not leave empty promotional sections taking up space on Home.
    await expect(page.locator("#home-lists")).toHaveCount(0);
    await expect(page.locator("#home-recent-news")).toHaveCount(0);

    for (const sectionId of ["home-newest", "home-popular"]) {
      const section = page.locator(`#${sectionId}`);
      if (sectionId === "home-popular" && await section.count() === 0) continue;
      await expect(section).toBeVisible();
      await expect(section).toHaveAttribute("aria-busy", "false");
      const cards = section.locator("article:visible");
      if (sectionId === "home-popular") {
        expect(await cards.count(), "The popular rail should include only films with community ratings").toBeGreaterThan(0);
        expect(await cards.count()).toBeLessThanOrEqual(6);
      }
      else {
        expect(await cards.count(), "The newest rail should show a useful number of live cards").toBeGreaterThanOrEqual(4);
        expect(await cards.count()).toBeLessThanOrEqual(6);
      }

      for (const card of await cards.all()) {
        const title = (await card.locator("h3").innerText()).trim();
        expect(title, `${sectionId} must not render a blank film title`).not.toBe("");
        if (sectionId === "home-popular") await expect(card.locator("p")).toContainText("★");
        await expect(card.getByRole("link").first()).toHaveAttribute("href", new RegExp(`^/${view.locale}/films/\\d+$`));
        await expect.poll(async () => {
          const image = card.locator("img").first();
          if (await image.count()) return image.evaluate(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0);
          return (await card.locator('[class*="posterFallback"]').count()) === 1;
        }, { message: `${title} must show a loaded poster or its readable fallback` }).toBe(true);
        const fallback = card.locator('[class*="posterFallback"] span');
        if (await fallback.count()) await expect(fallback).toHaveText(title);
      }
    }

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
      `Home must not overflow at ${view.width}px`,
    ).toBeLessThanOrEqual(0);
    const evidenceDir = resolve(process.cwd(), "../artifacts/visual-audit-20261104/home-live-catalog");
    mkdirSync(evidenceDir, { recursive: true });
    await page.screenshot({ path: resolve(evidenceDir, `home-member-${view.locale}-${view.width}.png`), fullPage: true });
  }
});

test("Home shows the full film title when an external poster fails", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ json: { id: 700002, username: "home-poster-fallback", role: "USER" } }));
  await page.route("https://image.tmdb.org/**", route => route.abort());
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/home");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");

  const firstMovie = page.locator("#home-newest article").first();
  const title = (await firstMovie.locator("h3").innerText()).trim();
  await expect(firstMovie.locator('[class*="posterFallback"] span')).toHaveText(title);
  const evidenceDir = resolve(process.cwd(), "../artifacts/visual-audit-20261104/home-live-catalog");
  mkdirSync(evidenceDir, { recursive: true });
  await page.screenshot({ path: resolve(evidenceDir, "home-broken-poster-en-393.png"), fullPage: true });
});
