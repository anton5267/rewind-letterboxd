import { expect, test } from "@playwright/test";

test("full app home, public catalogue, and private account routing work on GitHub Pages", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  const homeResponse = await page.request.get("/rewind-letterboxd/uk/home/");
  expect(homeResponse.status()).toBe(200);
  expect(homeResponse.headers()["content-type"]).toContain("text/html");
  expect(await homeResponse.text()).toContain("<title>Ваш кіножурнал | REWIND</title>");

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
  await expect(page.getByRole("heading", { name: "Позначайте переглянуті фільми. Зберігайте ті, що хочете подивитися. Діліться враженнями з друзями." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/rewind-letterboxd/uk/films/");
  await expect(page.getByRole("heading", { name: "Фільми", exact: true })).toBeVisible();
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
  expect(await englishHomeResponse.text()).toContain("<title>Your film diary | REWIND</title>");
  await page.goto("/rewind-letterboxd/en/home/");
  await expect(page.getByRole("heading", { name: "Track films you’ve watched. Save those you want to see. Tell your friends what’s good." })).toBeVisible();
  await page.goto("/rewind-letterboxd/en/films/");
  await expect(page.getByRole("heading", { name: "Films", exact: true })).toBeVisible();
  await expect(page.getByRole("option", { name: "Action" })).toBeAttached();
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/rewind-letterboxd/uk/home/");
  await expect(page.getByRole("heading", { name: "Позначайте переглянуті фільми. Зберігайте ті, що хочете подивитися. Діліться враженнями з друзями." })).toBeVisible();

  await page.goto("/rewind-letterboxd/uk/profile/");
  await expect(page).toHaveURL(/\/rewind-letterboxd\/uk\/login\/?$/);
  await expect(page.getByRole("heading", { name: "З поверненням" })).toBeVisible();
  await expect(page.getByLabel("Електронна пошта")).toBeVisible();
  await page.goto("/rewind-letterboxd/uk/home/");
  await expect(page.getByRole("heading", { name: "Позначайте переглянуті фільми. Зберігайте ті, що хочете подивитися. Діліться враженнями з друзями." })).toBeVisible();

  await page.goto("/rewind-letterboxd/en/messages/");
  await expect(page).toHaveURL(/\/rewind-letterboxd\/en\/login\/?$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect.poll(() => pageErrors).toEqual([]);
});
