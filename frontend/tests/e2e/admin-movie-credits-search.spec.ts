import { expect, test, type Page } from "@playwright/test";
import { adminMovieFixture } from "./fixtures/admin-movie";

const roles = [
  { type: "actor", label: "Cast", id: 31 },
  { type: "director", label: "Directors", id: 32 },
  { type: "producer", label: "Producers", id: 33 },
] as const;

async function editor(page: Page) {
  const state = await adminMovieFixture(page);
  await page.route(`**/api/movies/${state.movie.id}/details`, route => route.fulfill({ json: {
    ...state.movie, originalLanguage: "ja", genres: [], actors: [], directors: [], producers: [],
    shortPlot: null, backdropUrl: null, trailerUrl: null,
  } }));
  const row = state.movies.getByRole("listitem").filter({ hasText: state.movie.title });
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(state.movies.getByRole("region", { name: "Cast & Crew" })).toBeVisible();
  return state;
}

for (const outcome of ["success", "failure"] as const) {
  test(`credit searches ignore a previous query's late ${outcome} for every role`, async ({ page }) => {
    const state = await editor(page);
    const gates = new Map<string, { promise: Promise<void>; release: () => void }>();
    const searches: string[] = [];
    await page.route("**/api/people/search**", async route => {
      const url = new URL(route.request().url());
      const type = url.searchParams.get("type")!;
      const query = url.searchParams.get("q")!;
      searches.push(`${type}:${query}`);
      if (query.startsWith("Old")) {
        await gates.get(type)!.promise;
        if (outcome === "failure") return route.fulfill({ status: 503, json: {} });
      }
      const role = roles.find(item => item.type === type)!;
      return route.fulfill({ json: {
        content: [{ id: query.startsWith("Old") ? role.id + 100 : role.id,
          name: query, type: type.toUpperCase(), photoUrl: null, filmCount: 0 }],
        number: 0, totalPages: 1, totalElements: 1,
      } });
    });
    try {
      for (const role of roles) {
        let release!: () => void;
        gates.set(role.type, { promise: new Promise<void>(resolve => { release = resolve; }), release: () => release() });
        const group = state.movies.getByRole("group", { name: role.label, exact: true });
        const query = group.getByRole("textbox").first();
        await query.fill(`Old ${role.type}`);
        await group.getByRole("button", { name: "Search", exact: true }).click();
        await expect.poll(() => searches).toContain(`${role.type}:Old ${role.type}`);
        await expect(query).toBeEnabled();
        await query.fill(`New ${role.type}`);
        await group.getByRole("button", { name: "Search", exact: true }).click();
        const results = group.getByRole("list", { name: `${role.label} · Search results`, exact: true });
        await expect(results.getByText(`New ${role.type}`, { exact: true })).toBeVisible();
        const oldResponse = page.waitForResponse(response => {
          const url = new URL(response.url());
          return url.pathname === "/api/people/search" && url.searchParams.get("type") === role.type
            && url.searchParams.get("q") === `Old ${role.type}`;
        });
        release();
        await (await oldResponse).finished();
        await page.waitForLoadState("networkidle");
        await expect(results.getByText(`New ${role.type}`, { exact: true })).toBeVisible();
        await expect(group.getByText(`Old ${role.type}`, { exact: true })).toHaveCount(0);
        await expect(group.getByRole("alert")).toHaveCount(0);
        await results.getByRole("button", { name: "Add", exact: true }).click();
        await expect(group.getByRole("button", { name: `Remove New ${role.type}`, exact: true })).toBeVisible();
      }
      await state.movies.getByRole("button", { name: "Save", exact: true }).click();
      expect(state.writes.find(write => write.path === `/api/admin/movies/${state.movie.id}`)?.data).toMatchObject({
        actorCredits: [{ actorId: 31, characterName: null, castOrder: 0 }], directorIds: [32], producerIds: [33],
      });
    } finally {
      for (const gate of gates.values()) gate.release();
    }
  });
}

test("editing a failed credit query clears its error and permits a new search", async ({ page }) => {
  const state = await editor(page);
  await page.route("**/api/people/search**", route => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("q")!.startsWith("Broken")) return route.fulfill({ status: 503, json: {} });
    const role = roles.find(item => item.type === url.searchParams.get("type"))!;
    return route.fulfill({ json: {
      content: [{ id: role.id, name: `Recovered ${role.type}`, type: role.type.toUpperCase(), photoUrl: null, filmCount: 0 }],
      number: 0, totalPages: 1, totalElements: 1,
    } });
  });
  for (const role of roles) {
    const group = state.movies.getByRole("group", { name: role.label, exact: true });
    const query = group.getByRole("textbox").first();
    await query.fill(`Broken ${role.type}`);
    await group.getByRole("button", { name: "Search", exact: true }).click();
    await expect(group.getByRole("alert")).toBeVisible();
    await query.fill("A");
    await expect(group.getByRole("alert")).toHaveCount(0);
    await expect(group.getByRole("button", { name: "Search", exact: true })).toBeDisabled();
    await query.fill(`Recovered ${role.type}`);
    await group.getByRole("button", { name: "Search", exact: true }).click();
    await group.getByRole("list", { name: `${role.label} · Search results`, exact: true })
      .getByRole("button", { name: "Add", exact: true }).click();
    await expect(group.getByRole("button", { name: `Remove Recovered ${role.type}`, exact: true })).toBeVisible();
  }
});

test("Admin genre choices use Ukrainian labels with the existing genre IDs", async ({ page }) => {
  await adminMovieFixture(page);
  await page.goto("/uk/admin?view=movies");
  const movies = page.getByRole("region", { name: "База фільмів", exact: true });
  await expect(movies).toHaveAttribute("aria-busy", "false");
  await movies.locator("details").first().locator(":scope > summary").click();
  const drama = movies.getByRole("checkbox", { name: "Драма", exact: true });
  const comedy = movies.getByRole("checkbox", { name: "Комедія", exact: true });
  await expect(drama).toBeVisible();
  await expect(comedy).toBeVisible();
  await drama.check();
  await comedy.check();
  await expect(drama).toBeChecked();
  await expect(comedy).toBeChecked();
});
