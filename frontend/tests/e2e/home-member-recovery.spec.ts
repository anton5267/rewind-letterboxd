import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { cleanupDisposableAccount } from "./helpers";

test("Member Home renders live feeds once and recovers its Journal section", async ({ page, baseURL }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = `home${suffix}`;
  const email = `home-${suffix}@example.invalid`;
  const password = "E2e-password-123!";
  let registered = false;
  const evidenceDir = resolve(process.cwd(), "../artifacts/visual-audit-20261104/home-empty-feeds");
  mkdirSync(evidenceDir, { recursive: true });
  const measurements: Record<string, unknown> = {};

  try {
    await page.goto("/en/register");
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    const registration = page.waitForResponse(response => response.url().endsWith("/api/auth/register") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Create your account" }).click();
    expect((await registration).status()).toBe(200);
    registered = true;
    await expect(page.getByRole("heading", { name: /Account created/i })).toBeVisible();

    await page.getByRole("button", { name: "Go to login" }).click();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/en\/films$/);

    let journalAttempts = 0;
    let recoveryAttempts = 0;
    const emptyJournal = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    await page.route(/\/api\/journal\/articles(?:\?.*)?$/, async route => {
      journalAttempts += 1;
      if (journalAttempts === 1 || journalAttempts === 3) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({ json: emptyJournal });
    });

    for (const locale of ["uk", "en"] as const) {
      const width = locale === "uk" ? 1440 : 393;
      const height = locale === "uk" ? 900 : 852;
      await page.setViewportSize({ width, height });
      await page.goto(`/${locale}/home`);
      const main = page.locator("main");
      await expect(main).toHaveAttribute("aria-busy", "false");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const journal = page.locator("#home-recent-news");
      await expect(page.locator("#home-journal")).toHaveCount(0);
      await expect.poll(async () => {
        if (await journal.count() === 0) return true;
        return await journal.locator("article").count() > 0
          || await journal.getByRole("button", { name: /Retry|Спробувати ще/ }).count() > 0;
      }).toBe(true);

      const retryLabel = locale === "uk" ? "Спробувати ще" : "Retry";
      const emptyText = locale === "uk" ? "Новин журналу поки немає." : "No journal updates yet.";
      await expect(journal.getByRole("button", { name: retryLabel, exact: true })).toBeVisible();
      await journal.getByRole("button", { name: retryLabel, exact: true }).click();
      await expect(journal).toHaveAttribute("aria-busy", "false");
      await expect(journal.getByRole("heading", { level: 2 })).toBeFocused();
      await expect(journal).toContainText(emptyText);
      const emptyStatus = journal.locator("p").filter({ hasText: emptyText });
      await expect(emptyStatus).toHaveCSS("min-height", "0px");
      await expect(emptyStatus).toHaveCSS("background-image", "none");
      await expect(journal.locator("article")).toHaveCount(0);
      expect(journalAttempts).toBe(locale === "uk" ? 2 : 4);
      recoveryAttempts = journalAttempts;

      await page.evaluate(() => window.scrollTo(0, 0));

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${locale} Home must not overflow at ${width}px`).toBeLessThanOrEqual(0);

      const measured = await page.evaluate(() => {
        const headingY = (id: string) => {
          const heading = document.querySelector<HTMLElement>(`#${id} h2`);
          return heading ? heading.getBoundingClientRect().top + window.scrollY : null;
        };
        return {
          viewport: { width: window.innerWidth, height: window.innerHeight },
          document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
          heroHeight: document.querySelector<HTMLElement>("main > section")?.getBoundingClientRect().height,
          anchors: {
            newest: headingY("home-newest"),
            popular: headingY("home-popular"),
            journal: headingY("home-journal"),
            reviews: headingY("home-reviews"),
            lists: headingY("home-lists"),
            recentNews: headingY("home-recent-news"),
          },
        };
      });
      measurements[`${locale}-${width}`] = measured;
      const populatedAnchors = Object.values(measured.anchors).filter((value): value is number => typeof value === "number");
      expect(populatedAnchors).toEqual([...populatedAnchors].sort((a, b) => a - b));

      if (locale === "uk") {
        await page.screenshot({ path: resolve(evidenceDir, `home-member-${locale}-${width}.png`), fullPage: true });
      } else {
        await page.screenshot({ path: resolve(evidenceDir, `home-member-${locale}-${width}.png`), fullPage: true });
      }
    }

    for (const width of [320, 600, 720, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/en/home");
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      const hero = page.locator("main > section").first();
      await expect(hero).toHaveCSS("min-height", width < 768 ? "320px" : "948px");
      if (width < 768) await expect(page.locator("#home-newest h2")).toHaveCSS("font-size", "16px");
    }

    writeFileSync(resolve(evidenceDir, "member-home-responsive.json"), JSON.stringify({
      frames: { desktop: "473:492", phone: "1327:3210" },
      routes: ["/uk/home", "/en/home"],
      journalErrorRetries: recoveryAttempts,
      measurements,
      notes: [
        "Disposable USER registration and removal; no profile content or film actions were created.",
        "Home feeds use live API responses. Successful empty feeds are omitted; errors and feeds containing real data remain visible.",
        "The first UK and EN Journal requests returned controlled 503; Retry returned a controlled empty response, kept the status reachable for assistive technology, and rendered no decorative placeholder cards.",
      ],
    }, null, 2));
  } finally {
    if (registered) await cleanupDisposableAccount(baseURL, email, password);
  }
});
