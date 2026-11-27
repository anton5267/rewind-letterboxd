import { expect, test } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const admin = { id: 900010, username: "lola-james", role: "ADMIN", displayName: "Lola James", email: "admin@example.invalid", avatarUrl: "https://admin-user-profile-fixture.invalid/lola-james.png", isActive: true, isHq: false };
const subject = { id: 900020, username: "liza-salvinko", role: "ADMIN", displayName: "Liza Salvinko", email: "liza.salv@gmail.com", avatarUrl: "https://admin-user-profile-fixture.invalid/liza-salvinko.png", isActive: true, isHq: false, createdAt: "2025-06-01T12:00:00Z" };
const overview = {
  stats: { watched: 74, reviews: 37, ratings: 51, watchlist: 28, favorites: 7, comments: 64, likesReceived: 145, followers: 12, customLists: 15 },
  adminHistory: [{ id: 900030, adminId: 900010, action: "UPDATE_ROLE", targetType: "USER", targetId: 900020, metadata: null, createdAt: "2025-10-19T12:00:00Z" }],
};

test("READY Admin User Profile frame renders API-backed identity, actions, history and stats", async ({ page }) => {
  await page.route("https://admin-user-profile-fixture.invalid/**", async route => {
    const filename = basename(new URL(route.request().url()).pathname);
    const image = await readFile(resolve(process.cwd(), "tests/e2e/fixtures/admin-user-profile-figma", filename));
    await route.fulfill({ contentType: "image/png", body: image });
  });
  await page.route("**/api/users/me", route => route.fulfill({ json: admin }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "admin-user-profile-figma" } }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/notifications/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/admin/users/900020", route => route.fulfill({ json: subject }));
  await page.route("**/api/admin/users/900020/overview", route => route.fulfill({ json: overview }));

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en/admin?view=user-profile&user=900020");
  const profile = page.locator("main > section[aria-label='User profile']");
  await expect(profile).toHaveAttribute("aria-busy", "false");
  await expect(page.getByRole("heading", { name: "Lola James" })).toBeVisible();
  await expect(profile.getByRole("heading", { name: "Liza Salvinko" })).toBeVisible();
  const heroAvatar = page.locator("main > header div[class*='avatar'] img");
  const subjectAvatar = page.locator("#admin-user-profile img[class*='detailAvatar']");
  await expect(heroAvatar).toBeVisible();
  await expect(subjectAvatar).toBeVisible();
  for (const avatar of [heroAvatar, subjectAvatar]) {
    await expect.poll(() => avatar.evaluate(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)).toBe(true);
  }
  await expect(heroAvatar).toHaveAttribute("src", /lola-james\.png/);
  await expect(subjectAvatar).toHaveAttribute("src", /liza-salvinko\.png/);
  await expect(profile.getByText("liza.salv@gmail.com")).toBeVisible();
  await expect(profile.getByRole("combobox", { name: "user: Liza Salvinko" })).toHaveValue("ADMIN");
  await expect(profile.getByRole("button", { name: "Block", exact: true })).toBeVisible();
  await expect(profile.getByRole("heading", { name: "Administrator action history" })).toBeVisible();
  await expect(profile.getByRole("heading", { name: "User Activity" })).toBeVisible();
  await expect(profile.getByText("74", { exact: true })).toBeVisible();
  await expect(profile.getByText("37", { exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));

  const anchors = await page.evaluate(() => {
    const rect = (element: Element | null) => { if (!element) return null; const box = element.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height }; };
    return {
      hero: rect(document.querySelector("main > header")),
      avatar: rect(document.querySelector("main > header div[class*='avatar']")),
      heroTitle: rect(document.querySelector("#admin-dashboard-title")),
      subtitle: rect(document.querySelector("main > header [class*='identity'] > p")),
      navigation: rect(document.querySelector("main > header nav")),
      panel: rect(document.querySelector("#admin-user-profile")),
      history: rect(document.querySelector("#admin-user-history")?.parentElement ?? null),
      activity: rect(document.querySelector("#admin-user-stats")?.parentElement ?? null),
      footer: rect(document.querySelector("footer")),
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    };
  });
  console.log("ADMIN_USER_PROFILE_FIGMA_GEOMETRY", JSON.stringify(anchors));
  expect(anchors.width).toBe(1440);
  expect(anchors.hero?.height).toBe(1020);
  expect(anchors.avatar?.y).toBe(292);
  expect(anchors.avatar?.width).toBe(272);
  expect(Math.abs((anchors.heroTitle?.y ?? 0) - 581)).toBeLessThan(2);
  expect(anchors.navigation?.y).toBe(772);
  expect(anchors.navigation?.width).toBe(752);
  expect(anchors.panel?.y).toBe(1219);
  expect(anchors.panel?.height).toBe(829);
  expect(anchors.history?.y).toBe(2133);
  expect(anchors.history?.width).toBe(516);
  expect(anchors.activity?.x).toBe(804);
  expect(anchors.footer?.y).toBe(2794);
  expect(anchors.height).toBe(3059);
  const evidence = resolve(process.cwd(), "../artifacts/visual-audit-20261125/admin-user-profile");
  await mkdir(evidence, { recursive: true });
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo(0, 0); });
  await page.screenshot({ path: resolve(evidence, "admin-user-profile-en-1440-fixture.png"), fullPage: true });
});
