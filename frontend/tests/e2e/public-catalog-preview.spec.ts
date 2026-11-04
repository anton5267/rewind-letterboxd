import { expect, test } from "@playwright/test";

test("read-only catalogue works on GitHub Pages path on a phone-sized viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  const homeResponse = await page.request.get("/rewind-letterboxd/uk/home/");
  expect(homeResponse.status()).toBe(200);
  expect(homeResponse.headers()["content-type"]).toContain("text/html");
  expect(await homeResponse.text()).toContain("<title>Каталог фільмів | REWIND</title>");

  const sitemapResponse = await page.request.get("/rewind-letterboxd/sitemap.xml");
  expect(sitemapResponse.status()).toBe(200);
  const sitemap = await sitemapResponse.text();
  const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  expect(sitemapUrls.length).toBeGreaterThan(6);
  expect(new Set(sitemapUrls).size).toBe(sitemapUrls.length);
  expect(sitemapUrls).toContain("https://anton5267.github.io/rewind-letterboxd/uk/films/33/");
  expect(sitemapUrls).toContain("https://anton5267.github.io/rewind-letterboxd/en/people/actor/286/");

  const robotsResponse = await page.request.get("/rewind-letterboxd/robots.txt");
  expect(robotsResponse.status()).toBe(200);
  expect(await robotsResponse.text()).toContain("Sitemap: https://anton5267.github.io/rewind-letterboxd/sitemap.xml");

  await page.goto("/rewind-letterboxd/uk/home/");
  await expect(page.locator('link[href*="font-awesome"]')).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Відкрий своє наступне кіно" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("link", { name: /The Wrecking Crew/ })).toBeVisible();
  await page.getByLabel("Рік випуску").fill("2026");
  await page.getByLabel("Мін. рейтинг").selectOption("4");
  await expect(page.getByRole("link", { name: /Send Help/ })).toBeVisible();
  await page.getByLabel("Мін. рейтинг").selectOption("");
  await page.getByLabel("Рік випуску").fill("");
  await page.getByLabel("Усі жанри").selectOption({ label: "Бойовик" });
  await expect(page.getByRole("link", { name: /The Running Man/ })).toBeVisible();

  await page.getByLabel("Назва фільму").fill("The Running Man");
  await page.getByRole("button", { name: "Знайти" }).click();
  const film = page.getByRole("link", { name: /The Running Man/ });
  await expect(film).toBeVisible();
  const movieUrl = await film.getAttribute("href");
  expect(movieUrl).toBeTruthy();
  expect(movieUrl).toMatch(/\/$/);
  const movieResponse = await page.request.get(movieUrl!);
  expect(movieResponse.status()).toBe(200);
  expect(await movieResponse.text()).toContain("<title>The Running Man (2025) | REWIND</title>");
  await film.click();
  await expect(page.getByRole("heading", { name: "The Running Man" })).toBeVisible();
  await expect(page.getByText("Бойовик", { exact: true })).toBeVisible();
  await expect(page.getByText("133 хв", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "У ролях" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Зовнішні рейтинги" })).toBeVisible();
  await expect(page.getByText("TMDB:", { exact: false }).first()).toBeVisible();
  const actorLink = page.getByRole("heading", { name: "У ролях" }).locator("..")
    .getByRole("link").first();
  const actorName = (await actorLink.textContent())?.trim();
  const actorUrl = await actorLink.getAttribute("href");
  expect(actorUrl).toBeTruthy();
  expect(actorUrl).toMatch(/\/$/);
  const actorResponse = await page.request.get(actorUrl!);
  expect(actorResponse.status()).toBe(200);
  expect(await actorResponse.text()).toContain('rel="canonical"');
  await actorLink.click();
  await expect(page.getByRole("heading", { name: actorName })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Фільми за участі" })).toBeVisible();
  await expect(page.getByRole("link", { name: /The Running Man/ })).toBeVisible();
  await page.getByRole("link", { name: "REWIND" }).click();
  await page.getByRole("button", { name: "Люди" }).click();
  const peopleSearch = page.getByPlaceholder("Ім’я актора чи режисера");
  await expect(peopleSearch).toHaveAttribute("maxlength", "100");
  await peopleSearch.fill("Rachel McAdams");
  await page.getByRole("button", { name: "Знайти" }).click();
  const person = page.getByRole("link", { name: /Rachel McAdams/ });
  await expect(person).toContainText("Актори");
  await person.click();
  await expect(page.getByRole("heading", { name: "Rachel McAdams" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Фільми за участі" })).toBeVisible();
  await page.getByRole("link", { name: "REWIND" }).click();
  const englishHomeResponse = await page.request.get("/rewind-letterboxd/en/home/");
  expect(englishHomeResponse.status()).toBe(200);
  expect(await englishHomeResponse.text()).toContain("<title>Film catalogue | REWIND</title>");
  await page.getByRole("link", { name: "EN", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Find your next film" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Action" })).toBeAttached();
  await page.getByRole("link", { name: "UK", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Відкрий своє наступне кіно" })).toBeVisible();

  await page.goto("/rewind-letterboxd/uk/profile/");
  await expect(page.getByRole("heading", { name: "Ця сторінка ще не доступна" })).toBeVisible();
  await expect(page.getByText(/Профілі, списки, відгуки й повідомлення/)).toBeVisible();
  await page.getByRole("link", { name: "Перейти до каталогу" }).click();
  await expect(page.getByRole("heading", { name: "Відкрий своє наступне кіно" })).toBeVisible();

  await page.goto("/rewind-letterboxd/en/messages/");
  await expect(page.getByRole("heading", { name: "This page is not available yet" })).toBeVisible();
  await expect(page.getByText(/Profiles, lists, reviews, and messages are not connected yet/)).toBeVisible();
  await expect.poll(() => pageErrors).toEqual([]);
});
