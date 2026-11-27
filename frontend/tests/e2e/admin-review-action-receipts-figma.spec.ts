import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const report = {
  id: 960021, movieId: 77, movieTitle: "Superman", moviePhotoUrl: null,
  userId: 960011, username: "CineMindset", content: "A reported fixture review.",
  rating: 4, isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2026-11-10T12:00:00Z",
  reportId: 961001, reportReason: "SPAM", reportCreatedAt: "2026-11-11T12:00:00Z", likesCount: 2, commentsCount: 1,
};

test("reported review resolve, block and delete actions show the matching Figma success receipt", async ({ page }) => {
  const actionLabels = {
    en: { resolve: "Marking a complaint as resolved", block: "Block", delete: "Delete review", resolved: "The review complaint has been successfully resolved", blocked: "The review author has been successfully blocked", deleted: "The review has been successfully deleted", back: "Back to Page" },
    uk: { resolve: "Позначити скаргу як вирішену", block: "Заблокувати автора", delete: "Видалити огляд", resolved: "Скаргу на огляд успішно позначено як вирішену", blocked: "Автора огляду успішно заблоковано", deleted: "Огляд успішно видалено", back: "Повернутися до сторінки" },
  } as const;
  page.on("dialog", dialog => dialog.accept());
  await page.route("https://fixtures.example.test/admin-review-receipt-avatar.png", route => route.fulfill({ path: resolve(process.cwd(), "tests/e2e/fixtures/admin-review-receipt-avatar.png") }));

  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: 960001, username: "Lola James", role: "ADMIN", displayName: "Lola James", email: "admin@example.invalid", avatarUrl: "https://fixtures.example.test/admin-review-receipt-avatar.png", isActive: true, isHq: false } });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "admin-receipt" } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/admin/reported-reviews") return route.fulfill({ json: { content: [report], totalPages: 1, totalElements: 1, number: 0, size: 50 } });
    if (/^\/api\/admin\/reviews\/\d+\/history$/.test(pathname)) return route.fulfill({ json: [] });
    if (pathname === "/api/admin/reported-reviews/961001/dismiss" || pathname === "/api/admin/users/960011/deactivate" || pathname === "/api/admin/reviews/960021") return route.fulfill({ status: 204 });
    return route.fulfill({ json: {} });
  });

  const output = resolve(process.cwd(), "../artifacts/visual-audit-20261124/admin-moderation");
  await mkdir(output, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1400 });
  for (const locale of ["en", "uk"] as const) {
    const labels = actionLabels[locale];
    for (const action of ["resolve", "block", "delete"] as const) {
      await page.goto(`/${locale}/admin?view=reported-review&reportId=961001`);
      const detail = page.getByRole("region", { name: locale === "en" ? "Edit Reported Review" : "Редагування скарги на огляд" });
      await expect(detail.getByRole("button", { name: labels[action], exact: true })).toBeVisible();
      await detail.getByRole("button", { name: labels[action], exact: true }).click();
      const receipt = page.getByRole("status");
      const expected = action === "resolve" ? labels.resolved : action === "block" ? labels.blocked : labels.deleted;
      await expect(receipt).toHaveText(expected);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      const back = page.getByRole("link", { name: labels.back, exact: true });
      await expect(back).toBeVisible();
      const [messageY, backY] = await page.evaluate(() => {
        const message = document.querySelector<HTMLElement>("[role='status']")!;
        const backLink = document.querySelector<HTMLElement>("[class*='successBack']")!;
        return [message.getBoundingClientRect().top + window.scrollY, backLink.getBoundingClientRect().top + window.scrollY];
      });
      expect(messageY).toBeCloseTo(1073, 0);
      expect(backY).toBeCloseTo(1200, 0);
      if (locale === "en") await page.screenshot({ path: resolve(output, `rewind-review-${action}-success-en-desktop-1440.png`), fullPage: true });
      await back.click();
      await expect(page).toHaveURL(/view=reported-reviews/);
    }
  }
});
