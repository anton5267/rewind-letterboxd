import type { MovieDetailsResponse } from "../../contracts/catalog.ts";

interface MovieDetailsQueryClient {
  queryObject<T>(query: { text: string; args: unknown[] }): Promise<{ rows: T[] }>;
}

export async function readMovieDetails(
  connection: MovieDetailsQueryClient,
  id: number,
  includeUnpublished = false,
): Promise<MovieDetailsResponse | null> {
  const [movieResult, genreResult, directorResult, producerResult, actorResult, ratingResult, similarResult] = await Promise.all([
    connection.queryObject<{
      id: string;
      imdb_id: string | null;
      tmdb_id: string | null;
      original_language: string | null;
      title: string;
      duration_minutes: string | null;
      release_date: string | null;
      age_rating: string | null;
      rating: string | null;
      short_plot: string | null;
      photo_url: string | null;
      backdrop_url: string | null;
      trailer_url: string | null;
    }>({
      text: `SELECT id::text AS id, imdb_id, tmdb_id::text AS tmdb_id, original_language, title,
                    duration_minutes::text AS duration_minutes, release_date::text AS release_date,
                    age_rating, rating::text AS rating, short_plot, photo_url, backdrop_url, trailer_url
             FROM rewind.movies WHERE id = $1 AND (is_published = TRUE OR $2::boolean)`,
      args: [id, includeUnpublished],
    }),
    connection.queryObject<{ id: string; name: string }>({
      text: `SELECT g.id::text AS id, g.name
             FROM rewind.movie_genres mg JOIN rewind.genres g ON g.id = mg.genre_id
             WHERE mg.movie_id = $1 ORDER BY g.name ASC`,
      args: [id],
    }),
    connection.queryObject<{ id: string; name: string; photo_url: string | null }>({
      text: `SELECT d.id::text AS id, d.name, d.photo_url
             FROM rewind.movie_directors md JOIN rewind.directors d ON d.id = md.director_id
             WHERE md.movie_id = $1 ORDER BY d.name ASC`,
      args: [id],
    }),
    connection.queryObject<{ id: string; name: string; photo_url: string | null }>({
      text: `SELECT p.id::text AS id, p.name, p.photo_url
             FROM rewind.movie_producers mp JOIN rewind.producers p ON p.id = mp.producer_id
             WHERE mp.movie_id = $1 ORDER BY p.name ASC, p.id ASC`,
      args: [id],
    }),
    connection.queryObject<{
      id: string;
      name: string;
      photo_url: string | null;
      character_name: string | null;
      cast_order: string | null;
    }>({
      text: `SELECT a.id::text AS id, a.name, a.photo_url, ma.character_name,
                    ma.cast_order::text AS cast_order
             FROM rewind.movie_actors ma JOIN rewind.actors a ON a.id = ma.actor_id
             WHERE ma.movie_id = $1 ORDER BY ma.cast_order NULLS LAST, a.name ASC`,
      args: [id],
    }),
    connection.queryObject<{
      source: string;
      rating: string;
      votes_count: string | null;
      last_updated_at: string;
    }>({
      text: `SELECT source, rating::text AS rating, votes_count::text AS votes_count,
                    to_char(last_updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS last_updated_at
             FROM rewind.external_ratings WHERE movie_id = $1 ORDER BY source ASC`,
      args: [id],
    }),
    connection.queryObject<{
      id: string;
      title: string;
      release_date: string | null;
      rating: string | null;
      photo_url: string | null;
    }>({
      text: `SELECT m.id::text AS id, m.title, m.release_date::text AS release_date,
                    m.rating::text AS rating, m.photo_url
             FROM rewind.similar_movies sm JOIN rewind.movies m
               ON m.id = sm.similar_movie_id AND m.is_published = TRUE
             WHERE sm.movie_id = $1
             ORDER BY m.release_date DESC NULLS LAST, m.id DESC`,
      args: [id],
    }),
  ]);
  const first = movieResult.rows[0];
  if (!first) return null;
  const safeId = (value: string, field: string): number => {
    const numericId = Number(value);
    if (!Number.isSafeInteger(numericId)) throw new Error(`${field} is outside the safe JSON integer range`);
    return numericId;
  };
  const nullableNumber = (value: string | null): number | null => value === null ? null : Number(value);
  const content = (row: { id: string; title: string; release_date: string | null; rating: string | null; photo_url: string | null }) => ({
    id: safeId(row.id, "Movie ID"),
    title: row.title,
    releaseDate: row.release_date,
    rating: nullableNumber(row.rating),
    photoUrl: row.photo_url,
  });
  return {
    id: safeId(first.id, "Movie ID"),
    imdbId: first.imdb_id,
    tmdbId: nullableNumber(first.tmdb_id),
    originalLanguage: first.original_language,
    title: first.title,
    durationMinutes: nullableNumber(first.duration_minutes),
    releaseDate: first.release_date,
    ageRating: first.age_rating,
    rating: nullableNumber(first.rating),
    shortPlot: first.short_plot,
    photoUrl: first.photo_url,
    backdropUrl: first.backdrop_url,
    trailerUrl: first.trailer_url,
    genres: genreResult.rows.map(row => ({ id: safeId(row.id, "Genre ID"), name: row.name })),
    directors: directorResult.rows.map(row => ({ id: safeId(row.id, "Director ID"), name: row.name, photoUrl: row.photo_url })),
    producers: producerResult.rows.map(row => ({ id: safeId(row.id, "Producer ID"), name: row.name, photoUrl: row.photo_url })),
    actors: actorResult.rows.map(row => ({
      id: safeId(row.id, "Actor ID"),
      name: row.name,
      photoUrl: row.photo_url,
      characterName: row.character_name,
      castOrder: nullableNumber(row.cast_order),
    })),
    externalRatings: ratingResult.rows.map(row => ({
      source: row.source,
      rating: Number(row.rating),
      votesCount: nullableNumber(row.votes_count),
      lastUpdatedAt: row.last_updated_at,
    })),
    similarMovies: similarResult.rows.map(content),
    myFlags: null,
  };
}
