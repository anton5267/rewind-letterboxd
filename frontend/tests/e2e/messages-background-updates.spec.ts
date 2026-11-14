import { type BrowserContext, expect, type Page, test } from "@playwright/test";

const empty = { content: [], totalElements: 0, totalPages: 0, number: 0 };
type Message = {
  id: number;
  conversationId: number;
  senderId: number;
  body: string;
  createdAt: string;
  readAt: string | null;
};
type PollingWindow = Window & {
  tickMessagePolling(): void;
  setMessageVisibility(value: DocumentVisibilityState): void;
};

async function fixture(context: BrowserContext) {
  const state = {
    messages: new Map<number, Message[]>([[11, [{
      id: 1,
      conversationId: 11,
      senderId: 8,
      body: "First message",
      createdAt: "2026-11-14T00:00:00Z",
      readAt: "2026-11-14T00:00:01Z",
    }]], [12, []]]),
    reads: [] as number[],
    messageRequests: [] as number[],
    conversationRequests: 0,
    fail: false,
    denied: false,
    hold: false,
    failRead: false,
    actor: 7,
  };
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await context.addInitScript(() => {
    let visibility: DocumentVisibilityState = "visible";
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => visibility,
    });
    const nativeInterval = window.setInterval.bind(window);
    const nativeClear = window.clearInterval.bind(window);
    const timers = new Map<number, () => void>();
    let next = 900000;
    window.setInterval =
      ((callback: TimerHandler, delay?: number, ...args: unknown[]) => {
        if (delay !== 15000 || typeof callback !== "function") {
          return nativeInterval(callback, delay, ...args);
        }
        const id = next++;
        timers.set(id, callback as () => void);
        return id;
      }) as typeof window.setInterval;
    window.clearInterval = (id) => {
      timers.delete(id ?? 0);
      nativeClear(id);
    };
    Object.assign(window, {
      tickMessagePolling: () => timers.forEach((callback) => callback()),
      setMessageVisibility: (value: DocumentVisibilityState) => {
        visibility = value;
        document.dispatchEvent(new Event("visibilitychange"));
      },
    });
  });
  await context.route(
    "**/auth/v1/**",
    (route) => route.fulfill({ status: 404, json: {} }),
  );
  await context.route(
    "**/auth/v1/logout**",
    (route) => route.fulfill({ status: 204, body: "" }),
  );
  await context.route("**/auth/v1/token**", (route) => {
    state.actor = route.request().postDataJSON().email?.startsWith("next")
      ? 6
      : 7;
    return route.fulfill({
      json: {
        access_token: `fixture-access-${state.actor}`,
        refresh_token: `fixture-refresh-${state.actor}`,
        token_type: "bearer",
        expires_in: 3600,
        user: {
          id: `b1f5872a-148b-4878-8581-06b809b2992${state.actor}`,
          email: "fixture@example.invalid",
          aud: "authenticated",
          role: "authenticated",
          app_metadata: {},
          user_metadata: {},
          created_at: "2026-11-14T00:00:00Z",
        },
      },
    });
  });
  await context.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.pathname === "/api/users/me") {
        return route.fulfill({
          json: {
            id: state.actor,
            username: `reader-${state.actor}`,
            role: "USER",
          },
        });
      }
      if (url.pathname.endsWith("unread-count")) {
        return route.fulfill({
          json: { count: 0 },
        });
      }
      if (url.pathname === "/api/conversations") {
        state.conversationRequests++;
        return route.fulfill({
          json: {
            ...empty,
            totalPages: 1,
            totalElements: state.actor === 7 ? 2 : 1,
            content: (state.actor === 7 ? [11, 12] : [12]).map((id) => ({
              id,
              otherUser: {
                id: id === 11 ? 8 : 9,
                username: id === 11 ? "alice" : "bob",
                displayName: id === 11 ? "Alice" : "Bob",
                avatarUrl: null,
              },
              updatedAt: "2026-11-14T00:00:00Z",
              lastMessage: state.messages.get(id)?.[0] ?? null,
            })),
          },
        });
      }
      const match = url.pathname.match(
        /^\/api\/conversations\/(\d+)\/(messages|read)$/,
      );
      if (match) {
        const id = Number(match[1]);
        if (match[2] === "read") {
          state.reads.push(id);
          if (state.failRead) return route.fulfill({ status: 503, json: {} });
          for (const message of state.messages.get(id) ?? []) {
            message.readAt = "2026-11-14T00:00:02Z";
          }
          return route.fulfill({ status: 204, body: "" });
        }
        state.messageRequests.push(id);
        const snapshot = structuredClone(state.messages.get(id) ?? []);
        if (state.hold) await gate;
        if (state.denied) return route.fulfill({ status: 403, json: {} });
        if (state.fail) return route.fulfill({ status: 503, json: {} });
        const page = Number(url.searchParams.get("page") ?? 0);
        return route.fulfill({
          json: {
            content: page === 0
              ? snapshot.slice(0, 50)
              : snapshot.slice(50, 100),
            totalPages: Math.ceil(snapshot.length / 50),
            totalElements: snapshot.length,
            number: page,
          },
        });
      }
      return route.fulfill({ json: empty });
    },
  );
  return { state, release };
}

