import { expect, test } from "@playwright/test";

test("admin user table pages, filters and updates the visible row", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "Run scripts/verify-admin-browser.ps1 for the disposable ADMIN fixture.");

  await page.goto("/uk/login");
  await page.getByLabel("Електронна пошта").fill(email!);
  await page.getByLabel("Пароль").fill(password!);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);

  const user = (id: number, username: string) => ({
    id, username, displayName: null, email: `${username}@example.invalid`, role: "USER",
    avatarUrl: null, isActive: true, isHq: false,
  });
  const requested: string[] = [];
  await page.route(/\/api\/admin\/users(?:\?.*)?$/, async route => {
    const url = new URL(route.request().url());
    requested.push(url.search);
    const query = url.searchParams.get("q") ?? "";
    const pageNumber = Number(url.searchParams.get("page") ?? "0");
    if (query === "needle") {
      await route.fulfill({ json: { content: [user(99999, "needle-user")], totalPages: 1, totalElements: 1 } });
      return;
    }
    const content = pageNumber === 0
      ? Array.from({ length: 50 }, (_, index) => user(90000 + index, `fake-user-${index + 1}`))
      : [user(90050, "fake-user-51")];
    await route.fulfill({ json: { content, totalPages: 2, totalElements: 51 } });
  });
  await page.route("**/api/admin/users/99999/deactivate", route => route.fulfill({ status: 200, body: "" }));

  await page.goto("/uk/admin");
  const users = page.getByRole("region", { name: "Користувачі" });
  await expect(users).toHaveAttribute("aria-busy", "false");
  await expect(users.getByRole("listitem")).toHaveCount(50);
  await expect(users.getByRole("status")).toHaveText("Сторінка 1 з 2 · 51");

  await users.getByRole("button", { name: "Далі" }).click();
  await expect(users.getByRole("listitem")).toHaveCount(1);
  await expect(users.getByText("fake-user-51", { exact: false })).toBeVisible();
  await expect(users.getByRole("status")).toHaveText("Сторінка 2 з 2 · 51");

  await users.getByLabel("Пошук користувача").fill("needle");
  await users.getByRole("button", { name: "Пошук" }).click();
  await expect(users.getByText("needle-user", { exact: false })).toBeVisible();
  await expect(users.getByRole("status")).toHaveText("Сторінка 1 з 1 · 1");
  await users.getByRole("button", { name: "Заблокувати" }).click();
  await expect(users.getByText("заблокований", { exact: false })).toBeVisible();

  expect(requested.some(search => search.includes("page=1"))).toBeTruthy();
  expect(requested.some(search => search.includes("q=needle") && search.includes("page=0"))).toBeTruthy();
});

test("admin list table returns from an emptied last page", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "Run scripts/verify-admin-browser.ps1 for the disposable ADMIN fixture.");

  await page.goto("/uk/login");
  await page.getByLabel("Електронна пошта").fill(email!);
  await page.getByLabel("Пароль").fill(password!);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);

  let deleted = false;
  const list = (id: number, name: string) => ({
    id, userId: 1, username: "fixture-owner", name, description: null, listType: "CUSTOM",
    isPublic: true, itemCount: 0, createdAt: "2026-10-17T00:00:00Z", updatedAt: "2026-10-17T00:00:00Z",
  });
  await page.route(/\/api\/admin\/lists(?:\?.*)?$/, async route => {
    const pageNumber = Number(new URL(route.request().url()).searchParams.get("page") ?? "0");
    const firstPage = Array.from({ length: 50 }, (_, index) => list(71000 + index, `fixture-list-${index + 1}`));
    if (deleted) await route.fulfill({ json: { content: firstPage, totalPages: 1, totalElements: 50 } });
    else if (pageNumber === 0) await route.fulfill({ json: { content: firstPage, totalPages: 2, totalElements: 51 } });
    else await route.fulfill({ json: { content: [list(77777, "fixture-list-51")], totalPages: 2, totalElements: 51 } });
  });
  await page.route("**/api/admin/lists/77777", async route => {
    if (route.request().method() !== "DELETE") return route.fallback();
    deleted = true;
    await route.fulfill({ status: 204, body: "" });
  });

  await page.goto("/uk/admin");
  const lists = page.getByRole("region", { name: "Списки" });
  await expect(lists.getByRole("listitem")).toHaveCount(50);
  await expect(lists.getByRole("status")).toHaveText("Сторінка 1 з 2 · 51");
  await lists.getByRole("button", { name: "Далі" }).click();
  await expect(lists.getByRole("listitem")).toHaveCount(1);
  await expect(lists.getByText("fixture-list-51", { exact: false })).toBeVisible();

  page.once("dialog", dialog => dialog.accept());
  await lists.getByRole("button", { name: "Видалити список" }).click();
  await expect(lists.getByRole("listitem")).toHaveCount(50);
  await expect(lists.getByRole("status")).toHaveText("Сторінка 1 з 1 · 50");
  expect(deleted).toBeTruthy();
});

