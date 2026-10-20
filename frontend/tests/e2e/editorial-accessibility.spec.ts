import { expect, test } from "@playwright/test";

// Controlled responses exercise fallback/media/focus states without publishing content.
const fallbackCases = [
  { routeLang: "en", articleLang: "uk", title: "Український текст без англійського перекладу", excerpt: "Український короткий опис.", content: "Повний український редакційний текст.", read: "Read", retry: "Retry", audioError: "Could not load podcast audio." },
  { routeLang: "uk", articleLang: "en", title: "English text awaiting a Ukrainian translation", excerpt: "An English editorial excerpt.", content: "The complete English editorial text.", read: "Читати", retry: "Спробувати ще", audioError: "Не вдалося завантажити аудіо подкасту." },
] as const;

function silentWav() {
  const samples = 2000;
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(8000, 24);
  buffer.writeUInt32LE(16000, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples * 2, 40);
  return buffer;
}

for (const fixture of fallbackCases) {
  test(`journal marks ${fixture.articleLang} fallback text inside ${fixture.routeLang} UI and retries a media load failure`, async ({ page, baseURL }) => {
    const audioUrl = new URL("/__e2e/journal-podcast.wav", baseURL).href;
    const article = {
      id: 920001, slug: "editorial-language-fixture", language: fixture.articleLang,
      category: "Community", title: fixture.title, excerpt: fixture.excerpt, content: fixture.content,
      coverUrl: null, audioUrl, publishedAt: "2026-10-01T12:00:00Z",
    };
    await page.route("**/api/journal/articles?*", route => route.fulfill({ json: { content: [article], totalPages: 1, totalElements: 1 } }));
    await page.route("**/api/journal/articles/archive?*", route => route.fulfill({ json: [] }));
    await page.route("**/api/journal/articles/editorial-language-fixture?*", route => route.fulfill({ json: article }));
    let audioRequests = 0;
    await page.route(audioUrl, route => {
      audioRequests += 1;
      return audioRequests === 1
        ? route.fulfill({ status: 503, body: "Media temporarily unavailable" })
        : route.fulfill({ contentType: "audio/wav", body: silentWav() });
    });

    await page.goto(`/${fixture.routeLang}/journal`);
    const heading = page.getByRole("heading", { name: fixture.title, level: 3 });
    await expect(heading).toHaveAttribute("lang", fixture.articleLang);
    await expect(page.getByText(fixture.excerpt, { exact: true })).toHaveAttribute("lang", fixture.articleLang);
    const readLink = page.getByRole("link", { name: fixture.read, exact: true });
    await expect(readLink).toHaveAttribute("href", `/${fixture.routeLang}/journal/${article.slug}`);
    expect(await readLink.evaluate(element => element.closest("[lang]")?.getAttribute("lang"))).toBe(fixture.routeLang);
    await readLink.click();

    await expect(page.getByRole("heading", { name: fixture.title, level: 1 })).toHaveAttribute("lang", fixture.articleLang);
    await expect(page.getByText(fixture.excerpt, { exact: true })).toHaveAttribute("lang", fixture.articleLang);
    await expect(page.getByText(fixture.content, { exact: true })).toHaveAttribute("lang", fixture.articleLang);
    const audio = page.locator("audio");
    await expect(audio).toHaveAttribute("src", audioUrl);
    await expect(page.getByRole("alert")).toContainText(fixture.audioError);
    await page.getByRole("button", { name: fixture.retry, exact: true }).click();
    await expect(audio).toBeFocused();
    await expect.poll(() => audio.evaluate(element => (element as HTMLAudioElement).readyState)).toBeGreaterThanOrEqual(1);
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(audio).toHaveAttribute("src", audioUrl);
    expect(audioRequests).toBe(2);
  });
}

test("admin user detail focuses its heading and restores the exact triggering row or list heading", async ({ page }) => {
  const users = [1, 2].map(id => ({ id: 930000 + id, username: `focus-user-${id}`, displayName: `Focus reader ${id}`, email: `focus-user-${id}@example.invalid`, role: "USER", avatarUrl: null, isActive: true, isHq: false, createdAt: "2026-10-01T12:00:00Z" }));
  const emptyPage = { content: [], totalPages: 0, totalElements: 0 };
  const mutations: string[] = [];
  await page.route(/^https?:\/\/[^/]+\/api\//, route => {
    const request = route.request();
    if (request.method() !== "GET") {
      mutations.push(request.url());
      return route.abort();
    }
    const url = new URL(request.url());
    if (url.pathname === "/api/users/me") return route.fulfill({ json: { id: 930100, username: "focus-admin", role: "ADMIN" } });
    if (url.pathname.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
    if (url.pathname === "/api/admin/dashboard") return route.fulfill({ json: { users: 2, activeUsers: 2, hqUsers: 0, movies: 0, reviews: 0, hiddenReviews: 0 } });
    if (url.pathname === "/api/admin/settings") return route.fulfill({ json: [] });
    if (url.pathname === "/api/admin/movies/tmdb-quality") return route.fulfill({ json: { totalMovies: 0, tmdbLinkedMovies: 0, completeTmdbMovies: 0, missingPoster: 0, missingBackdrop: 0, missingPlot: 0, missingRuntime: 0, missingTrailer: 0, missingTmdbRating: 0, linkedCoveragePercent: 0, metadataCompletenessPercent: 0 } });
    if (url.pathname === "/api/admin/users") return route.fulfill({ json: { content: url.searchParams.has("q") ? [] : users, totalPages: 1, totalElements: 2 } });
    const detail = url.pathname.match(/^\/api\/admin\/users\/(\d+)(\/overview)?$/);
    if (detail) return route.fulfill({ json: detail[2]
      ? { stats: { watched: 0, reviews: 0, ratings: 0, watchlist: 0, favorites: 0, comments: 0, likesReceived: 0, customLists: 0 }, adminHistory: [] }
      : users.find(user => user.id === Number(detail[1])) });
    return route.fulfill({ json: emptyPage });
  });

  await page.goto("/en/admin");
  const usersSection = page.getByRole("region", { name: "Users", exact: true });
  const secondRow = usersSection.getByRole("listitem").filter({ hasText: "Focus reader 2" });
  const trigger = secondRow.getByRole("button", { name: "View profile", exact: true });
  await trigger.focus();
  await trigger.press("Enter");
  const heading = page.locator("#admin-user-profile-title");
  await expect(heading).toHaveText("Focus reader 2");
  await expect(heading).toBeFocused();
  const detailPanel = page.locator("#admin-user-profile");
  await detailPanel.getByRole("button", { name: "Close", exact: true }).click();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  await trigger.press("Enter");
  await expect(heading).toBeFocused();
  await usersSection.getByRole("textbox", { name: "Search users", exact: true }).fill("no-longer-visible");
  await usersSection.getByRole("button", { name: "Search", exact: true }).click();
  await expect(trigger).toHaveCount(0);
  await detailPanel.getByRole("button", { name: "Close", exact: true }).click();
  await expect(usersSection.getByRole("heading", { name: "Users", exact: true, level: 2 })).toBeFocused();
  expect(mutations).toEqual([]);
});
