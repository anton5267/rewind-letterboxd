import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { installHostedAuthFixture, signInHostedFixture } from "./fixtures/hosted-auth";

const evidenceDir = resolve(process.cwd(), "../artifacts/visual-audit-20261125/auth");
const forgotError = {
  uk: "Не вдалося надіслати запит на відновлення пароля. Спробуйте ще раз.",
  en: "Could not send the password reset request. Please try again.",
};
const resetMismatch = { uk: "Паролі не збігаються.", en: "Passwords do not match." };

async function installApi(page: Page, authenticated = false) {
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/users/me") return route.fulfill(authenticated
      ? { json: { id: 7, username: "recovery-fixture", role: "USER" } }
      : { status: 401, json: {} });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "figma-auth-recovery" } });
    if (pathname === "/api/auth/forgot-password") {
      return route.fulfill(route.request().headers()["x-test-outcome"] === "error"
        ? { status: 503, json: { message: "Fixture request failed" } }
        : { status: 202, json: { message: "Request accepted" } });
    }
    if (pathname === "/api/auth/reset-password") {
      return route.fulfill({ status: 200, json: {} });
    }
    return route.fulfill({ json: [] });
  });
  await mkdir(evidenceDir, { recursive: true });
}

test("desktop Forgot Password follows READY frame 605:2174 geometry", async ({ page }) => {
  await installApi(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1614 });
  await page.goto("/en/forgot-password");
  await expect(page.getByRole("heading", { name: "Forgot your password?" })).toBeVisible();
  const geometry = await page.evaluate(() => {
    const box = (selector: string) => {
      const rect = document.querySelector<HTMLElement>(selector)?.getBoundingClientRect();
      return rect && { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height };
    };
    return {
      card: box("main [class*=card]"),
      title: box("#forgot-password-title"),
      description: box("main p[class*=text]"),
      email: box("#forgot-password-email"),
      submit: box("main form button[type=submit]"),
      footer: box("footer"),
      pageHeight: document.documentElement.scrollHeight,
    };
  });
  expect(geometry.card).toMatchObject({ x: 121, y: 316, width: 1198 });
  expect(geometry.card?.height).toBeCloseTo(873, 0);
  expect(geometry.title).toMatchObject({ y: 576, height: 43 });
  expect(Math.abs(geometry.title!.x + geometry.title!.width / 2 - 720)).toBeLessThanOrEqual(1);
  expect(Math.abs(geometry.title!.width - 363)).toBeLessThan(8);
  expect(geometry.description).toMatchObject({ y: 637, width: 625, height: 24 });
  expect(Math.abs(geometry.description!.x - 405)).toBeLessThanOrEqual(3);
  expect(geometry.email).toMatchObject({ y: 740, width: 627, height: 72 });
  expect(Math.abs(geometry.email!.x - 407)).toBeLessThanOrEqual(1);
  expect(geometry.submit).toMatchObject({ y: 867, width: 627, height: 89 });
  expect(Math.abs(geometry.submit!.x - 407)).toBeLessThanOrEqual(1);
  expect(geometry.footer).toMatchObject({ width: 1440, height: 265 });
  expect(geometry.footer?.y).toBeCloseTo(1349, 0);
  expect(geometry.pageHeight).toBe(1614);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await page.screenshot({ path: resolve(evidenceDir, "rewind-forgot-password-en-desktop-1440.png"), fullPage: true });
});

