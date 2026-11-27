import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const owner = { id: 98001, username: "emma-cerys", displayName: "Emma Cerys", role: "USER", email: "emma@example.invalid" };
const profile = {
  ...owner, avatarUrl: null, bannerUrl: null, bio: "", location: null, supabaseLinked: false,
  stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 }, lists: [], recentRatings: [], recentReviews: [],
};
const names = ["Alex Turner", "mariacine", "daniel.film", "sofiavhs", "Leo Ramirez", "noirjames", "emilyframes", "lena_arthouse", "arthur.rewind", "midnight.milly"];
const members = names.map((displayName, index) => ({
  id: 98301 + index,
  username: displayName.toLowerCase().replaceAll(" ", "-"),
  displayName,
  avatarUrl: index === 4 ? null : `https://follower-figma.invalid/avatar-${String(index < 4 ? index + 1 : index).padStart(2, "0")}.png`,
}));

test("READY own profile Followers mobile frame and page-local filter match source", async ({ page }) => {
  await page.route("https://follower-figma.invalid/**", async route => {
    const file = new URL(route.request().url()).pathname.split("/").at(-1)!;
    const body = await readFile(join(testDir, "fixtures", "own-profile-followers-mobile-figma", file));
    return route.fulfill({ contentType: "image/png", body });
  });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: owner });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 204 });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/profile/me/social-links") return route.fulfill({ json: [] });
    if (pathname === `/api/users/${owner.id}/followers`) return route.fulfill({ json: { content: members, totalPages: 1, totalElements: members.length, number: 0, size: 16 } });
    if (pathname === `/api/users/${owner.id}/following`) return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 16 } });
    if (/^\/api\/users\/\d+\/follow-status$/.test(pathname)) return route.fulfill({ json: { following: false, followers: 10, followingCount: 0 } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 16 } });
  });

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/profile?view=followers");
  const rows = page.locator("#profile-followers [data-network-member-id]");
  await expect(page.locator("[class*='collectionToolbar'] h2")).toHaveText("Followers");
  await expect(page.locator("#profile-activity")).toHaveCount(0);
  await expect(rows).toHaveCount(10);
  for (const image of await rows.locator("img").all()) {
    await expect(image).toHaveJSProperty("complete", true);
    expect(await image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }

  const geometry = await page.evaluate(() => {
    const rect = (element: Element | null) => { if (!element) return null; const box = element.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height }; };
    const rows = Array.from(document.querySelectorAll("#profile-followers [data-network-member-id]"));
    return {
      toolbar: rect(document.querySelector("[class*='collectionToolbar']")),
      title: rect(document.querySelector("[class*='collectionToolbar'] h2")),
      filter: rect(document.querySelector("[class*='collectionToolbar'] button")),
      firstAvatar: rect(rows[0]?.querySelector("img")),
      firstName: rect(rows[0]?.querySelector("[class*='userCopy'] strong")),
      firstActions: Array.from(rows[0]?.querySelectorAll("[data-network-action]") ?? []).map(rect),
      lastAvatar: rect(rows[9]?.querySelector("img")),
      mobileNav: rect(document.querySelector("nav[class*='mobileNav']")),
      width: document.documentElement.scrollWidth,
    };
  });
  console.log("OWN_PROFILE_FOLLOWERS_MOBILE_FIGMA_GEOMETRY", JSON.stringify(geometry));
  expect(geometry.width).toBe(393);
  expect(geometry.firstAvatar).toMatchObject({ x: 16, y: 123, width: 40, height: 40 });
  expect(geometry.firstName?.y).toBeCloseTo(134.5, 0);
  expect(geometry.firstActions[0]).toMatchObject({ x: 299, y: 123, width: 40, height: 40 });
  expect(geometry.firstActions[1]).toMatchObject({ x: 339, y: 123, width: 40, height: 40 });
  expect(geometry.lastAvatar?.y).toBe(708);
  expect(geometry.mobileNav?.y).toBe(760);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-own-followers-en-mobile-393x852.png", animations: "disabled" });

  const filterButton = page.getByRole("button", { name: "Filters" });
  await filterButton.click();
  const search = page.getByRole("searchbox", { name: "Search users" });
  await expect(search).toBeFocused();
  await search.fill("leo");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("Leo Ramirez");
  await search.press("Escape");
  await expect(filterButton).toBeFocused();
  await expect(page.getByRole("search")).toHaveCount(0);
});

test("READY own profile Following mobile frame and page-local filter match source", async ({ page }) => {
  const followingNames = ["neonframe", "filmnoirrr", "rewindmax", "leonaskafilm", "Vhsdreams", "Cinephage", "slowburner", "Framebyframe", "arthousekid", "Midnighttape"];
  const following = followingNames.map((displayName, index) => ({
    id: 98401 + index,
    username: displayName.toLowerCase(),
    displayName,
    avatarUrl: index === 0 ? null : `https://following-figma.invalid/avatar-${String(index).padStart(2, "0")}.png`,
  }));
  await page.route("https://following-figma.invalid/**", async route => {
    const file = new URL(route.request().url()).pathname.split("/").at(-1)!;
    const body = await readFile(join(testDir, "fixtures", "own-profile-following-mobile-figma", file));
    return route.fulfill({ contentType: "image/png", body });
  });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: owner });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 204 });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/profile/me/social-links") return route.fulfill({ json: [] });
    if (pathname === `/api/users/${owner.id}/following`) return route.fulfill({ json: { content: following, totalPages: 1, totalElements: following.length, number: 0, size: 16 } });
    if (pathname === `/api/users/${owner.id}/followers`) return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 16 } });
    if (/^\/api\/users\/\d+\/follow-status$/.test(pathname)) return route.fulfill({ json: { following: false, followers: 10, followingCount: 0 } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 16 } });
  });

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/profile?view=following");
  const rows = page.locator("#profile-following [data-network-member-id]");
  await expect(page.locator("[class*='collectionToolbar'] h2")).toHaveText("Following");
  await expect(page.locator("#profile-activity")).toHaveCount(0);
  await expect(rows).toHaveCount(10);
  for (const image of await rows.locator("img").all()) {
    await expect(image).toHaveJSProperty("complete", true);
    expect(await image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  const geometry = await page.evaluate(() => {
    const rect = (element: Element | null) => { if (!element) return null; const box = element.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height }; };
    const rows = Array.from(document.querySelectorAll("#profile-following [data-network-member-id]"));
    return {
      firstAvatar: rect(rows[0]?.querySelector("[class*='avatar']")),
      firstName: rect(rows[0]?.querySelector("[class*='userCopy'] strong")),
      lastAvatar: rect(rows[9]?.querySelector("[class*='avatar']")),
      mobileNav: rect(document.querySelector("nav[class*='mobileNav']")),
      width: document.documentElement.scrollWidth,
    };
  });
  expect(geometry.width).toBe(393);
  expect(geometry.firstAvatar).toMatchObject({ x: 16, y: 123, width: 40, height: 40 });
  expect(geometry.firstName?.y).toBeCloseTo(134.5, 0);
  expect(geometry.lastAvatar?.y).toBe(708);
  expect(geometry.mobileNav?.y).toBe(760);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/profile/rewind-own-following-en-mobile-393x852.png", animations: "disabled" });
  const filterButton = page.getByRole("button", { name: "Filters" });
  await filterButton.click();
  const search = page.getByRole("searchbox", { name: "Search users" });
  await expect(search).toBeFocused();
  await search.fill("Cinephage");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("Cinephage");
  await search.press("Escape");
  await expect(filterButton).toBeFocused();
  await expect(page.getByRole("search")).toHaveCount(0);
});
