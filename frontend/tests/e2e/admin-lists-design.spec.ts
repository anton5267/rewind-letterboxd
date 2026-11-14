import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("admin list cards expose controls only for custom lists across languages and responsive widths", async ({ page }) => {
  let featuredPosition: number | null = null;
  let secondFeaturedPosition: number | null = 0;
  let visibilityRequests = 0;
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900010, username: "admin-fixture", role: "ADMIN", displayName: "Admin Fixture",
    email: "admin@example.invalid", avatarUrl: null, isActive: true, isHq: false,
  } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "admin-lists-design" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/admin/lists**", route => {
    const url = new URL(route.request().url());
    if (route.request().method() === "PUT" && url.pathname.endsWith("/visibility")) {
      visibilityRequests++;
      return route.fulfill({ status: 409, json: { message: "Unexpected visibility change" } });
    }
    if (route.request().method() === "PUT" && /\/featured-position$/.test(url.pathname)) {
      const direction = url.searchParams.get("direction");
      if (direction === "down" && featuredPosition !== null && secondFeaturedPosition !== null && featuredPosition > secondFeaturedPosition) {
        return route.fulfill({ status: 409, json: { message: "List is already at that end of the featured order" } });
      }
      if (featuredPosition !== null && secondFeaturedPosition !== null) {
        [featuredPosition, secondFeaturedPosition] = [secondFeaturedPosition, featuredPosition];
      }
      return route.fulfill({ status: 204, body: "" });
    }
    if (route.request().method() === "PUT" && /\/featured$/.test(url.pathname)) {
      if (url.searchParams.get("featured") === "true") {
        featuredPosition = Math.max(-1, secondFeaturedPosition ?? -1) + 1;
      } else {
        featuredPosition = null;
      }
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
    }, {
      id: 900025, userId: 900012, username: "another-owner", name: "Another featured list",
      description: null, listType: "CUSTOM", isPublic: true, itemCount: 4,
      createdAt: "2025-12-04T10:30:00Z", updatedAt: "2025-12-04T10:30:00Z",
      featuredPosition: secondFeaturedPosition,
    }, {
      id: 900026, userId: 900011, username: "fixture-owner", name: "Private custom list",
      description: null, listType: "CUSTOM", isPublic: false, itemCount: 1,
      createdAt: "2025-12-05T10:30:00Z", updatedAt: "2025-12-05T10:30:00Z",
      featuredPosition: null,
    }],
    totalPages: 1, totalElements: 4, number: 0, size: 50,
    } });
  });

  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261030/admin-lists-created-date-fixture");
  await mkdir(captureDirectory, { recursive: true });
  for (const locale of ["uk", "en"] as const) {
    const label = locale === "uk" ? "Створено" : "Created";
    for (const width of [320, 393, 600, 720, 768, 1024, 1440]) {
      featuredPosition = null;
      secondFeaturedPosition = 0;
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/admin?view=lists`);
      const lists = page.getByRole("region", { name: locale === "uk" ? "Усі списки" : "All Lists" });
      const card = lists.getByRole("listitem").first();
      const systemCard = lists.getByRole("listitem").nth(1);
      const privateCard = lists.getByRole("listitem").filter({ hasText: "Private custom list" });
      await expect(card.getByText("A real API backed list")).toBeVisible();
      await expect(card.getByText("fixture-owner")).toBeVisible();
      await expect(card.getByText(label, { exact: true })).toBeVisible();
      await expect(card.locator("time")).toHaveAttribute("dateTime", "2025-12-02T10:30:00Z");
      await expect(card.getByRole("button", { name: locale === "uk" ? "Приховати" : "Hide" })).toBeVisible();
      await expect(card.getByRole("button", { name: locale === "uk" ? "Додати до вибраних" : "Feature list" })).toBeVisible();
      await expect(systemCard.getByText("System watchlist")).toBeVisible();
      await expect(systemCard.getByRole("button")).toHaveCount(0);
      await expect(privateCard.getByRole("button", { name: locale === "uk" ? "Додати до вибраних" : "Feature list" })).toBeDisabled();
      if (width === 320) {
        const featureButton = card.getByRole("button", { name: locale === "uk" ? "Додати до вибраних" : "Feature list" });
        await featureButton.click();
        await expect(card.getByText(locale === "uk" ? "Позиція у вибраних: 2" : "Featured position: 2")).toBeVisible();
        await card.getByRole("button", { name: new RegExp(locale === "uk" ? "Перемістити вище" : "Move up") }).click();
        await expect(card.getByText(locale === "uk" ? "Позиція у вибраних: 1" : "Featured position: 1")).toBeVisible();
        await card.getByRole("button", { name: new RegExp(locale === "uk" ? "Перемістити нижче" : "Move down") }).click();
        await expect(card.getByText(locale === "uk" ? "Позиція у вибраних: 2" : "Featured position: 2")).toBeVisible();
        await card.getByRole("button", { name: new RegExp(locale === "uk" ? "Перемістити нижче" : "Move down") }).click();
        await expect(lists.getByRole("alert")).toHaveText(locale === "uk" ? "Список уже на цьому краї добірки." : "This list is already at that end of the featured order.");
        await card.getByRole("button", { name: locale === "uk" ? "Прибрати з вибраних" : "Remove from featured" }).click();
        await expect(featureButton).toBeVisible();
      }
      await expect(lists.getByRole("button", { name: /reported only|лише зі скаргами/i })).toBeVisible();
      expect(visibilityRequests).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      if ((locale === "uk" && width === 1440) || (locale === "en" && width === 393)) {
        await page.screenshot({ path: resolve(captureDirectory, `admin-lists-${locale}-${width}-fixture.png`), fullPage: true });
      }
    }
  }
});
