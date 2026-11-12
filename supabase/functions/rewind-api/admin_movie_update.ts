import type { AdminMovieWriteRequest } from "./handler.ts";

const movieUpdateColumns = [
  ["title", "title"], ["imdbId", "imdb_id"], ["originalLanguage", "original_language"], ["durationMinutes", "duration_minutes"],
  ["releaseDate", "release_date"], ["ageRating", "age_rating"], ["rating", "rating"],
  ["shortPlot", "short_plot"], ["photoUrl", "photo_url"], ["backdropUrl", "backdrop_url"], ["trailerUrl", "trailer_url"],
  ["published", "is_published"],
] as const satisfies readonly (readonly [keyof AdminMovieWriteRequest, string])[];

export interface AdminMovieUpdateQuery {
  text: string;
  args: unknown[];
}

const movieAuditFieldOrder = [
  "title", "imdbId", "originalLanguage", "durationMinutes", "releaseDate", "ageRating", "rating",
  "shortPlot", "photoUrl", "backdropUrl", "trailerUrl", "published", "genreIds", "actorCredits",
  "directorIds", "producerIds",
] as const satisfies readonly (keyof AdminMovieWriteRequest)[];

export function buildAdminMovieAuditMetadata(body: AdminMovieWriteRequest): string | null {
  const fields = movieAuditFieldOrder.filter((field) => body[field] !== undefined);
  return fields.length ? `fields=${fields.join(",")}` : null;
}

export function buildAdminMovieUpdateQuery(
  id: number,
  body: AdminMovieWriteRequest,
): AdminMovieUpdateQuery | null {
  const fields: string[] = [];
  const args: unknown[] = [id];
  for (const [property, column] of movieUpdateColumns) {
    const value = body[property];
    // Undefined means "leave unchanged"; null explicitly clears nullable fields.
    if (value === undefined) continue;
    args.push(value);
    fields.push(`${column}=$${args.length}`);
  }
  if (fields.length === 0) return null;

  return {
    text: `UPDATE rewind.movies SET ${fields.join(",")}, updated_at=CURRENT_TIMESTAMP WHERE id=$1
           RETURNING id::text AS id, tmdb_id::text AS tmdb_id, title, release_date::text AS release_date, rating::text AS rating, photo_url, is_published`,
    args,
  };
}
