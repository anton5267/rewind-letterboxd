import { expect, test } from "@playwright/test";

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
