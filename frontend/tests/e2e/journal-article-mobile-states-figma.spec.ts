import { expect, test } from "@playwright/test";

test("mobile Journal article loading skeleton matches the UK and EN Figma drafts", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  for (const locale of ["en", "uk"] as const) {
    let release!: () => void;
    let signal!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const requested = new Promise<void>(resolve => { signal = resolve; });
    await page.route(`**/api/journal/articles/article-state-${locale}?*`, async route => {
      signal();
      await gate;
      return route.fulfill({ json: { id: 1, slug: `article-state-${locale}`, language: locale, category: "NEWS", title: "Article", content: "Body", coverUrl: null } });
    });
    await page.goto(`/${locale}/journal/article-state-${locale}`);
    await requested;
    expect(await page.locator("main").evaluate(element => getComputedStyle(element).backgroundColor)).toBe("rgb(18, 18, 18)");
    const toolbar = page.locator("[class*='mobileToolbar'] [class*='skeletonLine']");
    const lines = page.locator("[class*='articleLead'] [class*='skeletonLine']");
    const cover = page.locator("[class*='articleLead'] + [class*='coverHero']");
    const rect = async (locator: typeof toolbar) => locator.boundingBox();
    expect(await page.locator("header nav[class*='mobileNav']").boundingBox()).toMatchObject({ x: 0, y: 760, width: 393, height: 92 });
    expect(await rect(toolbar)).toMatchObject({ x: 174, y: 92, width: 45, height: 20 });
    expect(await rect(lines.nth(0))).toMatchObject({ x: 16, y: 148, width: 140, height: 20 });
    expect(await rect(lines.nth(1))).toMatchObject({ x: 16, y: 186, width: 306, height: 65 });
    expect(await rect(lines.nth(2))).toMatchObject({ x: 16, y: 273, width: 210, height: 20 });
    expect(await rect(cover)).toMatchObject({ x: 16, y: 368, width: 361, height: 206 });
    await page.screenshot({ path: `../artifacts/visual-audit-20261125/journal/article-loading-${locale}-393.png` });
    release();
    await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  }
});

test("mobile Journal article error follows the localized UK and EN Figma drafts", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.route("**/api/journal/articles/article-error-*?*", route => route.fulfill({ status: 503, json: {} }));
  for (const locale of ["en", "uk"] as const) {
    await page.goto(`/${locale}/journal/article-error-${locale}`);
    const english = locale === "en";
    const title = page.getByRole("heading", { name: english ? "Journal" : "Журнал", level: 1 });
    const error = page.getByRole("alert");
    const retry = error.getByRole("button", { name: english ? "Retry" : "Спробувати ще" });
    const breadcrumb = page.getByRole("link", { name: english ? "Journal" : "Журнал" }).last();
    const rect = async (locator: typeof title) => locator.boundingBox();
    await expect(title).toBeVisible();
    await expect(error).toContainText(english ? "Could not load the journal." : "Не вдалося завантажити журнал.");
    expect(await page.locator("main").evaluate(element => getComputedStyle(element).backgroundColor)).toBe("rgb(18, 18, 18)");
    const menu = page.locator("header button[class*='menuToggle']");
    expect(await menu.boundingBox()).toMatchObject({ x: 337, y: 11, width: 40, height: 40 });
    await expect(menu.locator("i")).toBeVisible();
    expect(await page.locator("header nav[class*='mobileNav']").boundingBox()).toMatchObject({ x: 0, y: 760, width: 393, height: 92 });
    expect(await rect(title)).toMatchObject({ x: 16, y: 80, width: 361, height: 40 });
    expect(await rect(error)).toMatchObject({ x: 16, y: 142, width: 361, height: 168 });
    expect(await rect(retry)).toMatchObject({ x: 34, y: 212, width: 138, height: 44 });
    expect(await rect(breadcrumb)).toMatchObject({ x: 34, y: 329, height: 24 });
    await page.screenshot({ path: `../artifacts/visual-audit-20261125/journal/article-error-${locale}-393.png` });
  }
});
