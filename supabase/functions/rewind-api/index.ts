import { Pool } from "@db/postgres";
import {
  createRewindApiHandler,
  type MovieDetailsResponse,
  type GenreResponse,
  type MovieSearchParams,
  type MovieSearchResult,
  type PersonFilmographyResponse,
  type PersonSearchParams,
  type PersonSearchResult,
} from "./handler.ts";

const databaseUrl = Deno.env.get("SUPABASE_DB_URL");
if (!databaseUrl) {
  throw new Error("SUPABASE_DB_URL must be available to this Edge Function");
}

// The server-only connection URL never leaves this function. Each checkout
// assumes the NOLOGIN role with SELECT on catalog tables only.
const pool = new Pool(databaseUrl, 1, true);

const allowedOrigins = (Deno.env.get("REWIND_ALLOWED_ORIGINS")
  ?? "https://anton5267.github.io,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const handler = createRewindApiHandler({
  async listGenres(): Promise<GenreResponse[]> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_reader");
      const result = await connection.queryObject<{ id: string; name: string }>`
        SELECT id::text AS id, name
        FROM rewind.genres
        ORDER BY name ASC
      `;
      return result.rows.map(({ id, name }) => {
        const numericId = Number(id);
        if (!Number.isSafeInteger(numericId)) {
          throw new Error("Genre ID is outside the safe JSON integer range");
        }
        return { id: numericId, name };
      });
    } finally {
      connection.release();
    }
  },
  async searchMovies(params: MovieSearchParams): Promise<MovieSearchResult> {
    const filters = ["NULLIF(BTRIM(m.title), '') IS NOT NULL"];
    const args: unknown[] = [];
    const bind = (value: unknown): string => {
      args.push(value);
      return `$${args.length}`;
    };
    if (params.q) filters.push(`LOWER(m.title) LIKE '%' || LOWER(${bind(params.q)}) || '%'`);
    if (params.genreId !== null) {
      filters.push(`EXISTS (SELECT 1 FROM rewind.movie_genres mg WHERE mg.movie_id = m.id AND mg.genre_id = ${bind(params.genreId)})`);
    }
    if (params.year !== null) filters.push(`EXTRACT(YEAR FROM m.release_date) = ${bind(params.year)}`);
    if (params.minRating !== null) filters.push(`m.rating >= ${bind(params.minRating)}`);

    const orderBy: Record<string, string> = {
      newest: "m.release_date DESC NULLS LAST",
      oldest: "m.release_date ASC NULLS LAST",
      rating_desc: "m.rating DESC NULLS LAST",
      rating_asc: "m.rating ASC NULLS LAST",
      title_asc: "m.title ASC",
    };
    const ordering = orderBy[params.sort] ?? orderBy.newest;
    const where = filters.join(" AND ");
    const countArgs = [...args];
    const pageArgs = [...args, params.size, params.page * params.size];
    const pageSizeArg = pageArgs.length - 1;
    const offsetArg = pageArgs.length;
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_reader");
      const [countResult, rowsResult] = await Promise.all([
        connection.queryObject<{ total: string }>({
          text: `SELECT COUNT(*)::text AS total FROM rewind.movies m WHERE ${where}`,
          args: countArgs,
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
                 FROM rewind.movies m WHERE ${where}
                 ORDER BY ${ordering}, m.id DESC
                 LIMIT $${pageSizeArg} OFFSET $${offsetArg}`,
          args: pageArgs,
        }),
      ]);
      const totalElements = Number(countResult.rows[0]?.total ?? "0");
      const content = rowsResult.rows.map((row) => {
        const id = Number(row.id);
        if (!Number.isSafeInteger(id)) throw new Error("Movie ID is outside the safe JSON integer range");
        return {
          id,
          title: row.title,
          releaseDate: row.release_date,
          rating: row.rating === null ? null : Number(row.rating),
          photoUrl: row.photo_url,
        };
      });
      return {
        content,
        totalElements,
        totalPages: Math.ceil(totalElements / params.size),
        number: params.page,
      };
    } finally {
      connection.release();
    }
  },
  async getMovieDetails(id: number): Promise<MovieDetailsResponse | null> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_reader");
      const [movieResult, genreResult, directorResult, actorResult, ratingResult, similarResult] = await Promise.all([
        connection.queryObject<{
          id: string;
          imdb_id: string | null;
          tmdb_id: string | null;
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
          text: `SELECT id::text AS id, imdb_id, tmdb_id::text AS tmdb_id, title,
                        duration_minutes::text AS duration_minutes, release_date::text AS release_date,
                        age_rating, rating::text AS rating, short_plot, photo_url, backdrop_url, trailer_url
                 FROM rewind.movies WHERE id = $1`,
          args: [id],
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
                 FROM rewind.similar_movies sm JOIN rewind.movies m ON m.id = sm.similar_movie_id
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
        producers: [],
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
    } finally {
      connection.release();
    }
  },
  async searchPeople(params: PersonSearchParams): Promise<PersonSearchResult> {
    const actor = params.type === "ACTOR";
    const peopleTable = actor ? "actors" : "directors";
    const relationTable = actor ? "movie_actors" : "movie_directors";
    const relationPersonColumn = actor ? "actor_id" : "director_id";
    const personType = params.type;
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_reader");
      const filter = params.q === null ? "" : "WHERE LOWER(p.name) LIKE '%' || LOWER($1) || '%'";
      const countArgs = params.q === null ? [] : [params.q];
      const pageArgs = params.q === null
        ? [params.size, params.page * params.size]
        : [params.q, params.size, params.page * params.size];
      const sizeArg = pageArgs.length - 1;
      const offsetArg = pageArgs.length;
      const [countResult, peopleResult] = await Promise.all([
        connection.queryObject<{ total: string }>({
          text: `SELECT COUNT(*)::text AS total FROM rewind.${peopleTable} p ${filter}`,
          args: countArgs,
        }),
        connection.queryObject<{
          id: string;
          name: string;
          photo_url: string | null;
          film_count: string;
        }>({
          text: `SELECT p.id::text AS id, p.name, p.photo_url,
                        COUNT(DISTINCT r.movie_id)::text AS film_count
                 FROM rewind.${peopleTable} p
                 LEFT JOIN rewind.${relationTable} r ON r.${relationPersonColumn} = p.id
                 ${filter}
                 GROUP BY p.id, p.name, p.photo_url
                 ORDER BY LOWER(p.name), p.id
                 LIMIT $${sizeArg} OFFSET $${offsetArg}`,
          args: pageArgs,
        }),
      ]);
      const totalElements = Number(countResult.rows[0]?.total ?? "0");
      const content = peopleResult.rows.map((person) => {
        const id = Number(person.id);
        if (!Number.isSafeInteger(id)) throw new Error("Person ID is outside the safe JSON integer range");
        return {
          id,
          name: person.name,
          photoUrl: person.photo_url,
          type: personType,
          filmCount: Number(person.film_count),
        };
      });
      return {
        content,
        totalElements,
        totalPages: Math.ceil(totalElements / params.size),
        number: params.page,
      };
    } finally {
      connection.release();
    }
  },
  async getPersonFilmography(type, id, genreId, sort): Promise<PersonFilmographyResponse | null> {
    const personTable = type === "ACTOR" ? "actors" : "directors";
    const relation = type === "ACTOR" ? "movie_actors" : "movie_directors";
    const personColumn = type === "ACTOR" ? "actor_id" : "director_id";
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_reader");
      const personResult = await connection.queryObject<{
        id: string;
        name: string;
        photo_url: string | null;
      }>({
        text: `SELECT id::text AS id, name, photo_url FROM rewind.${personTable} WHERE id = $1`,
        args: [id],
      });
      const person = personResult.rows[0];
      if (!person) return null;

      const sortColumns: Record<string, string> = {
        newest: "m.release_date DESC NULLS LAST",
        oldest: "m.release_date ASC NULLS LAST",
        rating: "m.rating DESC NULLS LAST",
        title: "LOWER(m.title) ASC",
      };
      const ordering = sortColumns[sort] ?? sortColumns.newest;
      const genreFilter = genreId === null
        ? ""
        : "AND EXISTS (SELECT 1 FROM rewind.movie_genres mg WHERE mg.movie_id = m.id AND mg.genre_id = $2)";
      const relationAlias = type === "ACTOR" ? "ma" : "md";
      const characterColumn = type === "ACTOR" ? "ma.character_name" : "NULL::text";
      const args = genreId === null ? [id] : [id, genreId];
      const filmResult = await connection.queryObject<{
        id: string;
        title: string;
        release_date: string | null;
        rating: string | null;
        photo_url: string | null;
        character_name: string | null;
      }>({
        text: `SELECT m.id::text AS id, m.title, m.release_date::text AS release_date,
                      m.rating::text AS rating, m.photo_url,
                      ${characterColumn} AS character_name
               FROM rewind.${relation} ${relationAlias}
               JOIN rewind.movies m ON m.id = ${relationAlias}.movie_id
               WHERE ${relationAlias}.${personColumn} = $1 ${genreFilter}
               ORDER BY ${ordering}, m.id ASC`,
        args,
      });
      const safeId = (value: string, field: string): number => {
        const numericId = Number(value);
        if (!Number.isSafeInteger(numericId)) throw new Error(`${field} is outside the safe JSON integer range`);
        return numericId;
      };
      return {
        id: safeId(person.id, "Person ID"),
        name: person.name,
        photoUrl: person.photo_url,
        type,
        films: filmResult.rows.map((film) => ({
          id: safeId(film.id, "Movie ID"),
          title: film.title,
          releaseDate: film.release_date,
          rating: film.rating === null ? null : Number(film.rating),
          photoUrl: film.photo_url,
          characterName: film.character_name,
        })),
      };
    } finally {
      connection.release();
    }
  },
}, allowedOrigins);

Deno.serve(handler);
