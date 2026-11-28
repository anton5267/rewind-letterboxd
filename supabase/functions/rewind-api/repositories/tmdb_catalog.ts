import type { TmdbMovieDiscoveryInput, TmdbMovieSearchResponse } from "../contracts/catalog.ts";
import type { HostedAuthUser } from "../contracts/auth.ts";
import type { RewindApiRepository } from "../contracts/repository.ts";
import { RewindApiError } from "../http/errors.ts";
import { tmdbApiBaseUrl, tmdbApiKey } from "../runtime/config.ts";
import { beginUserTransaction } from "../runtime/transactions.ts";
import { TmdbError, discoverTmdbMoviePage, fetchTmdbMovie, searchTmdbMoviePage, type TmdbMovie } from "../tmdb.ts";
import { replaceTmdbCrewCredits } from "./shared/tmdb_crew_credits.ts";
import { resolveTmdbPersonForImport } from "./shared/tmdb_user_import.ts";

const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_MAX_ENTRIES = 256;
const searchCache = new Map<string, { expiresAt: number; value: TmdbMovieSearchResponse }>();
const DISCOVERY_CACHE_TTL_MS = 10 * 60 * 1000;
const discoveryCache = new Map<string, { expiresAt: number; value: TmdbMovieSearchResponse }>();

function providerFailure(error: unknown): never {
  if (error instanceof TmdbError) throw new RewindApiError(error.status, error.message);
  throw error;
}

function numericId(value: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new Error("Database returned an invalid movie ID");
  return parsed;
}

async function applyImportedTmdbMovie(connection: Awaited<ReturnType<typeof beginUserTransaction>>["connection"], movieId: number, data: TmdbMovie) {
  await connection.queryObject({
    text: `UPDATE rewind.movies SET tmdb_id=$2, imdb_id=COALESCE(NULLIF($3,''),imdb_id), original_language=$4,
           title=$5, duration_minutes=$6, release_date=$7, short_plot=NULLIF($8,''), photo_url=$9,
           backdrop_url=$10, trailer_url=$11, updated_at=CURRENT_TIMESTAMP WHERE id=$1`,
    args: [movieId, data.tmdbId, data.imdbId, data.originalLanguage, data.title, data.runtime, data.releaseDate,
      data.overview, data.posterUrl, data.backdropUrl, data.trailerUrl],
  });

  for (const genre of data.genres) {
    const found = await connection.queryObject<{ id: string }>({
      text: "SELECT id::text AS id FROM rewind.genres WHERE tmdb_id=$1 OR LOWER(name)=LOWER($2) ORDER BY (tmdb_id=$1) DESC NULLS LAST LIMIT 1",
      args: [genre.tmdbId, genre.name],
    });
    if (found.rows[0]) await connection.queryObject({
      text: "UPDATE rewind.genres SET name=$2,tmdb_id=$3 WHERE id=$1", args: [Number(found.rows[0].id), genre.name, genre.tmdbId],
    });
    else await connection.queryObject({ text: "INSERT INTO rewind.genres(name,tmdb_id) VALUES($1,$2)", args: [genre.name, genre.tmdbId] });
  }
  await connection.queryObject({ text: "DELETE FROM rewind.movie_genres WHERE movie_id=$1", args: [movieId] });
  await connection.queryObject({
    text: "INSERT INTO rewind.movie_genres(movie_id,genre_id) SELECT $1,id FROM rewind.genres WHERE tmdb_id=ANY($2::bigint[])",
    args: [movieId, data.genres.map(genre => genre.tmdbId)],
  });

  const cast = [];
  for (const person of data.cast) cast.push({ id: await resolveTmdbPersonForImport(connection, "actors", person), ...person });
  await connection.queryObject({ text: "DELETE FROM rewind.movie_actors WHERE movie_id=$1", args: [movieId] });
  for (const person of cast) await connection.queryObject({
    text: "INSERT INTO rewind.movie_actors(movie_id,actor_id,character_name,cast_order) VALUES($1,$2,$3,$4)",
    args: [movieId, person.id, person.characterName, person.castOrder],
  });

  for (const [table, joinTable, foreignKey, people] of [
    ["directors", "movie_directors", "director_id", data.directors],
    ["producers", "movie_producers", "producer_id", data.producers],
  ] as const) {
    const personIds: number[] = [];
    for (const person of people) personIds.push(await resolveTmdbPersonForImport(connection, table, person));
    await connection.queryObject({ text: `DELETE FROM rewind.${joinTable} WHERE movie_id=$1`, args: [movieId] });
    for (const personId of personIds) await connection.queryObject({
      text: `INSERT INTO rewind.${joinTable}(movie_id,${foreignKey}) VALUES($1,$2)`, args: [movieId, personId],
    });
  }

  await replaceTmdbCrewCredits(connection, movieId, data.crewCredits ?? []);
  if (data.voteAverage !== null) await connection.queryObject({
    text: `INSERT INTO rewind.external_ratings(movie_id,source,rating,votes_count,last_updated_at) VALUES($1,'TMDB',$2,$3,CURRENT_TIMESTAMP)
           ON CONFLICT(movie_id,source) DO UPDATE SET rating=EXCLUDED.rating,votes_count=EXCLUDED.votes_count,last_updated_at=CURRENT_TIMESTAMP`,
    args: [movieId, data.voteAverage, data.voteCount],
  });
}

