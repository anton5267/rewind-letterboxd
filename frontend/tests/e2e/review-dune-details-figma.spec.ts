import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261124", "review-dune-details-phone");
mkdirSync(evidenceDir, { recursive: true });
const fixtureDir = path.resolve(process.cwd(), "tests", "e2e", "fixtures", "review-dune-figma");
const testOrigin = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const likeAvatarNames = ["avatar-82.png", "avatar-81.png", "avatar-83.png", "avatar-80.png", ...Array.from({ length: 10 }, (_, index) => `avatar-${84 + index}.png`)];
const fixtureImage = (name: string) => new URL(`/__figma__/review-dune/${name}`, testOrigin).toString();

async function mockFigmaImages(page: import("@playwright/test").Page) {
  await page.route("**/__figma__/review-dune/*", async route => {
    const name = new URL(route.request().url()).pathname.split("/").at(-1) ?? "";
    const allowed = new Set(["backdrop.png", "poster.png", "author.png", ...Array.from({ length: 14 }, (_, index) => `avatar-${80 + index}.png`)]);
    if (!allowed.has(name)) return route.fulfill({ status: 404 });
    return route.fulfill({ path: path.join(fixtureDir, name) });
  });
}

const content = "Visually overwhelming in the best way possible. Villeneuve’s Dune prioritizes atmosphere and world-building, slowly drawing the viewer into the harsh and monumental world of Arrakis.\n\nThe film refuses to rush or over-explain, trusting visuals, sound, and restrained performances to communicate its themes of power, destiny, and survival. It may feel distant or slow at times, but its scale, mood, and confidence make it a striking introduction to the story.\n\nRather than delivering a complete narrative, Dune functions as a carefully crafted first chapter, ending not with closure but with a sense of inevitability. It leaves the viewer immersed, unsettled, and aware that this world has only just begun to reveal itself.";
const members = Array.from({ length: 10 }, (_, index) => ({
  id: 94100 + index,
  username: `dune-reader-${index}`,
  displayName: `Dune Reader ${index + 1}`,
  avatarUrl: fixtureImage(likeAvatarNames[index]),
}));

