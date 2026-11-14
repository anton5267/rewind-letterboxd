import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

type PreviousResponse = "loaded" | "late-success" | "late-error";

async function headerFixture(context: BrowserContext, page: Page, outcome: PreviousResponse) {
  await installHostedAuthFixture(context);
  let releasePrevious!: () => void;
  let releaseNext!: () => void;
  const previousHeld = new Promise<void>(resolve => { releasePrevious = resolve; });
  const nextHeld = new Promise<void>(resolve => { releaseNext = resolve; });
  let holdPrevious = false;
  const requests: { viewer: number; path: string }[] = [];
  const emptyPage = { content: [], number: 0, totalElements: 0, totalPages: 0 };

  await context.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const viewer = request.headers().authorization?.endsWith("6") ? 6 : 7;
    if (path === "/api/users/me") {
      return route.fulfill({ json: { id: viewer, username: `reader-${viewer}`, role: viewer === 7 ? "ADMIN" : "USER" } });
    }
    if (path.endsWith("/unread-count")) {
      const originalTab = request.frame().page() === page;
      if (originalTab) requests.push({ viewer, path });
      const delayedPrevious = originalTab && viewer === 7 && holdPrevious;
      if (originalTab && viewer === 6) await nextHeld;
      if (delayedPrevious) {
        await previousHeld;
        if (outcome === "late-error") return route.fulfill({ status: 503, json: {} });
      }
      const messageCount = viewer === 6 ? 2 : delayedPrevious ? 91 : 4;
      const notificationCount = viewer === 6 ? 3 : delayedPrevious ? 90 : 9;
      return route.fulfill({ json: { count: path.startsWith("/api/conversations/") ? messageCount : notificationCount } });
    }
    if (path.startsWith("/api/genres") || path.startsWith("/api/tags") || path.includes("popular-reviewers")) {
      return route.fulfill({ json: [] });
    }
    return route.fulfill({ json: emptyPage });
  });

  return {
    requests,
    holdPrevious: () => { holdPrevious = true; },
    releasePrevious,
    releaseNext,
  };
}

for (const language of ["uk", "en"] as const) {
  for (const outcome of ["loaded", "late-success", "late-error"] as const) {
    test(`Header refreshes unread counts after account switch with ${outcome} in ${language}`, async ({ context, page }) => {
      const fixture = await headerFixture(context, page, outcome);
      const desktop = language === "uk";
      try {
        await page.setViewportSize({ width: desktop ? 1440 : 393, height: 900 });
        await signInHostedFixture(page, language);
        await page.goto(`/${language}/help`);
        await expect(page.locator("#service-page-title")).toBeVisible();
        const header = page.getByRole("banner");
        const toggle = header.locator("button[aria-expanded]:visible");
        const menu = page.locator(desktop ? "#desktop-account-links" : "#mobile-more-menu");
        const notifications = menu.locator(`a[href="/${language}/notifications"]`);
        const messages = menu.locator(`a[href="/${language}/messages"]`);
        await toggle.click();
        await expect(notifications.locator("span[aria-label]")).toHaveText("9");
        if (desktop) {
          await expect(messages.locator("span[aria-label]")).toHaveText("4");
          await expect(toggle.locator("span[aria-label]")).toHaveText("13");
        }
        await expect(menu.locator(`a[href="/${language}/admin"]`)).toBeVisible();

        if (outcome !== "loaded") {
          fixture.holdPrevious();
          const before = fixture.requests.length;
          await page.evaluate(() => window.dispatchEvent(new CustomEvent("rewind:unread-counts-changed", { detail: "all" })));
          await expect.poll(() => fixture.requests.length).toBeGreaterThanOrEqual(before + 2);
        }

        const profile = page.waitForResponse(response => new URL(response.url()).pathname === "/api/users/me"
          && response.request().headers().authorization?.endsWith("6") === true);
        const other = await context.newPage();
        const initialProfile = other.waitForResponse(response => new URL(response.url()).pathname === "/api/users/me"
          && response.request().headers().authorization?.endsWith("7") === true);
        await other.goto("/en/email-action/#rewind_action=signup&type=email&token_hash=fixture-next-account");
        await (await initialProfile).finished();
        await other.getByRole("button", { name: "Confirm email", exact: true }).click();
        await expect(other).toHaveURL(/\/en\/films\/?$/);
        expect((await (await profile).json()).id).toBe(6);
        await expect.poll(() => fixture.requests.filter(request => request.viewer === 6).length).toBeGreaterThanOrEqual(2);
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
        await toggle.click();
        await expect(notifications.locator("span[aria-label]")).toHaveCount(0);
        await expect(menu.locator(`a[href="/${language}/admin"]`)).toHaveCount(0);
        if (desktop) await expect(toggle.locator("span[aria-label]")).toHaveCount(0);

        fixture.releaseNext();
        await expect(notifications.locator("span[aria-label]")).toHaveText("3");
        if (desktop) {
          await expect(messages.locator("span[aria-label]")).toHaveText("2");
          await expect(toggle.locator("span[aria-label]")).toHaveText("5");
        }
        if (outcome !== "loaded") {
          const previous = page.waitForResponse(response => new URL(response.url()).pathname === "/api/notifications/unread-count"
            && response.request().headers().authorization?.endsWith("7") === true);
          fixture.releasePrevious();
          await (await previous).finished();
          await page.waitForLoadState("networkidle");
          await expect(notifications.locator("span[aria-label]")).toHaveText("3");
          if (desktop) await expect(toggle.locator("span[aria-label]")).toHaveText("5");
        }
        await expect(page).toHaveURL(new RegExp(`/${language}/help/?$`));
      } finally {
        fixture.releasePrevious();
        fixture.releaseNext();
      }
    });
  }
}
