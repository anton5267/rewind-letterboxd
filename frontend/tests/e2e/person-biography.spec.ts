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

test("READY James Cameron biography frames collapse and expand on mobile", async ({ page }) => {
  const longBiography = [
    "James Francis Cameron (born August 16, 1954) is a Canadian filmmaker. He is a major figure in the post-New Hollywood era and often uses novel technologies with a classical filmmaking style. Cameron first gained recognition for writing and directing The Terminator (1984), and found further success with Aliens (1986), The Abyss (1989), Terminator 2: Judgment Day (1991), and True Lies (1994), as well as Avatar (2009) and its sequels.",
    "Cameron co-founded the production companies Lightstorm Entertainment, Digital Domain, and Earthship Productions. In addition to filmmaking, he is a National Geographic explorer-in-residence. He has produced many documentaries on deep-ocean exploration, including Ghosts of the Abyss (2003) and Aliens of the Deep (2005). Cameron has also contributed to underwater filming and remote vehicle technologies and helped create the digital 3D Fusion Camera System. In 2012, Cameron became the first person to solo descend the Mariana Trench in the Deepsea Challenger submersible.",
    "Cameron's films have grossed over $8 billion worldwide, making him the second-highest-grossing film director. Three of Cameron's films are among the top four highest-grossing films of all time: Avatar, Avatar: The Way of Water, and Titanic. In 2010, Time named Cameron one of the 100 most influential people in the world. Cameron is also an environmentalist and runs several sustainability businesses.",
  ].join("\n\n");
  const films = Array.from({ length: 12 }, (_, index) => ({
    id: 950000 + index, title: `Cameron film ${index + 1}`, releaseDate: "2022-01-01", rating: null, photoUrl: null,
  }));
  await page.route("**/api/directors/19?*", route => route.fulfill({ json: {
    id: 19, name: "James Cameron", type: "DIRECTOR", photoUrl: null,
    biography: longBiography, biographyLanguage: "en", films,
    relatedPeople: [{ id: 19, name: "James Cameron", type: "PRODUCER", films }, { id: 19, name: "James Cameron", type: "WRITER", films }],
  } }));
  await page.route("**/api/genres", route => route.fulfill({ json: [] }));
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/uk/people/director/19");
  const biographyText = page.locator("#person-biography");
  const more = page.getByRole("button", { name: "Більше", exact: true });
  await expect(page.getByRole("heading", { name: "James Cameron", level: 1 })).toBeVisible();
  await expect(biographyText).toHaveAttribute("lang", "en");
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByText("Біографія доступна англійською.", { exact: true })).toBeVisible();
  const collapsedHeight = (await biographyText.boundingBox())!.height;
  expect(collapsedHeight).toBeLessThanOrEqual(44);
  await expect(page.getByRole("heading", { name: "Режисерські роботи", level: 2 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/people/rewind-james-cameron-biography-collapsed-uk-mobile-393.png", fullPage: true });

  await more.click();
  const less = page.getByRole("button", { name: "Менше", exact: true });
  await expect(less).toHaveAttribute("aria-expanded", "true");
  expect((await biographyText.boundingBox())!.height).toBeGreaterThan(collapsedHeight * 3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await page.screenshot({ path: "../artifacts/visual-audit-20261124/people/rewind-james-cameron-biography-expanded-uk-mobile-393.png", fullPage: true });
});
