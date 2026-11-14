import { expect, test } from "@playwright/test";
import { adminMovieFixture } from "./fixtures/admin-movie";

const cases = [
  { name: "sparse positions", orders: [0, 7], removeFirst: false, expected: 8, width: 1440 },
  { name: "removed first actor", orders: [0, 1], removeFirst: true, expected: 2, width: 393 },
  { name: "unspecified positions", orders: [null, null], removeFirst: false, expected: 0, width: 1440 },
  { name: "empty cast", orders: [], removeFirst: false, expected: 0, width: 393 },
  { name: "maximum database position", orders: [2147483647], removeFirst: false, expected: null, width: 1440 },
];

for (const scenario of cases) {
  test(`new cast credit preserves ${scenario.name}`, async ({ page }) => {
    await page.setViewportSize({ width: scenario.width, height: 900 });
    const actors = scenario.orders.map((castOrder, index) => ({
      id: 99100 + index, name: `Existing Actor ${index}`, characterName: `Role ${index}`, castOrder,
    }));
    const { movie, movies, writes } = await adminMovieFixture(page, { details: { actors } });
    await page.route("**/api/people/search**", route => route.fulfill({ json: {
      content: [{ id: 99200, name: "New Actor", photoUrl: null, type: "ACTOR", filmCount: 0 }],
      number: 0, totalPages: 1, totalElements: 1,
    } }));
    await movies.getByRole("listitem").filter({ hasText: movie.title }).getByRole("button", { name: "Edit", exact: true }).click();
    const cast = movies.getByRole("group", { name: "Cast", exact: true });
    if (scenario.removeFirst) await cast.getByRole("button", { name: "Remove Existing Actor 0", exact: true }).click();
    await cast.getByRole("textbox").first().fill("New Actor");
    await cast.getByRole("button", { name: "Search", exact: true }).click();
    await cast.getByRole("listitem").filter({ hasText: "New Actor" }).getByRole("button").click();
    const added = cast.getByRole("listitem").filter({ hasText: "New Actor" }).filter({ has: page.getByRole("spinbutton") });
    await expect(added.getByRole("spinbutton", { name: "Cast order", exact: true })).toHaveValue(scenario.expected === null ? "" : String(scenario.expected));
    await movies.getByRole("button", { name: "Save", exact: true }).click();
    await expect.poll(() => writes.length).toBe(1);
    const remaining = scenario.removeFirst ? actors.slice(1) : actors;
    expect(writes[0].data).toMatchObject({ actorCredits: [
      ...remaining.map(({ id: actorId, characterName, castOrder }) => ({ actorId, characterName, castOrder })),
      { actorId: 99200, characterName: null, castOrder: scenario.expected },
    ] });
  });
}

test("cast order input enforces database integer bounds before save", async ({ page }) => {
  const { movie, movies, writes } = await adminMovieFixture(page, { details: {
    actors: [{ id: 99100, name: "Existing Actor", characterName: null, castOrder: 0 }],
  } });
  await movies.getByRole("listitem").filter({ hasText: movie.title }).getByRole("button", { name: "Edit", exact: true }).click();
  const order = movies.getByRole("spinbutton", { name: "Cast order", exact: true });
  await expect(order).toHaveAttribute("max", "2147483647");
  for (const value of ["-1", "1.5", "2147483648"]) {
    await order.fill(value);
    expect(await order.evaluate((input: HTMLInputElement) => input.validity.valid)).toBe(false);
    await movies.getByRole("button", { name: "Save", exact: true }).click();
    expect(writes).toHaveLength(0);
  }
  await order.fill("2147483647");
  await movies.getByRole("button", { name: "Save", exact: true }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0].data).toMatchObject({ actorCredits: [{ actorId: 99100, characterName: null, castOrder: 2147483647 }] });
});
