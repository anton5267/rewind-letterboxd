import { expect, test } from "@playwright/test";

test("non-writer film links expose the detailed crew jobs supplied by Edge", async ({ page }) => {
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/producers/159") {
      return route.fulfill({ json: {
        id: 159,
        name: "Adam Sidman",
        photoUrl: null,
        type: "PRODUCER",
        tmdbId: 1347824,
        careerJobs: ["Executive Producer", "Unit Production Manager"],
        films: [{
          id: 3501,
          title: "War of the Worlds",
          releaseDate: "2025-07-29",
          rating: 3.8,
          photoUrl: null,
          characterName: null,
          crewCredits: [
            { department: "Production", job: "Executive Producer" },
            { department: "Production", job: "Unit Production Manager" },
          ],
        }],
      } });
    }
    if (pathname === "/api/genres") return route.fulfill({ json: [] });
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0 } });
  });

  await page.goto("/en/people/producer/159");
  await expect(page.getByRole("heading", { level: 1, name: "Adam Sidman" })).toBeVisible();
  await expect(page.getByLabel("Credits", { exact: true })).toHaveCount(0);
  for (const width of [393, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const nameBox = await page.getByRole("heading", { level: 1, name: "Adam Sidman" }).boundingBox();
    const summary = page.getByTestId("person-role-summary");
    await expect(summary).toHaveText("Producer | Executive");
    expect(await summary.ariaSnapshot()).toContain("Producer | Executive");
    const summaryBox = await summary.boundingBox();
    expect(nameBox).not.toBeNull();
    expect(summaryBox).not.toBeNull();
    expect(nameBox!.y + nameBox!.height).toBeLessThan(summaryBox!.y);
  }
  const section = page.locator('section[aria-labelledby="filmography-title"]');
  const filmLink = section.getByRole("link", { name: /War of the Worlds/ });
  await expect(filmLink).toBeVisible();
  await expect(filmLink).toHaveAccessibleName(/2025.*Executive Producer, Unit Production Manager.*Rating: 3\.8/);
});

test("person role summary combines related roles with the executive job shown in the Figma source", async ({ page }) => {
  const backdropUrl = "https://image.tmdb.org/t/p/original/housemaid-backdrop.jpg";
  await page.route("https://image.tmdb.org/**", route => route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#345"/></svg>',
    }));
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/actors/11") {
      const language = new URL(route.request().url()).searchParams.get("language");
      return route.fulfill({ json: {
        id: 11,
        name: "Amanda Seyfried",
        photoUrl: null,
        type: "ACTOR",
        relatedPeople: [{ id: 111, type: "PRODUCER" }],
        tmdbId: 71070,
        biography: language === "uk" ? "Коротка біографія Аманди." : "A short Amanda biography.",
        biographyLanguage: language,
        careerJobs: ["Executive Producer"],
        films: [{
          id: 12,
          title: "The Housemaid",
          releaseDate: "2025-12-19",
          rating: 4.2,
          photoUrl: null,
          characterName: null,
          crewCredits: [{ department: "Production", job: "Executive Producer" }],
        }],
      } });
    }
    if (pathname === "/api/movies/12/details") return route.fulfill({ json: { backdropUrl } });
    if (pathname === "/api/genres") return route.fulfill({ json: [] });
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0 } });
  });

  for (const [locale, expected] of [
    ["en", "Actor | Producer | Executive"],
    ["uk", "Актор | Продюсер | Виконавчий продюсер"],
  ] as const) {
    await page.goto(`/${locale}/people/actor/11`);
    await expect(page.getByRole("heading", { level: 1, name: "Amanda Seyfried" })).toBeVisible();
    const summary = page.getByTestId("person-role-summary");
    await expect(summary).toHaveText(expected);
    expect(await summary.ariaSnapshot()).toContain(expected);
    await expect(page.getByLabel(locale === "uk" ? "Ролі" : "Credits", { exact: true })).toHaveCount(0);
    const filmLink = page.locator('section[aria-labelledby="filmography-title"]')
      .getByRole("link", { name: /The Housemaid/ });
    await expect(filmLink).toBeVisible();
    await expect(filmLink).toHaveAccessibleName(locale === "uk"
      ? /Executive Producer.*Рейтинг: 4,2/
      : /Executive Producer.*Rating: 4\.2/);
    for (const width of [320, 393, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const nameBox = await page.getByRole("heading", { level: 1, name: "Amanda Seyfried" }).boundingBox();
      const summaryBox = await page.getByTestId("person-role-summary").boundingBox();
      const biographyBox = await page.locator("#person-biography").boundingBox();
      expect(nameBox).not.toBeNull();
      expect(summaryBox).not.toBeNull();
      expect(biographyBox).not.toBeNull();
      expect(nameBox!.y + nameBox!.height).toBeLessThan(summaryBox!.y);
      expect(summaryBox!.y + summaryBox!.height).toBeLessThan(biographyBox!.y);
      await expect.poll(() => page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      )).toBeLessThanOrEqual(1);
    }
    await page.setViewportSize({ width: 393, height: 852 });
    const backdrop = page.locator('section img[aria-hidden="true"][alt=""]');
    await expect(backdrop).toHaveAttribute("src", backdropUrl);
    await expect(backdrop).toBeVisible();
  }
});
