import { expect, test } from "@playwright/test";

test("Journal feed Retry stays focused after a repeated failure and focuses content after recovery", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/journal/articles**", async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith("/archive")) return route.fulfill({ json: [] });
    attempts++;
    if (attempts < 3) return route.fulfill({ status: 503, json: {} });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } });
  });

  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/journal");
  await expect(page.getByRole("alert")).toContainText("Не вдалося завантажити журнал.");
  const retry = page.getByRole("alert").getByRole("button", { name: "Спробувати ще" });
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(() => attempts).toBe(2);
  const repeated = page.getByRole("alert").getByRole("button", { name: "Спробувати ще" });
  await expect(repeated).toBeFocused();
  await repeated.press("Enter");
  await expect.poll(() => attempts).toBe(3);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator('section[aria-labelledby="journal-content-title"]')).toBeFocused();
});

test("Journal archive Retry stays focused after a repeated failure and focuses the archive title after recovery", async ({ page }) => {
  let archiveAttempts = 0;
  await page.route("**/api/journal/articles**", async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (!pathname.endsWith("/archive")) return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } });
    archiveAttempts++;
    if (archiveAttempts < 3) return route.fulfill({ status: 503, json: {} });
    return route.fulfill({ json: [] });
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en/journal");
  const archive = page.locator("aside[aria-labelledby='journal-archive-title']");
  const retry = archive.getByRole("button", { name: "Retry" });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect.poll(() => archiveAttempts).toBe(2);
  const repeated = archive.getByRole("button", { name: "Retry" });
  await expect(repeated).toBeFocused();
  await repeated.press("Enter");
  await expect.poll(() => archiveAttempts).toBe(3);
  const pageTitle = page.getByRole("heading", { name: "Journal", level: 1 });
  await expect(pageTitle).toBeFocused();
  await expect(pageTitle).toHaveCSS("outline-style", "solid");
});
