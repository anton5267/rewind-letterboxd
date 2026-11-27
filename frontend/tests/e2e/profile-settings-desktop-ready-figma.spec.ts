import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

const poster = "https://images.example.invalid/poster.png";
const avatar = "https://figma-assets.example.invalid/account-settings-avatar.jpg";
const banner = "https://figma-assets.example.invalid/account-settings-banner.png";
const profile = {
  id: 7, username: "simchuk", displayName: "Emma Cerys", email: "emmacerys@gmail.com",
  avatarUrl: avatar, bannerUrl: banner, bio: "Obsessed with great directing, bold storytelling, and films that stick with you long after the credits roll.",
  location: "USA", website: "", pronoun: "She / her", role: "USER", replyPreference: "ANYONE", pinnedListId: null,
  supabaseLinked: true, lists: [], recentRatings: [], recentReviews: [],
  stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 4 },
};
const posterNames = ["profile-babylon", "profile-holiday", "profile-whiplash", "profile-dead-poets-society"];
const films = ["Babylon", "The Holiday", "Whiplash", "Dead Poets Society"].map((title, index) => ({
  id: index + 1, title, releaseDate: null, rating: null, photoUrl: `https://figma-assets.example.invalid/${posterNames[index]}.png`,
}));
const page = { content: films, number: 0, size: 24, totalPages: 1, totalElements: 4 };

