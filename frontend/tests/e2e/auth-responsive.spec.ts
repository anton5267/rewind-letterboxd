import { expect, test } from "@playwright/test";

test("mobile auth retains standalone composition and supported local forms", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.setViewportSize({ width: 393, height: 852 });
  for (const route of ["login", "register", "forgot-password", "reset-password?token=responsive-fixture-token"]) {
    await page.goto(`/en/${route}`);
    const main = page.locator("main");
    await expect(main.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(main.locator("form")).toHaveCount(1);
    // OAuth remains an explicit contract gap, never a decorative dead action.
    await expect(main.getByText("Sign in with", { exact: true })).toHaveCount(0);
    const geometry = await page.evaluate(() => {
      const heading = document.querySelector("main h1")!;
      const input = document.querySelector("main input")!.getBoundingClientRect();
      const submit = document.querySelector('main form button[type="submit"]')!.getBoundingClientRect();
      return { overflow: document.documentElement.scrollWidth - innerWidth,
        font: getComputedStyle(heading).fontFamily, title: heading.getBoundingClientRect().toJSON(),
        input: input.toJSON(), submit: submit.toJSON(),
        header: document.querySelector("header")?.getBoundingClientRect().height ?? 0,
        footer: document.querySelector("footer")?.getBoundingClientRect().height ?? 0 };
    });
    expect(geometry.overflow).toBe(0);
    expect(geometry.font).toContain("Inter");
    expect(geometry.header).toBeLessThanOrEqual(1);
    expect(geometry.footer).toBeLessThanOrEqual(1);
    expect(geometry.input.x).toBeGreaterThanOrEqual(16);
    expect(geometry.input.right).toBeLessThanOrEqual(393 - 16);
    expect(geometry.input.y).toBeGreaterThan(geometry.title.bottom);
    expect(geometry.submit.y).toBeGreaterThanOrEqual(geometry.input.bottom);
    expect(geometry.submit.height).toBeGreaterThanOrEqual(44);
    const field = main.locator("input").first();
    await field.focus();
    await expect(field).toBeFocused();
  }
  await expect(page.getByRole("textbox", { name: "New password", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Confirm password", exact: true })).toBeVisible();
});
