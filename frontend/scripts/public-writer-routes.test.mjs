import test from "node:test";
import assert from "node:assert/strict";
import { publicImageUrl, toWriterRoutePages } from "./public-writer-routes.mjs";

test("creates localized static route descriptors for each known writer", () => {
  assert.deepEqual(toWriterRoutePages([
    { id: 7, name: "Bea Writer", photoUrl: null, type: "WRITER" },
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
  assert.throws(
    () => toWriterRoutePages([{ id: 0, name: "Invalid", photoUrl: null, type: "WRITER" }]),
    /invalid record/,
  );
  assert.throws(
    () => toWriterRoutePages([{ id: 7, name: "Not a writer", photoUrl: null, type: "PRODUCER" }]),
    /invalid record/,
  );
  assert.equal(publicImageUrl("javascript:alert(1)"), null);
  assert.equal(publicImageUrl("https://image.tmdb.org/t/p/w185/bea.jpg"), "https://image.tmdb.org/t/p/w185/bea.jpg");
});
