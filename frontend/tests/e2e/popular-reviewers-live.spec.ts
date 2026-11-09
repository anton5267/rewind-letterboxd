import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

type Reviewer = {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  likes: number;
  reviewCount: number | null;
  watchedCount: number | null;
  listCount: number | null;
};

const evidenceDir = path.resolve(process.cwd(), "..", "artifacts", "visual-audit-20261104", "popular-reviewers-live");
mkdirSync(evidenceDir, { recursive: true });

test("Popular reviewers renders live API members and metrics on desktop and phone widths", async ({ page }, testInfo) => {
  const response = await page.request.get("/api/users/popular-reviewers?size=10");
  expect(response.ok()).toBe(true);
  const reviewers = await response.json() as Reviewer[];
  expect(reviewers.length).toBeGreaterThan(0);
  expect(reviewers.length).toBeLessThanOrEqual(10);

  const mobileProject = /Android|iOS/i.test(testInfo.project.name);
  const scenarios = mobileProject
    ? [
      { lang: "uk", width: 320, height: 852 },
      { lang: "en", width: 393, height: 852 },
    ]
    : [
      { lang: "uk", width: 1440, height: 1000 },
      { lang: "en", width: 393, height: 852 },
    ];

  for (const scenario of scenarios) {
    await page.setViewportSize({ width: scenario.width, height: scenario.height });
    await page.goto(`/${scenario.lang}/community/reviewers`);
    await expect(page.locator("html")).toHaveAttribute("lang", scenario.lang);

    const heading = page.getByRole("heading", { level: 1, name: scenario.lang === "uk" ? "Популярні рецензенти" : "Popular reviewers" });
    await expect(heading).toBeVisible();
    const list = page.locator("#reviewer-list");
    await expect(list.locator(":scope > li")).toHaveCount(reviewers.length);

    for (const reviewer of reviewers) {
      const row = list.locator(":scope > li").filter({ has: page.locator(`a[href='/${scenario.lang}/users/${reviewer.id}']`) });
      await expect(row).toBeVisible();
      await expect(row.getByRole("link", { name: reviewer.displayName?.trim() || `@${reviewer.username}`, exact: true })).toBeVisible();
      await expect.poll(async () => {
        if (await row.locator("[class*=avatarFallback]").isVisible().catch(() => false)) return true;
        const avatar = row.locator("img").first();
        return (await avatar.count()) > 0 && avatar.evaluate(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0);
      }).toBe(true);

      if (scenario.width >= 768 && reviewer.reviewCount != null && reviewer.watchedCount != null && reviewer.listCount != null) {
        const metrics = row.getByRole("group", { name: scenario.lang === "uk" ? "Статистика рецензента" : "Reviewer statistics" });
        await expect(metrics).toBeVisible();
        await expect(metrics).toContainText(String(reviewer.watchedCount));
        await expect(metrics).toContainText(String(reviewer.listCount));
        await expect(metrics).toContainText(String(reviewer.likes));
      } else if (reviewer.reviewCount != null) {
        await expect(row.locator("[class*=userCopy] > span").first()).toContainText(String(reviewer.reviewCount));
      }

      await expect(row.getByRole("link", { name: new RegExp(scenario.lang === "uk" ? "Підписатися" : "Follow") })).toHaveAttribute("href", `/${scenario.lang}/login`);
    }

    await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(scenario.width);
    const projectSuffix = mobileProject ? `-${testInfo.project.name.startsWith("Android") ? "android" : "ios"}` : "";
    await page.screenshot({ path: path.join(evidenceDir, `popular-reviewers-live${projectSuffix}-${scenario.lang}-${scenario.width}.png`), fullPage: true });
  }
});