test("desktop expired recovery-link state matches the Figma frame", async ({ page }) => {
  await installHostedAuthFixture(page.context());
  await installApi(page);
  await page.route(url => url.pathname === "/api/auth/reset-password", route => route.fulfill({ status: 400, json: { message: "Expired recovery token fixture" } }));
  await page.setViewportSize({ width: 1440, height: 1614 });
  await page.goto("/en/reset-password?token=expired-fixture-token");
  if (!(await page.getByRole("alert").count())) {
    await page.getByRole("textbox", { name: "New password" }).fill("valid-fixture-password");
    await page.getByRole("textbox", { name: "Confirm password" }).fill("valid-fixture-password");
    await page.getByRole("button", { name: "Change password" }).click();
  }
  await expect(page.getByRole("alert")).toHaveText("The link is invalid or has expired.");
  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => document.querySelector<HTMLElement>(selector)?.getBoundingClientRect().toJSON() ?? null;
    return {
      card: rect("main section"),
      password: rect("#reset-password"),
      confirm: rect("#reset-password-confirm"),
      error: rect("#reset-password-error"),
      submit: rect("form button[type=submit]"),
    };
  });
  expect(geometry.card).toMatchObject({ x: 121, y: 316, width: 1198, height: 873 });
  expect(Math.abs(geometry.password!.x - 407)).toBeLessThanOrEqual(3);
  expect(Math.abs(geometry.password!.y - 600)).toBeLessThanOrEqual(3);
  expect(Math.abs(geometry.password!.width - 627)).toBeLessThanOrEqual(3);
  expect(Math.abs(geometry.confirm!.y - 748)).toBeLessThanOrEqual(4);
  expect(Math.abs(geometry.error!.y - 854)).toBeLessThanOrEqual(4);
  expect(Math.abs(geometry.submit!.y - 918)).toBeLessThanOrEqual(4);
  expect(Math.abs(geometry.submit!.width - 627)).toBeLessThanOrEqual(3);
  expect(geometry.submit!.height).toBe(89);
  await expect(page.getByRole("button", { name: "Change password" })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await page.screenshot({ path: resolve(evidenceDir, "rewind-reset-password-en-desktop-expired-1440.png"), fullPage: true });
});

test("desktop password-reset default state matches the Figma frame", async ({ page }) => {
  await installHostedAuthFixture(page.context());
  await installApi(page, true);
  await page.route("**/auth/v1/user", route => route.fulfill({ json: { id: "fixture-user" } }));
  await page.setViewportSize({ width: 1440, height: 1614 });
  await signInHostedFixture(page, "en");
  await page.goto("/en/reset-password?token=fixture-access-7");
  await expect(page.getByRole("heading", { name: "Set a new password" })).toBeVisible();
  await expect(page.locator("#reset-password-error")).toHaveCount(0);
  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => {
      const value = document.querySelector<HTMLElement>(selector)?.getBoundingClientRect();
      return value ? { x: value.x + window.scrollX, y: value.y + window.scrollY, width: value.width, height: value.height } : null;
    };
    return { card: rect("main [class*=card]"), password: rect("#reset-password"), confirm: rect("#reset-password-confirm"), submit: rect("form button[type=submit]") };
  });
  expect(geometry.card).toMatchObject({ x: 121, y: 316, width: 1198, height: 873 });
  expect(Math.abs(geometry.password!.y - 600)).toBeLessThanOrEqual(3);
  expect(Math.abs(geometry.confirm!.y - 748)).toBeLessThanOrEqual(4);
  expect(Math.abs(geometry.submit!.x - 406.5)).toBeLessThanOrEqual(3);
  expect(Math.abs(geometry.submit!.y - 856)).toBeLessThanOrEqual(4);
  expect(geometry.submit!.height).toBe(89);
  await expect(page.getByRole("button", { name: "Change password" })).toBeDisabled();
  await page.screenshot({ path: resolve(evidenceDir, "rewind-reset-password-en-desktop-default-1440.png"), fullPage: true });
});

test("desktop recovery success state matches the Figma frame", async ({ page }) => {
  await installHostedAuthFixture(page.context());
  await installApi(page, true);
  await page.route("**/auth/v1/user", route => route.fulfill({ json: { id: "fixture-user" } }));
  await page.setViewportSize({ width: 1440, height: 1614 });
  await signInHostedFixture(page, "en");
  await page.goto("/en/reset-password?token=fixture-access-7");
  await page.locator("#reset-password").fill("Valid-password-123!");
  await page.locator("#reset-password-confirm").fill("Valid-password-123!");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByRole("status")).toContainText("Password changed.");
  const success = await page.getByRole("status").evaluate(node => {
    const rect = node.getBoundingClientRect();
    return { x: rect.x + window.scrollX, y: rect.y + window.scrollY, width: rect.width, height: rect.height };
  });
  expect(success).not.toBeNull();
  expect(Math.abs(success!.x - 407)).toBeLessThanOrEqual(3);
  expect(Math.abs(success!.y - 600)).toBeLessThanOrEqual(3);
  expect(Math.abs(success!.width - 627)).toBeLessThanOrEqual(3);
  expect(Math.abs(success!.height - 82)).toBeLessThanOrEqual(3);
  await page.screenshot({ path: resolve(evidenceDir, "rewind-reset-password-en-desktop-success-1440.png"), fullPage: true });
});

