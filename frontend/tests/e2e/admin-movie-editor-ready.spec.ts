import { expect, test } from "@playwright/test";

const widths = [320, 393, 600, 720, 768, 1024, 1440];
const locales = {
  uk: {
    email: "Електронна пошта", password: "Пароль", signIn: "Увійти", database: "База фільмів",
    results: "Фільми каталогу", edit: "Редагувати", editor: "Редагування фільму",
    title: "Назва фільму", duration: "Тривалість (хв)", releaseDate: "Дата виходу", plot: "Опис",
    save: "Зберегти", cancel: "Скасувати",
  },
  en: {
    email: "Email", password: "Password", signIn: "Log in", database: "Film database",
    results: "Catalog films", edit: "Edit", editor: "Edit film",
    title: "Film title", duration: "Duration (minutes)", releaseDate: "Release date", plot: "Description",
    save: "Save", cancel: "Cancel",
  },
} as const;

for (const [locale, text] of Object.entries(locales) as [keyof typeof locales, (typeof locales)[keyof typeof locales]][]) {
  for (const width of widths) {
    test(`Admin Movies editor ${locale} at ${width}px`, async ({ page }) => {
      const email = process.env.E2E_ADMIN_EMAIL;
      const password = process.env.E2E_ADMIN_PASSWORD;
      test.skip(!email || !password, "Run scripts/verify-admin-browser.ps1 for the disposable ADMIN fixture.");

      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${locale}/login`);
      await page.getByLabel(text.email).fill(email!);
      await page.getByLabel(text.password, { exact: true }).fill(password!);
      await page.getByRole("button", { name: text.signIn }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/films$`));

      await page.goto(`/${locale}/admin?view=movies`);
      const section = page.getByRole("region", { name: text.database });
      await expect(section).toHaveAttribute("aria-busy", "false");
      const firstMovie = section.getByRole("list", { name: text.results }).getByRole("listitem").first();
      await expect(firstMovie).toBeVisible();
      const editTrigger = firstMovie.getByRole("button", { name: text.edit, exact: true });
      await editTrigger.click();
      await expect(section.getByRole("heading", { name: text.editor })).toBeVisible();
      const form = section.locator("form").first();
      await expect(form).toHaveAttribute("aria-busy", "false");
      const titleInput = form.getByLabel(text.title);
      await expect(titleInput).toBeVisible();
      await expect(form.getByLabel(text.duration)).toBeVisible();
      await expect(form.getByLabel(text.releaseDate)).toBeVisible();
      await expect(form.getByLabel(text.plot)).toBeVisible();
      await expect(form.getByRole("button", { name: text.save, exact: true })).toBeVisible();
      await expect(titleInput).toBeFocused();

      const geometry = await page.evaluate(() => {
        const section = document.querySelector<HTMLElement>("[aria-label='База фільмів'], [aria-label='Film database']")!;
        const details = section.querySelector<HTMLElement>("details")!;
        const panel = details.querySelector<HTMLElement>(":scope > div")!;
        const rect = (element: Element) => {
          const { x, y, width, height } = element.getBoundingClientRect();
          return { x, y, width, height };
        };
        return {
          viewport: window.innerWidth,
          document: document.documentElement.scrollWidth,
          section: rect(section),
          panel: rect(panel),
          poster: rect(panel.querySelector<HTMLElement>("form > div")!),
          title: rect(panel.querySelector<HTMLInputElement>("form input[required]")!),
          duration: rect(panel.querySelector<HTMLInputElement>("form input[type=number]")!),
          releaseDate: rect(panel.querySelector<HTMLInputElement>("form input[type=date]")!),
          fieldStyle: {
            fontSize: getComputedStyle(panel.querySelector("form label")!).fontSize,
            radius: getComputedStyle(panel.querySelector<HTMLInputElement>("form input[required]")!).borderRadius,
          },
        };
      });
      console.log(`ADMIN_MOVIE_EDITOR_GEOMETRY ${locale} ${JSON.stringify(geometry)}`);
      expect(geometry.document).toBe(geometry.viewport);
      expect(geometry.section.width).toBeLessThanOrEqual(Math.min(1200, width));
      expect(geometry.panel.width).toBeLessThanOrEqual(width);
      if (locale === "uk" && width === 1440) {
        expect(Math.abs(geometry.section.x - 120)).toBeLessThanOrEqual(2);
        expect(geometry.panel.width).toBeCloseTo(1200, 0);
        expect(geometry.poster.width).toBeCloseTo(275, 0);
        expect(geometry.poster.height).toBeCloseTo(411, 0);
        expect(geometry.title.x).toBeCloseTo(484, 0);
        expect(geometry.title.width).toBeCloseTo(406, 0);
        expect(geometry.duration.x).toBeCloseTo(922, 0);
        expect(geometry.duration.width).toBeCloseTo(117, 0);
        expect(geometry.releaseDate.x).toBeCloseTo(150, 0);
        expect(geometry.releaseDate.width).toBeCloseTo(386, 0);
        expect(geometry.fieldStyle).toMatchObject({ fontSize: "24px", radius: "38px" });
      }

      if (locale === "uk" && [393, 1440].includes(width)) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: `../artifacts/visual-audit-20261101/admin-movies-ready/editor-${locale}-${width}.png`, fullPage: true });
      }
      await form.getByRole("button", { name: text.cancel, exact: true }).click();
      await expect(editTrigger).toBeFocused();
      await expect(section.getByRole("heading", { name: text.editor })).toBeHidden();
    });
  }
}

