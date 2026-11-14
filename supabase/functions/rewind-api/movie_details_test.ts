import { readMovieDetails } from "./repositories/shared/movie_details.ts";

Deno.test("shared movie details excludes unpublished records by default and preserves nullable credits", async () => {
  for (const includeUnpublished of [false, true]) {
    const queries: { text: string; args: unknown[] }[] = [];
    const connection = {
      async queryObject<T>(query: { text: string; args: unknown[] }): Promise<{ rows: T[] }> {
        queries.push(query);
        let rows: unknown[] = [];
        if (query.text.includes("FROM rewind.movies WHERE")) {
          rows = [{ id: "51", imdb_id: null, tmdb_id: null, original_language: "uk", title: "Draft film",
            duration_minutes: null, release_date: null, age_rating: null, rating: null, short_plot: null,
            photo_url: null, backdrop_url: null, trailer_url: null }];
        } else if (query.text.includes("FROM rewind.movie_actors")) {
          rows = [{ id: "7", name: "Actor", photo_url: null, character_name: null, cast_order: null }];
        }
        return { rows: rows as T[] };
      },
    };
    const result = includeUnpublished
      ? await readMovieDetails(connection, 51, true)
      : await readMovieDetails(connection, 51);
    if (queries.length !== 7 || JSON.stringify(queries[0].args) !== JSON.stringify([51, includeUnpublished])
      || !queries[0].text.includes("is_published = TRUE OR $2::boolean")
      || !queries[6].text.includes("m.is_published = TRUE")
      || result?.id !== 51 || result.originalLanguage !== "uk" || result.actors[0].castOrder !== null
      || result.actors[0].characterName !== null || result.myFlags !== null) {
      throw new Error("Movie details visibility, parameters or existing response shape changed");
    }
  }
});

Deno.test("shared movie details returns null when the scoped query finds no movie", async () => {
  const connection = { async queryObject<T>() { return { rows: [] as T[] }; } };
  if (await readMovieDetails(connection, 404) !== null) throw new Error("Missing movie must remain null");
});
