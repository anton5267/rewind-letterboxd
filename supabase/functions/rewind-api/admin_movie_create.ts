import type { AdminMovieWriteRequest } from "./handler.ts";

export interface AdminMovieCreateQuery {
  text: string;
  args: unknown[];
}

export function buildAdminMovieCreateQuery(body: AdminMovieWriteRequest): AdminMovieCreateQuery {
  return {
    text: `INSERT INTO rewind.movies (imdb_id,original_language,title,duration_minutes,release_date,age_rating,rating,short_plot,photo_url,backdrop_url,trailer_url,is_published)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           RETURNING id::text AS id, tmdb_id::text AS tmdb_id, title, release_date::text AS release_date, rating::text AS rating, photo_url, is_published`,
    args: [body.imdbId ?? null, body.originalLanguage ?? null, body.title, body.durationMinutes ?? null,
      body.releaseDate ?? null, body.ageRating ?? null, body.rating ?? null, body.shortPlot ?? null,
      body.photoUrl ?? null, body.backdropUrl ?? null, body.trailerUrl ?? null, body.published ?? true],
  };
}
