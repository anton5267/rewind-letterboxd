import type { AdminTmdbBatchResponse, AdminTmdbDiscoveryResponse, AdminTmdbMovieCandidate, AdminTmdbQualityReport, AdminTmdbSyncResponse } from "../contracts/admin.ts";
import type { HostedAuthUser } from "../contracts/auth.ts";
import type { RewindApiRepository } from "../contracts/repository.ts";
import { RewindApiError } from "../http/errors.ts";
import {
  tmdbApiBaseUrl,
  tmdbApiKey,
} from "../runtime/config.ts";
import {
  type PgConnection,
} from "../runtime/database.ts";
import {
  beginAdminTransaction,
} from "../runtime/transactions.ts";
import {
  TmdbError,
  discoverTmdbMovies,
  fetchTmdbMovie,
  searchTmdbMovieCandidates,
  type TmdbMovie,
  type TmdbPerson,
} from "../tmdb.ts";
import {
  recordAdminAudit,
} from "./shared/admin_audit.ts";

class TmdbProviderApiError extends RewindApiError {
  constructor(status: number, message: string, readonly providerStatus: number | null) {
    super(status, message);
  }
}

function tmdbApiFailure(error: unknown): never {
  if (error instanceof TmdbError) {
    throw new TmdbProviderApiError(error.status, error.message, error.providerStatus);
  }
  throw error;
}

async function assertTmdbAdmin(authUser: HostedAuthUser) {
  const { connection } = await beginAdminTransaction(authUser);
  try { await connection.queryObject("COMMIT"); }
  catch (error) { try { await connection.queryObject("ROLLBACK"); } catch { /* closed */ } throw error; }
  finally { connection.release(); }
}

async function resolveTmdbPerson(connection: PgConnection, table: "actors" | "directors" | "producers", value: TmdbPerson): Promise<number> {
  const found = await connection.queryObject<{ id: string }>({
    text: `SELECT id::text AS id FROM rewind.${table} WHERE tmdb_id=$1 OR LOWER(name)=LOWER($2) ORDER BY (tmdb_id=$1) DESC NULLS LAST LIMIT 1`,
    args: [value.tmdbId, value.name],
  });
  if (found.rows[0]) {
    const id = Number(found.rows[0].id);
    await connection.queryObject({ text: `UPDATE rewind.${table} SET name=$2, tmdb_id=$3, photo_url=$4 WHERE id=$1`, args: [id, value.name, value.tmdbId, value.photoUrl] });
    return id;
  }
  const inserted = await connection.queryObject<{ id: string }>({
    text: `INSERT INTO rewind.${table} (name, tmdb_id, photo_url) VALUES ($1,$2,$3) RETURNING id::text AS id`,
    args: [value.name, value.tmdbId, value.photoUrl],
  });
  return Number(inserted.rows[0]!.id);
}

