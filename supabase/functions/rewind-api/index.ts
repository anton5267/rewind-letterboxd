import { Pool } from "@db/postgres";
import {
  createRewindApiHandler,
  type MovieDetailsResponse,
  type GenreResponse,
  type MovieSearchParams,
  type MovieSearchResult,
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
      const result = await connection.queryObject<{
        id: string;
        title: string;
        release_date: string | null;
        rating: string | null;
        photo_url: string | null;
        genre_id: string | null;
        genre_name: string | null;
      }>({
        text: `SELECT m.id::text AS id, m.title, m.release_date::text AS release_date,
                      m.rating::text AS rating, m.photo_url,
                      g.id::text AS genre_id, g.name AS genre_name
               FROM rewind.movies m
               LEFT JOIN rewind.movie_genres mg ON mg.movie_id = m.id
               LEFT JOIN rewind.genres g ON g.id = mg.genre_id
               WHERE m.id = $1
               ORDER BY g.name ASC`,
        args: [id],
      });
      const first = result.rows[0];
      if (!first) return null;
      const movieId = Number(first.id);
      if (!Number.isSafeInteger(movieId)) throw new Error("Movie ID is outside the safe JSON integer range");
      return {
        id: movieId,
        imdbId: null,
        tmdbId: null,
        title: first.title,
        durationMinutes: null,
        releaseDate: first.release_date,
        ageRating: null,
        rating: first.rating === null ? null : Number(first.rating),
        shortPlot: null,
        photoUrl: first.photo_url,
        backdropUrl: null,
        trailerUrl: null,
        genres: result.rows.flatMap((row) => row.genre_id && row.genre_name
          ? [{ id: Number(row.genre_id), name: row.genre_name }]
          : []),
        directors: [],
        producers: [],
        actors: [],
        externalRatings: [],
        similarMovies: [],
        myFlags: null,
      };
    } finally {
      connection.release();
    }
  },
}, allowedOrigins);

Deno.serve(handler);
