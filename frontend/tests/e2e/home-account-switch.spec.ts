import { expect, test, type BrowserContext } from "@playwright/test";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

async function homeFixture(context: BrowserContext, outcome: "loaded" | "late-success" | "late-error") {
  await installHostedAuthFixture(context);
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const requests: number[] = [];
  const emptyPage = { content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 };
  await context.route(url => url.pathname.startsWith("/api/"), async route => {
    const path = new URL(route.request().url()).pathname;
    const actor = route.request().headers().authorization?.endsWith("6") ? 6 : 7;
    if (path === "/api/users/me") return route.fulfill({ json: { id: actor, username: `reader-${actor}`, role: "USER" } });
    if (path === "/api/activity/following") {
      requests.push(actor);
      if (actor === 7 && outcome !== "loaded") {
        await held;
        if (outcome === "late-error") return route.fulfill({ status: 503, json: {} });
      }
      return route.fulfill({ json: { ...emptyPage, totalElements: 1, totalPages: 1, content: [{
        id: actor, type: "REVIEW", createdAt: "2026-11-14T00:00:00Z",
        actor: { id: actor, username: `friend-${actor}`, displayName: `Friend ${actor}`, avatarUrl: null },
        movie: { id: actor, title: `Account ${actor} activity` }, relatedUser: null, list: null,
      }] } });
    }
    if (path.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (path.includes("popular-reviewers") || path.startsWith("/api/tags")) return route.fulfill({ json: [] });
    return route.fulfill({ json: emptyPage });
  });
  return { requests, release };
}

for (const language of ["uk", "en"] as const) {
  for (const outcome of ["loaded", "late-success", "late-error"] as const) {
    test(`Home refreshes the current account and ignores ${outcome} from the previous viewer in ${language}`, async ({ context, page }) => {
      const state = await homeFixture(context, outcome);
      try {
        await page.setViewportSize({ width: language === "uk" ? 1440 : 393, height: 900 });
        await signInHostedFixture(page, language);
        await page.goto(`/${language}/home`);
        const feed = page.locator("#home-following-activity");
        await expect.poll(() => state.requests).toContain(7);
        if (outcome === "loaded") await expect(feed.getByRole("link", { name: "Account 7 activity", exact: true })).toBeVisible();

        const profile = page.waitForResponse(r => new URL(r.url()).pathname === "/api/users/me"
          && r.request().headers().authorization?.endsWith("6") === true);
        const other = await context.newPage();
        await other.goto("/en/email-action/#rewind_action=signup&type=email&token_hash=fixture-next-account");
        await other.getByRole("button", { name: "Confirm email", exact: true }).click();
        await expect(other).toHaveURL(/\/en\/films\/?$/);
        expect((await (await profile).json()).id).toBe(6);
        await expect.poll(() => state.requests).toContain(6);
        await expect(feed.getByRole("link", { name: "Account 6 activity", exact: true })).toBeVisible();
        await expect(feed.getByText("Account 7 activity", { exact: true })).toHaveCount(0);
        await expect(page).toHaveURL(new RegExp(`/${language}/home/?$`));

        if (outcome !== "loaded") {
          const response = page.waitForResponse(r => new URL(r.url()).pathname === "/api/activity/following"
            && r.request().headers().authorization?.endsWith("7") === true);
          state.release();
          await (await response).finished();
          await page.waitForLoadState("networkidle");
          await expect(feed.getByRole("link", { name: "Account 6 activity", exact: true })).toBeVisible();
          await expect(feed.getByText("Account 7 activity", { exact: true })).toHaveCount(0);
          await expect(feed.getByRole("button", { name: /Retry|Спробувати ще/ })).toHaveCount(0);
        }
      } finally {
        state.release();
      }
    });
  }
}