for (const tab of ["connections", "avatar", "authentication", "profile"] as const) {
  test(`READY desktop account settings ${tab} captures Figma comparison`, async ({ context, page: browserPage }) => {
    await installHostedAuthFixture(context);
    await context.route("https://images.example.invalid/**", route => route.fulfill({
      contentType: "image/png",
      body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aAZkAAAAASUVORK5CYII=", "base64"),
    }));
    await context.route("https://figma-assets.example.invalid/**", route => {
      const filename = new URL(route.request().url()).pathname.split("/").at(-1) ?? "";
      const file = filename === "account-settings-avatar.jpg" || filename === "account-settings-banner.png" || posterNames.some(name => filename === `${name}.png`)
        ? filename
        : "account-settings-banner.png";
      return route.fulfill({
        path: resolve(process.cwd(), "tests/e2e/fixtures/figma", file),
        contentType: file.endsWith(".jpg") ? "image/jpeg" : "image/png",
      });
    });
    await context.route(url => url.pathname.startsWith("/api/"), route => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/api/users/me") return route.fulfill({ json: { id: 7, username: "simchuk", role: "USER" } });
      if (path === "/api/profile/me") return route.fulfill({ json: profile });
      if (path === "/api/profile/me/favorites") return route.fulfill({ json: page });
      if (path === "/api/profile/me/social-links") return route.fulfill({ json: [{ platform: "x", url: "https://x.com/example" }] });
      if (path.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
      if (path === "/api/newsletter/subscription") return route.fulfill({ json: { subscribed: false } });
      if (path === "/api/lists/my") return route.fulfill({ json: [] });
      return route.fulfill({ json: { content: [], number: 0, size: 24, totalPages: 0, totalElements: 0 } });
    });
    await browserPage.setViewportSize({ width: 1440, height: 1000 });
    await signInHostedFixture(browserPage, "en");
    await browserPage.goto(`/en/profile?settings=${tab}`);
    await expect(browserPage.locator("main")).toHaveAttribute("aria-busy", "false");
    const geometry = await browserPage.evaluate(() => ({
      pageHeight: document.documentElement.scrollHeight,
      hero: document.querySelector("main > header")!.getBoundingClientRect().toJSON(),
      title: document.querySelector("#account-settings-title")!.getBoundingClientRect().toJSON(),
      activeTab: document.querySelector("main nav[aria-label] a[aria-current='page']")?.getBoundingClientRect().toJSON(),
      footer: document.querySelector("footer")!.getBoundingClientRect().toJSON(),
      section: document.querySelector("main > div > section")!.getBoundingClientRect().toJSON(),
      form: document.querySelector("#settings-form-profile")?.getBoundingClientRect().toJSON(),
      save: document.querySelector("#settings-form-profile button")?.getBoundingClientRect().toJSON(),
      favorites: document.querySelector("#settings-favorites-title")?.parentElement?.getBoundingClientRect().toJSON(),
      favoriteRail: document.querySelector("#settings-favorites-title")?.parentElement?.querySelector("ul")?.getBoundingClientRect().toJSON(),
      formChildren: Array.from(document.querySelector("#settings-form-profile")?.children ?? []).map(element => ({
        text: element.textContent?.trim().slice(0, 35),
        className: (element as HTMLElement).className,
        ...element.getBoundingClientRect().toJSON(),
      })),
      accountLinks: document.querySelector("main nav[aria-label]:last-child")?.getBoundingClientRect().toJSON(),
      accountPadding: getComputedStyle(document.querySelector("main")!).paddingBottom,
      passwordForm: document.querySelector("#settings-form-authentication")?.getBoundingClientRect().toJSON(),
      passwordButton: document.querySelector("#settings-form-authentication button")?.getBoundingClientRect().toJSON(),
      linkState: document.querySelector("[aria-labelledby='supabase-link-title']")?.getBoundingClientRect().toJSON(),
      profileDisplayName: document.querySelector("#profile-display-name")?.getBoundingClientRect().toJSON(),
      profileUsername: document.querySelector("#settings-username")?.getBoundingClientRect().toJSON(),
      profileDisplayNameLabel: document.querySelector("label[for='profile-display-name']")?.innerText.trim(),
      favoriteHeading: document.querySelector("#settings-favorites-title")?.getBoundingClientRect().toJSON(),
      mediaPanels: Array.from(document.querySelectorAll<HTMLElement>("[data-profile-media-panel]")).map(panel => ({
        kind: panel.dataset.profileMediaPanel,
        heading: panel.querySelector("h2")?.getBoundingClientRect().toJSON(),
        preview: panel.querySelector("[data-profile-media-preview]")?.getBoundingClientRect().toJSON(),
        image: panel.querySelector("img")?.getBoundingClientRect().toJSON(),
        button: panel.querySelector("[data-profile-media-actions] button")?.getBoundingClientRect().toJSON(),
        hint: panel.querySelector(".hint, [class*=hint]")?.getBoundingClientRect().toJSON(),
      })),
    }));
    if (tab === "avatar") {
      const closeTo = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(3);
      expect(geometry.mediaPanels).toHaveLength(2);
      closeTo(geometry.footer.y, 2855);
      const [avatarPanel, bannerPanel] = geometry.mediaPanels;
      closeTo(avatarPanel.heading!.y, 943);
      closeTo(avatarPanel.preview!.y, 1024);
      closeTo(avatarPanel.preview!.height, 543);
      closeTo(avatarPanel.image!.x, 587.5);
      closeTo(avatarPanel.image!.y, 1163);
      closeTo(avatarPanel.button!.y, 1598);
      closeTo(avatarPanel.button!.height, 79);
      closeTo(avatarPanel.hint!.y, 1708);
      closeTo(bannerPanel.heading!.y, 1869);
      closeTo(bannerPanel.preview!.y, 1953);
      closeTo(bannerPanel.preview!.height, 543);
      closeTo(bannerPanel.button!.y, 2527);
      closeTo(bannerPanel.button!.height, 79);
      closeTo(bannerPanel.hint!.y, 2637);
      const loadedImages = await browserPage.locator("[data-profile-media-preview] img").evaluateAll(images => images.map(image => ({
        complete: (image as HTMLImageElement).complete,
        naturalWidth: (image as HTMLImageElement).naturalWidth,
      })));
      expect(loadedImages).toHaveLength(2);
      expect(loadedImages.every(image => image.complete && image.naturalWidth > 0)).toBe(true);
    }
    if (tab === "authentication") {
      const closeTo = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(3);
      closeTo(geometry.passwordForm!.x, 120);
      closeTo(geometry.passwordForm!.y, 943);
      closeTo(geometry.passwordButton!.y, 1557);
      closeTo(geometry.footer.y, 1796);
      expect(geometry.pageHeight).toBe(2061);
    }
    if (tab === "connections") {
      expect(geometry.pageHeight).toBe(2073);
      expect(geometry.footer.y).toBeCloseTo(1808, 0);
      const connections = browserPage.getByRole("region", { name: "Social links" });
      await expect(connections.locator('[data-social-connection-card="x"]')).toContainText("Connected");
      await expect(connections.locator('[data-social-connection-card="instagram"]')).toContainText("Connect");
      await expect(connections.locator("input[type=url]:visible")).toHaveCount(0);
    }
    if (tab === "profile") {
      const closeTo = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(3);
      expect(geometry.profileDisplayNameLabel).toBe("Username");
      expect(geometry.profileDisplayName).toMatchObject({ x: 120, width: 588, height: 79 });
      closeTo(geometry.profileDisplayName!.y, 1071);
      expect(geometry.profileUsername?.width).toBe(0);
      closeTo(geometry.favoriteHeading!.y, 1916);
      closeTo(geometry.favoriteRail!.y, 1999);
      closeTo(geometry.footer.y, 2554);
      const posterSizes = await browserPage.locator("[data-profile-favorite-posters] [data-favorite-poster] img").evaluateAll(images => images.map(image => ({
        width: (image as HTMLImageElement).naturalWidth,
        height: (image as HTMLImageElement).naturalHeight,
      })));
      expect(posterSizes).toHaveLength(4);
      expect(posterSizes.every(image => image.width >= 265 && image.height >= 395)).toBe(true);
      const moreProfileSettings = browserPage.locator("details[data-profile-settings-more]");
      await expect(moreProfileSettings).toHaveCount(1);
      await expect(moreProfileSettings).not.toHaveAttribute("open", "");
      await moreProfileSettings.locator("summary").click();
      await expect(moreProfileSettings.locator("[data-profile-pinned-list]")).toBeVisible();
      await moreProfileSettings.locator("summary").click();
      await browserPage.evaluate(() => window.scrollTo(0, 0));
    }
    console.log("DESKTOP SETTINGS", tab, JSON.stringify(geometry));
    await browserPage.screenshot({ path: `../artifacts/visual-audit-20261125/profile-settings/${tab}-en-desktop-current.png`, fullPage: true });
    if (tab === "connections") {
      const connections = browserPage.getByRole("region", { name: "Social links" });
      await connections.getByText("Other links", { exact: true }).click();
      await expect(connections.getByLabel("Website")).toBeVisible();
      await expect(connections.getByLabel("TikTok")).toBeVisible();
      await expect(connections.getByLabel("Letterboxd")).toBeVisible();
      await expect(connections.getByRole("button", { name: "Save", exact: true })).toBeVisible();
      await connections.getByRole("button", { name: "Connect Instagram" }).click();
      await expect(connections.getByLabel("Instagram URL")).toBeVisible();
    }
  });
}
