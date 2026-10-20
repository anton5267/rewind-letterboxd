import { expect, test, type Locator, type Page } from "@playwright/test";
import { waitForPageContent } from "./helpers";

const messages = {
  uk: "Пароль перевищує 72 байти UTF-8. Скоротіть його.",
  en: "Password exceeds 72 UTF-8 bytes. Shorten it.",
};
const emptyPage = { content: [], number: 0, size: 12, totalPages: 0, totalElements: 0, first: true, last: true };

/** These form checks intercept every API request; no account or password is written. */
async function isolateFormApi(page: Page) {
  const mutations: { path: string; body: Record<string, string> }[] = [];
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== "GET") {
      mutations.push({ path, body: request.postDataJSON() as Record<string, string> });
      await route.fulfill({ status: 400, json: { message: "Form boundary test: mutation intercepted" } });
    } else if (path === "/api/auth/csrf") {
      await route.fulfill({ json: { token: "form-test-csrf" } });
    } else if (path === "/api/users/me") {
      await route.fulfill({ json: { id: 700001, username: "formreader", role: "USER" } });
    } else if (path === "/api/profile/me") {
      await route.fulfill({ json: {
        id: 700001, username: "formreader", displayName: null, email: "formreader@example.invalid", role: "USER", avatarUrl: null,
        stats: { watched: 0, watchlist: 0, favorites: 0, reviews: 0, ratings: 0 }, lists: [], recentRatings: [], recentReviews: [],
      } });
    } else if (path.endsWith("/social-links")) {
      await route.fulfill({ json: [] });
    } else if (path === "/api/newsletter/subscription") {
      await route.fulfill({ json: { subscribed: false } });
    } else if (path.includes("unread-count")) {
      await route.fulfill({ json: { count: 0 } });
    } else {
      await route.fulfill({ json: emptyPage });
    }
  });
  return mutations;
}

async function checkWritingBoundary(
  page: Page,
  password: Locator,
  submit: Locator,
  error: string,
  mutations: { path: string; body: Record<string, string> }[],
  endpoint: string,
  property: "password" | "newPassword",
  confirm?: Locator,
) {
  await expect(password).toHaveAttribute("maxlength", "72");
  await expect(password).toHaveAttribute("aria-describedby", /password-hint/);
  for (const value of ["ї".repeat(37), "🔑".repeat(19)]) {
    await password.clear();
    await password.fill(value);
    if (confirm) { await confirm.clear(); await confirm.fill(value); }
    await submit.click();
    await expect(page.getByRole("alert")).toHaveText(error);
    expect(mutations, "Overlong UTF-8 passwords must not reach the API").toHaveLength(0);
  }

  await password.clear();
  await password.pressSequentially("a".repeat(73));
  await expect(password, "The native character cap also prevents a 73rd ASCII byte").toHaveValue("a".repeat(72));

  for (const value of ["a".repeat(72), "ї".repeat(36), "🔑".repeat(18)]) {
    await password.clear();
    await password.fill(value);
    if (confirm) { await confirm.clear(); await confirm.fill(value); }
    const previousCount = mutations.length;
    const response = page.waitForResponse(result => new URL(result.url()).pathname === endpoint && result.request().method() !== "GET");
    await submit.click();
    expect((await response).status(), "A controlled response stops this valid boundary request before any account write").toBe(400);
    await expect(submit).toBeEnabled();
    expect(mutations).toHaveLength(previousCount + 1);
    expect(mutations.at(-1)).toEqual({ path: endpoint, body: expect.objectContaining({ [property]: value }) });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
}

for (const lang of ["uk", "en"] as const) {
  test(`registration validates UTF-8 password boundaries in ${lang}`, async ({ page }) => {
    const mutations = await isolateFormApi(page);
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(`/${lang}/register`);
    await waitForPageContent(page);
    await page.locator("#register-username").fill("formreader");
    await page.locator("#register-email").fill("formreader@example.invalid");
    await checkWritingBoundary(page, page.locator("#register-password"), page.locator('main button[type="submit"]'), messages[lang], mutations, "/api/auth/register", "password");
  });

  test(`password reset validates UTF-8 password boundaries in ${lang}`, async ({ page }) => {
    const mutations = await isolateFormApi(page);
    await page.setViewportSize({ width: 393, height: 900 });
    await page.goto(`/${lang}/reset-password?token=unused-form-boundary-token`);
    await waitForPageContent(page);
    await checkWritingBoundary(page, page.locator("#reset-password"), page.locator('main button[type="submit"]'), messages[lang], mutations, "/api/auth/reset-password", "newPassword", page.locator("#reset-password-confirm"));
  });

  test(`profile validates UTF-8 password boundaries in ${lang}`, async ({ page }) => {
    const mutations = await isolateFormApi(page);
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(`/${lang}/profile`);
    await waitForPageContent(page);
    await page.locator("#profile-current-password").fill("legacy");
    await checkWritingBoundary(page, page.locator("#profile-new-password"), page.locator('form[aria-labelledby="profile-password-form-title"] button[type="submit"]'), messages[lang], mutations, "/api/profile/me/password", "newPassword");
  });
}

test("login keeps its six-character legacy password contract", async ({ page }) => {
  const mutations = await isolateFormApi(page);
  await page.goto("/en/login");
  await waitForPageContent(page);
  await page.locator("#login-email").fill("formreader@example.invalid");
  const password = page.locator("#login-password");
  await expect(password).toHaveAttribute("minlength", "6");
  await expect(password).toHaveAttribute("maxlength", "100");
  await password.fill("legacy");
  const response = page.waitForResponse(result => new URL(result.url()).pathname === "/api/auth/login" && result.request().method() === "POST");
  await page.locator('main button[type="submit"]').click();
  expect((await response).status()).toBe(400);
  expect(mutations).toEqual([{ path: "/api/auth/login", body: { email: "formreader@example.invalid", password: "legacy" } }]);
});

test("registration success moves keyboard focus to its heading", async ({ page }) => {
  await isolateFormApi(page);
  await page.route("**/api/auth/register", route => route.fulfill({ status: 200, json: {} }));
  await page.goto("/uk/register");
  await waitForPageContent(page);
  await page.locator("#register-username").fill("formreader");
  await page.locator("#register-email").fill("formreader@example.invalid");
  await page.locator("#register-password").fill("legacy");
  await page.locator('main button[type="submit"]').click();
  const heading = page.locator("#register-success-title");
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
  await heading.press("Tab");
  await expect(page.getByRole("button", { name: "Перейти до входу" })).toBeFocused();
});