async function openMessages(page: Page, lang: "uk" | "en") {
  await page.goto(`/${lang}/login`);
  await page.getByLabel(lang === "uk" ? "Електронна пошта" : "Email", {
    exact: true,
  }).fill("fixture@example.invalid");
  await page.getByLabel(lang === "uk" ? "Пароль" : "Password", { exact: true })
    .fill("fixture-password-only");
  await page.getByRole("button", {
    name: lang === "uk" ? "Увійти" : "Log in",
    exact: true,
  }).click();
  await expect(page).toHaveURL(new RegExp(`/${lang}/films/?$`));
  await page.goto(`/${lang}/messages`);
  await page.getByRole("button", { name: /Alice/ }).click();
  await expect(page.getByRole("log")).toBeVisible();
}
const tick = (page: Page) =>
  page.evaluate(() => (window as PollingWindow).tickMessagePolling());

for (const lang of ["uk", "en"] as const) {
  test(`open messages receive incoming content, keep the draft and pause background reads in ${lang}`, async ({ context, page }) => {
    const { state } = await fixture(context);
    await openMessages(page, lang);
    const composer = page.getByRole("textbox", {
      name: lang === "uk" ? "Текст повідомлення" : "Message text",
      exact: true,
    });
    await composer.fill("Unsent draft");
    state.messages.get(11)!.unshift({
      id: 2,
      conversationId: 11,
      senderId: 8,
      body: "Incoming while open",
      createdAt: "2026-11-14T00:01:00Z",
      readAt: null,
    });
    await tick(page);
    await expect(page.getByText("Incoming while open", { exact: true }).last())
      .toBeVisible();
    await expect(composer).toHaveValue("Unsent draft");
    await expect(composer).toBeFocused();
    await expect.poll(() => state.reads.length).toBe(2);
    await page.evaluate(() =>
      (window as PollingWindow).setMessageVisibility("hidden")
    );
    const reads = state.messageRequests.length;
    await tick(page);
    expect(state.messageRequests.length).toBe(reads);
    await page.evaluate(() =>
      (window as PollingWindow).setMessageVisibility("visible")
    );
    await expect.poll(() => state.messageRequests.length).toBeGreaterThan(
      reads,
    );
    state.fail = true;
    await tick(page);
    await expect(page.getByRole("alert")).toContainText(
      lang === "uk"
        ? "Не вдалося оновити повідомлення."
        : "Could not refresh messages.",
    );
    await expect(page.getByText("Incoming while open", { exact: true }).last())
      .toBeVisible();
    state.fail = false;
    await page.getByRole("alert").getByRole("button").click();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(composer).toHaveValue("Unsent draft");
    state.failRead = true;
    state.messages.get(11)!.unshift({
      id: 3,
      conversationId: 11,
      senderId: 8,
      body: "Unread after a failed receipt",
      createdAt: "2026-11-14T00:02:00Z",
      readAt: null,
    });
    await tick(page);
    await expect(page.getByRole("alert")).toBeVisible();
    state.failRead = false;
    await tick(page);
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
}

test("message history remains stable until the reader opens new messages", async ({ context, page }) => {
  const { state } = await fixture(context);
  state.messages.set(
    11,
    Array.from(
      { length: 51 },
      (_, index) => ({
        id: 51 - index,
        conversationId: 11,
        senderId: 8,
        body: `History ${51 - index}`,
        createdAt: "2026-11-14T00:00:00Z",
        readAt: "2026-11-14T00:00:01Z",
      }),
    ),
  );
  await openMessages(page, "en");
  await page.getByRole("button", { name: "Older", exact: true }).click();
  await expect(page.getByRole("log")).toHaveText(/History 1/);
  const readCount = state.reads.length;
  state.messages.get(11)!.unshift({
    id: 52,
    conversationId: 11,
    senderId: 8,
    body: "Newest incoming",
    createdAt: "2026-11-14T00:01:00Z",
    readAt: null,
  });
  await tick(page);
  const latest = page.getByRole("button", {
    name: "Show new messages",
    exact: true,
  });
  await expect(latest).toBeVisible();
  await expect(page.getByRole("log")).toHaveText(/History 1/);
  expect(state.reads.length).toBe(readCount);
  await latest.click();
  await expect(
    page.getByRole("log").getByText("Newest incoming", { exact: true }),
  ).toBeVisible();
  await expect(latest).toHaveCount(0);
});

test("message polling serializes requests and ignores a delayed previous conversation", async ({ context, page }) => {
  const { state, release } = await fixture(context);
  await openMessages(page, "en");
  state.messages.get(11)!.unshift({
    id: 2,
    conversationId: 11,
    senderId: 8,
    body: "Delayed old conversation",
    createdAt: "2026-11-14T00:01:00Z",
    readAt: null,
  });
  state.hold = true;
  await tick(page);
  await expect.poll(() => state.messageRequests.length).toBe(2);
  await tick(page);
  expect(state.messageRequests.length).toBe(2);
  state.hold = false;
  await page.getByRole("button", { name: /Bob/ }).click();
  await expect(page.getByRole("heading", { name: "Bob", exact: true }))
    .toBeVisible();
  release();
  await expect.poll(() => state.messageRequests.length).toBe(3);
  await expect(page.getByRole("log")).toHaveCount(0);
  await expect(page.getByText("Delayed old conversation", { exact: true }))
    .toHaveCount(0);
  expect(state.reads.filter((id) => id === 11)).toHaveLength(1);
});

test("a background access denial clears unavailable message content while preserving the draft", async ({ context, page }) => {
  const { state } = await fixture(context);
  await openMessages(page, "en");
  const composer = page.getByRole("textbox", {
    name: "Message text",
    exact: true,
  });
  await composer.fill("Retained draft");
  state.denied = true;
  await tick(page);
  await expect(page.getByRole("log")).toHaveCount(0);
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(composer).toHaveValue("Retained draft");
});

test("an old account's delayed poll cannot populate the next account", async ({ context, page }) => {
  const { state, release } = await fixture(context);
  await openMessages(page, "en");
  await page.getByRole("textbox", { name: "Message text", exact: true }).fill(
    "Previous account draft",
  );
  state.hold = true;
  await tick(page);
  await expect.poll(() => state.messageRequests.length).toBe(2);
  await page.locator("header").getByRole("button", {
    name: "Account",
    exact: true,
  }).click();
  await page.locator("header").getByRole("button", {
    name: "Log out",
    exact: true,
  }).click();
  await expect(page).toHaveURL(/\/en\/login\/?$/);
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(
    "next@example.invalid",
  );
  await page.getByLabel("Password", { exact: true }).fill(
    "fixture-next-password",
  );
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/messages\/?$/);
  state.hold = false;
  release();
  await page.getByRole("button", { name: /Bob/ }).click();
  await expect(page.getByRole("textbox", { name: "Message text", exact: true }))
    .toHaveValue("");
  await expect(page.getByText("First message", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Alice/ })).toHaveCount(0);
});
