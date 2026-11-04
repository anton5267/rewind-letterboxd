import { expect, test } from "@playwright/test";

test("read-only catalogue works on GitHub Pages path on a phone-sized viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto("/rewind-letterboxd/uk/home");
  await expect(page.locator('link[href*="font-awesome"]')).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Відкрий своє наступне кіно" })).toBeVisible();
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
  await page.getByRole("link", { name: "EN" }).click();
  await expect(page.getByRole("heading", { name: "Find your next film" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Action" })).toBeAttached();
  await page.getByRole("link", { name: "UK" }).click();
  await expect(page.getByRole("heading", { name: "Відкрий своє наступне кіно" })).toBeVisible();
  await expect.poll(() => pageErrors).toEqual([]);
});
