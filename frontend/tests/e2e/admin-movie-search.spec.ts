import { expect, test } from "@playwright/test";

const locales = {
  uk: { email: "Електронна пошта", password: "Пароль", signIn: "Увійти", database: "База фільмів", searchRegion: "Пошук фільму в каталозі", search: "Пошук", clear: "Очистити пошук", results: "Фільми каталогу", empty: "Фільмів не знайдено." },
  en: { email: "Email", password: "Password", signIn: "Log in", database: "Film database", searchRegion: "Search films in the catalog", search: "Search", clear: "Clear search", results: "Catalog films", empty: "No films found." },
} as const;

for (const [locale, text] of Object.entries(locales) as [keyof typeof locales, (typeof locales)[keyof typeof locales]][]) {
  for (const width of [393, 1440]) {
    test(`Admin Movies server search ${locale} at ${width}px`, async ({ page }) => {
      const email = process.env.E2E_ADMIN_EMAIL;
      const password = process.env.E2E_ADMIN_PASSWORD;
      test.skip(!email || !password, "Run scripts/verify-admin-browser.ps1 for the disposable ADMIN fixture.");

      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/login`);
      await page.getByLabel(text.email).fill(email!);
      await page.getByLabel(text.password, { exact: true }).fill(password!);
      await page.getByRole("button", { name: text.signIn }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/films$`));

      await page.goto(`/${locale}/admin?view=movies`);
      const section = page.getByRole("region", { name: text.database });
      const results = section.getByRole("list", { name: text.results });
      await expect(results.getByRole("listitem")).toHaveCount(6);
      const firstTitle = (await results.locator("h3").first().innerText()).trim();

      const search = section.getByRole("search", { name: text.searchRegion });
      const query = search.getByLabel(text.searchRegion);
      await query.fill(firstTitle);
      await search.getByRole("button", { name: text.search, exact: true }).click();
      await expect(results.getByRole("listitem")).toHaveCount(1);
      await expect(results.getByRole("heading", { name: firstTitle, exact: true })).toBeVisible();

      await query.fill("No matching Rewind film 928374");
      await search.getByRole("button", { name: text.search, exact: true }).click();
      await expect(section.getByText(text.empty, { exact: true })).toBeVisible();

      await search.getByRole("button", { name: text.clear, exact: true }).click();
      await expect(results.getByRole("listitem")).toHaveCount(6);
      await expect(page.locator("html")).toHaveJSProperty("scrollWidth", width);
    });
  }
}
