import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("admin list cards expose controls only for custom lists across languages and responsive widths", async ({ page }) => {
  let featuredPosition: number | null = null;
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900010, username: "admin-fixture", role: "ADMIN", displayName: "Admin Fixture",
    email: "admin@example.invalid", avatarUrl: null, isActive: true, isHq: false,
  } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "admin-lists-design" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/admin/lists**", route => {
    const url = new URL(route.request().url());
    if (route.request().method() === "PUT" && /\/featured$/.test(url.pathname)) {
      featuredPosition = url.searchParams.get("featured") === "true" ? 0 : null;
      return route.fulfill({ json: {
        id: 900023, userId: 900011, username: "fixture-owner", name: "A real API backed list",
        description: "This description stays readable and grows naturally with its content.",
        listType: "CUSTOM", isPublic: true, itemCount: 6,
        createdAt: "2025-12-02T10:30:00Z", updatedAt: "2025-12-02T10:30:00Z", featuredPosition,
      } });
    }
    return route.fulfill({ json: {
    content: [{
      id: 900023, userId: 900011, username: "fixture-owner", name: "A real API backed list",
      description: "This description stays readable and grows naturally with its content.",
      listType: "CUSTOM", isPublic: true, itemCount: 6,
      createdAt: "2025-12-02T10:30:00Z", updatedAt: "2025-12-02T10:30:00Z",
      featuredPosition,
    }, {
      id: 900024, userId: 900011, username: "fixture-owner", name: "System watchlist",
      description: null, listType: "WATCHLIST", isPublic: false, itemCount: 2,
      createdAt: "2025-12-03T10:30:00Z", updatedAt: "2025-12-03T10:30:00Z",
      featuredPosition: null,
    }],
    totalPages: 1, totalElements: 2, number: 0, size: 50,
    } });
  });

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261030/admin-lists-created-date-fixture");
  await mkdir(captureDirectory, { recursive: true });
  for (const locale of ["uk", "en"] as const) {
    const label = locale === "uk" ? "Створено" : "Created";
    for (const width of [320, 393, 600, 720, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/admin?view=lists`);
      const lists = page.getByRole("region", { name: locale === "uk" ? "Усі списки" : "All Lists" });
      const card = lists.getByRole("listitem").first();
      const systemCard = lists.getByRole("listitem").nth(1);
      await expect(card.getByText("A real API backed list")).toBeVisible();
      await expect(card.getByText("fixture-owner")).toBeVisible();
      await expect(card.getByText(label, { exact: true })).toBeVisible();
      await expect(card.locator("time")).toHaveAttribute("dateTime", "2025-12-02T10:30:00Z");
      await expect(card.getByRole("button", { name: locale === "uk" ? "Приховати" : "Hide" })).toBeVisible();
      await expect(card.getByRole("button", { name: locale === "uk" ? "Додати до вибраних" : "Feature list" })).toBeVisible();
      await expect(systemCard.getByText("System watchlist")).toBeVisible();
      await expect(systemCard.getByRole("button")).toHaveCount(0);
      if (width === 320) {
        const featureButton = card.getByRole("button", { name: locale === "uk" ? "Додати до вибраних" : "Feature list" });
        await featureButton.click();
        await expect(card.getByText(locale === "uk" ? "Позиція у вибраних: 1" : "Featured position: 1")).toBeVisible();
        await card.getByRole("button", { name: locale === "uk" ? "Прибрати з вибраних" : "Remove from featured" }).click();
        await expect(featureButton).toBeVisible();
      }
      await expect(lists.getByRole("button", { name: /reported lists|скаргами на списки/i })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      if ((locale === "uk" && width === 1440) || (locale === "en" && width === 393)) {
        await page.screenshot({ path: resolve(captureDirectory, `admin-lists-${locale}-${width}-fixture.png`), fullPage: true });
      }
    }
  }
});