test("desktop password-mismatch state matches the Figma frame", async ({ page }) => {
  await installHostedAuthFixture(page.context());
  await installApi(page, true);
  await page.route("**/auth/v1/user", route => route.fulfill({ json: { id: "fixture-user" } }));
  await page.setViewportSize({ width: 1440, height: 1614 });
  await signInHostedFixture(page, "en");
  await page.goto("/en/reset-password?token=fixture-access-7");
  await page.locator("#reset-password").fill("Valid-password-123!");
  await page.locator("#reset-password-confirm").fill("Different-password-123!");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByRole("alert")).toHaveText("Passwords do not match.");
  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => {
      const value = document.querySelector<HTMLElement>(selector)?.getBoundingClientRect();
      return value ? { x: value.x + window.scrollX, y: value.y + window.scrollY, width: value.width, height: value.height } : null;
    };
    return { confirm: rect("#reset-password-confirm"), error: rect("#reset-password-error"), submit: rect("form button[type=submit]") };
  });
  expect(Math.abs(geometry.confirm!.x - 406.5)).toBeLessThanOrEqual(3);
  expect(Math.abs(geometry.confirm!.y - 748)).toBeLessThanOrEqual(4);
  expect(Math.abs(geometry.error!.x - 406.5)).toBeLessThanOrEqual(3);
  expect(Math.abs(geometry.error!.y - 854)).toBeLessThanOrEqual(4);
  expect(Math.abs(geometry.submit!.y - 918)).toBeLessThanOrEqual(4);
  expect(geometry.submit!.height).toBe(89);
  await expect(page.getByRole("button", { name: "Change password" })).toBeDisabled();
  await page.screenshot({ path: resolve(evidenceDir, "rewind-reset-password-en-desktop-mismatch-1440.png"), fullPage: true });
});

for (const [lang, height, passwordY, confirmY, submitY] of [
  ["uk", 914, 382, 520, 570],
  ["en", 852, 338, 458, 508],
] as const) {
  test(`mobile password-reset default state matches the ${lang} Figma frame`, async ({ page }) => {
    await installHostedAuthFixture(page.context());
    await installApi(page, true);
    await page.route("**/auth/v1/user", route => route.fulfill({ json: { id: "fixture-user" } }));
    await page.setViewportSize({ width: 393, height });
    await signInHostedFixture(page, lang);
    await page.goto(`/${lang}/reset-password?token=fixture-access-7`);
    await expect(page.locator("#reset-password-error")).toHaveCount(0);
    const password = await page.locator("#reset-password").boundingBox();
    const confirm = await page.locator("#reset-password-confirm").boundingBox();
    const submit = await page.locator("form button[type=submit]").boundingBox();
    expect(password).not.toBeNull();
    expect(confirm).not.toBeNull();
    expect(submit).not.toBeNull();
    expect(Math.abs(password!.y - passwordY)).toBeLessThanOrEqual(3);
    expect(Math.abs(confirm!.y - confirmY)).toBeLessThanOrEqual(4);
    expect(Math.abs(submit!.y - submitY)).toBeLessThanOrEqual(4);
    expect(submit!.height).toBe(56);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
    await expect(page.getByRole("button", { name: lang === "uk" ? "Змінити пароль" : "Change password" })).toBeDisabled();
    await page.screenshot({ path: resolve(evidenceDir, `rewind-reset-password-${lang}-mobile-default-393.png`), fullPage: true });
  });
}

