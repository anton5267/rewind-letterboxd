import { expect, test } from "@playwright/test";

test("legacy root redirects to the localized home page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/uk\/home$/);
  await expect(page.locator("h1").first()).toBeVisible();
});

test("public pages render in both locales without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });

  for (const route of ["/uk/home", "/en/home", "/uk/films", "/en/help", "/uk/journal", "/uk/community", "/en/community", "/uk/lists/discover", "/en/lists/discover"]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${route} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
    const expectedLanguage = route.startsWith("/en/") ? "en" : "uk";
    await expect(page.locator("html")).toHaveAttribute("lang", expectedLanguage);
  }
});

test("guest users cannot open private or admin pages", async ({ page }) => {
  const expectedRedirects: Record<string, RegExp> = {
    "/uk/profile": /\/uk\/login$/,
    "/uk/lists": /\/uk\/login$/,
    "/uk/messages": /\/uk\/login$/,
    "/uk/notifications": /\/uk\/login$/,
    "/uk/admin": /\/uk\/home$/,
  };

  for (const [route, redirect] of Object.entries(expectedRedirects)) {
    await page.goto(route);
    await expect(page).toHaveURL(redirect);
    await expect(page.locator("h1")).toBeVisible();
  }
});

test("public list catalog paginates server-side", async ({ page }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = `lists${suffix.slice(-12)}`;
  const email = `${username}@example.invalid`;
  const password = "E2e-password-123!";

  const csrfHeaders = async () => {
    const csrf = await page.request.get("/api/auth/csrf");
    expect(csrf.status()).toBe(200);
    const cookie = (await page.context().cookies()).find(item => item.name === "XSRF-TOKEN");
    expect(cookie, "XSRF cookie must be present").toBeTruthy();
    return { "X-XSRF-TOKEN": decodeURIComponent(cookie!.value) };
  };

  await page.goto("/uk/register");
  await page.getByLabel("Нікнейм").fill(username);
  await page.getByLabel("Електронна пошта").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Створити акаунт" }).click();
  await expect(page.getByRole("heading", { name: /Акаунт створено/ })).toBeVisible();

  await page.getByRole("button", { name: "Перейти до входу" }).click();
  await page.getByLabel("Електронна пошта").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);

  try {
    for (let index = 1; index <= 13; index += 1) {
      const response = await page.request.post("/api/lists", {
        headers: await csrfHeaders(),
        data: {
          name: `Pagination list ${suffix}-${index}`,
          description: null,
          isPublic: true,
          tags: [],
        },
      });
      expect(response.ok(), `list ${index} create failed`).toBeTruthy();
    }

    await page.goto("/uk/lists/discover?feed=recent");
    const pagination = page.getByRole("navigation", { name: "Сторінки публічних списків" });
    await expect(pagination).toBeVisible();
    await expect(pagination.getByRole("status")).toHaveText(/Сторінка 1 з \d+/);
    await pagination.getByRole("button", { name: "Далі" }).click();
    await expect(pagination.getByRole("status")).toHaveText(/Сторінка 2 з \d+/);
  } finally {
    const cleanup = await page.request.delete("/api/profile/me", {
      headers: await csrfHeaders(),
      data: { currentPassword: password },
    });
    expect.soft(cleanup.ok(), `Disposable public-list account must be removed (status ${cleanup.status()})`).toBeTruthy();
  }
});

