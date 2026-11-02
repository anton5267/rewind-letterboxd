import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const emptyResponse = {
  films: { content: [], number: 0, size: 6, totalElements: 0, totalPages: 0 },
  users: { content: [], totalElements: 0 },
  lists: { content: [], totalElements: 0 },
  tags: [],
  people: [],
  reviews: { content: [], totalElements: 0 },
  journal: { content: [], totalElements: 0 },
};

async function useEmptySearch(page: Page) {
  await page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/search/global") return route.fulfill({ json: emptyResponse });
    if (url.pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    return route.fulfill({ status: 404, json: {} });
  });
}

const cases = [
  { locale: "uk", width: 393, height: 852, heading: "За вашим запитом нічого не знайдено", home: "На головну" },
  { locale: "en", width: 393, height: 852, heading: "There were no matches for your search term", home: "Back to home" },
  { locale: "uk", width: 1440, height: 1039, heading: "За вашим запитом нічого не знайдено", home: "На головну" },
  { locale: "en", width: 1440, height: 1039, heading: "There were no matches for your search term", home: "Back to home" },
];

test("search no-match state follows current desktop and phone READY frames", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await useEmptySearch(page);
  const evidenceDir = resolve(process.cwd(), "../artifacts/visual-audit-20261102/search-empty-current");
  const runtime = (process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000").includes(":5173") ? "source-vite" : "docker";
  const runtimeDir = resolve(evidenceDir, runtime);
  mkdirSync(runtimeDir, { recursive: true });
  const measurements = [] as Array<Record<string, unknown>>;

  for (const item of cases) {
    await test.step(`${item.locale} ${item.width}px`, async () => {
      await page.setViewportSize({ width: item.width, height: item.height });
      await page.goto(`/${item.locale}/search?q=dune123`);
      const main = page.getByRole("main");
      await expect(main).toHaveAttribute("aria-busy", "false");
      const empty = main.locator('section[class*="noMatches"]');
      const heading = empty.getByRole("heading", { name: item.heading });
      const action = empty.getByRole("link", { name: item.home, exact: true });
      await expect(heading).toBeVisible();
      await expect(action).toBeVisible();

      const sectionBox = await empty.boundingBox();
      const headingBox = await heading.boundingBox();
      const descriptionBox = await empty.locator(":scope > p:not([class*=sectionKicker])").boundingBox();
      const actionBox = await action.boundingBox();
      const pageBox = await main.boundingBox();
      const footerBox = await page.locator("footer").first().boundingBox();
      const visibleAction = await action.evaluate(element => {
        const style = getComputedStyle(element, "::before");
        return { top: Number.parseFloat(style.top), height: Number.parseFloat(style.height) };
      });
      measurements.push({ locale: item.locale, width: item.width, documentWidth: await page.evaluate(() => document.documentElement.scrollWidth), documentHeight: await page.evaluate(() => document.documentElement.scrollHeight), pageBox, footerBox, sectionBox, headingBox, descriptionBox, actionBox, visibleAction });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

      if (item.width === 393) {
        expect(headingBox?.y).toBeCloseTo(342.5, 0);
        expect(actionBox?.y).toBeCloseTo(477.5, 0);
        expect(actionBox?.height).toBe(44);
        expect(visibleAction).toEqual({ top: 0, height: 32 });
      }
      if (item.locale === "en" && item.width === 1440) {
        expect(headingBox?.y).toBeCloseTo(377, 0);
        expect((headingBox?.x ?? 0) + (headingBox?.width ?? 0) / 2).toBeCloseTo(720, 0);
        expect(headingBox?.height).toBeCloseTo(130, 0);
        expect(Math.abs((actionBox?.y ?? 0) - 610)).toBeLessThan(2);
        expect(footerBox?.y).toBeCloseTo(774, 0);
      }

      await page.screenshot({ path: resolve(runtimeDir, `runtime-search-empty-${item.width}-${item.locale}.png`), fullPage: item.width >= 1024 });

      await action.focus();
      await expect(action).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`/${item.locale}/home$`));
    });
  }

  for (const locale of ["uk", "en"]) {
    for (const width of [320, 393, 600, 720, 768, 1024, 1440]) {
      await test.step(`no-match overflow ${locale} ${width}px`, async () => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}/search?q=dune123`);
        await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      });
    }
  }

  const json = JSON.stringify({ frames: { desktop: "1480:5809", phone: "1480:8856" }, measurements }, null, 2);
  writeFileSync(resolve(runtimeDir, "search-empty-responsive.json"), json);
  await testInfo.attach("search-empty-measurements.json", { body: json, contentType: "application/json" });
});