test("Review Dune detail matches Figma mobile frame 1480:9249", async ({ page }) => {
  await mockFigmaImages(page);
  await page.route(url => new URL(url).pathname.startsWith("/api/"), async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: 94073, username: "silverframe", role: "USER" } });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "figma-review-detail" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/reviews/94072") return route.fulfill({ json: {
      id: 94072,
      content,
      rating: 4,
      createdAt: "2026-10-18T12:30:00Z",
      author: { id: 94073, username: "silverframe", displayName: "SilverFrame", avatarUrl: fixtureImage("author.png") },
      movie: { id: 35, title: "Dune", releaseDate: "2021-10-22", durationMinutes: 155, ageRating: "12+", photoUrl: fixtureImage("poster.png"), backdropUrl: fixtureImage("backdrop.png"), trailerUrl: "https://example.invalid/trailer" },
      likes: members.length,
      likedBy: members,
    } });
    if (pathname === "/api/reviews/94072/like-status") return route.fulfill({ json: { liked: false, likes: members.length } });
    return route.fulfill({ status: 404, json: {} });
  });

  await page.setViewportSize({ width: 393, height: 932 });
  await page.goto("/en/reviews/94072");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Dune", level: 1 })).toBeVisible();
  await expect(main.locator('[aria-label="Film data"]')).toContainText("2h 35m");
  await expect(main.getByText(content, { exact: true })).toBeVisible();
  await expect.poll(() => page.locator('img[src*="/__figma__/review-dune/"]').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(main.getByRole("region", { name: "Members who liked this review" }).getByRole("link")).toHaveCount(members.length);
  const nav = page.getByRole("navigation", { name: "Main navigation", exact: true });
  for (const label of ["Home", "Search", "Add", "Journal", "Profile"]) await expect(nav.getByText(label, { exact: true })).toBeVisible();

  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing ${selector}`);
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    const avatar = rect('[class*="_likers_"] a');
    return {
      poster: rect('[class*="_posterColumn_"] [class*="_poster_"]'),
      title: rect("#review-title"),
      byline: rect('[class*="_authorMeta_"]'),
      review: rect('[class*="_reviewText_"]'),
      trailer: rect('[class*="_trailer_"]'),
      divider: rect('[class*="_likersSection_"] [class*="_likeRow_"]'),
      members: rect('[class*="_likers_"]'),
      avatar,
      navigation: rect('header nav[class*="_mobileNav_"]'),
    };
  });
  expect(geometry.poster).toMatchObject({ x: 16, y: 245, width: 120, height: 180 });
  expect(geometry.title.y).toBeCloseTo(270, 0);
  expect(geometry.review.y).toBeCloseTo(351, 0);
  expect(geometry.trailer).toMatchObject({ x: 16, y: 434, width: 120, height: 30 });
  expect(geometry.divider.y).toBeCloseTo(714, 0);
  expect(geometry.avatar).toMatchObject({ x: 16, width: 40, height: 40 });
  expect(geometry.avatar.y).toBeCloseTo(762.08, 0);
  expect(geometry.navigation).toMatchObject({ x: 0, y: 840, width: 393, height: 92 });
  console.log("DUNE_REVIEW_DETAILS_GEOMETRY", JSON.stringify(geometry));
  await page.screenshot({ path: path.join(evidenceDir, "rewind-review-dune-en-phone-393x932.png"), fullPage: false });

  await page.goto("/uk/reviews/94072");
  await expect(page.getByRole("main").locator('ul[class*="_meta_"]')).toContainText("2 год 35 хв");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
});

test("Review Dune detail follows Figma desktop frame 1480:6826", async ({ page }) => {
  const desktopMembers = Array.from({ length: likeAvatarNames.length }, (_, index) => ({
    id: 94200 + index,
    username: `dune-fan-${index}`,
    displayName: `Dune Fan ${index + 1}`,
    avatarUrl: fixtureImage(likeAvatarNames[index]),
  }));
  await mockFigmaImages(page);
  await page.route(url => new URL(url).pathname.startsWith("/api/"), async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: 94073, username: "silverframe", role: "USER" } });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "figma-review-desktop" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/notifications/unread-count") return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/reviews/94072") return route.fulfill({ json: {
      id: 94072,
      content,
      rating: 4,
      createdAt: "2024-10-18T12:30:00Z",
      author: { id: 94073, username: "silverframe", displayName: "SilverFrame", avatarUrl: fixtureImage("author.png") },
      movie: { id: 35, title: "Dune", releaseDate: "2021-10-22", durationMinutes: 155, ageRating: "12+", photoUrl: fixtureImage("poster.png"), backdropUrl: fixtureImage("backdrop.png"), trailerUrl: "https://example.invalid/trailer" },
      likes: 500,
      likedBy: desktopMembers,
    } });
    if (pathname === "/api/reviews/94072/like-status") return route.fulfill({ json: { liked: false, likes: 500 } });
    return route.fulfill({ status: 404, json: {} });
  });

  await page.clock.install({ time: new Date("2025-01-18T12:30:00Z") });
  await page.setViewportSize({ width: 1440, height: 1905 });
  await page.goto("/en/reviews/94072");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Dune", level: 1 })).toBeVisible();
  await expect(main.getByText(content, { exact: true })).toBeVisible();
  await expect(main.locator('time[class*="_published_"]')).toHaveText("Published 3 months ago");
  await expect(page.locator("footer")).toContainText("© 2025 Rewind");
  await expect.poll(() => page.locator('img[src*="/__figma__/review-dune/"]').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(main.getByRole("region", { name: "Members who liked this review" }).getByRole("link")).toHaveCount(likeAvatarNames.length);

  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing ${selector}`);
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      poster: rect('[class*="_posterColumn_"] [class*="_poster_"]'),
      title: rect("#review-title"),
      review: rect('[class*="_reviewText_"]'),
      trailer: rect('[class*="_trailer_"]'),
      socialPanel: rect('[class*="_socialPanel_"]'),
      membersHeading: rect('[class*="_likersSection_"] h2'),
      members: rect('[class*="_likers_"]'),
      footerStart: rect("footer"),
    };
  });
  expect(geometry.poster).toMatchObject({ x: 120, y: 538, width: 275, height: 411 });
  expect(geometry.title).toMatchObject({ x: 450, y: 601 });
  expect(geometry.review).toMatchObject({ x: 450, width: 581 });
  expect(geometry.review.y).toBeCloseTo(794, 0);
  expect(geometry.trailer).toMatchObject({ x: 120, y: 974, width: 275, height: 59 });
  expect(geometry.socialPanel).toMatchObject({ x: 1069, y: 653, width: 251, height: 170 });
  expect(geometry.membersHeading.y).toBeCloseTo(1318, 0);
  expect(geometry.members).toMatchObject({ x: 120, y: 1400, width: 1200, height: 80 });
  expect(geometry.footerStart.y).toBeCloseTo(1640, 0);
  console.log("DUNE_REVIEW_DESKTOP_GEOMETRY", JSON.stringify(geometry));
  await page.screenshot({ path: path.join(evidenceDir, "rewind-review-dune-en-desktop-1440x1905.png"), fullPage: true });
});
