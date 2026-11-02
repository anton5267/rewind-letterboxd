import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { cleanupDisposableAccount } from "./helpers";

test("Member Home current READY pair renders live data and recovers its Journal section", async ({ page, baseURL }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = `home${suffix}`;
  const email = `home-${suffix}@example.invalid`;
  const password = "E2e-password-123!";
  let registered = false;
  const evidenceDir = resolve(process.cwd(), "../artifacts/visual-audit-20261102/home-member-current");
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
    await page.route("**/api/journal/articles?**", async route => {
      journalAttempts += 1;
      if (journalAttempts === 1) return route.fulfill({ status: 503, json: {} });
      return route.continue();
    });

    for (const locale of ["uk", "en"] as const) {
      const width = locale === "uk" ? 1440 : 393;
      const height = locale === "uk" ? 5020 : 2463;
      await page.setViewportSize({ width, height });
      await page.goto(`/${locale}/home`);
      const main = page.locator("main");
      await expect(main).toHaveAttribute("aria-busy", "false");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("#home-journal")).toBeVisible();
      await expect(page.locator("#home-recent-news")).toBeVisible();

      if (locale === "uk") {
        const journal = page.locator("#home-journal");
        await expect(journal.getByRole("button", { name: "Спробувати ще", exact: true })).toBeVisible();
        await journal.getByRole("button", { name: "Спробувати ще", exact: true }).click();
        await expect(journal).toHaveAttribute("aria-busy", "false");
        await expect(journal.getByRole("heading", { level: 2 })).toBeFocused();
        await expect(page.locator("#home-recent-news")).toContainText("Новин журналу поки немає.");
        expect(journalAttempts).toBe(2);
        recoveryAttempts = journalAttempts;
      }

      await page.evaluate(() => window.scrollTo(0, 0));

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${locale} Home must not overflow at ${width}px`).toBeLessThanOrEqual(0);

      const measured = await page.evaluate(() => {
        const headingY = (id: string) => document.querySelector<HTMLElement>(`#${id} h2`)?.getBoundingClientRect().top! + window.scrollY;
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
      if (locale === "uk") {
        expect(measured.anchors.newest).toBeCloseTo(1049, 0);
        expect(measured.anchors.popular).toBeCloseTo(1487, 0);
        expect(measured.anchors.journal).toBeCloseTo(1927, 0);
        expect(measured.anchors.reviews).toBeCloseTo(2300, 0);
      }

      if (locale === "uk") {
        await page.screenshot({ path: resolve(evidenceDir, `member-home-${width}.png`), fullPage: true });
      } else {
        await page.screenshot({ path: resolve(evidenceDir, `member-home-${width}.png`), fullPage: true });
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
        "Home feeds use live API responses. Journal's first request returned controlled 503; Retry continued to the live API.",
        "Captured live data and empty Journal state differ from Figma's illustrative samples.",
      ],
    }, null, 2));
  } finally {
    if (registered) await cleanupDisposableAccount(baseURL, email, password);
  }
});
