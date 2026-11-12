import { RewindApiError } from "./handler.ts";

interface GenreQueryClient {
  queryObject<T>(query: string | { text: string; args?: unknown[] }): Promise<{ rows: T[] }>;
}

export async function replaceAdminMovieGenres(
  connection: GenreQueryClient,
  movieId: number,
  genreIds: number[],
): Promise<void> {
  const genres = await connection.queryObject<{ id: string }>({
    text: "SELECT id::text AS id FROM rewind.genres WHERE id = ANY($1::bigint[])",
    args: [genreIds],
  });
  if (genres.rows.length !== genreIds.length) {
    throw new RewindApiError(400, "One or more genres were not found");
  }

  await connection.queryObject({ text: "DELETE FROM rewind.movie_genres WHERE movie_id=$1", args: [movieId] });
  if (genreIds.length > 0) {
    await connection.queryObject({
      text: "INSERT INTO rewind.movie_genres (movie_id, genre_id) SELECT $1, selected_genre.genre_id FROM unnest($2::bigint[]) AS selected_genre(genre_id)",
      args: [movieId, genreIds],
    });
  }
}