test("admin comment and review tables page, filter and recover after moderation", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "Run scripts/verify-admin-browser.ps1 for the disposable ADMIN fixture.");

  await page.goto("/uk/login");
  await page.getByLabel("Електронна пошта").fill(email!);
  await page.getByLabel("Пароль").fill(password!);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);

  const comment = (id: number, hidden = false) => ({
    id, reviewId: 1, userId: 1, username: "fixture-user", content: `fixture-comment-${id}`,
    isHidden: hidden, moderatedReason: null, moderatedAt: null, createdAt: "2026-10-17T00:00:00Z",
  });
  const review = (id: number, hidden = false) => ({
    id, movieId: 1, movieTitle: "Fixture film", userId: 1, username: "fixture-user",
    content: `fixture-review-${id}`, rating: 4, isHidden: hidden, moderatedReason: null,
    moderatedAt: null, createdAt: "2026-10-17T00:00:00Z",
  });
  let lastReviewHidden = false;
  const commentRequests: string[] = [];
  const reviewRequests: string[] = [];
  await page.route(/\/api\/admin\/comments(?:\?.*)?$/, async route => {
    const url = new URL(route.request().url());
    commentRequests.push(url.search);
    const pageNumber = Number(url.searchParams.get("page") ?? "0");
    const hidden = url.searchParams.get("hidden");
    if (hidden === "true") {
      await route.fulfill({ json: { content: [comment(88999, true)], totalPages: 1, totalElements: 1 } });
      return;
    }
    const content = pageNumber === 0
      ? Array.from({ length: 50 }, (_, index) => comment(88000 + index))
      : [comment(88050)];
    await route.fulfill({ json: { content, totalPages: 2, totalElements: 51 } });
  });
  await page.route(/\/api\/admin\/reviews(?:\?.*)?$/, async route => {
    const url = new URL(route.request().url());
    reviewRequests.push(url.search);
    const pageNumber = Number(url.searchParams.get("page") ?? "0");
    const visibleOnly = url.searchParams.get("hidden") === "false";
    const firstPage = Array.from({ length: 50 }, (_, index) => review(99000 + index));
    if (visibleOnly && lastReviewHidden) {
      await route.fulfill({ json: { content: firstPage, totalPages: 1, totalElements: 50 } });
      return;
    }
    const content = pageNumber === 0 ? firstPage : [review(99050)];
    await route.fulfill({ json: { content, totalPages: 2, totalElements: 51 } });
  });
  await page.route("**/api/admin/reviews/99050/hide", async route => {
    lastReviewHidden = true;
    await route.fulfill({ json: review(99050, true) });
  });

  await page.goto("/uk/admin");
  const comments = page.getByRole("region", { name: "Коментарі" });
  await expect(comments).toHaveAttribute("aria-busy", "false");
  await expect(comments.getByRole("listitem")).toHaveCount(50);
  await comments.getByRole("button", { name: "Далі" }).click();
  await expect(comments.getByText("fixture-comment-88050", { exact: false })).toBeVisible();
  await expect(comments.getByRole("status")).toHaveText("Сторінка 2 з 2 · 51");
  await comments.getByRole("combobox").selectOption("hidden");
  await expect(comments.getByText("fixture-comment-88999", { exact: false })).toBeVisible();
  await expect(comments.getByRole("status")).toHaveText("Сторінка 1 з 1 · 1");

  const reviews = page.getByRole("region", { name: "Огляди" });
  await reviews.getByRole("combobox").selectOption("visible");
  await expect(reviews.getByRole("listitem")).toHaveCount(50);
  await reviews.getByRole("button", { name: "Далі" }).click();
  await expect(reviews.getByText("fixture-review-99050", { exact: false })).toBeVisible();
  await reviews.getByRole("button", { name: "Приховати" }).click();
  await expect(reviews.getByRole("listitem")).toHaveCount(50);
  await expect(reviews.getByRole("status")).toHaveText("Сторінка 1 з 1 · 50");

  expect(commentRequests.some(search => search.includes("page=1"))).toBeTruthy();
  expect(commentRequests.some(search => search.includes("hidden=true") && search.includes("page=0"))).toBeTruthy();
  expect(reviewRequests.some(search => search.includes("hidden=false") && search.includes("page=1"))).toBeTruthy();
  expect(lastReviewHidden).toBeTruthy();
});

