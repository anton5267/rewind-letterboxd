import { expect, test, type Page } from "@playwright/test";
import { waitForPageContent } from "./helpers";

const actor = { id: 700001, username: "communityreader", role: "USER" };
const nextActor = { id: 700002, username: "otherreader", role: "USER" };
const ada = { id: 700010, username: "ada", displayName: "Ada Finch", avatarUrl: null };
const bo = { id: 700011, username: "bo", displayName: "Bo Chen", avatarUrl: null };
type Member = typeof ada;
type StatusCall = { actorId: number | null; targetId: number; kind: "follow-status" | "block-status"; attempt: number };
type MutationCall = { actorId: number | null; targetId: number; method: string };
type Reply = { status: number; json?: unknown };

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

function pageOf(content: Member[]) {
  return { content, number: 0, size: 12, totalElements: content.length, totalPages: content.length ? 1 : 0, first: true, last: true };
}

/** All root /api requests are controlled; these checks never write real follow/account data. */
async function communityFixture(page: Page) {
  const state = {
    actor: actor as typeof actor | null,
    nextActor,
    reviewers: [ada] as Member[],
    hq: [ada] as Member[],
    directory: (query: string) => [ada].filter(user => user.displayName.toLowerCase().includes(query.toLowerCase())),
    following: new Map<string, boolean>(),
    blocked: new Set<number>(),
    statusCalls: [] as StatusCall[],
    finishedStatuses: [] as StatusCall[],
    mutations: [] as MutationCall[],
    finishedMutations: [] as MutationCall[],
    statusReply: undefined as ((call: StatusCall) => Reply | undefined | Promise<Reply | undefined>) | undefined,
    mutationReply: undefined as ((call: MutationCall) => Reply | undefined | Promise<Reply | undefined>) | undefined,
  };
  const key = (actorId: number | null, targetId: number) => `${actorId}:${targetId}`;
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const respond = (reply: Reply) => route.fulfill({ status: reply.status, ...(reply.json === undefined ? {} : { json: reply.json }) });
    const relation = path.match(/^\/api\/users\/(\d+)\/(follow-status|block-status|follow)$/);
    if (relation) {
      const targetId = Number(relation[1]);
      const actorId = state.actor?.id ?? null;
      if (relation[2] !== "follow") {
        const kind = relation[2] as StatusCall["kind"];
        const attempt = state.statusCalls.filter(call => call.actorId === actorId && call.targetId === targetId && call.kind === kind).length + 1;
        const call = { actorId, targetId, kind, attempt };
        state.statusCalls.push(call);
        const snapshot = kind === "follow-status"
          ? { following: state.following.get(key(actorId, targetId)) ?? false, followers: 3, followingCount: 1 }
          : { blocked: state.blocked.has(targetId) };
        const reply = await state.statusReply?.(call);
        await respond(reply ?? { status: 200, json: snapshot });
        state.finishedStatuses.push(call);
      } else {
        const call = { actorId, targetId, method: request.method() };
        state.mutations.push(call);
        const reply = await state.mutationReply?.(call) ?? { status: 204 };
        if (reply.status >= 200 && reply.status < 300) state.following.set(key(actorId, targetId), call.method === "POST");
        await respond(reply);
        state.finishedMutations.push(call);
      }
    } else if (path === "/api/users/me") {
      await respond(state.actor ? { status: 200, json: state.actor } : { status: 401 });
    } else if (path === "/api/auth/csrf") {
      await respond({ status: 200, json: { token: "community-form-test-csrf" } });
    } else if (path === "/api/auth/refresh") {
      await respond({ status: state.actor ? 204 : 401 });
    } else if (path === "/api/auth/logout") {
      state.actor = null;
      await respond({ status: 204 });
    } else if (path === "/api/auth/login") {
      state.actor = state.nextActor;
      await respond({ status: 204 });
    } else if (path === "/api/users/popular-reviewers") {
      await respond({ status: 200, json: state.reviewers.map((user, index) => ({ ...user, likes: 30 + index, reviewCount: 12 + index, watchedCount: 80 + index, listCount: 4 + index })) });
    } else if (path === "/api/users/hq") {
      await respond({ status: 200, json: pageOf(state.hq) });
    } else if (path === "/api/users/directory") {
      await respond({ status: 200, json: pageOf(state.directory(url.searchParams.get("q") ?? "")) });
    } else if (path.endsWith("/unread-count")) {
      await respond({ status: 200, json: { count: 0 } });
    } else if (path === "/api/genres") {
      await respond({ status: 200, json: [] });
    } else {
      await respond({ status: 200, json: pageOf([]) });
    }
  });
  return state;
}

