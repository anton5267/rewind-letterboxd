import { expect, test } from "@playwright/test";

test("review keeps complete text, controls and every liked member reachable on phones", async ({ page }, testInfo) => {
  // Browser-only fixtures exercise reflow without changing the live database.
  const content = `${"A detailed review with readable paragraphs and the complete story. ".repeat(12)}\n\n${"ДовгийТекстБезПробілів".repeat(20)}\n\nFinal review paragraph.`;
  const members = Array.from({ length: 14 }, (_, index) => ({
    id: 99101 + index, username: `member-${index}`, displayName: `Member ${index + 1}`, avatarUrl: null,
  }));
  await page.route("**/api/**", route => {
    const pathname = new URL(route.request().url()).pathname;
    if (!pathname.startsWith("/api/")) return route.continue();
    if (pathname === "/api/users/me") return route.fulfill({ json: { id: 99001, username: "review-reader", role: "USER" } });
    if (pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname === "/api/reviews/99001/like-status") return route.fulfill({ json: { liked: false, likes: members.length } });
    if (pathname === "/api/reviews/99001") return route.fulfill({ json: {
      id: 99001, content, rating: 4, createdAt: "2026-10-18T12:30:00Z",
      author: { id: 99002, username: "film-writer", displayName: "Film Writer", avatarUrl: null },
      movie: { id: 99003, title: "A film with a long localized title", releaseDate: "2021-01-01", durationMinutes: 155, ageRating: "12+", photoUrl: null, backdropUrl: null, trailerUrl: "https://example.invalid/trailer" },
      likes: members.length, likedBy: members,
    } });
    return route.fulfill({ status: 404, json: {} });
  });

  for (const locale of ["uk", "en"] as const) {
    for (const width of [320, 393, 480, 768, 1440]) {
      await page.setViewportSize({ width, height: 932 });
      await page.goto(`/${locale}/reviews/99001`);
      const main = page.getByRole("main");
      const body = main.getByText(content, { exact: true });
      const rate = main.getByRole("button", { name: locale === "uk" ? "Оцінити фільм" : "Rate film", exact: true });
      const community = main.getByRole("complementary");
      await expect(main).toHaveAttribute("aria-busy", "false");
      await expect(body).toHaveText(content);
      await expect(rate).toBeVisible();
      await expect(community.getByRole("link")).toHaveCount(members.length);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

      const complete = await body.evaluate(element => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const text = range.getBoundingClientRect();
        const box = element.getBoundingClientRect();
        return { visible: getComputedStyle(element).overflowY, textBottom: text.bottom, boxBottom: box.bottom };
      });
      expect(complete.visible).not.toBe("hidden");
      expect(complete.textBottom).toBeLessThanOrEqual(complete.boxBottom + 1);

      if (width <= 480) {
        const boxes = await main.evaluate(element => {
          const text = element.querySelector("article > p")!.getBoundingClientRect();
          const metadata = element.querySelector("article > div")!.getBoundingClientRect();
          const panel = element.querySelector("aside")!.getBoundingClientRect();
          return { textBottom: text.bottom, metadataTop: metadata.top, metadataBottom: metadata.bottom, panelTop: panel.top };
        });
        expect(boxes.metadataTop).toBeGreaterThanOrEqual(boxes.textBottom);
        expect(boxes.panelTop).toBeGreaterThanOrEqual(boxes.metadataBottom);
        // DOM and visual focus order both proceed from rating to the member rail.
        await rate.focus();
        for (const member of members) {
          await page.keyboard.press("Tab");
          const link = community.getByRole("link", { name: member.displayName, exact: true });
          await expect(link).toBeFocused();
          await expect.poll(() => link.evaluate(element => {
            const box = element.getBoundingClientRect();
            const rail = element.parentElement!.getBoundingClientRect();
            const bottomNav = [...document.querySelectorAll("header nav")].find(nav => getComputedStyle(nav).position === "fixed");
            const visibleBottom = bottomNav?.getBoundingClientRect().top ?? innerHeight;
            return box.left >= rail.left - 1 && box.right <= rail.right + 1 && box.bottom <= visibleBottom;
          }), { message: "keyboard focus scrolls each member fully into view above navigation" }).toBe(true);
        }
      }
      if (locale === "en" && width === 393) await page.screenshot({ path: testInfo.outputPath("review-phone-long-content.png"), fullPage: true });
    }
  }
});
