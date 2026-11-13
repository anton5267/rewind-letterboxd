import type { GenreResponse, GlobalSearchArticleResponse, GlobalSearchResponse, MovieCardResponse, MovieDetailsResponse, MovieSearchParams, MovieSearchResult, PersonFilmographyResponse, PersonSearchParams, PersonSearchResult } from "../contracts/catalog.ts";
import type { RewindApiRepository } from "../contracts/repository.ts";
import {
  pool,
} from "../runtime/database.ts";
import {
  pageResult,
  safeId,
} from "./shared/results.ts";

export const catalogueRepository: Pick<RewindApiRepository,
  | "listGenres"
  | "searchMovies"
  | "searchGlobal"
  | "getMovieDetails"
  | "searchPeople"
  | "getPersonFilmography"
> = {

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
    const filters = ["m.is_published = TRUE", "NULLIF(BTRIM(m.title), '') IS NOT NULL"];
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

  async searchGlobal(query, language, size): Promise<GlobalSearchResponse> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const normalizedQuery = query.toLowerCase();
      const fallbackLanguage = language === "en" ? "uk" : "en";
      const [filmCount, films, userCount, users, listCount, lists, tags, people, reviewCount, reviews, articleCount, articles] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.movies m
          WHERE m.is_published = TRUE AND NULLIF(BTRIM(m.title), '') IS NOT NULL AND POSITION($1 IN LOWER(m.title)) > 0`, args: [normalizedQuery] }),
        connection.queryObject<{ id: string; title: string; release_date: string | null; rating: string | null; photo_url: string | null }>({
          text: `SELECT m.id::text AS id, m.title, m.release_date::text AS release_date, m.rating::text AS rating, m.photo_url
                  FROM rewind.movies m WHERE m.is_published = TRUE AND NULLIF(BTRIM(m.title), '') IS NOT NULL
                   AND POSITION($1 IN LOWER(m.title)) > 0
                 ORDER BY m.title ASC, m.id DESC LIMIT $2`, args: [normalizedQuery, size],
        }),
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.users u
          WHERE u.is_active = TRUE AND (POSITION($1 IN LOWER(u.username)) > 0
            OR POSITION($1 IN LOWER(COALESCE(u.display_name, ''))) > 0)`, args: [normalizedQuery] }),
        connection.queryObject<{ id: string; username: string; display_name: string | null; avatar_url: string | null }>({
          text: `SELECT u.id::text AS id, u.username, u.display_name, u.avatar_url FROM rewind.users u
                 WHERE u.is_active = TRUE AND (POSITION($1 IN LOWER(u.username)) > 0
                   OR POSITION($1 IN LOWER(COALESCE(u.display_name, ''))) > 0)
                 ORDER BY u.username ASC, u.id ASC LIMIT $2`, args: [normalizedQuery, size],
        }),
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.lists l
          JOIN rewind.users owner ON owner.id = l.user_id AND owner.is_active = TRUE
          WHERE l.is_public = TRUE AND l.list_type = 'CUSTOM'
            AND (POSITION($1 IN LOWER(l.name)) > 0 OR POSITION($1 IN LOWER(COALESCE(l.description, ''))) > 0
              OR POSITION($1 IN LOWER(owner.username)) > 0)`, args: [normalizedQuery] }),
        connection.queryObject<{ id: string; name: string; description: string | null; owner_id: string; owner_username: string;
          owner_avatar_url: string | null; like_count: string; item_count: string }>({
          text: `SELECT l.id::text AS id, l.name, l.description, owner.id::text AS owner_id,
                        owner.username AS owner_username, owner.avatar_url AS owner_avatar_url,
                        (SELECT COUNT(*)::text FROM rewind.list_likes ll JOIN rewind.users liker
                          ON liker.id = ll.user_id AND liker.is_active = TRUE WHERE ll.list_id = l.id) AS like_count,
                         (SELECT COUNT(*)::text FROM rewind.list_items li JOIN rewind.movies visible_movie ON visible_movie.id = li.movie_id AND visible_movie.is_published = TRUE WHERE li.list_id = l.id) AS item_count
                 FROM rewind.lists l JOIN rewind.users owner ON owner.id = l.user_id AND owner.is_active = TRUE
                 WHERE l.is_public = TRUE AND l.list_type = 'CUSTOM'
                   AND (POSITION($1 IN LOWER(l.name)) > 0 OR POSITION($1 IN LOWER(COALESCE(l.description, ''))) > 0
                     OR POSITION($1 IN LOWER(owner.username)) > 0)
                 ORDER BY l.updated_at DESC, l.id DESC LIMIT $2`, args: [normalizedQuery, size],
        }),
        query.length === 0 ? Promise.resolve({ rows: [] as { id: string; name: string; slug: string }[] })
          : connection.queryObject<{ id: string; name: string; slug: string }>({
            text: `SELECT t.id::text AS id, t.name, t.slug FROM rewind.tags t
                   WHERE POSITION($1 IN LOWER(t.name)) > 0 AND EXISTS (
                     SELECT 1 FROM rewind.list_tags lt JOIN rewind.lists l ON l.id = lt.list_id
                     JOIN rewind.users owner ON owner.id = l.user_id
                     WHERE lt.tag_id = t.id AND l.is_public = TRUE AND l.list_type = 'CUSTOM' AND owner.is_active = TRUE)
                   ORDER BY t.name ASC, t.id ASC LIMIT $2`, args: [normalizedQuery, size],
          }),
        query.length === 0 ? Promise.resolve({ rows: [] as { id: string; name: string; photo_url: string | null; type: "ACTOR" | "DIRECTOR" | "PRODUCER" }[] })
          : connection.queryObject<{ id: string; name: string; photo_url: string | null; type: "ACTOR" | "DIRECTOR" | "PRODUCER" }>({
            text: `SELECT id::text AS id, name, photo_url, type FROM (
                     SELECT a.id, a.name, a.photo_url, 'ACTOR'::text AS type FROM rewind.actors a WHERE POSITION($1 IN LOWER(a.name)) > 0
                     UNION ALL
                     SELECT d.id, d.name, d.photo_url, 'DIRECTOR'::text FROM rewind.directors d WHERE POSITION($1 IN LOWER(d.name)) > 0
                     UNION ALL
                     SELECT p.id, p.name, p.photo_url, 'PRODUCER'::text FROM rewind.producers p WHERE POSITION($1 IN LOWER(p.name)) > 0
                   ) matched ORDER BY name ASC, type ASC, id ASC LIMIT $2`, args: [normalizedQuery, size],
          }),
         connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.reviews r
           JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE JOIN rewind.users author ON author.id = r.user_id
           WHERE r.is_hidden = FALSE AND author.is_active = TRUE AND (POSITION($1 IN LOWER(r.content)) > 0
            OR POSITION($1 IN LOWER(m.title)) > 0 OR POSITION($1 IN LOWER(author.username)) > 0)`, args: [normalizedQuery] }),
        connection.queryObject<{ id: string; movie_id: string; movie_title: string; user_id: string; username: string; content: string;
          rating: string | null; created_at: string; movie_photo_url: string | null; user_avatar_url: string | null }>({
          text: `SELECT r.id::text AS id, r.movie_id::text AS movie_id, m.title AS movie_title,
                        author.id::text AS user_id, author.username, r.content, r.rating::text AS rating,
                        r.created_at::text AS created_at, m.photo_url AS movie_photo_url, author.avatar_url AS user_avatar_url
                  FROM rewind.reviews r JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
                 JOIN rewind.users author ON author.id = r.user_id
                  WHERE r.is_hidden = FALSE AND author.is_active = TRUE AND (POSITION($1 IN LOWER(r.content)) > 0
                   OR POSITION($1 IN LOWER(m.title)) > 0 OR POSITION($1 IN LOWER(author.username)) > 0)
                 ORDER BY r.updated_at DESC, r.id DESC LIMIT $2`, args: [normalizedQuery, size],
        }),
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.journal_articles a
          WHERE a.is_published = TRUE AND (a.language = $1 OR (a.language = $2 AND NOT EXISTS (
            SELECT 1 FROM rewind.journal_articles preferred WHERE preferred.slug = a.slug
              AND preferred.language = $1 AND preferred.is_published = TRUE)))
            AND (POSITION($3 IN LOWER(a.title)) > 0 OR POSITION($3 IN LOWER(COALESCE(a.excerpt, ''))) > 0
              OR POSITION($3 IN LOWER(a.category)) > 0)`, args: [language, fallbackLanguage, normalizedQuery] }),
        connection.queryObject<{ id: string; slug: string; category: string; title: string; excerpt: string | null;
          cover_url: string | null; published_at: string | null }>({
          text: `SELECT a.id::text AS id, a.slug, a.category, a.title, a.excerpt, a.cover_url, a.published_at::text AS published_at
                 FROM rewind.journal_articles a
                 WHERE a.is_published = TRUE AND (a.language = $1 OR (a.language = $2 AND NOT EXISTS (
                   SELECT 1 FROM rewind.journal_articles preferred WHERE preferred.slug = a.slug
                     AND preferred.language = $1 AND preferred.is_published = TRUE)))
                   AND (POSITION($3 IN LOWER(a.title)) > 0 OR POSITION($3 IN LOWER(COALESCE(a.excerpt, ''))) > 0
                     OR POSITION($3 IN LOWER(a.category)) > 0)
                 ORDER BY a.published_at DESC NULLS LAST, a.id DESC LIMIT $4`,
          args: [language, fallbackLanguage, normalizedQuery, size],
        }),
      ]);
      const listIds = lists.rows.map((row) => safeId(row.id, "List ID"));
      const [listTags, listPreviews] = listIds.length === 0 ? [{ rows: [] as { list_id: string; name: string }[] },
        { rows: [] as { list_id: string; movie_id: string; title: string; release_date: string | null; rating: string | null; photo_url: string | null }[] }]
        : await Promise.all([
          connection.queryObject<{ list_id: string; name: string }>({
            text: `SELECT lt.list_id::text AS list_id, t.name FROM rewind.list_tags lt JOIN rewind.tags t ON t.id = lt.tag_id
                   WHERE lt.list_id = ANY($1::bigint[]) ORDER BY lt.list_id, t.name`, args: [listIds],
          }),
          connection.queryObject<{ list_id: string; movie_id: string; title: string; release_date: string | null; rating: string | null; photo_url: string | null }>({
            text: `SELECT list_id::text AS list_id, movie_id::text AS movie_id, title, release_date, rating, photo_url FROM (
                     SELECT li.list_id, m.id AS movie_id, m.title, m.release_date::text AS release_date,
                            m.rating::text AS rating, m.photo_url,
                            ROW_NUMBER() OVER (PARTITION BY li.list_id ORDER BY li.position ASC NULLS LAST, li.id ASC) AS rn
                      FROM rewind.list_items li JOIN rewind.movies m ON m.id = li.movie_id AND m.is_published = TRUE WHERE li.list_id = ANY($1::bigint[])
                   ) ranked WHERE rn <= 3 ORDER BY list_id, rn`, args: [listIds],
          }),
        ]);
      const tagMap = new Map<number, string[]>();
      for (const row of listTags.rows) {
        const id = safeId(row.list_id, "List ID");
        tagMap.set(id, [...(tagMap.get(id) ?? []), row.name]);
      }
      const previewMap = new Map<number, MovieCardResponse[]>();
      for (const row of listPreviews.rows) {
        const id = safeId(row.list_id, "List ID");
        previewMap.set(id, [...(previewMap.get(id) ?? []), {
          id: safeId(row.movie_id, "Movie ID"), title: row.title, releaseDate: row.release_date,
          rating: row.rating === null ? null : Number(row.rating), photoUrl: row.photo_url,
        }]);
      }
      const toPage = <T>(content: T[], total: string) => pageResult(content, total, 0, size);
      const articleContent: GlobalSearchArticleResponse[] = articles.rows.map((row) => ({
        id: safeId(row.id, "Journal article ID"), slug: row.slug, category: row.category,
        title: row.title, excerpt: row.excerpt, coverUrl: row.cover_url, publishedAt: row.published_at,
      }));
      return {
        films: toPage(films.rows.map((row) => ({
          id: safeId(row.id, "Movie ID"), title: row.title, releaseDate: row.release_date,
          rating: row.rating === null ? null : Number(row.rating), photoUrl: row.photo_url,
        })), filmCount.rows[0]?.total ?? "0"),
        users: toPage(users.rows.map((row) => ({
          id: safeId(row.id, "User ID"), username: row.username, displayName: row.display_name, avatarUrl: row.avatar_url,
        })), userCount.rows[0]?.total ?? "0"),
        lists: toPage(lists.rows.map((row) => {
          const id = safeId(row.id, "List ID");
          return { id, name: row.name, description: row.description, isPublic: true,
            ownerId: safeId(row.owner_id, "User ID"), ownerUsername: row.owner_username, ownerAvatarUrl: row.owner_avatar_url,
            tags: tagMap.get(id) ?? [], likeCount: Number(row.like_count), itemCount: Number(row.item_count),
            previewMovies: previewMap.get(id) ?? [] };
        }), listCount.rows[0]?.total ?? "0"),
        tags: tags.rows.map((row) => ({ id: safeId(row.id, "Tag ID"), name: row.name, slug: row.slug })),
        people: people.rows.map((row) => ({ id: safeId(row.id, "Person ID"), name: row.name, photoUrl: row.photo_url, type: row.type })),
        reviews: toPage(reviews.rows.map((row) => ({
          id: safeId(row.id, "Review ID"), movieId: safeId(row.movie_id, "Movie ID"), movieTitle: row.movie_title,
          userId: safeId(row.user_id, "User ID"), username: row.username, content: row.content,
          rating: row.rating === null ? null : Number(row.rating), createdAt: row.created_at,
          moviePhotoUrl: row.movie_photo_url, userAvatarUrl: row.user_avatar_url,
        })), reviewCount.rows[0]?.total ?? "0"),
        journal: toPage(articleContent, articleCount.rows[0]?.total ?? "0"),
      };
    } finally {
      connection.release();
    }
  },

  async getMovieDetails(id: number): Promise<MovieDetailsResponse | null> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_reader");
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
                 FROM rewind.movies WHERE id = $1 AND is_published = TRUE`,
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
    } finally {
      connection.release();
    }
  },

  async searchPeople(params: PersonSearchParams): Promise<PersonSearchResult> {
    const peopleTable = params.type === "ACTOR" ? "actors" : params.type === "DIRECTOR" ? "directors" : "producers";
    const relationTable = params.type === "ACTOR" ? "movie_actors" : params.type === "DIRECTOR" ? "movie_directors" : "movie_producers";
    const relationPersonColumn = params.type === "ACTOR" ? "actor_id" : params.type === "DIRECTOR" ? "director_id" : "producer_id";
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
                        COUNT(DISTINCT m.id)::text AS film_count
                 FROM rewind.${peopleTable} p
                 LEFT JOIN rewind.${relationTable} r ON r.${relationPersonColumn} = p.id
                 LEFT JOIN rewind.movies m ON m.id = r.movie_id AND m.is_published = TRUE
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
    const personTable = type === "ACTOR" ? "actors" : type === "DIRECTOR" ? "directors" : "producers";
    const relation = type === "ACTOR" ? "movie_actors" : type === "DIRECTOR" ? "movie_directors" : "movie_producers";
    const personColumn = type === "ACTOR" ? "actor_id" : type === "DIRECTOR" ? "director_id" : "producer_id";
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
      const relationAlias = type === "ACTOR" ? "ma" : type === "DIRECTOR" ? "md" : "mp";
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
               WHERE ${relationAlias}.${personColumn} = $1 AND m.is_published = TRUE ${genreFilter}
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
};
