import { expect, test } from "@playwright/test";
import { browserMutation, cleanupDisposableAccount } from "./helpers";

test("mobile Movie ActionSheet real list, review, share and close actions at 393px", async ({ page, baseURL }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = `sheet${suffix}`;
  const email = `${username}@example.invalid`;
  const password = "E2e-password-123!";
  const listName = `Action sheet list ${suffix}`;
  let registered = false;

  try {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/uk/register");
    await page.getByLabel("Нікнейм").fill(username);
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    const registration = page.waitForResponse(response => response.url().endsWith("/api/auth/register") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Створити акаунт" }).click();
    expect((await registration).status()).toBe(200);
    registered = true;
    await page.getByRole("button", { name: "Перейти до входу" }).click();
    await page.getByLabel("Електронна пошта").fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Увійти" }).click();
    await expect(page).toHaveURL(/\/uk\/films$/);

    const list = await browserMutation(page, "/api/lists", "POST", {
      name: listName, description: "Disposable ActionSheet test list", isPublic: false, tags: [],
    });
    expect(list.status).toBe(200);
    const listId = Number(list.data.id);
    expect(listId).toBeGreaterThan(0);

    await page.goto("/uk/films/5");
    await expect(page.locator("#movie-title")).toBeVisible();
    const trigger = page.getByRole("button", { name: "Мої дії" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: await page.locator("#movie-title").innerText() });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Готово", exact: true })).toBeFocused();
    const geometry = await page.evaluate(() => {
      const rect = (element: Element | null) => {
        if (!element) return null;
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      };
      const dialog = document.querySelector('[role="dialog"]');
      return {
        viewport: innerWidth,
        document: document.documentElement.scrollWidth,
        sheet: rect(dialog?.querySelector('[class*="actionPanel"]') ?? null),
        addToListRow: rect(dialog?.querySelector('[aria-controls="mobile-movie-list-picker"]') ?? null),
        listLabelDisplay: dialog?.querySelector("label[for='mobile-movie-list']") ? getComputedStyle(dialog.querySelector("label[for='mobile-movie-list']")!).display : null,
        listToggleDisplay: dialog?.querySelector('[aria-controls="mobile-movie-list-picker"]') ? getComputedStyle(dialog.querySelector('[aria-controls="mobile-movie-list-picker"]')!).display : null,
        listPickerDisplay: dialog?.querySelector("#mobile-movie-list-picker") ? getComputedStyle(dialog.querySelector("#mobile-movie-list-picker")!).display : null,
        done: rect(dialog?.querySelector('[class*="doneButton"]') ?? null),
      };
    });
    console.log(`MOVIE_ACTION_SHEET_GEOMETRY ${JSON.stringify(geometry)}`);
    expect(geometry.sheet?.x).toBe(16);
    expect(Math.abs((geometry.sheet?.y ?? 0) - 373)).toBeLessThanOrEqual(2);
    expect(Math.abs((geometry.sheet?.height ?? 0) - 369)).toBeLessThanOrEqual(2);
    await page.screenshot({ path: "../artifacts/visual-audit-20261102/movie-action-sheet/runtime-live-movie-action-sheet-uk-393.png" });

    const width = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
    expect(width).toEqual({ viewport: 393, document: 393 });

    const responsive: Array<{ locale: string; width: number; document: number; panel: { x: number; right: number } | null; listToggle: boolean; desktopPicker: boolean }> = [];
    for (const locale of ["uk", "en"]) {
      if (locale === "en") {
        await page.goto("/en/films/5");
        const englishTrigger = page.getByRole("button", { name: "My actions" });
        await englishTrigger.click();
        await expect(page.getByRole("dialog")).toBeVisible();
      }
      const localizedDialog = page.getByRole("dialog");
      for (const viewportWidth of [320, 393, 600, 720, 768, 1024, 1440]) {
        await page.setViewportSize({ width: viewportWidth, height: 852 });
        const measured = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]');
          const panel = document.querySelector('[role="dialog"] [class*="actionPanel"]')?.getBoundingClientRect();
          const measuredRect = innerWidth < 768 ? panel : dialog?.getBoundingClientRect();
          return {
            locale: location.pathname.split("/")[1],
            width: innerWidth,
            document: document.documentElement.scrollWidth,
            panel: measuredRect ? { x: measuredRect.x, right: measuredRect.right } : null,
            listToggle: !!document.querySelector('[role="dialog"] [aria-controls="mobile-movie-list-picker"]') && getComputedStyle(document.querySelector('[role="dialog"] [aria-controls="mobile-movie-list-picker"]')!).display !== "none",
            desktopPicker: !!document.querySelector('[role="dialog"] #mobile-movie-list-picker') && getComputedStyle(document.querySelector('[role="dialog"] #mobile-movie-list-picker')!).display !== "none",
          };
        });
        expect(measured.document, `${locale} ${viewportWidth}px document overflow`).toBeLessThanOrEqual(viewportWidth + 1);
        expect(measured.panel?.x ?? -1, `${locale} ${viewportWidth}px panel left edge`).toBeGreaterThanOrEqual(0);
        expect(measured.panel?.right ?? viewportWidth + 1, `${locale} ${viewportWidth}px panel right edge`).toBeLessThanOrEqual(viewportWidth + 1);
        expect(measured.listToggle, `${locale} ${viewportWidth}px mobile trigger visibility`).toBe(viewportWidth < 768);
        expect(measured.desktopPicker, `${locale} ${viewportWidth}px desktop picker visibility`).toBe(viewportWidth >= 768);
        responsive.push(measured);
        await expect(localizedDialog).toBeVisible();
      }
      if (locale === "uk") {
        await page.setViewportSize({ width: 393, height: 852 });
        await page.keyboard.press("Escape");
        await expect(localizedDialog).toBeHidden();
        await expect(trigger).toBeFocused();
        await trigger.click();
        await expect(localizedDialog).toBeVisible();
      }
    }
    console.log(`MOVIE_ACTION_SHEET_RESPONSIVE ${JSON.stringify(responsive)}`);

    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/uk/films/5");
    await trigger.click();
    await expect(dialog).toBeVisible();

    const listToggle = dialog.getByRole("button", { name: "Додати до списків", exact: true });
    await expect(listToggle).toHaveAttribute("aria-expanded", "false");
    await listToggle.click();
    await expect(listToggle).toHaveAttribute("aria-expanded", "true");
    const listSelect = dialog.getByRole("combobox", { name: "Оберіть список" });
    await expect(listSelect).toBeVisible();
    await listSelect.selectOption(String(listId));
    const addResponse = page.waitForResponse(response =>
      response.url().endsWith(`/api/lists/${listId}/movies`) && response.request().method() === "POST"
    );
    await dialog.getByRole("button", { name: "Додати", exact: true }).click();
    expect((await addResponse).status()).toBe(200);
    await expect(page.getByRole("status").filter({ hasText: "Фільм додано до списку." })).toBeVisible();

    await dialog.getByRole("button", { name: "Готово", exact: true }).click();
    await expect(dialog).toBeHidden();
    await trigger.click();
    await expect(dialog).toBeVisible();
    await expect(listToggle).toHaveAttribute("aria-expanded", "false");

    await dialog.getByRole("button", { name: "Огляд", exact: true }).click();
    await expect(dialog).toBeHidden();
    const reviewComposer = page.getByRole("textbox", { name: "Ваш огляд" });
    await expect(reviewComposer).toBeFocused();

    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/uk/films/5");
    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.evaluate(() => {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (payload: ShareData) => {
          (window as Window & { __actionSheetSharePayload?: ShareData }).__actionSheetSharePayload = payload;
        },
      });
    });
    await dialog.getByRole("button", { name: "Поділитися", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as Window & { __actionSheetSharePayload?: ShareData }).__actionSheetSharePayload?.url)).toBe(page.url());
    await dialog.getByRole("button", { name: "Готово", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  } finally {
    if (registered) await cleanupDisposableAccount(baseURL, email, password);
  }
});