test("admin notification table pages, filters and recovers after delete", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "Run scripts/verify-admin-browser.ps1 for the disposable ADMIN fixture.");

  await page.goto("/uk/login");
  await page.getByLabel("Електронна пошта").fill(email!);
  await page.getByLabel("Пароль").fill(password!);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);

  let deleted = false;
  const requests: string[] = [];
  const notification = (id: number, read = false) => ({
    id, recipientId: 70001, actorId: 70002, type: "FOLLOW", reviewId: null,
    createdAt: "2026-10-17T00:00:00Z", readAt: read ? "2026-10-17T01:00:00Z" : null,
  });
  await page.route(/\/api\/admin\/notifications(?:\?.*)?$/, async route => {
    if (route.request().method() !== "GET") return route.fallback();
    const url = new URL(route.request().url());
    requests.push(url.search);
    const pageNumber = Number(url.searchParams.get("page") ?? "0");
    if (url.searchParams.get("read") === "true") {
      await route.fulfill({ json: { content: [notification(92998, true)], totalPages: 1, totalElements: 1 } });
      return;
    }
    const firstPage = Array.from({ length: 50 }, (_, index) => notification(92000 + index));
    if (deleted) await route.fulfill({ json: { content: firstPage, totalPages: 1, totalElements: 50 } });
    else if (pageNumber === 0) await route.fulfill({ json: { content: firstPage, totalPages: 2, totalElements: 51 } });
    else await route.fulfill({ json: { content: [notification(92999)], totalPages: 2, totalElements: 51 } });
  });
  await page.route("**/api/admin/notifications/92999", async route => {
    if (route.request().method() !== "DELETE") return route.fallback();
    deleted = true;
    await route.fulfill({ status: 204, body: "" });
  });

  await page.goto("/uk/admin");
  const notifications = page.getByRole("region", { name: "Сповіщення" });
  const pagination = notifications.getByRole("navigation", { name: "Сторінки сповіщень" });
  await expect(notifications).toHaveAttribute("aria-busy", "false");
  await expect(notifications.getByRole("listitem")).toHaveCount(50);
  await pagination.getByRole("button", { name: "Далі" }).click();
  await expect(notifications.getByRole("listitem")).toHaveCount(1);
  await expect(pagination.getByRole("status")).toHaveText("Сторінка 2 з 2 · 51");

  page.once("dialog", dialog => dialog.accept());
  await notifications.getByRole("button", { name: "Видалити сповіщення" }).click();
  await expect(notifications.getByRole("listitem")).toHaveCount(50);
  await expect(pagination.getByRole("status")).toHaveText("Сторінка 1 з 1 · 50");

  await notifications.getByLabel("Фільтр стану").selectOption("read");
  await notifications.getByRole("button", { name: "Фільтрувати" }).click();
  await expect(notifications.getByRole("listitem")).toHaveCount(1);
  await expect(pagination.getByRole("status")).toHaveText("Сторінка 1 з 1 · 1");
  expect(requests.some(search => search.includes("read=true") && search.includes("page=0"))).toBeTruthy();
  expect(deleted).toBeTruthy();
});

