import { mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261124", "popular-reviewers-mobile");
const avatarFiles = Array.from({ length: 8 }, (_, index) => `reviewer-${String(index + 2).padStart(2, "0")}.png`);
const desktopAvatarFiles = Array.from({ length: 10 }, (_, index) => `desktop-reviewer-${String(index + 1).padStart(2, "0")}.png`);
const popularMemberAvatarFiles = Array.from({ length: 14 }, (_, index) => `popular-member-${String(index + 1).padStart(2, "0")}.png`);
mkdirSync(evidenceDir, { recursive: true });

test("popular reviewers mobile matches the Figma row layout", async ({ page }) => {
  const avatars = new Map(await Promise.all([...avatarFiles, ...desktopAvatarFiles, ...popularMemberAvatarFiles].map(async name => [name, await readFile(new URL(`./fixtures/popular-reviewers-mobile-figma/${name}`, import.meta.url))] as const)));
  const pageRequests: URL[] = [];
  await page.route("https://reviewer-fixture.invalid/**", route => {
    const name = new URL(route.request().url()).pathname.slice(1);
    const body = avatars.get(name);
    return body ? route.fulfill({ contentType: "image/png", body }) : route.abort();
  });
  await page.route(url => new URL(url).pathname.startsWith("/api/"), async route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/popular-reviewers/page") {
      pageRequests.push(url);
      const number = Number(url.searchParams.get("page") ?? 0);
      const query = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
      const firstNames = ["neonframe", "filmnoirrr", "rewindmax", "leonaskafilm", "Vhsdreams", "Cinephage", "slowburner", "Framebyframe", "arthousekid", "Midnighttape"];
      const firstReviewCounts = [1367, 1267, 1167, 1067, 967, 867, 867, 867, 767, 667];
      const names = query ? ["member-15"] : number === 0 ? firstNames : Array.from({ length: 10 }, (_, index) => `member-${number * 10 + index - 9}`);
      const content = names.map((username, index) => ({
        id: 990001 + number * 10 + index, username, displayName: username,
        avatarUrl: page.viewportSize()?.width === 1440 ? `https://reviewer-fixture.invalid/desktop-reviewer-${String((number * 10 + index) % 10 + 1).padStart(2, "0")}.png` : index > 0 && index < 9 ? `https://reviewer-fixture.invalid/reviewer-${String(index + 1).padStart(2, "0")}.png` : null,
        likes: 42 + index, reviewCount: number === 0 && !query ? firstReviewCounts[index] : 1367 - number * 10 - index, watchedCount: 1800 - index * 70, listCount: 30 - index,
      }));
      return route.fulfill({ json: { content, totalPages: query ? 1 : 40, totalElements: query ? 1 : 400, number, size: 10 } });
    }
    if (url.pathname === "/api/users/popular-reviewers") {
      const desktop = page.viewportSize()?.width === 1440;
      return route.fulfill({ json: [
        ["neonframe", 1367], ["filmnoirrr", 1267], ["rewindmax", 1167], ["leonaskafilm", 1067], ["Vhsdreams", 967],
        ["Cinephage", 867], ["slowburner", 867], ["Framebyframe", 867], ["arthousekid", 767], ["Midnighttape", 667],
        ...Array.from({ length: 14 }, (_, index) => [`member-${index + 1}`, 600 - index * 10]),
      ].map(([username, reviewCount], index) => ({
        id: 980001 + index, username, displayName: username,
        avatarUrl: desktop ? index < 10 ? `https://reviewer-fixture.invalid/desktop-reviewer-${String(index + 1).padStart(2, "0")}.png` : `https://reviewer-fixture.invalid/popular-member-${String(index - 9).padStart(2, "0")}.png` : index > 0 && index < 9 ? `https://reviewer-fixture.invalid/reviewer-${String(index + 1).padStart(2, "0")}.png` : null, likes: 42 + index,
        reviewCount, watchedCount: 1800 - index * 70, listCount: 30 - index,
      })) });
    }
    if (url.pathname === "/api/users/me") return route.fulfill({ status: 401 });
    if (/\/api\/users\/\d+\/(follow-status|block-status)$/.test(url.pathname)) {
      return route.fulfill({ json: url.pathname.endsWith("follow-status") ? { following: false, followers: 14, followingCount: 7 } : { blocked: false } });
    }
    if (url.pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ status: 200, json: [] });
  });

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/en/community/reviewers");
  await expect(page.locator("#popular-reviewers-title")).toBeAttached();
  const rows = page.locator("#reviewer-list > li");
  await expect(rows).toHaveCount(10);
  const sourceTopTen = [
    ["neonframe", "1,367 reviews"], ["filmnoirrr", "1,267 reviews"], ["rewindmax", "1,167 reviews"],
    ["leonaskafilm", "1,067 reviews"], ["Vhsdreams", "967 reviews"], ["Cinephage", "867 reviews"],
    ["slowburner", "867 reviews"], ["Framebyframe", "867 reviews"], ["arthousekid", "767 reviews"],
    ["Midnighttape", "667 reviews"],
  ];
  for (const [index, [username, reviewCount]] of sourceTopTen.entries()) {
    await expect(rows.nth(index)).toContainText(username);
    await expect(rows.nth(index)).toContainText(reviewCount);
  }
  await expect(rows.first().locator("[class*=avatarFallback]")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(rows.nth(9).locator("[class*=avatarFallback]")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect.poll(() => page.locator("#reviewer-list img[class*=avatar]").evaluateAll(images => images.length === 8 && images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(page.locator("main[class*=page] [class*=toolbar] img")).toHaveCount(2);
  await expect(page.locator("main[class*=page] [class*=toolbar] img").evaluateAll(images => images.map(image => new URL((image as HTMLImageElement).src).pathname))).resolves.toEqual(["/images/popular-reviewers-back.png", "/images/popular-reviewers-filter.png"]);
  await expect(rows.first().locator('button[data-network-action="more"] img')).toHaveAttribute("src", "/images/popular-reviewers-more.png");
  await expect(rows.first().locator('a[aria-label^="Follow:"] img')).toHaveAttribute("src", "/images/popular-reviewers-follow.svg");

  const filterButton = page.getByRole("button", { name: "Filter reviewers" });
  await filterButton.click();
  const filterInput = page.getByRole("searchbox", { name: "Search reviewers" });
  await expect(filterInput).toBeVisible();
  await expect(filterInput).toHaveAttribute("maxlength", "80");
  await filterInput.fill("member-15");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("member-15");
  await expect.poll(() => pageRequests.at(-1)?.searchParams.get("q")).toBe("member-15");
  await expect(page.locator('nav[aria-label="Community user pages"]')).toHaveCount(0);
  await page.screenshot({ path: path.join(evidenceDir, "rewind-popular-reviewers-en-phone-filter-393x852.png") });
  await filterInput.press("Escape");
  await expect(filterInput).toBeHidden();
  await expect(rows).toHaveCount(10);
  await expect(filterButton).toBeFocused();

  const header = await page.locator("header").first().boundingBox();
  const firstRow = await rows.first().boundingBox();
  const avatar = await rows.first().locator("[class*=avatar]").boundingBox();
  expect(header?.y).toBe(0);
  expect(firstRow?.y).toBeCloseTo(116, 0);
  expect(firstRow?.height).toBeCloseTo(65, 0);
  expect(avatar).toMatchObject({ x: 16, y: 123, width: 40, height: 40 });

  await page.screenshot({ path: path.join(evidenceDir, "rewind-popular-reviewers-en-phone-393x852.png") });

  await page.setViewportSize({ width: 1440, height: 2850 });
  await page.goto("/en/community/reviewers");
  const desktopTable = page.locator("#reviewer-list").locator("xpath=..");
  await expect(page.locator("#reviewer-list > li")).toHaveCount(10);
  await expect.poll(() => page.locator("#reviewer-list img[class*=avatar]").evaluateAll(images => images.length === 10 && images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(page.locator("#reviewer-list img[class*=avatar]").evaluateAll(images => images.map(image => new URL((image as HTMLImageElement).src).pathname.split("/").pop()))).resolves.toEqual(Array.from({ length: 10 }, (_, index) => `desktop-reviewer-${String(index + 1).padStart(2, "0")}.png`));
  const table = await desktopTable.boundingBox();
  expect(table?.x).toBeCloseTo(120, 0);
  expect(table?.width).toBeCloseTo(1200, 0);
  expect(table?.y).toBeCloseTo(813, 0);
  const pageButtons = page.locator('nav[aria-label="Community user pages"] button');
  await expect(pageButtons).toHaveCount(4);
  await expect(pageButtons).toHaveText(["1", "2", "3", "40"]);
  await expect(page.locator('nav[aria-label="Community user pages"]')).toContainText("…");
  await pageButtons.nth(1).click();
  await expect(page.locator("#reviewer-list > li").first()).toContainText("member-1");
  await expect.poll(() => pageRequests.at(-1)?.searchParams.get("page")).toBe("1");
  await expect(page.locator('[class*=popularMembersRail] > a')).toHaveCount(14);
  await expect.poll(() => page.locator('[class*=popularMembersRail] img').evaluateAll(images => images.length === 14 && images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await pageButtons.nth(0).click();
  await expect.poll(() => pageRequests.at(-1)?.searchParams.get("page")).toBe("0");
  await page.screenshot({ path: path.join(evidenceDir, "rewind-popular-reviewers-en-desktop-1440x2850.png"), fullPage: true });
});
