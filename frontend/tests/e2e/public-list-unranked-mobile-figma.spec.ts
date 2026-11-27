import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

const posterFiles = ["interstellar.png", "oppenheimer.png", "dunkirk.png", "tenet.png", "inception.png", "following.png", "batman-begins.png", "dark-knight-rises.png"];
const movies = ["Interstellar", "Oppenheimer", "Dunkirk", "Tenet", "Inception", "Following", "Batman Begins", "The Dark Knight Rises"].map((title, index) => ({
  id: 1001 + index,
  title,
  releaseDate: `${2010 + index}-01-01`,
  rating: null,
  photoUrl: `https://figma-fixture.invalid/posters/${index}.png`,
  ...(index === 0 ? { backdropUrl: "https://figma-fixture.invalid/interstellar-backdrop.png" } : {}),
}));

test("unranked public list matches the mobile EN Figma screen", async ({ context, page }) => {
  await installHostedAuthFixture(context);
  await context.route("https://figma-fixture.invalid/interstellar-backdrop.png", route => route.fulfill({ path: resolve(process.cwd(), "public/images/public-list-empty-backdrop.png") }));
  await context.route("https://figma-fixture.invalid/avatar.png", route => route.fulfill({ path: resolve(process.cwd(), "tests/e2e/fixtures/figma/public-list/film-oracle-avatar.png") }));
  await context.route(url => url.hostname === "figma-fixture.invalid" && url.pathname.startsWith("/posters/"), route => {
    const match = new URL(route.request().url()).pathname.match(/\/posters\/(\d+)\.png$/);
    const index = match ? Number(match[1]) : -1;
    const file = posterFiles[index];
    return file ? route.fulfill({ path: resolve(process.cwd(), `tests/e2e/fixtures/figma/public-list/${file}`) }) : route.abort();
  });
  await context.route(url => url.pathname.startsWith("/api/"), route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: 7, username: "fixture-member", role: "USER" } });
    if (pathname === "/api/lists/public/996") return route.fulfill({ json: {
      id: 996,
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
      movies,
    } });
    if (pathname === "/api/lists/public/996/like-status") return route.fulfill({ json: { liked: false, likes: 554 } });
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 393, height: 852 });
  await signInHostedFixture(page, "en");
  await page.goto("/en/lists/public/996");

  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("data-list-ranked", "false");
  const heading = main.getByRole("heading", { level: 1, name: "Christopher Nolan Best Films" });
  await expect(heading).toBeVisible();
  await expect.poll(async () => heading.boundingBox()).toMatchObject({ x: 16, y: 190.5, width: 361 });
  await expect(heading).toHaveCSS("font-size", "22px");
  const tags = main.locator('[role="group"][aria-label="Tags"]');
  await expect.poll(async () => tags.boundingBox()).toMatchObject({ x: 16, y: 220, width: 361, height: 25 });
  await expect.poll(async () => main.locator("[data-public-list-actions]").boundingBox()).toMatchObject({ x: 16, y: 278, width: 361, height: 69 });
  await expect.poll(async () => main.locator("[data-public-list-actions] > button").boundingBox()).toMatchObject({ x: 116.5, y: 303, width: 160, height: 44 });
  await expect.poll(async () => main.locator('[class*="ownerLine"]').boundingBox()).toMatchObject({ x: 16, y: 350, height: 20 });
  await expect.poll(async () => main.locator('[class*="description"]').boundingBox()).toMatchObject({ x: 16, y: 382, width: 361 });
  const content = main.locator('section[aria-labelledby="public-list-films-heading"]');
  await expect.poll(async () => content.boundingBox()).toMatchObject({ x: 0, y: 502, width: 393 });
  const posters = main.locator('a[class*="movieMedia"]');
  await expect(posters).toHaveCount(8);
  await expect.poll(async () => posters.nth(0).boundingBox()).toMatchObject({ x: 16, y: 537, width: 79, height: 116 });
  await expect.poll(async () => posters.nth(1).boundingBox()).toMatchObject({ x: 110, y: 537, width: 79, height: 116 });
  await expect.poll(async () => posters.nth(2).boundingBox()).toMatchObject({ x: 204, y: 537, width: 79, height: 116 });
  await expect.poll(async () => posters.nth(3).boundingBox()).toMatchObject({ x: 298, y: 537, width: 79, height: 116 });
  await expect.poll(async () => posters.nth(4).boundingBox()).toMatchObject({ x: 16, y: 672, width: 79, height: 116 });
  await expect.poll(() => posters.locator("img").evaluateAll(elements => elements.map(element => (element as HTMLImageElement).naturalWidth > 0))).toEqual(Array(8).fill(true));
  await expect.poll(() => main.locator('img[class*="heroBackdrop"]').evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261125/public-list-ranked");
  await mkdir(captureDirectory, { recursive: true });
  await page.screenshot({ path: resolve(captureDirectory, "public-list-unranked-en-393.png") });
});