test("admin conversation table returns from an emptied last page", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "Run scripts/verify-admin-browser.ps1 for the disposable ADMIN fixture.");

  await page.goto("/uk/login");
  await page.getByLabel("Електронна пошта").fill(email!);
  await page.getByLabel("Пароль").fill(password!);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);

  let deleted = false;
  const conversation = (id: number) => ({
    id, userOneId: id + 1, userTwoId: id + 2, messageCount: 3,
    createdAt: "2026-10-17T00:00:00Z", updatedAt: "2026-10-17T00:00:00Z", lastMessageAt: null,
  });
  await page.route(/\/api\/admin\/conversations(?:\?.*)?$/, async route => {
    if (route.request().method() !== "GET") return route.fallback();
    const pageNumber = Number(new URL(route.request().url()).searchParams.get("page") ?? "0");
    const firstPage = Array.from({ length: 50 }, (_, index) => conversation(91000 + index));
    if (deleted) await route.fulfill({ json: { content: firstPage, totalPages: 1, totalElements: 50 } });
    else if (pageNumber === 0) await route.fulfill({ json: { content: firstPage, totalPages: 2, totalElements: 51 } });
    else await route.fulfill({ json: { content: [conversation(91999)], totalPages: 2, totalElements: 51 } });
  });
  await page.route("**/api/admin/conversations/91999", async route => {
    if (route.request().method() !== "DELETE") return route.fallback();
    deleted = true;
    await route.fulfill({ status: 204, body: "" });
  });

  await page.goto("/uk/admin");
  const conversations = page.getByRole("region", { name: "Діалоги" });
  const pagination = conversations.getByRole("navigation", { name: "Сторінки діалогів" });
  await expect(conversations).toHaveAttribute("aria-busy", "false");
  await expect(conversations.getByRole("listitem")).toHaveCount(50);
  await pagination.getByRole("button", { name: "Далі" }).click();
  await expect(conversations.getByRole("listitem")).toHaveCount(1);
  await expect(pagination.getByRole("status")).toHaveText("Сторінка 2 з 2 · 51");

  page.once("dialog", dialog => dialog.accept());
  await conversations.getByRole("button", { name: "Видалити діалог" }).click();
  await expect(conversations.getByRole("listitem")).toHaveCount(50);
  await expect(pagination.getByRole("status")).toHaveText("Сторінка 1 з 1 · 50");
  expect(deleted).toBeTruthy();
});

test("admin journal editor pages through all articles", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "Run scripts/verify-admin-browser.ps1 for the disposable ADMIN fixture.");

  await page.goto("/uk/login");
  await page.getByLabel("Електронна пошта").fill(email!);
  await page.getByLabel("Пароль").fill(password!);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);

  const requests: string[] = [];
  const article = (id: number) => ({
    id,
    slug: `fixture-article-${id}`,
    language: "uk",
    category: "Новини",
    title: `fixture-article-${id}`,
    excerpt: null,
    content: `fixture content ${id}`,
    coverUrl: null,
    audioUrl: null,
    publishedAt: null,
  });
  await page.route(/\/api\/admin\/journal\/articles(?:\?.*)?$/, async route => {
    const url = new URL(route.request().url());
    requests.push(url.search);
    const pageNumber = Number(url.searchParams.get("page") ?? "0");
    const content = pageNumber === 0
      ? Array.from({ length: 50 }, (_, index) => article(93000 + index))
      : [article(93050)];
    await route.fulfill({ json: { content, totalPages: 2, totalElements: 51 } });
  });

  await page.goto("/uk/admin");
  const editor = page.getByRole("region", { name: "Редактор журналу" });
  const pagination = editor.getByRole("navigation", { name: "Сторінки статей" });
  await expect(editor).toHaveAttribute("aria-busy", "false");
  await expect(editor.getByRole("listitem")).toHaveCount(50);
  await expect(pagination.getByRole("status")).toHaveText("Сторінка 1 з 2 · 51");

  await pagination.getByRole("button", { name: "Далі" }).click();
  await expect(editor.getByRole("listitem")).toHaveCount(1);
  await expect(editor.getByText("fixture-article-93050", { exact: false })).toBeVisible();
  await expect(pagination.getByRole("status")).toHaveText("Сторінка 2 з 2 · 51");
  expect(requests.some(search => search.includes("page=1") && search.includes("size=50"))).toBeTruthy();
});

test("admin audit log pages through all actions", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "Run scripts/verify-admin-browser.ps1 for the disposable ADMIN fixture.");

  await page.goto("/uk/login");
  await page.getByLabel("Електронна пошта").fill(email!);
  await page.getByLabel("Пароль").fill(password!);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);

  const requests: string[] = [];
  const auditLog = (id: number) => ({
    id,
    adminId: 1,
    action: `FIXTURE_ACTION_${id}`,
    targetType: "TEST",
    targetId: id,
    metadata: null,
    createdAt: "2026-10-18T00:00:00Z",
  });
  await page.route(/\/api\/admin\/audit-logs(?:\?.*)?$/, async route => {
    const url = new URL(route.request().url());
    requests.push(url.search);
    const pageNumber = Number(url.searchParams.get("page") ?? "0");
    const content = pageNumber === 0
      ? Array.from({ length: 50 }, (_, index) => auditLog(94000 + index))
      : [auditLog(94050)];
    await route.fulfill({ json: { content, totalPages: 2, totalElements: 51 } });
  });

  await page.goto("/uk/admin");
  const audit = page.getByRole("region", { name: "Журнал дій" });
  const pagination = audit.getByRole("navigation", { name: "Сторінки журналу дій" });
  await expect(audit).toHaveAttribute("aria-busy", "false");
  await expect(audit.getByRole("listitem")).toHaveCount(50);
  await expect(pagination.getByRole("status")).toHaveText("Сторінка 1 з 2 · 51");

  await pagination.getByRole("button", { name: "Далі" }).click();
  await expect(audit.getByRole("listitem")).toHaveCount(1);
  await expect(audit.getByText("Інша дія адміністратора", { exact: false })).toBeVisible();
  await expect(audit.getByText("Інший об’єкт", { exact: false })).toBeVisible();
  await expect(pagination.getByRole("status")).toHaveText("Сторінка 2 з 2 · 51");
  expect(requests.some(search => search.includes("page=1") && search.includes("size=50"))).toBeTruthy();
});

