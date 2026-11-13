import { expect, test, type Page, type Route } from "@playwright/test";

const user = { id: 987001, username: "password-fixture-owner", role: "USER" };
const profile = {
  ...user, displayName: "Password Fixture Owner", email: "password-fixture@example.invalid",
  avatarUrl: null, bio: null, location: null, pronoun: null, supabaseLinked: true,
  stats: { ratings: 0, reviews: 0, watched: 0, watchlist: 0, favorites: 0 },
  lists: [], recentRatings: [], recentReviews: [],
};
const currentPassword = "Fixture-current-password-123!";
const newPassword = "Fixture-new-password-456!";
const emptyPage = { content: [], number: 0, size: 12, totalPages: 0, totalElements: 0 };

async function installFixture(page: Page, onPassword: (route: Route) => Promise<void>) {
  let logoutCalls = 0;
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/profile/me/password") return onPassword(route);
    if (pathname === "/api/auth/logout") {
      logoutCalls += 1;
      return route.fulfill({ status: 204 });
    }
    if (pathname === "/api/users/me") return logoutCalls > 0
      ? route.fulfill({ status: 401, json: {} }) : route.fulfill({ json: user });
    if (pathname === "/api/profile/me") return route.fulfill({ json: profile });
    if (pathname === "/api/auth/csrf") return route.fulfill({ json: { token: "password-fixture-csrf" } });
    if (pathname === "/api/auth/refresh") return route.fulfill({ status: 401, json: {} });
    if (pathname.includes("unread-count")) return route.fulfill({ json: { count: 0 } });
    if (pathname.endsWith("/ratings") || pathname.endsWith("/reviews") || pathname.endsWith("/favorites")
      || pathname.endsWith("/activity") || pathname.endsWith("/following") || pathname.endsWith("/followers")) {
      return route.fulfill({ json: emptyPage });
    }
    return route.fulfill({ json: [] });
  });
  return () => logoutCalls;
}

for (const lang of ["uk", "en"] as const) {
  const copy = lang === "uk"
    ? { change: "Змінити пароль", error: "Перевірте поточний і новий пароль.", changed: "Пароль змінено. Увійдіть знову." }
    : { change: "Change password", error: "Check your current and new passwords.", changed: "Password changed. Please log in again." };

  test(`password settings retry focuses action error and signs out after success in ${lang}`, async ({ page }) => {
    const passwordBodies: Record<string, unknown>[] = [];
    const logoutCalls = await installFixture(page, async route => {
      passwordBodies.push(route.request().postDataJSON());
      return passwordBodies.length === 1
        ? route.fulfill({ status: 503, json: { message: "Fixture password update failure" } })
        : route.fulfill({ status: 200, body: "Password updated" });
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/${lang}/profile?settings=authentication`);
    const form = page.locator("#settings-form-authentication");
    await form.locator("#profile-current-password").fill(currentPassword);
    await form.locator("#profile-new-password").fill(newPassword);
    await form.locator("#profile-confirm-new-password").fill(newPassword);
    const submit = form.getByRole("button", { name: copy.change, exact: true });
    await submit.focus();
    await submit.press("Enter");
    const error = page.locator("#profile-action-error");
    await expect(error).toHaveText(copy.error);
    await expect(error).toBeFocused();
    await expect(form.locator("#profile-current-password")).toHaveValue(currentPassword);
    await expect(form.locator("#profile-new-password")).toHaveValue(newPassword);
    await expect(form.locator("#profile-confirm-new-password")).toHaveValue(newPassword);
    expect(logoutCalls()).toBe(0);

    await submit.click();
    await expect(page).toHaveURL(`/${lang}/login?passwordChanged=1`);
    await expect(page.getByText(copy.changed, { exact: true })).toBeVisible();
    expect(logoutCalls()).toBe(1);
    expect(passwordBodies).toEqual([
      { currentPassword, newPassword },
      { currentPassword, newPassword },
    ]);
  });

  test(`password settings delayed failure stays scoped after switching tabs in ${lang}`, async ({ page }) => {
    let releaseFailure!: () => void;
    const responseGate = new Promise<void>(resolve => { releaseFailure = resolve; });
    const logoutCalls = await installFixture(page, async route => {
      await responseGate;
      await route.fulfill({ status: 503, json: { message: "Delayed fixture password failure" } });
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/${lang}/profile?settings=authentication`);
    const form = page.locator("#settings-form-authentication");
    await form.locator("#profile-current-password").fill(currentPassword);
    await form.locator("#profile-new-password").fill(newPassword);
    await form.locator("#profile-confirm-new-password").fill(newPassword);
    const requestStarted = page.waitForRequest(request => new URL(request.url()).pathname === "/api/profile/me/password");
    await form.getByRole("button", { name: copy.change, exact: true }).click();
    await requestStarted;
    await page.locator(`a[href="/${lang}/profile?settings=profile"]:visible`).first().click();
    await expect(page).toHaveURL(`/${lang}/profile?settings=profile`);
    const displayName = page.locator("#profile-display-name");
    await displayName.fill("Unaffected profile draft");
    await displayName.focus();
    const requestFinished = page.waitForResponse(response => new URL(response.url()).pathname === "/api/profile/me/password");
    releaseFailure();
    await requestFinished;
    await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
    await expect(page.locator("#profile-action-error")).toHaveCount(0);
    await expect(displayName).toBeFocused();
    await expect(displayName).toHaveValue("Unaffected profile draft");
    expect(logoutCalls()).toBe(0);
  });
}