for (const lang of ["uk", "en"] as const) {
  test(`reset-password expired-link draft is visible before submission (${lang})`, async ({ page }) => {
    await installHostedAuthFixture(page.context());
    await installApi(page);
    await page.route(url => url.pathname === "/api/auth/reset-password", route => route.fulfill({ status: 400, json: { message: "Expired recovery token fixture" } }));
    await page.setViewportSize({ width: 393, height: lang === "uk" ? 914 : 852 });
    await page.goto(`/${lang}/reset-password?token=expired-fixture-token`);
      if (!(await page.getByRole("alert").count())) {
        await page.getByRole("textbox", { name: lang === "uk" ? "Новий пароль" : "New password" }).fill("valid-fixture-password");
        await page.getByRole("textbox", { name: lang === "uk" ? "Повторіть пароль" : "Confirm password" }).fill("valid-fixture-password");
        await page.getByRole("button", { name: lang === "uk" ? "Змінити пароль" : "Change password" }).click();
      }
    await expect(page.getByRole("alert")).toHaveText(lang === "uk"
      ? "Посилання недійсне або його час минув."
      : "The link is invalid or has expired.");
    const geometry = await page.evaluate(() => {
      const rect = (selector: string) => document.querySelector<HTMLElement>(selector)?.getBoundingClientRect().toJSON() ?? null;
      return {
        title: rect("#reset-password-title"),
        password: rect("#reset-password"),
        confirm: rect("#reset-password-confirm"),
        error: rect("#reset-password-error"),
        submit: rect("form button[type=submit]"),
      };
    });
    expect(Math.abs(geometry.title!.y - 164)).toBeLessThanOrEqual(3);
    expect(Math.abs(geometry.password!.y - (lang === "uk" ? 382 : 338))).toBeLessThanOrEqual(3);
    expect(Math.abs(geometry.confirm!.y - (lang === "uk" ? 520 : 458))).toBeLessThanOrEqual(4);
    expect(Math.abs(geometry.error!.y - (lang === "uk" ? 571 : 509))).toBeLessThanOrEqual(4);
    expect(Math.abs(geometry.submit!.y - (lang === "uk" ? 604 : 542))).toBeLessThanOrEqual(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
    await page.screenshot({ path: resolve(evidenceDir, `rewind-reset-password-${lang}-mobile-expired-393.png`), fullPage: true });
  });

  test(`forgot-password sent and request-error states fit the Figma phone frame (${lang})`, async ({ page }) => {
    await installHostedAuthFixture(page.context());
    await installApi(page);
    let recoverStatus = 503;
    await page.route(url => url.pathname === "/api/auth/forgot-password", route => route.fulfill({
      status: recoverStatus >= 400 ? recoverStatus : 202,
      json: recoverStatus >= 400 ? { message: "Fixture request failed" } : { message: "Request accepted" },
    }));
    await page.setViewportSize({ width: 393, height: lang === "uk" ? 954 : 934 });
    await page.goto(`/${lang}/forgot-password`);
    await page.locator("#forgot-password-email").fill("reader@example.invalid");
    await page.getByRole("button", { name: lang === "uk" ? "Відновити пароль" : "Reset password" }).click();
    await expect(page.getByRole("alert")).toHaveText(forgotError[lang]);
    const forgotGeometry = () => page.evaluate(() => {
      const rect = (selector: string) => document.querySelector<HTMLElement>(selector)?.getBoundingClientRect().toJSON() ?? null;
      return { email: rect("#forgot-password-email"), message: rect("#forgot-password-error, #forgot-password-success"), submit: rect("form button[type=submit]"), divider: rect("[class*=divider]"), create: rect("a[class*=create]") };
    });
    const errorGeometry = await forgotGeometry();
    const frame = lang === "uk"
      ? { email: 568, message: 630, submit: 714, divider: 827, create: 862, height: 954 }
      : { email: 534, message: 595, submit: 679, divider: 795, create: 829, height: 934 };
    expect(Math.abs(errorGeometry.email!.y - frame.email)).toBeLessThanOrEqual(3);
    expect(Math.abs(errorGeometry.message!.y - frame.message)).toBeLessThanOrEqual(3);
    expect(Math.abs(errorGeometry.message!.height - 64)).toBeLessThanOrEqual(1);
    expect(Math.abs(errorGeometry.submit!.y - frame.submit)).toBeLessThanOrEqual(3);
    expect(Math.abs(errorGeometry.divider!.y - frame.divider)).toBeLessThanOrEqual(4);
    expect(Math.abs(errorGeometry.create!.y - frame.create)).toBeLessThanOrEqual(4);
    expect(errorGeometry.create!.bottom).toBeLessThanOrEqual(frame.height);
    await page.screenshot({ path: resolve(evidenceDir, `rewind-forgot-password-${lang}-mobile-error-393.png`), fullPage: true });
    recoverStatus = 200;
    await page.getByRole("button", { name: lang === "uk" ? "Відновити пароль" : "Reset password" }).click();
    await expect(page.getByRole("status")).toContainText(lang === "uk" ? "Якщо акаунт існує" : "If the account exists");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
    const sentGeometry = await page.evaluate(() => {
      const rect = (selector: string) => document.querySelector<HTMLElement>(selector)?.getBoundingClientRect().toJSON() ?? null;
      return { message: rect("[role=status]"), submit: rect("form button[type=submit]"), divider: rect("[class*=divider]"), create: rect("a[class*=create]") };
    });
    expect(Math.abs(sentGeometry.message!.y - frame.message)).toBeLessThanOrEqual(3);
    expect(Math.abs(sentGeometry.message!.height - 64)).toBeLessThanOrEqual(1);
    expect(Math.abs(sentGeometry.submit!.y - frame.submit)).toBeLessThanOrEqual(3);
    expect(Math.abs(sentGeometry.divider!.y - frame.divider)).toBeLessThanOrEqual(4);
    expect(Math.abs(sentGeometry.create!.y - frame.create)).toBeLessThanOrEqual(4);
    expect(sentGeometry.create!.bottom).toBeLessThanOrEqual(frame.height);
    await page.screenshot({ path: resolve(evidenceDir, `rewind-forgot-password-${lang}-mobile-sent-393.png`), fullPage: true });
  });

  test(`reset-password mismatch and success states render in ${lang}`, async ({ page }) => {
    await installHostedAuthFixture(page.context());
    await installApi(page, true);
    await page.route("**/auth/v1/user", route => route.fulfill({ json: { id: "fixture-user" } }));
    await page.setViewportSize({ width: 393, height: lang === "uk" ? 896 : 852 });
    await signInHostedFixture(page, lang);
    await page.goto(`/${lang}/reset-password?token=fixture-access-7`);
    await page.locator("#reset-password").fill("Valid-password-123!");
    await page.locator("#reset-password-confirm").fill("Different-password-123!");
    await page.getByRole("button", { name: lang === "uk" ? "Змінити пароль" : "Change password" }).click();
    await expect(page.getByRole("alert")).toHaveText(resetMismatch[lang]);
    const mismatchPassword = await page.locator("#reset-password").boundingBox();
    const mismatchConfirm = await page.locator("#reset-password-confirm").boundingBox();
    const mismatchError = await page.locator("#reset-password-error").boundingBox();
    const mismatchSubmit = await page.locator("form button[type=submit]").boundingBox();
    expect(Math.abs(mismatchPassword!.y - (lang === "uk" ? 382 : 338))).toBeLessThanOrEqual(3);
    expect(Math.abs(mismatchConfirm!.y - (lang === "uk" ? 520 : 458))).toBeLessThanOrEqual(4);
    expect(Math.abs(mismatchError!.y - (lang === "uk" ? 571 : 509))).toBeLessThanOrEqual(4);
    expect(Math.abs(mismatchSubmit!.y - (lang === "uk" ? 604 : 542))).toBeLessThanOrEqual(4);
    await page.screenshot({ path: resolve(evidenceDir, `rewind-reset-password-${lang}-mobile-mismatch-393.png`), fullPage: true });
    await page.locator("#reset-password-confirm").fill("Valid-password-123!");
    await page.getByRole("button", { name: lang === "uk" ? "Змінити пароль" : "Change password" }).click();
    await expect(page.getByRole("status")).toContainText(lang === "uk" ? "Пароль змінено." : "Password changed.");
    const success = await page.getByRole("status").boundingBox();
    const successText = await page.getByRole("status").locator("span").boundingBox();
    const successLogin = await page.getByRole("status").getByRole("link").boundingBox();
    expect(success).not.toBeNull();
    expect(Math.abs(success!.y - (lang === "uk" ? 294 : 250))).toBeLessThanOrEqual(2);
    expect(Math.abs(success!.x - 52)).toBeLessThanOrEqual(2);
    expect(Math.abs(success!.width - 290)).toBeLessThanOrEqual(2);
    expect(Math.abs(success!.height - 68)).toBeLessThanOrEqual(2);
    expect(Math.abs(successText!.x - 66)).toBeLessThanOrEqual(2);
    expect(Math.abs(successText!.y - (lang === "uk" ? 314 : 270))).toBeLessThanOrEqual(2);
    expect(Math.abs(successLogin!.x - 230)).toBeLessThanOrEqual(2);
    expect(Math.abs(successLogin!.y - (lang === "uk" ? 314 : 270))).toBeLessThanOrEqual(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
    await page.screenshot({ path: resolve(evidenceDir, `rewind-reset-password-${lang}-mobile-success-393.png`), fullPage: true });
  });
}