async function expectControls(page: Page, name: string, count: number, disabled = false) {
  const controls = page.getByRole("button", { name, exact: true });
  await expect(controls).toHaveCount(count);
  for (const control of await controls.all()) {
    if (disabled) await expect(control).toBeDisabled();
    else await expect(control).toBeEnabled();
  }
  return controls;
}

async function switchActor(page: Page) {
  await page.locator("header").getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/login$/);
  await page.locator("#login-email").fill("otherreader@example.invalid");
  await page.locator("#login-password").fill("legacy");
  await page.locator('main button[type="submit"]').click();
  await expect(page).toHaveURL(/\/en\/films$/);
  await page.locator("header").getByRole("link", { name: "Community", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/community$/);
  await waitForPageContent(page);
}

for (const failedKind of ["follow-status", "block-status"] as const) {
  test(`community waits for both statuses and retries a failed ${failedKind} without a mutation`, async ({ page }) => {
    const state = await communityFixture(page);
    const gate = deferred();
    state.statusReply = async call => {
      if (call.targetId === ada.id && call.kind === failedKind && call.attempt === 1) {
        await gate.promise;
        return { status: 503, json: { message: "Controlled status failure" } };
      }
    };
    try {
      await page.setViewportSize({ width: 393, height: 900 });
      await page.goto("/en/community");
      await waitForPageContent(page);
      await expectControls(page, "Loading...: Ada Finch", 3, true);
      expect(state.statusCalls.filter(call => call.targetId === ada.id)).toHaveLength(2);
      gate.resolve();
      const retry = await expectControls(page, "Retry: Ada Finch", 3);
      const error = "Could not load the follow status.";
      await expect(page.getByRole("alert").filter({ hasText: error }).first()).toBeVisible();
      await retry.first().click();
      await expectControls(page, "Follow: Ada Finch", 3);
      expect(state.statusCalls.filter(call => call.targetId === ada.id)).toHaveLength(4);
      expect(state.mutations).toHaveLength(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    } finally { gate.resolve(); }
  });
}

test("community duplicate rows share keyboard follow state and prevent a second pending mutation", async ({ page }) => {
  const state = await communityFixture(page);
  const gate = deferred();
  state.mutationReply = async call => { if (call.method === "POST") await gate.promise; };
  try {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/uk/community");
    await waitForPageContent(page);
    const follow = await expectControls(page, "Підписатися: Ada Finch", 3);
    await follow.first().focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await expectControls(page, "Завантаження...: Ada Finch", 3, true);
    await expect.poll(() => state.mutations).toEqual([{ actorId: actor.id, targetId: ada.id, method: "POST" }]);
    gate.resolve();
    const unfollow = await expectControls(page, "Відписатися: Ada Finch", 3);
    await unfollow.last().focus();
    await page.keyboard.press("Space");
    await expectControls(page, "Підписатися: Ada Finch", 3);
    expect(state.mutations.map(call => call.method)).toEqual(["POST", "DELETE"]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  } finally { gate.resolve(); }
});

test("community guards guests, the current user and blocked interactions", async ({ page }) => {
  const state = await communityFixture(page);
  state.actor = null;
  state.reviewers.push({ id: actor.id, username: actor.username, displayName: "Current User", avatarUrl: null });
  await page.goto("/en/community");
  await waitForPageContent(page);
  const guestLinks = page.getByRole("link", { name: "Follow: Ada Finch", exact: true });
  await expect(guestLinks).toHaveCount(3);
  for (const link of await guestLinks.all()) await expect(link).toHaveAttribute("href", "/en/login");
  expect(state.statusCalls).toHaveLength(0);
  state.actor = actor;
  state.blocked.add(ada.id);
  await page.reload();
  await waitForPageContent(page);
  await expectControls(page, "Interaction blocked: Ada Finch", 3, true);
  await expect(page.getByRole("button", { name: /: Current User$/ })).toHaveCount(0);
  expect(state.statusCalls.filter(call => call.targetId === actor.id)).toHaveLength(0);
  expect(state.mutations).toHaveLength(0);
});

test("community mutation failure retries status without replaying follow and observes a new block", async ({ page }) => {
  const state = await communityFixture(page);
  state.mutationReply = () => {
    state.blocked.add(ada.id);
    return { status: 403, json: { message: "User interaction is blocked" } };
  };
  await page.goto("/en/community");
  await waitForPageContent(page);
  const follow = await expectControls(page, "Follow: Ada Finch", 3);
  await follow.first().click();
  const retry = await expectControls(page, "Retry: Ada Finch", 3);
  await expect(page.getByRole("alert").filter({ hasText: "Could not change the follow status." }).first()).toBeVisible();
  await retry.last().click();
  await expectControls(page, "Interaction blocked: Ada Finch", 3, true);
  expect(state.mutations).toHaveLength(1);
});

test("community ignores an old actor's delayed follow status after logout and another login", async ({ page }) => {
  const state = await communityFixture(page);
  const gate = deferred();
  state.statusReply = async call => {
    if (call.actorId === actor.id && call.kind === "follow-status") {
      await gate.promise;
      return { status: 200, json: { following: true, followers: 3, followingCount: 1 } };
    }
  };
  try {
    await page.goto("/en/community");
    await waitForPageContent(page);
    await expectControls(page, "Loading...: Ada Finch", 3, true);
    await switchActor(page);
    await expectControls(page, "Follow: Ada Finch", 3);
    gate.resolve();
    await expect.poll(() => state.finishedStatuses.some(call => call.actorId === actor.id && call.kind === "follow-status")).toBe(true);
    await expectControls(page, "Follow: Ada Finch", 3);
    await expect(page.getByRole("button", { name: "Unfollow: Ada Finch", exact: true })).toHaveCount(0);
    expect(state.mutations).toHaveLength(0);
  } finally { gate.resolve(); }
});

test("community ignores an old actor's delayed mutation after another login", async ({ page }) => {
  const state = await communityFixture(page);
  const gate = deferred();
  state.mutationReply = async call => { if (call.actorId === actor.id) await gate.promise; };
  try {
    await page.goto("/en/community");
    await waitForPageContent(page);
    const follow = await expectControls(page, "Follow: Ada Finch", 3);
    await follow.first().click();
    await expectControls(page, "Loading...: Ada Finch", 3, true);
    await switchActor(page);
    await expectControls(page, "Follow: Ada Finch", 3);
    gate.resolve();
    await expect.poll(() => state.finishedMutations.length).toBe(1);
    await expectControls(page, "Follow: Ada Finch", 3);
    await expect(page.getByRole("button", { name: "Unfollow: Ada Finch", exact: true })).toHaveCount(0);
    expect(state.mutations).toHaveLength(1);
  } finally { gate.resolve(); }
});

test("community directory changes keep pending mutations attached to the correct user", async ({ page }) => {
  const state = await communityFixture(page);
  state.reviewers = [];
  state.hq = [];
  state.directory = query => [ada, bo].filter(user => user.displayName.toLowerCase().includes(query.toLowerCase()));
  const gate = deferred();
  state.mutationReply = async call => { if (call.targetId === ada.id) await gate.promise; };
  try {
    await page.setViewportSize({ width: 393, height: 900 });
    await page.goto("/en/community");
    await waitForPageContent(page);
    const followAda = await expectControls(page, "Follow: Ada Finch", 1);
    await expectControls(page, "Follow: Bo Chen", 1);
    await followAda.first().click();
    await expectControls(page, "Loading...: Ada Finch", 1, true);
    const directory = page.locator('section[aria-labelledby="community-directory"]');
    await directory.getByLabel("Search users", { exact: true }).fill("Bo");
    await directory.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.getByRole("button", { name: /: Ada Finch$/ })).toHaveCount(0);
    const followBo = await expectControls(page, "Follow: Bo Chen", 1);
    await followBo.first().click();
    await expectControls(page, "Unfollow: Bo Chen", 1);
    gate.resolve();
    await expect.poll(() => state.finishedMutations.some(call => call.targetId === ada.id)).toBe(true);
    await expectControls(page, "Unfollow: Bo Chen", 1);
    await directory.getByLabel("Search users", { exact: true }).fill("");
    await directory.getByRole("button", { name: "Search", exact: true }).click();
    await expectControls(page, "Unfollow: Ada Finch", 1);
    await expectControls(page, "Unfollow: Bo Chen", 1);
    expect(state.mutations.map(call => call.targetId)).toEqual([ada.id, bo.id]);
  } finally { gate.resolve(); }
});

for (const lang of ["uk", "en"] as const) {
  test(`popular reviewers reuse follow controls and guards at 320 and 393px in ${lang}`, async ({ page }) => {
    const state = await communityFixture(page);
    state.reviewers = [ada, bo, { id: actor.id, username: actor.username, displayName: "Current User", avatarUrl: null }];
    state.blocked.add(bo.id);
    const followName = `${lang === "uk" ? "Підписатися" : "Follow"}: Ada Finch`;
    const unfollowName = `${lang === "uk" ? "Відписатися" : "Unfollow"}: Ada Finch`;
    const blockedName = `${lang === "uk" ? "Взаємодію заблоковано" : "Interaction blocked"}: Bo Chen`;
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(`/${lang}/community/reviewers`);
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.locator("#route-loading-title")).toHaveCount(0);
    await expect(page.locator("#popular-reviewers-title")).toBeVisible();
    for (const width of [320, 393]) {
      await page.setViewportSize({ width, height: 900 });
      const follow = await expectControls(page, followName, 1);
      await expectControls(page, blockedName, 1, true);
      await expect(page.getByRole("button", { name: /: Current User$/ })).toHaveCount(0);
      expect(state.statusCalls.filter(call => call.targetId === actor.id)).toHaveLength(0);
      await follow.first().focus();
      await page.keyboard.press("Enter");
      const unfollow = await expectControls(page, unfollowName, 1);
      await unfollow.first().focus();
      await page.keyboard.press("Space");
      await expectControls(page, followName, 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${lang} popular reviewers at ${width}px`).toBe(0);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.getByText(lang === "uk" ? "Переглядайте профілі найпопулярніших і найшанованіших рецензентів." : "Explore the profiles of our most followed and respected reviewers.")).toBeVisible();
    await expect(page.getByRole("group", { name: lang === "uk" ? "Статистика рецензента" : "Reviewer statistics" })).toHaveCount(3);
    const reviewerTable = page.locator("#reviewer-list").locator("..");
    const tableBox = await reviewerTable.boundingBox();
    expect(tableBox?.width).toBeCloseTo(1200, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    expect(state.mutations.map(call => [call.targetId, call.method])).toEqual([
      [ada.id, "POST"], [ada.id, "DELETE"], [ada.id, "POST"], [ada.id, "DELETE"],
    ]);
    const statusCount = state.statusCalls.length;
    state.actor = null;
    await page.reload();
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.locator("#route-loading-title")).toHaveCount(0);
    await expect(page.locator("#popular-reviewers-title")).toBeVisible();
    const guestLink = page.getByRole("link", { name: followName, exact: true });
    await expect(guestLink).toHaveAttribute("href", `/${lang}/login`);
    await expect(page.getByRole("button", { name: /: (Ada Finch|Bo Chen|Current User)$/ })).toHaveCount(0);
    expect(state.statusCalls).toHaveLength(statusCount);
    expect(state.mutations).toHaveLength(4);
  });
}