test("message screen shows honest loading states and pages older messages on mobile", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "Run scripts/verify-admin-browser.ps1 for the disposable ADMIN fixture.");

  await page.goto("/uk/login");
  await page.getByLabel("Електронна пошта").fill(email!);
  await page.getByLabel("Пароль").fill(password!);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);

  const messageRequests: string[] = [];
  const conversation = {
    id: 95000,
    otherUser: { id: 95001, username: "fixture-chat-user", displayName: "Fixture Chat User", avatarUrl: null },
    updatedAt: "2026-10-18T00:00:00Z",
    lastMessage: null,
  };
  const message = (id: number) => ({
    id,
    conversationId: conversation.id,
    senderId: 95001,
    body: `fixture-message-${id}`,
    createdAt: "2026-10-18T00:00:00Z",
    readAt: null,
  });
  await page.route(/\/api\/conversations(?:\?.*)?$/, async route => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({ json: { content: [conversation], totalPages: 1, totalElements: 1 } });
  });
  await page.route(/\/api\/conversations\/95000\/messages(?:\?.*)?$/, async route => {
    const url = new URL(route.request().url());
    messageRequests.push(url.search);
    const pageNumber = Number(url.searchParams.get("page") ?? "0");
    const content = pageNumber === 0
      ? Array.from({ length: 50 }, (_, index) => message(96000 + index))
      : [message(96050)];
    await route.fulfill({ json: { content, totalPages: 2, totalElements: 51 } });
  });
  await page.route("**/api/conversations/95000/read", route => route.fulfill({ status: 204, body: "" }));

  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/uk/messages");
  const conversations = page.getByRole("complementary", { name: "Діалоги" });
  await expect(conversations).toHaveAttribute("aria-busy", "false");
  await conversations.getByRole("button", { name: /Fixture Chat User/ }).click();
  const thread = page.getByRole("region", { name: "Fixture Chat User" });
  const pagination = thread.getByRole("navigation", { name: "Сторінки повідомлень" });
  await expect(thread).toHaveAttribute("aria-busy", "false");
  await expect(thread.getByRole("listitem")).toHaveCount(50);
  await expect(pagination.getByRole("status")).toHaveText("Сторінка 1 з 2");
  await pagination.getByRole("button", { name: "Старіші" }).click();
  await expect(thread.getByRole("listitem")).toHaveCount(1);
  await expect(thread.getByText("fixture-message-96050")).toBeVisible();
  expect(messageRequests.some(search => search.includes("page=1") && search.includes("size=50"))).toBeTruthy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
});

