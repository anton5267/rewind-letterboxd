import { expect, request, test, type APIRequestContext, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { cleanupDisposableAccount } from "./helpers";

async function mutate(api: APIRequestContext, method: "POST" | "PATCH" | "DELETE", path: string, data?: unknown) {
  expect((await api.get("/api/auth/csrf")).ok()).toBe(true);
  const cookie = (await api.storageState()).cookies.find(item => item.name === "XSRF-TOKEN");
  expect(cookie).toBeTruthy();
  return api.fetch(path, { method, headers: { "X-XSRF-TOKEN": decodeURIComponent(cookie!.value) }, data });
}

async function findDirectoryUser(page: Page, username: string, userId: number, lang: "uk" | "en") {
  const directory = page.locator("section[aria-labelledby='community-directory']");
  await directory.locator("#community-user-search").fill(username);
  const response = page.waitForResponse(item => {
    const url = new URL(item.url());
    return url.pathname === "/api/users/directory" && url.searchParams.get("q") === username;
  });
  await directory.locator("form").getByRole("button").click();
  expect((await response).ok()).toBe(true);
  const row = directory.locator("li").filter({ has: page.locator(`a[href='/${lang}/users/${userId}']`) });
  await expect(row).toBeVisible();
  return row;
}

test("community directory follows real users, persists unfollow and respects either block direction", async ({ page, baseURL, browser }) => {
  test.setTimeout(60_000);
  const suffix = process.env.E2E_COMMUNITY_FIXTURE_SUFFIX ?? `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  if (!/^\d{13,20}$/.test(suffix)) throw new Error("Community fixture suffix must be 13–20 digits");
  const actorUsername = `community_view_${suffix.slice(-12)}`;
  const targetUsername = `community_target_${suffix.slice(-12)}`;
  const actorEmail = `community-view-${suffix}@example.invalid`;
  const targetEmail = `community-target-${suffix}@example.invalid`;
  const targetIdentity = `Community Target ${suffix}`;
  const password = "E2e-password-123!";
  const targetApi = await request.newContext({ baseURL });
  let actorRegistered = false;
  let targetRegistered = false;
  let actorId: number | undefined;
  let targetId: number | undefined;

  const ownedDirectoryCount = async (username: string) => {
    const response = await targetApi.get(`/api/users/directory?q=${encodeURIComponent(username)}&page=0&size=50`);
    expect(response.ok()).toBe(true);
    const data = await response.json() as { content: { username: string }[] };
    return data.content.filter(user => user.username === username).length;
  };
  try {
    expect(await ownedDirectoryCount(actorUsername)).toBe(0);
    expect(await ownedDirectoryCount(targetUsername)).toBe(0);
    const actor = await mutate(page.request, "POST", "/api/auth/register", { username: actorUsername, email: actorEmail, password });
    expect(actor.ok()).toBe(true);
    actorRegistered = true;
    actorId = (await actor.json() as { id: number }).id;
    const target = await mutate(targetApi, "POST", "/api/auth/register", { username: targetUsername, email: targetEmail, password });
    expect(target.ok()).toBe(true);
    targetRegistered = true;
    targetId = (await target.json() as { id: number }).id;
    expect((await mutate(page.request, "POST", "/api/auth/login", { email: actorEmail, password })).ok()).toBe(true);
    expect((await mutate(targetApi, "POST", "/api/auth/login", { email: targetEmail, password })).ok()).toBe(true);
    expect((await mutate(targetApi, "PATCH", "/api/profile/me", { displayName: targetIdentity })).ok()).toBe(true);
    const fixturePath = test.info().outputPath("owned-community-fixtures.json");
    await writeFile(fixturePath, JSON.stringify({ suffix, actorId, targetId, actorEmail, targetEmail }));
    await test.info().attach("owned-community-fixtures.json", { contentType: "application/json", path: fixturePath });

    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/uk/community");
    let row = await findDirectoryUser(page, targetUsername, targetId, "uk");
    const followLabel = `Підписатися: ${targetIdentity}`;
    const unfollowLabel = `Відписатися: ${targetIdentity}`;
    await expect(row.getByRole("button", { name: followLabel, exact: true })).toBeEnabled();
    const followed = page.waitForResponse(response => new URL(response.url()).pathname === `/api/users/${targetId}/follow` && response.request().method() === "POST");
    await row.getByRole("button", { name: followLabel, exact: true }).click();
    expect((await followed).status()).toBe(204);
    await expect(row.getByRole("button", { name: unfollowLabel, exact: true })).toBeEnabled();
    const followStatus = await page.request.get(`/api/users/${targetId}/follow-status`);
    expect(await followStatus.json()).toMatchObject({ following: true, followers: 1 });
    const notifications = await targetApi.get("/api/notifications?page=0&size=20");
    expect(notifications.ok()).toBe(true);
    const notificationData = await notifications.json() as { content: { type: string; actor: { id: number } | null }[] };
    expect(notificationData.content.some(item => item.type === "FOLLOW" && item.actor?.id === actorId)).toBe(true);

    await page.reload();
    row = await findDirectoryUser(page, targetUsername, targetId, "uk");
    await expect(row.getByRole("button", { name: unfollowLabel, exact: true })).toBeEnabled();
    const unfollowed = page.waitForResponse(response => new URL(response.url()).pathname === `/api/users/${targetId}/follow` && response.request().method() === "DELETE");
    await row.getByRole("button", { name: unfollowLabel, exact: true }).click();
    expect((await unfollowed).status()).toBe(204);
    await expect(row.getByRole("button", { name: followLabel, exact: true })).toBeEnabled();
    expect(await (await page.request.get(`/api/users/${targetId}/follow-status`)).json()).toMatchObject({ following: false, followers: 0 });

    expect((await mutate(page.request, "POST", `/api/users/${targetId}/block`)).ok()).toBe(true);
    await page.reload();
    row = await findDirectoryUser(page, targetUsername, targetId, "uk");
    await expect(row.getByRole("button", { name: `Взаємодію заблоковано: ${targetIdentity}`, exact: true })).toBeDisabled();
    expect((await mutate(page.request, "POST", `/api/users/${targetId}/follow`)).status()).toBe(403);
    expect((await mutate(page.request, "DELETE", `/api/users/${targetId}/block`)).ok()).toBe(true);

    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/en/community");
    row = await findDirectoryUser(page, targetUsername, targetId, "en");
    await expect(row.getByRole("button", { name: `Follow: ${targetIdentity}`, exact: true })).toBeEnabled();
    expect((await mutate(targetApi, "POST", `/api/users/${actorId}/block`)).ok()).toBe(true);
    await page.reload();
    row = await findDirectoryUser(page, targetUsername, targetId, "en");
    await expect(row.getByRole("button", { name: `Interaction blocked: ${targetIdentity}`, exact: true })).toBeDisabled();
    expect(await (await page.request.get(`/api/users/${targetId}/block-status`)).json()).toMatchObject({ blocked: true });

    const selfRow = await findDirectoryUser(page, actorUsername, actorId, "en");
    await expect(selfRow.getByRole("button")).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    const guestContext = await browser.newContext();
    try {
      const guest = await guestContext.newPage();
      await guest.goto(`${baseURL}/en/community`);
      const guestRow = await findDirectoryUser(guest, targetUsername, targetId, "en");
      await expect(guestRow.locator("a[href='/en/login']")).toBeVisible();
      await expect(guestRow.getByRole("button")).toHaveCount(0);
    } finally {
      await guestContext.close();
    }
  } finally {
    try {
      for (const [registered, email] of [[targetRegistered, targetEmail], [actorRegistered, actorEmail]] as const) {
        if (!registered) continue;
        try {
          await cleanupDisposableAccount(baseURL, email, password);
        } catch (error) {
          expect.soft(false, `Owned account cleanup must finish for ${email}: ${String(error)}`).toBe(true);
        }
      }
      const counts = { actor: await ownedDirectoryCount(actorUsername), target: await ownedDirectoryCount(targetUsername) };
      await test.info().attach("post-cleanup-owned-directory-counts.json", { contentType: "application/json", body: JSON.stringify(counts) });
      expect.soft(counts).toEqual({ actor: 0, target: 0 });
    } finally {
      await targetApi.dispose();
    }
  }
});