async function applyTmdbMovie(connection: PgConnection, adminId: number, movieId: number, data: TmdbMovie, syncSimilar: boolean): Promise<AdminTmdbSyncResponse> {
  const movie = await connection.queryObject<{ id: string; title: string }>({
    text: "SELECT id::text AS id, title FROM rewind.movies WHERE id=$1 FOR UPDATE", args: [movieId],
  });
  if (!movie.rows[0]) throw new RewindApiError(404, "Movie not found");
  if (data.imdbId) {
    const collision = await connection.queryObject<{ id: string }>({ text: "SELECT id::text AS id FROM rewind.movies WHERE imdb_id=$1 AND id<>$2", args: [data.imdbId, movieId] });
    if (collision.rows.length) throw new RewindApiError(409, "IMDb id is already linked to another movie");
  }
  const update = await connection.queryObject<{ title: string }>({
    text: `UPDATE rewind.movies SET tmdb_id=$2, imdb_id=COALESCE(NULLIF($3,''),imdb_id), original_language=$4, title=$5,
           duration_minutes=$6, release_date=$7, short_plot=NULLIF($8,''), photo_url=$9, backdrop_url=$10,
           trailer_url=$11, updated_at=CURRENT_TIMESTAMP WHERE id=$1 RETURNING title`,
    args: [movieId, data.tmdbId, data.imdbId, data.originalLanguage, data.title, data.runtime, data.releaseDate, data.overview, data.posterUrl, data.backdropUrl, data.trailerUrl],
  });
  for (const genre of data.genres) {
    const found = await connection.queryObject<{ id: string }>({ text: "SELECT id::text AS id FROM rewind.genres WHERE tmdb_id=$1 OR LOWER(name)=LOWER($2) ORDER BY (tmdb_id=$1) DESC NULLS LAST LIMIT 1", args: [genre.tmdbId, genre.name] });
    if (found.rows[0]) await connection.queryObject({ text: "UPDATE rewind.genres SET name=$2, tmdb_id=$3 WHERE id=$1", args: [Number(found.rows[0].id), genre.name, genre.tmdbId] });
    else await connection.queryObject({ text: "INSERT INTO rewind.genres (name,tmdb_id) VALUES ($1,$2)", args: [genre.name, genre.tmdbId] });
  }
  await connection.queryObject({ text: "DELETE FROM rewind.movie_genres WHERE movie_id=$1", args: [movieId] });
  await connection.queryObject({ text: `INSERT INTO rewind.movie_genres(movie_id,genre_id)
      SELECT $1,id FROM rewind.genres WHERE tmdb_id=ANY($2::bigint[])`, args: [movieId, data.genres.map((x) => x.tmdbId)] });

  const actorIds: { id: number; characterName: string | null; castOrder: number | null }[] = [];
  for (const cast of data.cast) actorIds.push({ id: await resolveTmdbPerson(connection, "actors", cast), characterName: cast.characterName, castOrder: cast.castOrder });
  await connection.queryObject({ text: "DELETE FROM rewind.movie_actors WHERE movie_id=$1", args: [movieId] });
  for (const actor of actorIds) await connection.queryObject({ text: "INSERT INTO rewind.movie_actors(movie_id,actor_id,character_name,cast_order) VALUES($1,$2,$3,$4)", args: [movieId, actor.id, actor.characterName, actor.castOrder] });

  const directorIds: number[] = [];
  for (const person of data.directors) directorIds.push(await resolveTmdbPerson(connection, "directors", person));
  await connection.queryObject({ text: "DELETE FROM rewind.movie_directors WHERE movie_id=$1", args: [movieId] });
  for (const id of directorIds) await connection.queryObject({ text: "INSERT INTO rewind.movie_directors(movie_id,director_id) VALUES($1,$2)", args: [movieId, id] });

  const producerIds: number[] = [];
  for (const person of data.producers) producerIds.push(await resolveTmdbPerson(connection, "producers", person));
  await connection.queryObject({ text: "DELETE FROM rewind.movie_producers WHERE movie_id=$1", args: [movieId] });
  for (const id of producerIds) await connection.queryObject({ text: "INSERT INTO rewind.movie_producers(movie_id,producer_id) VALUES($1,$2)", args: [movieId, id] });

  if (data.voteAverage !== null) await connection.queryObject({
    text: `INSERT INTO rewind.external_ratings(movie_id,source,rating,votes_count,last_updated_at) VALUES($1,'TMDB',$2,$3,CURRENT_TIMESTAMP)
           ON CONFLICT(movie_id,source) DO UPDATE SET rating=EXCLUDED.rating,votes_count=EXCLUDED.votes_count,last_updated_at=CURRENT_TIMESTAMP`,
    args: [movieId, data.voteAverage, data.voteCount],
  });
  let similarMoviesLinked = 0;
  if (syncSimilar) {
    await connection.queryObject({ text: "DELETE FROM rewind.similar_movies WHERE movie_id=$1", args: [movieId] });
    const linked = await connection.queryObject({
      text: `INSERT INTO rewind.similar_movies(movie_id,similar_movie_id)
        SELECT $1,m.id FROM rewind.movies m WHERE m.tmdb_id=ANY($2::bigint[]) AND m.id<>$1
        ORDER BY array_position($2::bigint[],m.tmdb_id) LIMIT 6 ON CONFLICT DO NOTHING`,
      args: [movieId, data.similarTmdbIds],
    });
    similarMoviesLinked = linked.rowCount ?? 0;
  }
  await recordAdminAudit(connection, adminId, "MOVIE_TMDB_SYNCED", "MOVIE", movieId, `tmdbId=${data.tmdbId}`);
  return { movieId, tmdbId: data.tmdbId, title: update.rows[0]?.title ?? movie.rows[0].title,
    genresUpdated: data.genres.length, actorsUpdated: data.cast.length, directorsUpdated: data.directors.length,
    producersUpdated: data.producers.length, similarMoviesLinked, trailerUpdated: !!data.trailerUrl };
}

