import { expect, test } from "@playwright/test";

const biography = Array.from(
  { length: 12 },
  (_, index) =>
    `Biography paragraph ${
      index + 1
    }. A filmmaker whose published work spans acting, directing and producing. This text comes from the configured metadata provider.`,
).join("\n\n") + "\n\n<b>Text remains plain.</b>";

for (const lang of ["uk", "en"] as const) {
  test(
    `person biography expands, collapses and preserves localized fallback information in ${lang}`,
    async ({ page }, testInfo) => {
      const languages: string[] = [];
      let localized = false;
      await page.route(
        (url) => url.pathname.startsWith("/api/"),
        async (route) => {
          const url = new URL(route.request().url());
          if (
            url.pathname === "/api/users/me" ||
            url.pathname === "/api/auth/refresh"
          ) return route.fulfill({ status: 401, json: {} });
          if (url.pathname === "/api/genres") {
            return route.fulfill({ json: [] });
          }
          if (url.pathname === "/api/actors/85") {
            languages.push(url.searchParams.get("language") ?? "");
            return route.fulfill({
              json: {
                id: 85,
                name: "Person fixture",
                type: "ACTOR",
                photoUrl: null,
                biography: localized
                  ? "Локалізована біографія. ".repeat(80)
                  : biography,
                biographyLanguage: localized ? "uk" : "en",
                films: [{
                  id: 7,
                  title: "A published film",
                  releaseDate: "2025-01-01",
                  rating: null,
                  photoUrl: null,
                  characterName: null,
                }],
              },
            });
          }
          if (url.pathname === "/api/actors/86") {
            return route.fulfill({
              json: {
                id: 86,
                name: "Another person",
                type: "ACTOR",
                photoUrl: null,
                biography: "Short biography.",
                biographyLanguage: "en",
                films: [],
              },
            });
          }
          return route.fulfill({
            json: { content: [], totalPages: 0, totalElements: 0, number: 0 },
          });
        },
      );
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`/${lang}/people/actor/85`);
      const text = page.locator("#person-biography");
      const more = page.getByRole("button", {
        name: lang === "uk" ? "Більше" : "More",
        exact: true,
      });
      const less = page.getByRole("button", {
        name: lang === "uk" ? "Менше" : "Less",
        exact: true,
      });
      await expect(more).toBeVisible();
      expect(languages).toEqual([lang]);
      await expect(text).toHaveAttribute("lang", "en");
      await expect(text.locator("b")).toHaveCount(0);
      await expect(text).toContainText("<b>Text remains plain.</b>");
      const desktop = await text.boundingBox();
      expect(desktop?.width).toBe(535);
      expect(desktop?.height).toBeLessThanOrEqual(97);
      if (lang === "uk") {
        await expect(
          page.getByText("Біографія доступна англійською.", { exact: true }),
        ).toBeVisible();
      }
      await more.focus();
      await more.press("Enter");
      await expect(less).toHaveAttribute("aria-expanded", "true");
      await expect(less).toBeFocused();
      expect((await text.boundingBox())!.height).toBeGreaterThan(200);
      const filmography = page.locator(
        'section[aria-labelledby="filmography-title"]',
      );
      expect((await filmography.boundingBox())!.y).toBeGreaterThan(
        (await text.boundingBox())!.y + (await text.boundingBox())!.height,
      );
      await less.press("Enter");
      await expect(more).toBeFocused();
      await expect(more).toHaveAttribute("aria-expanded", "false");
      await page.screenshot({
        path: testInfo.outputPath(`biography-${lang}-1440.png`),
        fullPage: true,
      });

      await page.setViewportSize({ width: 393, height: 844 });
      const phone = await text.boundingBox();
      expect(phone?.width).toBe(325);
      expect(phone?.height).toBeLessThanOrEqual(44);
      expect((await more.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await more.press("Enter");
      await expect(less).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath(`biography-${lang}-393-expanded.png`),
        fullPage: true,
      });
      await less.press("Enter");
      await expect(more).toBeFocused();
      await page.setViewportSize({ width: 320, height: 844 });
      await expect.poll(() =>
        page.evaluate(() =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
        )
      ).toBeLessThanOrEqual(1);
      if (lang === "uk") {
        localized = true;
        await page.getByRole("button", { name: "Фільтри", exact: true })
          .click();
        await page.getByRole("combobox", { name: "Сортувати", exact: true })
          .selectOption("oldest");
        await expect(text).toHaveAttribute("lang", "uk");
        await expect(
          page.getByText("Біографія доступна англійською.", { exact: true }),
        ).toHaveCount(0);
      }
      await page.evaluate((language) => {
        window.history.pushState({}, "", `/${language}/people/actor/86`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }, lang);
      await expect(
        page.getByRole("heading", { name: "Another person", exact: true }),
      ).toBeVisible();
      await expect(text).toHaveText("Short biography.");
      await expect(more).toHaveCount(0);
      await expect(less).toHaveCount(0);
    },
  );
}
