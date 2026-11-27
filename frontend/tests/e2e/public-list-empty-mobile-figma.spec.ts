import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

for (const language of ["uk", "en"] as const) {
test(`empty public list matches the mobile member Figma state (${language})`, async ({ context, page }) => {
  await installHostedAuthFixture(context);
  await context.route("https://figma-fixture.invalid/avatar.png", route => route.fulfill({ path: resolve(process.cwd(), "tests/e2e/fixtures/figma/public-list/film-oracle-avatar.png") }));
  await context.route(url => url.pathname.startsWith("/api/"), route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: 7, username: "fixture-member", role: "USER" } });
    if (pathname === "/api/lists/public/995") return route.fulfill({ json: {
      id: 995,
      name: "Christopher Nolan Best Films",
      description: "A collection of Christopher Nolan’s mind-bending, time-twisting, reality-shifting films from grounded psychological thrillers to epic cosmic blockbusters.\n\nStories that challenge perception, reward rewatching, and redefine modern cinema.",
      listType: "CUSTOM",
      isPublic: true,
      isRanked: false,
      ownerId: 10,
      ownerUsername: "FilmOracle",
      ownerAvatarUrl: "https://figma-fixture.invalid/avatar.png",
      tags: ["director", "best", "films"],
      likeCount: 554,
      movies: [],
    } });
    if (pathname === "/api/lists/public/995/like-status") return route.fulfill({ json: { liked: false, likes: 554 } });
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 393, height: 852 });
  await signInHostedFixture(page, language);
  await page.goto(`/${language}/lists/public/995`);

  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("data-list-ranked", "false");
  await expect(main).toHaveAttribute("data-list-empty", "true");
  const heading = main.getByRole("heading", { level: 1, name: "Christopher Nolan Best Films" });
  await expect(heading).toBeVisible();
  await expect.poll(async () => heading.boundingBox()).toMatchObject({ x: 16, y: 190.5, width: 361 });
  await expect(heading).toHaveCSS("font-size", "22px");
  const tags = main.locator(`[role="group"][aria-label="${language === "uk" ? "Теги" : "Tags"}"]`);
  await expect.poll(async () => tags.boundingBox()).toMatchObject({ x: 16, y: 220, width: 361, height: 25 });
  await expect(tags.locator("a").first()).toHaveCSS("font-size", "12px");
  await expect.poll(() => tags.locator("a").first().evaluate(element => getComputedStyle(element, "::before").content)).toBe('"#"');
  await expect.poll(async () => main.locator("[data-public-list-actions]").boundingBox()).toMatchObject({ x: 16, y: 278, width: 361, height: 69 });
  await expect.poll(async () => main.locator("[data-public-list-actions] > button").boundingBox()).toMatchObject({ x: 116.5, y: 303, width: 160, height: 44 });
  await expect.poll(async () => main.locator('[class*="ownerLine"]').boundingBox()).toMatchObject({ x: 16, y: 350, height: 20 });
  await expect.poll(async () => main.locator('[class*="description"]').boundingBox()).toMatchObject({ x: 16, y: 382, width: 361 });
  await expect(main.getByRole("button", { name: language === "uk" ? "Вподобати список" : "Like list" })).toBeVisible();
  await expect.poll(async () => main.getByText(language === "uk" ? "У цьому списку поки немає фільмів." : "This list has no films yet.").boundingBox()).toMatchObject({ x: 16, y: 537, width: 361, height: 20 });
  await expect(main.locator('a[class*="movieMedia"]')).toHaveCount(0);
  await expect(main.locator('[class*="comments"]')).toHaveCount(0);
  await expect(main.locator('img[class*="heroBackdrop"]')).toHaveAttribute("src", "/images/public-list-empty-backdrop.png");
  await expect.poll(() => main.locator('img[class*="heroBackdrop"]').evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261125/public-list-empty");
  await mkdir(captureDirectory, { recursive: true });
  await page.screenshot({ path: resolve(captureDirectory, `public-list-empty-${language}-393.png`) });

  await main.getByRole("button", { name: language === "uk" ? "Інформація про список" : "List information" }).click();
  const dialog = page.getByRole("dialog", { name: "Christopher Nolan Best Films" });
  const report = dialog.locator('[data-content-report-type="list"]');
  await expect(report.getByRole("button", { name: language === "uk" ? "Поскаржитися на список" : "Report list", exact: true })).toBeVisible();
});
}