export async function syncOneTmdb(authUser: HostedAuthUser, movieId: number, tmdbId: number, syncSimilar: boolean, importIfMissing = false): Promise<AdminTmdbSyncResponse> {
  await assertTmdbAdmin(authUser);
  let data: TmdbMovie;
  try { data = await fetchTmdbMovie(tmdbId, tmdbApiKey, fetch, tmdbApiBaseUrl); } catch (error) { return tmdbApiFailure(error); }
  const { connection, userId } = await beginAdminTransaction(authUser);
  try {
    const result = await connection.queryObject<{ id: string }>({ text: "SELECT id::text AS id FROM rewind.movies WHERE id=$1", args: [movieId] });
    if (!result.rows[0] && !importIfMissing) throw new RewindApiError(404, "Movie not found");
    let actualMovieId = movieId;
    if (!result.rows[0]) {
      const existing = await connection.queryObject<{ id: string }>({ text: "SELECT id::text AS id FROM rewind.movies WHERE tmdb_id=$1", args: [tmdbId] });
      if (existing.rows[0]) actualMovieId = Number(existing.rows[0].id);
      else {
        const inserted = await connection.queryObject<{ id: string }>({ text: "INSERT INTO rewind.movies(title) VALUES($1) RETURNING id::text AS id", args: [`TMDB ${tmdbId}`] });
        actualMovieId = Number(inserted.rows[0]!.id);
      }
    }
    const synced = await applyTmdbMovie(connection, userId, actualMovieId, data, syncSimilar);
    await connection.queryObject("COMMIT");
    return synced;
  } catch (error) {
    try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may be closed */ }
    throw error;
  } finally { connection.release(); }
}

function batchResult(items: AdminTmdbBatchResponse["items"]): AdminTmdbBatchResponse {
  const succeeded = items.filter((item) => item.status !== "FAILED").length;
  return { requested: items.length, succeeded, failed: items.length - succeeded, items };
}

async function importTmdbIds(authUser: HostedAuthUser, tmdbIds: number[], syncSimilar: boolean): Promise<AdminTmdbBatchResponse> {
  const items: AdminTmdbBatchResponse["items"] = [];
  for (const tmdbId of tmdbIds) {
    try {
      const result = await syncOneTmdb(authUser, -1, tmdbId, syncSimilar, true);
      items.push({ movieId: result.movieId, tmdbId, status: "IMPORTED", title: result.title, message: "Movie imported and metadata synchronized" });
    } catch (error) {
      items.push({ movieId: null, tmdbId, status: "FAILED", title: null, message: error instanceof Error ? error.message : "TMDB import failed" });
    }
  }
  return batchResult(items);
}

export const adminTmdbRepository: Pick<RewindApiRepository,
  | "getAdminTmdbQuality"
  | "syncAdminTmdbMovie"
  | "searchAdminMovieTmdbCandidates"
  | "syncAdminTmdbBatch"
  | "importAdminTmdb"
  | "discoverAndImportAdminTmdb"
