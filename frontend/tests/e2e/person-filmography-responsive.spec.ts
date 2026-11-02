import { expect, test } from "@playwright/test";

const pageOf = { content: [], totalPages: 0, totalElements: 0 };

function films(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: 982000 + index,
    title: index === 0 ? "A very long film title for responsive person cards" : `Film ${index + 1}`,
    releaseDate: index % 2 ? "2024-01-01" : null,
    rating: index % 3 ? 4.2 : null,
    photoUrl: null,
    characterName: index === 0 ? "A long character role" : null,
  }));
}

test("Person filmography adapts across locales and widths with nullable poster fallbacks", async ({ page }) => {
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/actors/85") {
      return route.fulfill({ json: { id: 85, name: "Brad Pitt", photoUrl: null, type: "ACTOR", films: films(13) } });
    }
    if (pathname === "/api/directors/19") {
      return route.fulfill({ json: { id: 19, name: "James Cameron", photoUrl: null, type: "DIRECTOR", films: films(2) } });
    }
    if (pathname === "/api/genres") {
      return route.fulfill({ json: [{ id: 16, name: "Science Fiction" }] });
    }
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    return route.fulfill({ json: pageOf });
  });

  for (const locale of ["uk", "en"] as const) {
    for (const type of ["actor", "director"] as const) {
      const id = type === "actor" ? 85 : 19;
      await page.goto(`/${locale}/people/${type}/${id}`);
      await expect(page.getByRole("heading", { level: 1, name: type === "actor" ? "Brad Pitt" : "James Cameron" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: type === "actor" ? /films starring|фільми за участі/i : /films directed|режисерські роботи/i })).toBeVisible();

      for (const width of [320, 393, 600, 720, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      }

      if (type === "actor") {
        await page.setViewportSize({ width: 393, height: 852 });
        const showAll = page.getByRole("button", { name: locale === "uk" ? "Усі фільми" : "All films" });
        await expect(showAll).toBeVisible();
        await showAll.click();
        await expect(page.getByRole("link", { name: /Film 13/ })).toBeVisible();
      }

      await page.setViewportSize({ width: 393, height: 852 });
      const filters = page.getByRole("button", { name: locale === "uk" ? /фільтри/i : /filters/i });
      await filters.click();
      await expect(filters).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("Escape");
      await expect(filters).toHaveAttribute("aria-expanded", "false");
      await expect(filters).toBeFocused();
    }
  }
});

test("Person filmography retries an API failure and focuses its heading", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/actors/85?**", async route => {
    attempts += 1;
    if (attempts === 1) return route.fulfill({ status: 503, json: {} });
    return route.fulfill({ json: { id: 85, name: "Brad Pitt", photoUrl: null, type: "ACTOR", films: [] } });
  });
  await page.route("**/api/genres", route => route.fulfill({ json: [] }));
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));

  await page.goto("/uk/people/actor/85");
  await expect(page.getByRole("alert")).toBeVisible();
  const retry = page.getByRole("button", { name: "Спробувати ще" });
  await retry.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Фільмів не знайдено.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Brad Pitt", level: 1 })).toBeFocused();
  expect(attempts).toBe(2);
});

test("expanded Actor READY state keeps the matched desktop starring grid and keyboard controls", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/actors/85") return route.fulfill({ json: { id: 85, name: "Brad Pitt", photoUrl: null, type: "ACTOR", films: films(13) } });
    if (pathname === "/api/genres") return route.fulfill({ json: [{ id: 16, name: "Science Fiction" }] });
    if (pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    return route.fulfill({ json: pageOf });
  });

  await page.goto("/uk/people/actor/85");
  const section = page.locator('section[aria-labelledby="filmography-title"]');
  await expect(section).toHaveAttribute("aria-busy", "false");
  const heading = section.getByRole("heading", { level: 2, name: "Фільми за участі", exact: true });
  const grid = section.locator("#person-films");
  await expect(grid.locator("article")).toHaveCount(12);
  const initialGeometry = await page.evaluate(() => {
    const content = document.querySelector('section[aria-labelledby="filmography-title"]');
    const grid = content?.querySelector("#person-films");
    const poster = grid?.querySelector("article img, article [class*=posterFallback]");
    const rect = (element: Element | null | undefined) => {
      const box = element?.getBoundingClientRect();
      return box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null;
    };
    return { content: rect(content), grid: rect(grid), poster: rect(poster), scrollWidth: document.documentElement.scrollWidth };
  });
  expect(initialGeometry.content?.x).toBe(120);
  expect(initialGeometry.content?.width).toBe(1200);
  expect(initialGeometry.grid?.x).toBe(120);
  expect(initialGeometry.grid?.width).toBe(1200);
  expect(initialGeometry.poster?.x).toBe(120);
  expect(initialGeometry.poster?.y).toBeCloseTo(1092, 0);
  expect(initialGeometry.poster?.width).toBeCloseTo(174, 0);
  expect(initialGeometry.scrollWidth).toBe(1440);
  console.log(`PERSON_EXPANDED_SOURCE_ANCHOR ${JSON.stringify(initialGeometry)}`);

  const showAll = section.getByRole("button", { name: "Усі фільми", exact: true });
  await showAll.focus();
  await showAll.press("Enter");
  const fewer = section.getByRole("button", { name: "Менше фільмів", exact: true });
  await expect(fewer).toHaveAttribute("aria-expanded", "true");
  await expect(grid.locator("article")).toHaveCount(13);
  await expect(grid.getByRole("link", { name: /Film 13/ })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await expect(fewer).toBeFocused();
  const expandedGrid = await grid.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y + window.scrollY, width: rect.width, height: rect.height };
  });
  expect(expandedGrid.x).toBe(120);
  expect(expandedGrid.y).toBe(1092);
  expect(expandedGrid.width).toBe(1200);
  console.log(`PERSON_EXPANDED_RUNTIME_GRID ${JSON.stringify(expandedGrid)}`);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.screenshot({ path: "../artifacts/visual-audit-20261102/actor-expanded/runtime-551-705-1440-uk.png", fullPage: true });

  await fewer.click();
  await expect(showAll).toHaveAttribute("aria-expanded", "false");
  await expect(grid.locator("article")).toHaveCount(12);
  await expect(heading).toBeFocused();
});