test("public list discovery reaches tag, detail, author and movie in both locales", async ({ page }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = `journey${suffix.slice(-12)}`;
  const email = `${username}@example.invalid`;
  const password = "E2e-password-123!";
  const listName = `Journey list ${suffix}`;
  const tagName = `e2e-tag-${suffix.slice(-8)}`;
  let listId: number | null = null;

  const csrfHeaders = async () => {
    const csrf = await page.request.get("/api/auth/csrf");
    expect(csrf.status()).toBe(200);
    const cookie = (await page.context().cookies()).find(item => item.name === "XSRF-TOKEN");
    expect(cookie, "XSRF cookie must be present").toBeTruthy();
    return { "X-XSRF-TOKEN": decodeURIComponent(cookie!.value) };
  };

  await page.goto("/uk/register");
  await page.getByLabel("Нікнейм").fill(username);
  await page.getByLabel("Електронна пошта").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Створити акаунт" }).click();
  await expect(page.getByRole("heading", { name: /Акаунт створено/ })).toBeVisible();
  await page.getByRole("button", { name: "Перейти до входу" }).click();
  await page.getByLabel("Електронна пошта").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/uk\/films$/);

  try {
    const moviesResponse = await page.request.get("/api/movies?page=0&size=1");
    expect(moviesResponse.ok()).toBeTruthy();
    const moviePage = await moviesResponse.json() as { content: { id: number; title: string }[] };
    expect(moviePage.content.length).toBeGreaterThan(0);
    const movie = moviePage.content[0];

    const createResponse = await page.request.post("/api/lists", {
      headers: await csrfHeaders(),
      data: { name: listName, description: "Discovery journey", isPublic: true, tags: [tagName] },
    });
    expect(createResponse.ok()).toBeTruthy();
    listId = (await createResponse.json() as { id: number }).id;
    const addMovieResponse = await page.request.post(`/api/lists/${listId}/movies`, {
      headers: await csrfHeaders(),
      data: { movieId: movie.id, position: 1 },
    });
    expect(addMovieResponse.ok()).toBeTruthy();

    await page.goto("/uk/lists/discover?feed=recent");
    await expect(page.getByRole("heading", { name: listName })).toBeVisible();
    await page.getByRole("main").getByRole("link", { name: "Добірки", exact: true }).click();
    await expect(page).toHaveURL(/\/uk\/lists\/discover$/);
    const feeds = page.getByRole("navigation", { name: "Добірки списків", exact: true });
    await expect(feeds.getByRole("link", { name: "Популярні", exact: true })).not.toHaveAttribute("aria-current", "page");
    await feeds.getByRole("link", { name: "Популярні", exact: true }).click();
    await expect(page).toHaveURL(/\/uk\/lists\/discover\?feed=popular$/);
    await expect(page.getByRole("heading", { name: "Популярні добірки", level: 1, exact: true })).toBeVisible();

    await page.goto(`/uk/lists/discover?feed=recent&tag=${encodeURIComponent(tagName.toLowerCase())}`);
    await expect(page.getByRole("heading", { name: listName })).toBeVisible();
    const listLink = page.getByRole("heading", { name: listName }).getByRole("link");
    await listLink.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/uk/lists/public/${listId}$`));
    await expect(page.getByRole("heading", { name: listName })).toBeVisible();
    await expect(page.getByRole("link", { name: username, exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: `#${tagName}`, exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: movie.title, exact: true })).toBeVisible();

    await page.getByRole("link", { name: "EN", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/en/lists/public/${listId}$`));
    await expect(page.getByRole("heading", { name: listName })).toBeVisible();
    await page.getByRole("link", { name: username, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/en/users/\\d+$`));
    await expect(page.getByRole("heading", { name: username })).toBeVisible();

    await page.getByRole("link", { name: listName, exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(`/en/lists/public/${listId}$`));
    await page.getByRole("link", { name: movie.title, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/en/films/${movie.id}$`));
    await expect(page.getByRole("heading", { name: movie.title, exact: true })).toBeVisible();
  } finally {
    await page.request.get("/api/auth/csrf");
    const cleanup = await page.request.delete("/api/profile/me", {
      headers: await csrfHeaders(),
      data: { currentPassword: password },
    });
    expect.soft(cleanup.ok(), "Disposable public-list journey account must be removed").toBeTruthy();
  }
});

test("journal list paginates server-side", async ({ page }) => {
  await page.route("**/api/journal/articles**", async route => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.pathname.endsWith("/archive")) {
      await route.continue();
      return;
    }
    const currentPage = Number(requestUrl.searchParams.get("page") ?? "0");
    const content = currentPage === 0
      ? Array.from({ length: 20 }, (_, index) => ({
          id: index + 1,
          slug: `journal-page-one-${index + 1}`,
          language: "uk",
          category: "Новини",
          title: `Сторінка журналу 1 — ${index + 1}`,
          excerpt: null,
          content: "Тестовий текст",
          coverUrl: null,
          audioUrl: null,
          publishedAt: "2026-10-18T00:00:00Z",
        }))
      : [{
          id: 21,
          slug: "journal-page-two-21",
          language: "uk",
          category: "Новини",
          title: "Сторінка журналу 2 — 21",
          excerpt: null,
          content: "Тестовий текст",
          coverUrl: null,
          audioUrl: null,
          publishedAt: "2026-10-17T00:00:00Z",
        }];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ content, totalPages: 2, totalElements: 21, number: currentPage }),
    });
  });

  await page.goto("/uk/journal");
  const pagination = page.getByRole("navigation", { name: "Сторінки журналу" });
  await expect(pagination).toBeVisible();
  await expect(pagination.getByRole("status")).toHaveText("Сторінка 1 з 2");
  await pagination.getByRole("button", { name: "Далі" }).click();
  await expect(pagination.getByRole("status")).toHaveText("Сторінка 2 з 2");
  await expect(page.getByRole("heading", { name: "Сторінка журналу 2 — 21" })).toBeVisible();
});