> = {

  async getAdminTmdbQuality(authUser) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        total_movies: string; tmdb_linked_movies: string; complete_tmdb_movies: string;
        missing_poster: string; missing_backdrop: string; missing_plot: string; missing_runtime: string;
        missing_trailer: string; missing_tmdb_rating: string; missing_original_language: string;
      }>({
        text: `SELECT COUNT(*)::text AS total_movies,
          COUNT(*) FILTER (WHERE m.tmdb_id IS NOT NULL)::text AS tmdb_linked_movies,
          COUNT(*) FILTER (WHERE m.tmdb_id IS NOT NULL
            AND NULLIF(TRIM(m.photo_url),'') IS NOT NULL AND NULLIF(TRIM(m.backdrop_url),'') IS NOT NULL
            AND NULLIF(TRIM(m.short_plot),'') IS NOT NULL AND m.duration_minutes IS NOT NULL
            AND LENGTH(TRIM(m.original_language)) = 2
            AND NULLIF(TRIM(m.trailer_url),'') IS NOT NULL
            AND EXISTS (SELECT 1 FROM rewind.external_ratings er WHERE er.movie_id=m.id AND er.source='TMDB'))::text AS complete_tmdb_movies,
          COUNT(*) FILTER (WHERE m.tmdb_id IS NOT NULL AND NULLIF(TRIM(m.photo_url),'') IS NULL)::text AS missing_poster,
          COUNT(*) FILTER (WHERE m.tmdb_id IS NOT NULL AND NULLIF(TRIM(m.backdrop_url),'') IS NULL)::text AS missing_backdrop,
          COUNT(*) FILTER (WHERE m.tmdb_id IS NOT NULL AND NULLIF(TRIM(m.short_plot),'') IS NULL)::text AS missing_plot,
          COUNT(*) FILTER (WHERE m.tmdb_id IS NOT NULL AND m.duration_minutes IS NULL)::text AS missing_runtime,
          COUNT(*) FILTER (WHERE m.tmdb_id IS NOT NULL AND NULLIF(TRIM(m.trailer_url),'') IS NULL)::text AS missing_trailer,
          COUNT(*) FILTER (WHERE m.tmdb_id IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM rewind.external_ratings er WHERE er.movie_id=m.id AND er.source='TMDB'))::text AS missing_tmdb_rating,
          COUNT(*) FILTER (WHERE m.tmdb_id IS NOT NULL
            AND (NULLIF(TRIM(m.original_language),'') IS NULL OR LENGTH(TRIM(m.original_language)) <> 2))::text AS missing_original_language
          FROM rewind.movies m`,
      });
      await connection.queryObject("COMMIT");
      const row = result.rows[0]!;
      const totalMovies = Number(row.total_movies);
      const tmdbLinkedMovies = Number(row.tmdb_linked_movies);
      const completeTmdbMovies = Number(row.complete_tmdb_movies);
      const percent = (value: number, total: number) => total === 0 ? 0 : Math.round(value * 1000 / total) / 10;
      return {
        totalMovies, tmdbLinkedMovies, completeTmdbMovies, missingPoster: Number(row.missing_poster),
        missingBackdrop: Number(row.missing_backdrop), missingPlot: Number(row.missing_plot),
        missingRuntime: Number(row.missing_runtime), missingTrailer: Number(row.missing_trailer),
        missingTmdbRating: Number(row.missing_tmdb_rating), missingOriginalLanguage: Number(row.missing_original_language),
        linkedCoveragePercent: percent(tmdbLinkedMovies, totalMovies),
        metadataCompletenessPercent: percent(completeTmdbMovies, tmdbLinkedMovies),
      } satisfies AdminTmdbQualityReport;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async syncAdminTmdbMovie(authUser, input) {
    return await syncOneTmdb(authUser, input.movieId, input.tmdbId, input.syncSimilar);
  },

  async searchAdminMovieTmdbCandidates(authUser, movieId) {
    const { connection } = await beginAdminTransaction(authUser);
    let movie: { title: string; release_date: string | null; imdb_id: string | null } | undefined;
    try {
      const result = await connection.queryObject<{ title: string; release_date: string | null; imdb_id: string | null }>({
        text: "SELECT title, release_date::text AS release_date, imdb_id FROM rewind.movies WHERE id=$1",
        args: [movieId],
      });
      movie = result.rows[0];
      await connection.queryObject("COMMIT");
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
    if (!movie) throw new RewindApiError(404, "Movie not found");
    const yearMatch = movie.release_date?.match(/^(\d{4})/);
    try {
      return await searchTmdbMovieCandidates({ imdbId: movie.imdb_id, title: movie.title, year: yearMatch ? Number(yearMatch[1]) : null }, tmdbApiKey, fetch, tmdbApiBaseUrl) as AdminTmdbMovieCandidate[];
    } catch (error) { return tmdbApiFailure(error); }
  },

  async syncAdminTmdbBatch(authUser, inputs, syncSimilar) {
    const items: AdminTmdbBatchResponse["items"] = [];
    for (const input of inputs) {
      try {
        const result = await syncOneTmdb(authUser, input.movieId, input.tmdbId, syncSimilar);
        items.push({ movieId: result.movieId, tmdbId: result.tmdbId, status: "SYNCED", title: result.title, message: "Movie metadata synchronized" });
      } catch (error) {
        items.push({ movieId: input.movieId, tmdbId: input.tmdbId, status: "FAILED", title: null, message: error instanceof Error ? error.message : "TMDB sync failed" });
      }
    }
    return batchResult(items);
  },

  async importAdminTmdb(authUser, tmdbIds, syncSimilar) {
    return await importTmdbIds(authUser, tmdbIds, syncSimilar);
  },

  async discoverAndImportAdminTmdb(authUser, input) {
    await assertTmdbAdmin(authUser);
    let discovered;
    try { discovered = await discoverTmdbMovies(input, tmdbApiKey, fetch, tmdbApiBaseUrl); } catch (error) { tmdbApiFailure(error); }
    const imports = await importTmdbIds(authUser, discovered.tmdbIds, input.syncSimilar);
    return { page: discovered.page, totalPages: discovered.totalPages, totalResults: discovered.totalResults,
      discovered: discovered.tmdbIds.length, imports } satisfies AdminTmdbDiscoveryResponse;
  },
};
