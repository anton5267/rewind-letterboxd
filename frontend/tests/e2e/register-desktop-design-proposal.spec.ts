import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const evidenceDir = resolve(process.cwd(), "../artifacts/visual-audit-20261127/auth-register-implementation");

test("desktop registration proposal keeps the auth shell anchors at the Figma canvas size", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1614 });
  await page.goto("/en/register");
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  const geometry = await page.evaluate(() => {
    const box = (element: Element | null) => {
      const rect = element?.getBoundingClientRect();
      return rect && { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height };
    };
    return {
      card: box(document.querySelector("main h1")?.parentElement ?? null),
      title: box(document.querySelector("main h1")),
      fields: [...document.querySelectorAll("#register-username, #register-email, #register-password")].map(box),
      submit: box(document.querySelector('main button[type="submit"]')),
      pageHeight: document.documentElement.scrollHeight,
      pageWidth: document.documentElement.scrollWidth,
    };
  });
  expect(geometry.card).toMatchObject({ x: 121, y: 316, width: 1198, height: 1011 });
  expect(geometry.title?.y).toBeCloseTo(410, 0);
  for (const [index, expectedY] of [508, 616, 724].entries()) {
    expect(geometry.fields[index]?.y).toBeCloseTo(expectedY, 0);
  }
  expect(geometry.submit).toMatchObject({ x: 406.5, width: 627, height: 89 });
  expect(geometry.submit?.y).toBeCloseTo(895, 0);
  expect(geometry.pageHeight).toBe(1752);
  expect(geometry.pageWidth).toBe(1440);
  await mkdir(evidenceDir, { recursive: true });
  await page.screenshot({ path: resolve(evidenceDir, "register-en-desktop-default-1440.png"), fullPage: true });
});

for (const language of ["uk", "en"] as const) {
  test(`${language} implementation-created desktop registration error stays inside the auth card`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    let intercepted = false;
    await page.route(url => url.pathname.endsWith("/api/auth/csrf"), route =>
      route.fulfill({ status: 200, json: { token: "register-desktop-fixture" } })
    );
    await page.route(url => url.pathname.endsWith("/api/auth/register"), route => {
      intercepted = true;
      return route.fulfill({ status: 503, json: { message: "Fixture registration failure" } });
    });
    await page.route(url => url.pathname.endsWith("/auth/v1/signup"), route => {
      intercepted = true;
      return route.fulfill({ status: 500, json: { message: "Fixture registration failure" } });
    });
    await page.setViewportSize({ width: 1440, height: 1614 });
    await page.goto(`/${language}/register`);
    await page.locator("#register-username").fill("rewind-member");
    await page.locator("#register-email").fill("member@example.invalid");
    await page.locator("#register-password").fill("secure-pass-123");
    await page.getByRole("button", { name: language === "uk" ? "Створити акаунт" : "Create Account" }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect.poll(() => intercepted).toBe(true);
    const geometry = await page.evaluate(() => {
      const box = (element: Element | null) => {
        const rect = element?.getBoundingClientRect();
        return rect && { x: rect.x + scrollX, right: rect.right + scrollX, y: rect.y + scrollY, bottom: rect.bottom + scrollY };
      };
      const card = document.querySelector("main h1")?.parentElement ?? null;
      return { card: box(card), alert: box(document.querySelector("main [role=alert]")), submit: box(document.querySelector("main button[type=submit]")), documentWidth: document.documentElement.scrollWidth };
    });
    expect(geometry.card).not.toBeNull();
    expect(geometry.alert).not.toBeNull();
    expect(geometry.submit).not.toBeNull();
    expect(geometry.alert!.x).toBeGreaterThanOrEqual(geometry.card!.x);
    expect(geometry.alert!.right).toBeLessThanOrEqual(geometry.card!.right);
    expect(geometry.submit!.bottom).toBeLessThanOrEqual(geometry.card!.bottom);
    expect(geometry.documentWidth).toBe(1440);
    await mkdir(evidenceDir, { recursive: true });
    await page.screenshot({ path: resolve(evidenceDir, `register-${language}-desktop-error-1440.png`), fullPage: true });
  });

  test(`${language} implementation-created desktop registration confirmation stays inside the auth card`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    let intercepted = false;
    await page.route(url => url.pathname.endsWith("/api/auth/csrf"), route =>
      route.fulfill({ status: 200, json: { token: "register-desktop-fixture" } })
    );
    await page.route(url => url.pathname.endsWith("/api/auth/register"), route => {
      intercepted = true;
      return route.fulfill({ status: 200, json: { confirmationRequired: true } });
    });
    await page.route(url => url.pathname.endsWith("/auth/v1/signup"), route => {
      intercepted = true;
      return route.fulfill({ status: 200, json: {
      user: { id: "b1f5872a-148b-4878-8581-06b809b2992f", aud: "authenticated", role: "authenticated", email: "member@example.invalid", created_at: new Date().toISOString() },
      session: null,
      } });
    });
    await page.setViewportSize({ width: 1440, height: 1614 });
    await page.goto(`/${language}/register`);
    await page.locator("#register-username").fill("rewind-member");
    await page.locator("#register-email").fill("member@example.invalid");
    await page.locator("#register-password").fill("secure-pass-123");
    await page.getByRole("button", { name: language === "uk" ? "Створити акаунт" : "Create Account" }).click();
    await expect.poll(() => intercepted).toBe(true);

    const confirmation = page.getByRole("status");
    await expect(page.getByRole("heading", { name: language === "uk" ? "Акаунт створено" : "Account created" })).toBeVisible();
    await expect(confirmation).toBeVisible();
    const geometry = await page.evaluate(() => {
      const box = (element: Element | null) => {
        const rect = element?.getBoundingClientRect();
        return rect && { x: rect.x + scrollX, right: rect.right + scrollX, y: rect.y + scrollY, bottom: rect.bottom + scrollY };
      };
      const card = document.querySelector("main h1")?.parentElement ?? null;
      return { card: box(card), title: box(document.querySelector("main h1")), confirmation: box(document.querySelector("main [role=status]")), submit: box(document.querySelector("main button")), documentWidth: document.documentElement.scrollWidth };
    });
    expect(geometry.card).not.toBeNull();
    for (const element of [geometry.title, geometry.confirmation, geometry.submit]) {
      expect(element).not.toBeNull();
      expect(element!.x).toBeGreaterThanOrEqual(geometry.card!.x);
      expect(element!.right).toBeLessThanOrEqual(geometry.card!.right);
      expect(element!.bottom).toBeLessThanOrEqual(geometry.card!.bottom);
    }
    expect(geometry.documentWidth).toBe(1440);
    await mkdir(evidenceDir, { recursive: true });
    await page.screenshot({ path: resolve(evidenceDir, `register-${language}-desktop-success-1440.png`), fullPage: true });
  });
}
