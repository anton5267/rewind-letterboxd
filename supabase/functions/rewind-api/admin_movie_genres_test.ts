import { replaceAdminMovieGenres } from "./admin_movie_genres.ts";

function createQueryClient(existingIds: string[]) {
  const calls: Array<{ text: string; args?: unknown[] } | string> = [];
  return {
    calls,
    async queryObject<T>(query: string | { text: string; args?: unknown[] }) {
      calls.push(query);
      return { rows: (typeof query === "string" ? [] : query.text.startsWith("SELECT id::text") ? existingIds.map(id => ({ id })) : []) as T[] };
    },
  };
}

Deno.test("genre replacement validates IDs before atomically replacing join rows", async () => {
  const client = createQueryClient(["2", "5"]);
  await replaceAdminMovieGenres(client, 23, [2, 5]);
  const expected = [
    { text: "SELECT id::text AS id FROM rewind.genres WHERE id = ANY($1::bigint[])", args: [[2, 5]] },
    { text: "DELETE FROM rewind.movie_genres WHERE movie_id=$1", args: [23] },
    { text: "INSERT INTO rewind.movie_genres (movie_id, genre_id) SELECT $1, selected_genre.genre_id FROM unnest($2::bigint[]) AS selected_genre(genre_id)", args: [23, [2, 5]] },
  ];
  if (JSON.stringify(client.calls) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected genre replacement queries: ${JSON.stringify(client.calls)}`);
  }
});

Deno.test("genre replacement rejects unknown IDs before deleting existing links", async () => {
  const client = createQueryClient(["2"]);
  let rejected = false;
  try { await replaceAdminMovieGenres(client, 23, [2, 5]); } catch { rejected = true; }
  if (!rejected || client.calls.length !== 1) {
    throw new Error(`Unknown genre did not fail before mutation: ${JSON.stringify(client.calls)}`);
  }
});

Deno.test("empty genre selection removes existing links without inserting rows", async () => {
  const client = createQueryClient([]);
  await replaceAdminMovieGenres(client, 23, []);
  if (client.calls.length !== 2 || typeof client.calls[1] === "string"
    || client.calls[1].text !== "DELETE FROM rewind.movie_genres WHERE movie_id=$1") {
    throw new Error(`Empty selection did not clear genre links: ${JSON.stringify(client.calls)}`);
  }
});
