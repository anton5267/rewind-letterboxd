import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("only published newsletters can be queued and status retry does not queue twice", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900010, username: "admin-fixture", role: "ADMIN", displayName: "Admin Fixture",
    email: "admin@example.invalid", avatarUrl: null, isActive: true, isHq: false,
  } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "newsletter-fixture" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));

  const article = (id: number, category: string, publishedAt: string | null) => ({
    id, slug: `article-${id}`, language: "en", category, title: `Article ${id}`,
    excerpt: null, content: "Article content", coverUrl: null, audioUrl: null, publishedAt,
  });
  await page.route("**/api/admin/journal/articles?**", route => route.fulfill({ json: {
    content: [
      article(101, "News", "2026-10-01T12:00:00Z"),
      article(102, "Newsletter", null),
      article(103, "Newsletter", "2026-10-01T12:00:00Z"),
      article(104, " Бюлетень ", "2026-10-01T12:00:00Z"),
    ],
    totalPages: 1, totalElements: 4, number: 0, size: 50,
  } }));

  let queueRequests = 0;
  let statusRequests = 0;
  await page.route("**/api/admin/journal/articles/103/newsletter", async route => {
    if (route.request().method() === "POST") {
      queueRequests++;
      await route.fulfill({ status: 202, json: {} });
      return;
    }
    statusRequests++;
    if (statusRequests < 3) await route.fulfill({ status: 503, json: {} });
    else await route.fulfill({ json: { articleId: 103, pending: 2, sending: 0, sent: 1, failed: 0, cancelled: 0 } });
  });

  const captureDirectory = resolve(process.cwd(), "../artifacts/functional-audit-20261103/admin-newsletter");
  await mkdir(captureDirectory, { recursive: true });
  for (const locale of ["uk", "en"] as const) {
    const width = locale === "uk" ? 1440 : 393;
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/${locale}/admin?view=articles`);
    const editor = page.getByRole("region", { name: locale === "uk" ? "Редактор журналу" : "Journal editor" });
    const rows = editor.getByRole("listitem");
    await expect(rows).toHaveCount(4);
    const queueLabel = locale === "uk" ? "Поставити в чергу" : "Queue newsletter";
    await expect(rows.nth(0).getByRole("button", { name: queueLabel })).toHaveCount(0);
    await expect(rows.nth(1).getByRole("button", { name: queueLabel })).toHaveCount(0);
    await expect(rows.nth(2).getByRole("button", { name: queueLabel })).toBeVisible();
    await expect(rows.nth(3).getByRole("button", { name: queueLabel })).toBeVisible();
    if (width === 393) {
      await page.evaluate(() => document.fonts.ready);
      const nav = page.getByRole("navigation", { name: "Admin dashboard" });
      const active = nav.locator('[aria-current="page"]');
      await expect.poll(async () => {
        const [rail, link] = await Promise.all([nav.boundingBox(), active.boundingBox()]);
        return !!rail && !!link && link.x >= rail.x && link.x + link.width <= rail.x + rail.width;
      }).toBe(true);
    }
    await page.screenshot({ path: resolve(captureDirectory, `admin-newsletter-${locale}-${width}-fixture.png`), fullPage: true });
  }

  const row = page.getByRole("region", { name: "Journal editor" }).getByRole("listitem").nth(2);
  await row.getByRole("button", { name: "Queue newsletter" }).click();
  await expect(row.getByRole("alert")).toContainText("Newsletter queued, but its status could not be refreshed.");
  await expect(row.getByRole("button", { name: "Retry" })).toBeFocused();
  expect(queueRequests).toBe(1);
  expect(statusRequests).toBe(1);

  await row.getByRole("button", { name: "Retry" }).click();
  await expect(row.getByRole("button", { name: "Retry" })).toBeFocused();
  expect(queueRequests).toBe(1);
  expect(statusRequests).toBe(2);

  await row.getByRole("button", { name: "Retry" }).click();
  await expect(row.getByRole("alert")).toHaveCount(0);
  await expect(row.getByText("Queued / sent / failed: 2/1/0")).toBeFocused();
  expect(queueRequests).toBe(1);
  expect(statusRequests).toBe(3);
});

test("journal articles cannot be created with whitespace-only required fields", async ({ page }) => {
  let createRequests = 0;
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900011, username: "admin-fixture", role: "ADMIN", displayName: "Admin Fixture",
    email: "admin@example.invalid", avatarUrl: null, isActive: true, isHq: false,
  } }));
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { token: "article-empty-guard" } }));
  await page.route("**/api/*/unread-count", route => route.fulfill({ json: { count: 0 } }));
  await page.route("**/api/admin/journal/articles?**", async route => {
    if (route.request().method() === "POST") createRequests++;
    await route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0, number: 0, size: 50 } });
  });

  await page.setViewportSize({ width: 393, height: 900 });
  await page.goto("/uk/admin?view=articles");
  const editor = page.getByRole("region", { name: "Редактор журналу" });
  const slug = editor.getByRole("textbox", { name: "Slug статті" });
  const title = editor.getByRole("textbox", { name: "Заголовок" });
  const content = editor.getByRole("textbox", { name: "Текст статті" });
  await slug.fill("   ");
  await title.fill(" \n ");
  await editor.getByRole("combobox", { name: "Категорія" }).selectOption("News");
  await content.fill(" \n\t ");
  const submit = editor.locator("form button[type=submit]");
  await expect(submit).toBeDisabled();
  await content.evaluate(element => (element as HTMLTextAreaElement).form?.requestSubmit());
  await page.waitForTimeout(100);
  expect(createRequests).toBe(0);

  await slug.fill("useful-article");
  await title.fill("A useful title");
  await content.fill("A useful article.");
  await expect(submit).toBeEnabled();
});