test("notification screen pages safely and exposes preference states on mobile", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "Run scripts/verify-admin-browser.ps1 for the disposable ADMIN fixture.");

  await page.goto("/uk/login");
  await page.getByLabel("Електронна пошта").fill(email!);
  await page.getByLabel("Пароль").fill(password!);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);

  const requests: string[] = [];
  const notification = (id: number) => ({
    id,
    type: "FOLLOW",
    createdAt: "2026-10-18T00:00:00Z",
    readAt: null,
    actor: { id: 97001, username: "fixture-notifier", displayName: "Fixture Notifier", avatarUrl: null },
    relatedUserId: 97001,
    reviewId: null,
  });
  await page.route(/\/api\/notifications(?:\?.*)?$/, async route => {
    const url = new URL(route.request().url());
    requests.push(url.search);
    const pageNumber = Number(url.searchParams.get("page") ?? "0");
    const content = pageNumber === 0
      ? Array.from({ length: 20 }, (_, index) => notification(97010 + index))
      : [notification(97030)];
    await route.fulfill({ json: { content, totalPages: 2, totalElements: 21 } });
  });
  await page.route("**/api/notifications/unread-count", route => route.fulfill({ json: { count: 21 } }));
  await page.route("**/api/notifications/preferences", async route => {
    if (route.request().method() === "PUT") return route.fulfill({ json: route.request().postDataJSON() });
    await route.fulfill({ json: { followsEnabled: true, reviewLikesEnabled: true } });
  });
  await page.route("**/api/notifications/stream", route => route.fulfill({ status: 200, contentType: "text/event-stream", body: "event: connected\ndata: ok\n\n" }));
  await page.route(/\/api\/notifications\/\d+\/read$/, route => route.fulfill({ status: 204, body: "" }));
  await page.route("**/api/notifications/read-all", route => route.fulfill({ status: 204, body: "" }));

  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/uk/notifications");
  const preferences = page.getByRole("region", { name: "Налаштування сповіщень" });
  await expect(preferences).toHaveAttribute("aria-busy", "false");
  await expect(preferences.getByRole("checkbox")).toHaveCount(2);
  const notifications = page.getByRole("region", { name: "Сповіщення" });
  await expect(notifications).toHaveAttribute("aria-busy", "false");
  await expect(notifications.getByRole("listitem")).toHaveCount(20);
  const pagination = notifications.getByRole("navigation", { name: "Сторінки сповіщень" });
  await pagination.getByRole("button", { name: "Далі" }).click();
  await expect(notifications.getByRole("listitem")).toHaveCount(1);
  await expect(pagination.getByRole("status")).toHaveText("Сторінка 2 з 2");
  expect(requests.some(search => search.includes("page=1") && search.includes("size=20"))).toBeTruthy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
});

test("admin film table returns from an emptied last page", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "Run scripts/verify-admin-browser.ps1 for the disposable ADMIN fixture.");

  await page.goto("/uk/login");
  await page.getByLabel("Електронна пошта").fill(email!);
  await page.getByLabel("Пароль").fill(password!);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);

  let deleted = false;
  const movie = (id: number, title: string) => ({
    id, title, releaseDate: null, rating: null, photoUrl: null, tmdbId: null,
  });
  await page.route(/\/api\/admin\/movies(?:\?.*)?$/, async route => {
    if (route.request().method() !== "GET") return route.fallback();
    const pageNumber = Number(new URL(route.request().url()).searchParams.get("page") ?? "0");
    const firstPage = Array.from({ length: 50 }, (_, index) => movie(81000 + index, `fixture-film-${index + 1}`));
    if (deleted) await route.fulfill({ json: { content: firstPage, totalPages: 1, totalElements: 50 } });
    else if (pageNumber === 0) await route.fulfill({ json: { content: firstPage, totalPages: 2, totalElements: 51 } });
    else await route.fulfill({ json: { content: [movie(81888, "fixture-film-51")], totalPages: 2, totalElements: 51 } });
  });
  await page.route("**/api/admin/movies/81888", async route => {
    if (route.request().method() !== "DELETE") return route.fallback();
    deleted = true;
    await route.fulfill({ status: 204, body: "" });
  });

  await page.goto("/uk/admin");
  const films = page.getByRole("region", { name: "Фільми" });
  const results = films.getByRole("list", { name: "Фільми каталогу" });
  const pagination = films.getByRole("navigation", { name: "Сторінки фільмів в адмінці" });
  await expect(films).toHaveAttribute("aria-busy", "false");
  await expect(results.getByRole("listitem")).toHaveCount(50);
  await expect(pagination.getByRole("status")).toHaveText("Сторінка 1 з 2 · 51");
  await pagination.getByRole("button", { name: "Далі" }).click();
  await expect(results.getByRole("listitem")).toHaveCount(1);
  await expect(results.getByText("fixture-film-51", { exact: false })).toBeVisible();

  page.once("dialog", dialog => dialog.accept());
  await results.getByRole("button", { name: "Видалити" }).click();
  await expect(results.getByRole("listitem")).toHaveCount(50);
  await expect(pagination.getByRole("status")).toHaveText("Сторінка 1 з 1 · 50");
  expect(deleted).toBeTruthy();
});

