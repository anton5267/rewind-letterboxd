import { buildAdminMovieUpdateQuery } from "./admin_movie_update.ts";

Deno.test("admin movie update binds explicit nulls to nullable columns and leaves omitted fields unchanged", () => {
  const query = buildAdminMovieUpdateQuery(23, {
    releaseDate: null,
    rating: null,
    photoUrl: null,
  });

  const expected = {
    text: `UPDATE rewind.movies SET release_date=$2,rating=$3,photo_url=$4, updated_at=CURRENT_TIMESTAMP WHERE id=$1
           RETURNING id::text AS id, tmdb_id::text AS tmdb_id, title, release_date::text AS release_date, rating::text AS rating, photo_url, is_published`,
    args: [23, null, null, null],
  };
  if (JSON.stringify(query) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected SQL update query: ${JSON.stringify(query)}`);
  }
});

Deno.test("admin movie update returns no SQL when the request omits every writable field", () => {
  if (buildAdminMovieUpdateQuery(23, {}) !== null) {
    throw new Error("An empty update unexpectedly produced SQL");
  }
});

Deno.test("admin movie update writes original language through the explicit allowlist", () => {
  const query = buildAdminMovieUpdateQuery(23, { originalLanguage: "ja" });
  if (!query || !query.text.includes("original_language=$2") || JSON.stringify(query.args) !== JSON.stringify([23, "ja"])) {
    throw new Error(`Original language was not bound safely: ${JSON.stringify(query)}`);
  }
});