export const tmdbCatalogRepository: Pick<RewindApiRepository, "searchTmdbCatalog" | "discoverTmdbCatalog" | "importTmdbCatalogMovie"> = {
  async searchTmdbCatalog(query, year, page, language) {
    const normalized = query.trim().replace(/\s+/g, " ");
    const key = `${language}:${year ?? ""}:${page}:${normalized.toLocaleLowerCase()}`;
    const now = Date.now();
    for (const [cacheKey, entry] of searchCache) if (entry.expiresAt <= now) searchCache.delete(cacheKey);
    const hit = searchCache.get(key);
    if (hit) return hit.value;
    try {
      const value = await searchTmdbMoviePage(normalized, year, tmdbApiKey, fetch, tmdbApiBaseUrl, page, language);
      if (searchCache.size >= CACHE_MAX_ENTRIES) searchCache.delete(searchCache.keys().next().value!);
      searchCache.set(key, { expiresAt: now + CACHE_TTL_MS, value });
      return value;
    } catch (error) { return providerFailure(error); }
  },

  async discoverTmdbCatalog(input: TmdbMovieDiscoveryInput) {
    const key = JSON.stringify([input.page, input.genreId, input.year, input.minRating, input.language]);
    const now = Date.now();
    for (const [cacheKey, entry] of discoveryCache) if (entry.expiresAt <= now) discoveryCache.delete(cacheKey);
    const hit = discoveryCache.get(key);
    if (hit) return hit.value;
    try {
      const value = await discoverTmdbMoviePage(input, tmdbApiKey, fetch, tmdbApiBaseUrl);
      if (discoveryCache.size >= CACHE_MAX_ENTRIES) discoveryCache.delete(discoveryCache.keys().next().value!);
      discoveryCache.set(key, { expiresAt: now + DISCOVERY_CACHE_TTL_MS, value });
      return value;
    } catch (error) { return providerFailure(error); }
  },

  async importTmdbCatalogMovie(authUser: HostedAuthUser, tmdbId: number) {
    let data: TmdbMovie;
    try { data = await fetchTmdbMovie(tmdbId, tmdbApiKey, fetch, tmdbApiBaseUrl); }
    catch (error) { return providerFailure(error); }

    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      await connection.queryObject({ text: "SELECT id FROM rewind.users WHERE id=$1 FOR UPDATE", args: [userId] });
      const existing = await connection.queryObject<{ id: string; title: string; is_published: boolean }>({
        text: "SELECT id::text AS id,title,is_published FROM rewind.movies WHERE tmdb_id=$1", args: [tmdbId],
      });
      if (existing.rows[0]) {
        if (!existing.rows[0].is_published) throw new RewindApiError(404, "Movie not found");
        await connection.queryObject("COMMIT");
        return { movieId: numericId(existing.rows[0].id), title: existing.rows[0].title };
      }

      const sameTitleYear = await connection.queryObject({
        text: `SELECT 1 FROM rewind.movies WHERE is_published=TRUE AND tmdb_id IS NULL AND LOWER(title)=LOWER($1)
               AND EXTRACT(YEAR FROM release_date)=EXTRACT(YEAR FROM $2::date) LIMIT 1`,
        args: [data.title, data.releaseDate],
      });
      if (sameTitleYear.rows.length) throw new RewindApiError(409, "A matching REWIND entry needs review before adding this film");

      const usage = await connection.queryObject<{ total: string }>({
        text: `SELECT COUNT(*)::text AS total FROM rewind.tmdb_user_imports
               WHERE user_id=$1 AND created_at >= (date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')`,
        args: [userId],
      });
      if (Number(usage.rows[0]?.total ?? "0") >= 5) throw new RewindApiError(429, "Daily film import limit reached; try again tomorrow");

      await connection.queryObject("SELECT set_config('rewind.tmdb_user_import', 'true', TRUE)");
      const inserted = await connection.queryObject<{ id: string }>({
        text: `INSERT INTO rewind.movies(title,tmdb_id,is_published) VALUES($1,$2,TRUE)
               ON CONFLICT(tmdb_id) DO NOTHING RETURNING id::text AS id`,
        args: [data.title, tmdbId],
      });
      if (!inserted.rows[0]) {
        const duplicate = await connection.queryObject<{ id: string; title: string }>({
          text: "SELECT id::text AS id,title FROM rewind.movies WHERE tmdb_id=$1 AND is_published=TRUE", args: [tmdbId],
        });
        if (!duplicate.rows[0]) throw new RewindApiError(404, "Movie not found");
        await connection.queryObject("COMMIT");
        return { movieId: numericId(duplicate.rows[0].id), title: duplicate.rows[0].title };
      }
      const movieId = numericId(inserted.rows[0].id);
      await applyImportedTmdbMovie(connection, movieId, data);
      await connection.queryObject({
        text: "INSERT INTO rewind.tmdb_user_imports(user_id,tmdb_id,movie_id) VALUES($1,$2,$3)", args: [userId, tmdbId, movieId],
      });
      await connection.queryObject("COMMIT");
      return { movieId, title: data.title };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* connection may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
};