test("moderation queue pages, retries failed loads and returns to the previous page after bulk hiding", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "Run scripts/verify-admin-browser.ps1 for the disposable ADMIN fixture.");
  await page.goto("/uk/login");
  await page.getByLabel("Електронна пошта").fill(email!);
  await page.getByLabel("Пароль").fill(password!);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);
  const csrfHeaders = async () => {
    const csrf = await page.request.get("/api/auth/csrf");
    expect(csrf.status()).toBe(200);
    const cookie = (await page.context().cookies()).find(item => item.name === "XSRF-TOKEN");
    expect(cookie).toBeTruthy();
    return { "X-XSRF-TOKEN": decodeURIComponent(cookie!.value) };
  };
  const marker = `queue-pagination-${Date.now()}`;
  const created = await page.request.post("/api/admin/movies", { headers: await csrfHeaders(), data: { title: marker } });
  expect(created.status()).toBe(200);
  const movieId = (await created.json()).id;
  try {
    const review = await page.request.post(`/api/movies/${movieId}/reviews`, { headers: await csrfHeaders(), data: { content: marker, rating: 4 } });
    expect(review.status()).toBe(200);
    const reviewId = (await review.json()).id;
    for (let i = 0; i < 51; i++) {
      const response = await page.request.post(`/api/reviews/${reviewId}/comments`, { headers: await csrfHeaders(), data: { text: `${marker} comment ${i}` } });
      expect(response.status()).toBe(200);
    }
    await page.goto("/uk/admin");
    const queue = page.getByRole("region", { name: "Черга модерації" });
    await expect(queue).toHaveAttribute("aria-busy", "false");
    await queue.getByRole("combobox").selectOption("COMMENT");
    await queue.getByLabel("Пошук у черзі").fill(marker);
    await queue.getByRole("button", { name: "Фільтрувати", exact: true }).click();
    await expect(queue.getByRole("listitem")).toHaveCount(50);
    await expect(queue.getByRole("status")).toHaveText("Сторінка 1 з 2 · 51");

    // Exercise recovery without allowing stale rows to remain actionable.
    await page.route(/\/api\/admin\/moderation\/queue\?.*page=1/, route => route.fulfill({ status: 503, json: { message: "Temporary test failure" } }), { times: 1 });
    await queue.getByRole("button", { name: "Далі", exact: true }).click();
    await expect(queue.getByRole("alert")).toBeVisible();
    await expect(queue.getByRole("listitem")).toHaveCount(0);
    await queue.getByRole("button", { name: "Спробувати ще" }).click();
    await expect(queue.getByRole("listitem")).toHaveCount(1);
    await expect(queue.getByRole("status")).toHaveText("Сторінка 2 з 2 · 51");
    await expect(queue.getByRole("button", { name: "Далі", exact: true })).toBeDisabled();
    await queue.screenshot({ path: testInfo.outputPath("moderation-last-page.png") });

    await queue.getByRole("button", { name: "Вибрати все", exact: true }).click();
    page.once("dialog", dialog => dialog.accept());
    await queue.getByRole("button", { name: /Приховати вибране/ }).click();
    await expect(queue.getByRole("status")).toHaveText("Сторінка 1 з 1 · 50");
    await expect(queue.getByRole("listitem")).toHaveCount(50);
    await queue.getByRole("button", { name: "Вибрати все", exact: true }).click();
    page.once("dialog", dialog => dialog.accept());
    await queue.getByRole("button", { name: /Приховати вибране/ }).click();
    await expect(queue.getByRole("listitem")).toHaveCount(0);
    await expect(queue.getByRole("status")).toHaveText("Сторінка 0 з 0 · 0");
    const remaining = await page.request.get(`/api/admin/moderation/queue?type=COMMENT&query=${marker}`);
    expect(remaining.status()).toBe(200);
    expect((await remaining.json()).totalElements).toBe(0);
  } finally {
    const cleanup = await page.request.delete(`/api/admin/movies/${movieId}`, { headers: await csrfHeaders() });
    expect.soft(cleanup.ok(), "Disposable movie and dependent moderation data must be removed").toBeTruthy();
  }
});

