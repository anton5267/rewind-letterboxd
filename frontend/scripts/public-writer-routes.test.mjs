import test from "node:test";
import assert from "node:assert/strict";
import { fetchPublishedWriterPeople, toWriterRoutePages } from "./public-writer-routes.mjs";

test("fetches each published movie's writer credits with a bounded number of requests", async () => {
  const movies = Array.from({ length: 5 }, (_, index) => ({ id: index + 1 }));
  let active = 0;
  let maxActive = 0;
  const requestCatalog = async resource => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise(resolve => setTimeout(resolve, 5));
    active -= 1;
    const id = Number(resource.match(/^\/movies\/(\d+)\/details\?language=en$/)?.[1]);
    assert.ok(id, `unexpected catalog resource: ${resource}`);
    return {
      id,
      writers: id === 1
        ? [{ tmdbId: 42, name: "Ada Writer", photoUrl: "https://image.tmdb.org/t/p/w185/ada.jpg" }]
        : id === 2
          ? [{ tmdbId: 42, name: "Ada Writer", photoUrl: "https://image.tmdb.org/t/p/w185/ada.jpg" }, { tmdbId: 7, name: "Bea Writer", photoUrl: null }]
          : [],
    };
  };

  const writers = await fetchPublishedWriterPeople(movies, requestCatalog, 2);

  assert.equal(maxActive, 2);
  assert.deepEqual(writers, [
    { tmdbId: 7, name: "Bea Writer", photoUrl: null },
    { tmdbId: 42, name: "Ada Writer", photoUrl: "https://image.tmdb.org/t/p/w185/ada.jpg" },
  ]);
});

test("rejects incomplete or mismatched movie details instead of silently omitting writer routes", async () => {
  await assert.rejects(
    fetchPublishedWriterPeople([{ id: 8 }], async () => ({ id: 9, writers: [] })),
    /details did not match published movie 8/,
  );
  await assert.rejects(
    fetchPublishedWriterPeople([{ id: 8 }], async () => ({ id: 8 })),
    /Writer credits were missing for published movie 8/,
  );
});

test("creates localized static route descriptors for each known writer", () => {
  assert.deepEqual(toWriterRoutePages([
    { tmdbId: 7, name: "Bea Writer", photoUrl: null },
  ]), [
    {
      route: "uk/people/writer/7", language: "uk", title: "Bea Writer",
      description: "Фільмографія сценариста Bea Writer у публічному каталозі REWIND.", imageUrl: null,
    },
    {
      route: "en/people/writer/7", language: "en", title: "Bea Writer",
      description: "Bea Writer's writer filmography in the public REWIND catalogue.", imageUrl: null,
    },
  ]);
});