test("Admin Movies can create, save edits to, and delete one disposable film", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "Run scripts/verify-admin-browser.ps1 for the disposable ADMIN fixture.");

  const title = `Admin editor fixture ${Date.now()}`;
  const updatedTitle = `${title} updated`;
  let movieId: number | null = null;
  let deleted = false;

  try {
    await page.goto("/uk/login");
    await page.getByLabel(locales.uk.email).fill(email!);
    await page.getByLabel(locales.uk.password, { exact: true }).fill(password!);
    await page.getByRole("button", { name: locales.uk.signIn }).click();
    await expect(page).toHaveURL(/\/uk\/films$/);

    await page.goto("/uk/admin?view=movies");
    const section = page.getByRole("region", { name: locales.uk.database });
    await expect(section).toHaveAttribute("aria-busy", "false");
    await section.locator("summary").filter({ hasText: "Додати фільм" }).click();
    await section.getByLabel(locales.uk.title).fill(title);
    const createResponse = page.waitForResponse(response =>
      response.url().endsWith("/api/admin/movies") && response.request().method() === "POST"
    );
    await section.getByRole("button", { name: "Створити", exact: true }).click();
    const created = await createResponse;
    expect(created.status()).toBe(200);
    movieId = Number((await created.json()).id);
    expect(movieId).toBeGreaterThan(0);

    let row = section.getByRole("list", { name: locales.uk.results }).getByRole("listitem").filter({ hasText: title });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: locales.uk.edit, exact: true }).click();
    const form = section.locator("form").first();
    const titleInput = form.getByLabel(locales.uk.title);
    await expect(titleInput).toBeFocused();
    await titleInput.fill(updatedTitle);
    await form.getByLabel("Рейтинг", { exact: true }).fill("7.3");
    const updateResponse = page.waitForResponse(response =>
      response.url().endsWith(`/api/admin/movies/${movieId}`) && response.request().method() === "PUT"
    );
    await form.getByRole("button", { name: locales.uk.save, exact: true }).click();
    expect((await updateResponse).status()).toBe(200);

    row = section.getByRole("list", { name: locales.uk.results }).getByRole("listitem").filter({ hasText: updatedTitle });
    await expect(row).toBeVisible();
    const stored = await page.evaluate(async (id) => {
      const response = await fetch("/api/admin/movies?size=50", { credentials: "include" });
      const result = await response.json();
      return result.content.find((movie: { id: number; title: string; rating?: number }) => movie.id === id);
    }, movieId);
    expect(stored).toMatchObject({ id: movieId, title: updatedTitle, rating: 7.3 });

    await row.getByRole("button", { name: locales.uk.edit, exact: true }).click();
    const editingForm = section.locator("form").first();
    await editingForm.getByRole("button", { name: "Видалити", exact: true }).click();
    const confirm = page.getByRole("alertdialog").getByRole("button", { name: "Видалити", exact: true });
    const deleteResponse = page.waitForResponse(response =>
      response.url().endsWith(`/api/admin/movies/${movieId}`) && response.request().method() === "DELETE"
    );
    await confirm.click();
    expect((await deleteResponse).status()).toBe(204);
    deleted = true;
    await expect(row).toHaveCount(0);
  } finally {
    if (movieId && !deleted) {
      const cleanupStatus = await page.evaluate(async (id) => {
        const csrf = decodeURIComponent(document.cookie.split("; ").find(value => value.startsWith("XSRF-TOKEN="))?.slice("XSRF-TOKEN=".length) ?? "");
        const response = await fetch(`/api/admin/movies/${id}`, {
          method: "DELETE",
          credentials: "include",
          headers: { "X-XSRF-TOKEN": csrf },
        });
        return response.status;
      }, movieId).catch(() => -1);
      expect([204, 404]).toContain(cleanupStatus);
    }
  }
});