test("admin can open the dashboard, manage a notification and manage a movie", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  const username = process.env.E2E_ADMIN_USERNAME;
  test.skip(!email || !password || !username, "Run scripts/verify-admin-browser.ps1 for the disposable ADMIN fixture.");

  await page.goto("/uk/login");
  await page.getByLabel("Електронна пошта").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);

  await page.goto("/uk/admin");
  await expect(page.getByRole("heading", { name: "Панель адміністратора" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Користувачі" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Фільми" })).toBeVisible();
  await expect(page.getByText("Якість каталогу TMDB", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Налаштування сайту" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Журнал дій" })).toBeVisible();

  const adminUsers = await page.evaluate(async (query) => {
    const response = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}&size=10`);
    return response.json();
  }, username);
  const recipientId = adminUsers.content[0].id as number;
  const notificationSection = page.locator("section").filter({ has: page.getByRole("heading", { name: "Сповіщення" }) });
  await notificationSection.getByLabel("ID отримувача", { exact: true }).fill(String(recipientId));
  await notificationSection.getByRole("button", { name: "Створити сповіщення" }).click();
  await expect(notificationSection.getByText(`отримувач #${recipientId}`, { exact: false }).first()).toBeVisible();

  await page.getByLabel("Пошук користувача").fill(username);
  await page.getByRole("button", { name: "Пошук" }).click();
  await expect(page.getByText(username, { exact: false }).first()).toBeVisible();

  const adminSqlInjection = "' OR 1=1 --";
  const adminUsersResponse = page.waitForResponse(response =>
    response.url().includes("/api/admin/users") && response.request().method() === "GET"
  );
  await page.getByLabel("Пошук користувача").fill(adminSqlInjection);
  await page.getByRole("button", { name: "Пошук" }).click();
  expect((await adminUsersResponse).status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Панель адміністратора" })).toBeVisible();

  const movieSection = page.locator("section").filter({ has: page.getByLabel("Назва фільму", { exact: true }) });
  const title = `Admin browser ${Date.now()}`;
  await movieSection.getByLabel("Назва фільму").fill(title);
  await movieSection.getByLabel("Рейтинг", { exact: true }).fill("7.5");
  await movieSection.getByRole("button", { name: "Створити" }).click();
  const createdMovie = movieSection.locator("li").filter({ hasText: title });
  await expect(createdMovie).toBeVisible();

  const createdMovieData = await page.evaluate(async (movieTitle) => {
    const response = await fetch("/api/admin/movies?size=50");
    const data = await response.json();
    return data.content.find((movie: { id: number; title: string }) => movie.title === movieTitle) as { id: number } | undefined;
  }, title);
  expect(createdMovieData?.id).toBeTruthy();
  const moderationContent = `Admin moderation ${Date.now()}`;
  const xsrf = await page.evaluate(() => decodeURIComponent(document.cookie.split("; ").find(value => value.startsWith("XSRF-TOKEN="))?.slice("XSRF-TOKEN=".length) ?? ""));
  const reviewResponse = await page.evaluate(async ({ movieId, content, token }) => {
    const response = await fetch(`/api/movies/${movieId}/reviews`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": token },
      body: JSON.stringify({ content, rating: 4 })
    });
    return response.status;
  }, { movieId: createdMovieData!.id, content: moderationContent, token: xsrf });
  expect(reviewResponse).toBe(200);
  const moderationComment = `Admin comment moderation ${Date.now()}`;
  await page.goto(`/uk/films/${createdMovieData!.id}`);
  await expect(page.getByText(moderationContent)).toBeVisible();
  await page.getByRole("button", { name: "Показати коментарі" }).click();
  await page.getByLabel("Ваш коментар").fill(moderationComment);
  await page.getByRole("button", { name: "Надіслати" }).click();
  await expect(page.getByText(moderationComment)).toBeVisible();
  await page.goto("/uk/admin");
  const moderationSection = page.getByRole("region", { name: "Черга модерації" });
  await expect(moderationSection).toHaveAttribute("aria-busy", "false");
  await moderationSection.getByLabel("Пошук у черзі").fill(moderationContent);
  await moderationSection.getByRole("button", { name: "Фільтрувати", exact: true }).click();
  const moderationItem = moderationSection.locator("li").filter({ hasText: moderationContent });
  await expect(moderationItem).toBeVisible();
  await moderationItem.getByRole("button", { name: "Приховати" }).click();
  await expect(moderationItem).toHaveCount(0);
  await moderationSection.getByLabel("Пошук у черзі").fill(moderationComment);
  await moderationSection.getByRole("button", { name: "Фільтрувати", exact: true }).click();
  const moderationCommentItem = moderationSection.locator("li").filter({ hasText: moderationComment });
  await expect(moderationCommentItem).toBeVisible();
  await moderationCommentItem.getByRole("button", { name: "Приховати" }).click();
  await expect(moderationCommentItem).toHaveCount(0);

  page.once("dialog", dialog => dialog.accept());
  const refreshedMovieSection = page.locator("section").filter({ has: page.getByLabel("Назва фільму", { exact: true }) });
  const refreshedMovie = refreshedMovieSection.locator("li").filter({ hasText: title });
  await refreshedMovie.getByRole("button", { name: "Видалити" }).click();
  await expect(refreshedMovie).toHaveCount(0);
});
