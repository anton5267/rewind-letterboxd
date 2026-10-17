import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const publicRoutes = [
  "/uk/home",
  "/en/films",
  "/uk/films/50",
  "/uk/lists/discover",
  "/uk/journal",
  "/uk/about",
  "/en/help",
];

test("public screens keep named controls and mobile layout", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });

  for (const route of publicRoutes) {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();

    const unnamed = await page.locator("a, button, input, textarea, select").evaluateAll(elements => elements
      .filter(element => {
        const style = window.getComputedStyle(element);
        return style.visibility !== "hidden" && style.display !== "none" && element.getBoundingClientRect().width > 0;
      })
      .map(element => {
        const aria = element.getAttribute("aria-label")?.trim();
        const labelledBy = element.getAttribute("aria-labelledby");
        const label = labelledBy ? document.getElementById(labelledBy)?.textContent?.trim() : undefined;
        const parentLabel = element.closest("label")?.textContent?.trim();
        const imageAlt = element.querySelector("img[alt]")?.getAttribute("alt")?.trim();
        const text = element.textContent?.trim();
        return aria || label || parentLabel || imageAlt || text ? null : element.outerHTML.slice(0, 160);
      })
      .filter(Boolean));

    expect(unnamed, `${route} contains unnamed interactive controls`).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${route} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
  }
});

test("static app sends baseline browser security headers", async ({ page }) => {
  const response = await page.goto("/uk/home");
  expect(response).not.toBeNull();
  const headers = response!.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["content-security-policy"]).toContain("object-src 'none'");
});

test("primary public routes have keyboard reachable controls", async ({ page }) => {
  for (const route of ["/uk/home", "/uk/films", "/en/help"]) {
    await page.goto(route);
    const positiveTabIndexes = await page.locator("[tabindex]").evaluateAll(elements => elements
      .filter(element => Number(element.getAttribute("tabindex")) > 0)
      .map(element => element.outerHTML.slice(0, 120)));
    expect(positiveTabIndexes, `${route} contains a positive tabindex`).toEqual([]);

    const controlCount = await page.locator("a, button, input, textarea, select").count();
    expect(controlCount, `${route} has no keyboard controls`).toBeGreaterThan(0);
    for (let index = 0; index < Math.min(controlCount, 8); index++) {
      await page.keyboard.press("Tab");
      const activeIsControl = await page.evaluate(() => document.activeElement?.matches("a, button, input, textarea, select") ?? false);
      expect(activeIsControl, `${route} tab ${index + 1} did not land on a control`).toBe(true);
    }
  }
});

test("public routes expose complete landmarks and image alternatives", async ({ page }) => {
  for (const route of publicRoutes) {
    await page.goto(route);
    const audit = await page.evaluate(() => {
      const headings = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].map(element => Number(element.tagName.slice(1)));
      const imagesWithoutAlt = [...document.images]
        .filter(image => !image.hasAttribute("alt"))
        .map(image => image.outerHTML.slice(0, 120));
      const invalidLinks = [...document.querySelectorAll("a")]
        .filter(link => !link.getAttribute("href"))
        .map(link => link.outerHTML.slice(0, 120));
      return {
        main: document.querySelectorAll("main").length,
        banner: document.querySelectorAll("header").length,
        footer: document.querySelectorAll("footer").length,
        h1: document.querySelectorAll("h1").length,
        headings,
        imagesWithoutAlt,
        invalidLinks,
      };
    });
    expect(audit.main, `${route} should expose one main landmark`).toBe(1);
    expect(audit.banner, `${route} should expose one header`).toBe(1);
    expect(audit.footer, `${route} should expose one footer`).toBe(1);
    expect(audit.h1, `${route} should expose one h1`).toBe(1);
    expect(audit.imagesWithoutAlt, `${route} has images without alt`).toEqual([]);
    expect(audit.invalidLinks, `${route} has links without href`).toEqual([]);
    expect(audit.headings, `${route} skips a heading level`).toEqual(expect.arrayContaining([1]));
    for (let index = 1; index < audit.headings.length; index++) {
      expect(audit.headings[index] - audit.headings[index - 1], `${route} heading jump`).toBeLessThanOrEqual(1);
    }
  }
});

test("public routes pass the WCAG 2 A/AA axe audit", async ({ page }) => {
  for (const route of publicRoutes) {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(results.violations, `${route} has axe violations`).toEqual([]);
  }
});
