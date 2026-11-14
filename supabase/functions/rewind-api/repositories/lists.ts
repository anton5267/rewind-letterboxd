import type { CreateMyListRequest, MyListItemResponse, MyListPageResponse, MyListResponse, PopularTagResponse, PublicListCardResponse, PublicListDetailsResponse, UpdateMyListRequest } from "../contracts/lists.ts";
import type { RewindApiRepository } from "../contracts/repository.ts";
import { RewindApiError } from "../http/errors.ts";
import {
  pool,
} from "../runtime/database.ts";
import {
  beginUserTransaction,
} from "../runtime/transactions.ts";
import {
  getMyContentReport,
  submitContentReport,
} from "./shared/content_reports.ts";
import {
  fetchMyListRows,
  loadListTags,
  replaceListTags,
} from "./shared/lists.ts";
import {
  safeId,
} from "./shared/results.ts";

export const listsRepository: Pick<RewindApiRepository,
  | "getPopularTags"
  | "getMyLists"
  | "getMyListsPage"
  | "createMyList"
  | "updateMyList"
  | "deleteMyList"
  | "getMyListItems"
  | "addMovieToMyList"
  | "removeMovieFromMyList"
  | "reorderMyListItems"
  | "getPublicLists"
  | "getPublicList"
  | "getPublicListLikeStatus"
  | "likePublicList"
  | "unlikePublicList"
  | "getMyListReport"
  | "reportList"
> = {

  async getPopularTags(size): Promise<PopularTagResponse[]> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const result = await connection.queryObject<{ id: string; name: string; slug: string }>({
        text: `SELECT t.id::text AS id, t.name, t.slug
               FROM rewind.tags t JOIN rewind.list_tags lt ON lt.tag_id = t.id
               JOIN rewind.lists l ON l.id = lt.list_id
               WHERE l.is_public = TRUE AND l.list_type = 'CUSTOM'
               GROUP BY t.id, t.name, t.slug
               ORDER BY COUNT(l.id) DESC, t.name ASC, t.id ASC
               LIMIT $1`,
        args: [size],
      });
      return result.rows.map((row) => {
        const id = Number(row.id);
        if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Tag ID is outside the safe JSON integer range.");
        return { id, name: row.name, slug: row.slug };
      });
    } finally { connection.release(); }
  },

  async getMyLists(authUser): Promise<MyListResponse[]> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const lists = await fetchMyListRows(connection, userId);
      await connection.queryObject("COMMIT");
      return lists;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getMyListsPage(authUser, page, size): Promise<MyListPageResponse> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const count = await connection.queryObject<{ total: string }>({
        text: "SELECT COUNT(*)::text AS total FROM rewind.lists WHERE user_id = $1", args: [userId],
      });
      const content = await fetchMyListRows(connection, userId, size, page * size);
      await connection.queryObject("COMMIT");
      const totalElements = Number(count.rows[0]?.total ?? "0");
      return { content, totalPages: Math.ceil(totalElements / size), totalElements, number: page };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async createMyList(authUser, body: CreateMyListRequest): Promise<MyListResponse> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const movieIds = [...new Set(body.movieIds)];
      const movies = await connection.queryObject<{ id: string }>({
        text: "SELECT id::text AS id FROM rewind.movies WHERE id = ANY($1::bigint[]) AND is_published = TRUE", args: [movieIds],
      });
      if (movies.rows.length !== movieIds.length) throw new RewindApiError(400, "One or more movies were not found");
      const inserted = await connection.queryObject<{ id: string }>({
        text: `INSERT INTO rewind.lists (user_id, name, description, list_type, is_public, is_ranked, reply_preference)
               VALUES ($1, $2, $3, 'CUSTOM', $4, $5, $6) RETURNING id::text AS id`,
        args: [userId, body.name, body.description, body.isPublic, body.isRanked ?? true, body.replyPreference ?? null],
      });
      const listId = safeId(inserted.rows[0].id, "List ID");
      for (let index = 0; index < movieIds.length; index++) {
        await connection.queryObject({
          text: `INSERT INTO rewind.list_items (list_id, movie_id, position)
                 VALUES ($1, $2, $3) ON CONFLICT (list_id, movie_id) DO NOTHING`,
          args: [listId, movieIds[index], index + 1],
        });
      }
      const tags = await replaceListTags(connection, listId, body.tags);
      if (body.isPublic) {
        await connection.queryObject({
          text: `INSERT INTO rewind.user_activities (user_id, activity_type, list_id)
                 VALUES ($1, 'LIST', $2)`,
          args: [userId, listId],
        });
      }
      await connection.queryObject("COMMIT");
      return { id: listId, name: body.name, description: body.description,
        listType: "CUSTOM", isPublic: body.isPublic, isRanked: body.isRanked ?? true, replyPreference: body.replyPreference ?? null, tags };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async updateMyList(authUser, listId, body: UpdateMyListRequest): Promise<MyListResponse | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const selected = await connection.queryObject<{
        name: string; description: string | null; list_type: MyListResponse["listType"]; is_public: boolean; is_ranked: boolean; reply_preference: MyListResponse["replyPreference"];
      }>({
        text: `SELECT name, description, list_type, is_public, is_ranked, reply_preference FROM rewind.lists
               WHERE id = $1 AND user_id = $2 FOR UPDATE`, args: [listId, userId],
      });
      const current = selected.rows[0];
      if (!current) { await connection.queryObject("COMMIT"); return null; }
      if (current.list_type !== "CUSTOM") throw new RewindApiError(400, "System list cannot be edited");
      const updateDescription = body.description !== undefined && body.description !== null;
      await connection.queryObject({
        text: `UPDATE rewind.lists SET
                 name = CASE WHEN $3 THEN $4 ELSE name END,
                 description = CASE WHEN $5 THEN $6 ELSE description END,
                 is_public = CASE WHEN $7 THEN $8 ELSE is_public END,
                 is_ranked = CASE WHEN $9 THEN $10 ELSE is_ranked END,
                 reply_preference = CASE WHEN $11 THEN $12::VARCHAR ELSE reply_preference END
               WHERE id = $1 AND user_id = $2`,
        args: [listId, userId, body.name !== undefined, body.name ?? null,
          updateDescription, body.description ?? null, body.isPublic !== undefined, body.isPublic ?? false,
          body.isRanked !== undefined, body.isRanked ?? true,
          body.replyPreference !== undefined, body.replyPreference ?? null],
      });
      const tags = body.tags === undefined
        ? (await loadListTags(connection, [listId])).get(listId) ?? []
        : await replaceListTags(connection, listId, body.tags);
      await connection.queryObject("COMMIT");
      return { id: listId, name: body.name ?? current.name,
        description: updateDescription ? body.description! : current.description,
        listType: "CUSTOM", isPublic: body.isPublic ?? current.is_public,
        isRanked: body.isRanked ?? current.is_ranked,
        replyPreference: body.replyPreference === undefined ? current.reply_preference : body.replyPreference, tags };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async deleteMyList(authUser, listId): Promise<boolean> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const list = await connection.queryObject<{ list_type: string }>({
        text: "SELECT list_type FROM rewind.lists WHERE id = $1 AND user_id = $2", args: [listId, userId],
      });
      if (!list.rows[0]) { await connection.queryObject("COMMIT"); return false; }
      if (list.rows[0].list_type !== "CUSTOM") throw new RewindApiError(400, "System list cannot be deleted");
      await connection.queryObject({ text: "DELETE FROM rewind.lists WHERE id = $1 AND user_id = $2", args: [listId, userId] });
      await connection.queryObject("COMMIT");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getMyListItems(authUser, listId): Promise<MyListItemResponse[] | null> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const list = await connection.queryObject({
        text: "SELECT 1 FROM rewind.lists WHERE id = $1 AND user_id = $2", args: [listId, userId],
      });
      if (!list.rows.length) { await connection.queryObject("COMMIT"); return null; }
      const rows = await connection.queryObject<{
        id: string; position: number | null; movie_id: string; title: string;
        release_date: string | null; rating: string | null; photo_url: string | null;
      }>({
        text: `SELECT li.id::text AS id, li.position, m.id::text AS movie_id, m.title,
                      m.release_date::text AS release_date, m.rating::text AS rating, m.photo_url
               FROM rewind.list_items li JOIN rewind.movies m ON m.id = li.movie_id
               WHERE li.list_id = $1 ORDER BY li.position ASC NULLS LAST, li.id ASC`, args: [listId],
      });
      await connection.queryObject("COMMIT");
      return rows.rows.map((row) => ({
        id: safeId(row.id, "List item ID"), position: row.position,
        movie: { id: safeId(row.movie_id, "Movie ID"), title: row.title, releaseDate: row.release_date,
          rating: row.rating === null ? null : Number(row.rating), photoUrl: row.photo_url },
      }));
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async addMovieToMyList(authUser, listId, movieId, position): Promise<"OK" | "LIST_NOT_FOUND" | "MOVIE_NOT_FOUND"> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const list = await connection.queryObject({
        text: "SELECT 1 FROM rewind.lists WHERE id = $1 AND user_id = $2", args: [listId, userId],
      });
      if (!list.rows.length) { await connection.queryObject("COMMIT"); return "LIST_NOT_FOUND"; }
      const movie = await connection.queryObject({ text: "SELECT 1 FROM rewind.movies WHERE id = $1 AND is_published = TRUE", args: [movieId] });
      if (!movie.rows.length) { await connection.queryObject("COMMIT"); return "MOVIE_NOT_FOUND"; }
      let resolvedPosition = position;
      if (resolvedPosition === null) {
        const max = await connection.queryObject<{ position: number }>({
          text: "SELECT COALESCE(MAX(position), 0) + 1 AS position FROM rewind.list_items WHERE list_id = $1",
          args: [listId],
        });
        resolvedPosition = Number(max.rows[0]?.position ?? 1);
      }
      await connection.queryObject({
        text: `INSERT INTO rewind.list_items (list_id, movie_id, position) VALUES ($1, $2, $3)
               ON CONFLICT (list_id, movie_id) DO NOTHING`, args: [listId, movieId, resolvedPosition],
      });
      await connection.queryObject("COMMIT");
      return "OK";
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async removeMovieFromMyList(authUser, listId, movieId): Promise<"OK" | "LIST_NOT_FOUND" | "LAST_MOVIE"> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const list = await connection.queryObject<{ list_type: string }>({
        text: "SELECT list_type FROM rewind.lists WHERE id = $1 AND user_id = $2", args: [listId, userId],
      });
      if (!list.rows[0]) { await connection.queryObject("COMMIT"); return "LIST_NOT_FOUND"; }
      if (list.rows[0].list_type === "CUSTOM") {
        const count = await connection.queryObject<{ total: string }>({
          text: "SELECT COUNT(*)::text AS total FROM rewind.list_items WHERE list_id = $1", args: [listId],
        });
        if (Number(count.rows[0]?.total ?? "0") <= 1) {
          await connection.queryObject("COMMIT");
          return "LAST_MOVIE";
        }
      }
      await connection.queryObject({
        text: "DELETE FROM rewind.list_items WHERE list_id = $1 AND movie_id = $2", args: [listId, movieId],
      });
      await connection.queryObject("COMMIT");
      return "OK";
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async reorderMyListItems(authUser, listId, orderedItemIds): Promise<"OK" | "LIST_NOT_FOUND" | "INVALID_ORDER"> {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const list = await connection.queryObject<{ list_type: string }>({
        text: "SELECT list_type FROM rewind.lists WHERE id = $1 AND user_id = $2", args: [listId, userId],
      });
      if (!list.rows[0]) { await connection.queryObject("COMMIT"); return "LIST_NOT_FOUND"; }
      if (list.rows[0].list_type !== "CUSTOM") throw new RewindApiError(400, "System list cannot be reordered");
      const rows = await connection.queryObject<{ id: string }>({
        text: "SELECT id::text AS id FROM rewind.list_items WHERE list_id = $1", args: [listId],
      });
      const currentIds = rows.rows.map((row) => safeId(row.id, "List item ID"));
      if (orderedItemIds.length !== currentIds.length || new Set(orderedItemIds).size !== orderedItemIds.length
        || orderedItemIds.some((id) => !currentIds.includes(id))) {
        await connection.queryObject("COMMIT");
        return "INVALID_ORDER";
      }
      for (let index = 0; index < orderedItemIds.length; index++) {
        await connection.queryObject({
          text: "UPDATE rewind.list_items SET position = $3 WHERE id = $1 AND list_id = $2",
          args: [orderedItemIds[index], listId, index + 1],
        });
      }
      await connection.queryObject("COMMIT");
      return "OK";
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getPublicLists(feed, tag, page, size) {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const tagFilter = feed === "all" && tag !== null;
      const teamFilter = feed === "team" ? " AND owner.is_hq = TRUE" : "";
      const featuredFilter = feed === "featured" ? " AND l.featured_position IS NOT NULL" : "";
      const predicate = tagFilter
        ? `l.is_public = TRUE AND l.list_type = 'CUSTOM' AND owner.is_active = TRUE
           AND EXISTS (SELECT 1 FROM rewind.list_tags lt JOIN rewind.tags t ON t.id = lt.tag_id
                       WHERE lt.list_id = l.id AND t.slug = $1)`
        : `l.is_public = TRUE AND l.list_type = 'CUSTOM' AND owner.is_active = TRUE`;
      const countJoin = feed === "recently-liked"
        ? ` JOIN rewind.list_likes count_like ON count_like.list_id = l.id
            JOIN rewind.users count_liker ON count_liker.id = count_like.user_id AND count_liker.is_active = TRUE`
        : "";
      const filterArgs = tagFilter ? [tag] : [];
      const countResult = await connection.queryObject<{ total: string }>({
        text: `SELECT COUNT(${feed === "recently-liked" ? "DISTINCT l.id" : "*"})::text AS total
               FROM rewind.lists l JOIN rewind.users owner ON owner.id = l.user_id${countJoin}
               WHERE ${predicate}${teamFilter}${featuredFilter}`,
        args: filterArgs,
      });
      const orderBy = feed === "featured"
        ? `l.featured_position ASC, l.id DESC`
        : feed === "popular"
        ? `likes DESC, l.updated_at DESC, l.id DESC`
        : feed === "recently-liked"
        ? `recent_like_at DESC NULLS LAST, l.id DESC`
        : `l.updated_at DESC, l.id DESC`;
      let extraJoin = "";
      let extraSelect = "";
      if (feed === "popular") {
        extraSelect = `, (SELECT COUNT(*)::text FROM rewind.list_likes ll
                         JOIN rewind.users liker ON liker.id = ll.user_id AND liker.is_active = TRUE
                         WHERE ll.list_id = l.id) AS likes`;
      } else if (feed === "recently-liked") {
        extraJoin = ` JOIN (SELECT ll.list_id, MAX(ll.created_at) AS recent_like_at
                            FROM rewind.list_likes ll JOIN rewind.users liker
                              ON liker.id = ll.user_id AND liker.is_active = TRUE
                            GROUP BY ll.list_id) liked ON liked.list_id = l.id`;
        extraSelect = ", liked.recent_like_at::text AS recent_like_at";
      }
      const listArgs = tagFilter ? [tag, size, page * size] : [size, page * size];
      const rows = await connection.queryObject<{
        id: string; name: string; description: string | null; is_public: boolean;
        owner_id: string; owner_username: string; owner_avatar_url: string | null;
        like_count: string; item_count: string;
      }>({
        text: `SELECT l.id::text AS id, l.name, l.description, l.is_public,
                      owner.id::text AS owner_id, owner.username AS owner_username, owner.avatar_url AS owner_avatar_url,
                      (SELECT COUNT(*)::text FROM rewind.list_likes ll JOIN rewind.users liker
                        ON liker.id = ll.user_id AND liker.is_active = TRUE WHERE ll.list_id = l.id) AS like_count,
                       (SELECT COUNT(*)::text FROM rewind.list_items li JOIN rewind.movies visible_movie ON visible_movie.id = li.movie_id AND visible_movie.is_published = TRUE WHERE li.list_id = l.id) AS item_count
                      ${extraSelect}
               FROM rewind.lists l JOIN rewind.users owner ON owner.id = l.user_id${extraJoin}
               WHERE ${predicate}${teamFilter}${featuredFilter}
               ORDER BY ${orderBy} LIMIT $${tagFilter ? 2 : 1} OFFSET $${tagFilter ? 3 : 2}`,
        args: listArgs,
      });
      const ids = rows.rows.map((row) => Number(row.id));
      const tagsByList = new Map<number, string[]>();
      const previewsByList = new Map<number, { id: number; title: string; releaseDate: string | null; rating: number | null; photoUrl: string | null }[]>();
      if (ids.length > 0) {
        const [tagsResult, previewsResult] = await Promise.all([
          connection.queryObject<{ list_id: string; name: string }>({
            text: `SELECT lt.list_id::text AS list_id, t.name FROM rewind.list_tags lt
                   JOIN rewind.tags t ON t.id = lt.tag_id WHERE lt.list_id = ANY($1::bigint[])
                   ORDER BY lt.list_id, t.name`, args: [ids],
          }),
          connection.queryObject<{
            list_id: string; movie_id: string; title: string; release_date: string | null;
            rating: string | null; photo_url: string | null;
          }>({
            text: `SELECT list_id::text AS list_id, movie_id::text AS movie_id, title, release_date, rating, photo_url
                   FROM (SELECT li.list_id, li.id, li.position, m.id AS movie_id, m.title,
                                m.release_date::text AS release_date, m.rating::text AS rating, m.photo_url,
                                ROW_NUMBER() OVER (PARTITION BY li.list_id ORDER BY li.position ASC NULLS LAST, li.id ASC) AS rn
                          FROM rewind.list_items li JOIN rewind.movies m ON m.id = li.movie_id AND m.is_published = TRUE
                          WHERE li.list_id = ANY($1::bigint[])) ranked WHERE rn <= 3
                   ORDER BY list_id, rn`, args: [ids],
          }),
        ]);
        for (const row of tagsResult.rows) {
          const id = Number(row.list_id);
          const values = tagsByList.get(id) ?? [];
          values.push(row.name);
          tagsByList.set(id, values);
        }
        for (const row of previewsResult.rows) {
          const id = Number(row.list_id);
          const values = previewsByList.get(id) ?? [];
          values.push({ id: Number(row.movie_id), title: row.title,
            releaseDate: row.release_date, rating: row.rating === null ? null : Number(row.rating), photoUrl: row.photo_url });
          previewsByList.set(id, values);
        }
      }
      const toId = (value: string) => {
        const id = Number(value);
        if (!Number.isSafeInteger(id) || id <= 0) throw new Error("List ID is outside the safe JSON integer range.");
        return id;
      };
      const content: PublicListCardResponse[] = rows.rows.map((row) => {
        const id = toId(row.id);
        return {
          id, name: row.name, description: row.description, isPublic: row.is_public,
          ownerId: toId(row.owner_id), ownerUsername: row.owner_username, ownerAvatarUrl: row.owner_avatar_url,
          tags: tagsByList.get(id) ?? [], likeCount: Number(row.like_count), itemCount: Number(row.item_count),
          previewMovies: previewsByList.get(id) ?? [],
        };
      });
      const totalElements = Number(countResult.rows[0]?.total ?? "0");
      return { content, totalPages: Math.ceil(totalElements / size), totalElements, number: page };
    } finally {
      connection.release();
    }
  },

  async getPublicList(listId): Promise<PublicListDetailsResponse | null> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const listResult = await connection.queryObject<{
        id: string; name: string; description: string | null; owner_id: string;
        owner_username: string; owner_avatar_url: string | null; is_ranked: boolean; reply_preference: MyListResponse["replyPreference"];
      }>({
        text: `SELECT l.id::text AS id, l.name, l.description, owner.id::text AS owner_id,
                      owner.username AS owner_username, owner.avatar_url AS owner_avatar_url, l.is_ranked, l.reply_preference
               FROM rewind.lists l JOIN rewind.users owner ON owner.id = l.user_id
               WHERE l.id = $1 AND l.list_type = 'CUSTOM' AND l.is_public = TRUE AND owner.is_active = TRUE`,
        args: [listId],
      });
      const list = listResult.rows[0];
      if (!list) return null;
      const [tags, likes, movies] = await Promise.all([
        connection.queryObject<{ name: string }>({
          text: `SELECT t.name FROM rewind.list_tags lt JOIN rewind.tags t ON t.id = lt.tag_id
                 WHERE lt.list_id = $1 ORDER BY t.name`, args: [listId],
        }),
        connection.queryObject<{ total: string }>({
          text: `SELECT COUNT(*)::text AS total FROM rewind.list_likes ll JOIN rewind.users liker
                 ON liker.id = ll.user_id AND liker.is_active = TRUE WHERE ll.list_id = $1`, args: [listId],
        }),
        connection.queryObject<{
          id: string; title: string; release_date: string | null; rating: string | null; photo_url: string | null;
        }>({
          text: `SELECT m.id::text AS id, m.title, m.release_date::text AS release_date,
                        m.rating::text AS rating, m.photo_url
                  FROM rewind.list_items li JOIN rewind.movies m ON m.id = li.movie_id AND m.is_published = TRUE
                  WHERE li.list_id = $1 ORDER BY li.position ASC NULLS LAST, li.id ASC`, args: [listId],
        }),
      ]);
      const toId = (value: string) => {
        const id = Number(value);
        if (!Number.isSafeInteger(id) || id <= 0) throw new Error("List ID is outside the safe JSON integer range.");
        return id;
      };
      return {
        id: toId(list.id), name: list.name, description: list.description,
        ownerId: toId(list.owner_id), ownerUsername: list.owner_username,
        ownerAvatarUrl: list.owner_avatar_url, tags: tags.rows.map((row) => row.name),
        likeCount: Number(likes.rows[0]?.total ?? "0"), isRanked: list.is_ranked, replyPreference: list.reply_preference,
        movies: movies.rows.map((movie) => ({
          id: toId(movie.id), title: movie.title, releaseDate: movie.release_date,
          rating: movie.rating === null ? null : Number(movie.rating), photoUrl: movie.photo_url,
        })),
      };
    } finally {
      connection.release();
    }
  },

  async getPublicListLikeStatus(authUser, listId) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const visible = await connection.queryObject({
        text: `SELECT 1 FROM rewind.lists l JOIN rewind.users owner ON owner.id = l.user_id
               WHERE l.id = $1 AND l.list_type = 'CUSTOM' AND l.is_public = TRUE AND owner.is_active = TRUE`,
        args: [listId],
      });
      if (!visible.rows.length) { await connection.queryObject("COMMIT"); return null; }
      const result = await connection.queryObject<{ liked: boolean; likes: string }>({
        text: `SELECT EXISTS(SELECT 1 FROM rewind.list_likes WHERE list_id = $1 AND user_id = $2) AS liked,
                      (SELECT COUNT(*)::text FROM rewind.list_likes ll JOIN rewind.users liker
                       ON liker.id = ll.user_id AND liker.is_active = TRUE WHERE ll.list_id = $1) AS likes`,
        args: [listId, userId],
      });
      await connection.queryObject("COMMIT");
      return { liked: result.rows[0]?.liked ?? false, likes: Number(result.rows[0]?.likes ?? "0") };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async likePublicList(authUser, listId) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const visible = await connection.queryObject({
        text: `SELECT 1 FROM rewind.lists l JOIN rewind.users owner ON owner.id = l.user_id
               WHERE l.id = $1 AND l.list_type = 'CUSTOM' AND l.is_public = TRUE AND owner.is_active = TRUE`,
        args: [listId],
      });
      if (!visible.rows.length) { await connection.queryObject("COMMIT"); return false; }
      await connection.queryObject({
        text: `INSERT INTO rewind.list_likes (list_id, user_id) VALUES ($1, $2)
               ON CONFLICT (list_id, user_id) DO NOTHING`, args: [listId, userId],
      });
      await connection.queryObject("COMMIT");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async unlikePublicList(authUser, listId) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const visible = await connection.queryObject({
        text: `SELECT 1 FROM rewind.lists l JOIN rewind.users owner ON owner.id = l.user_id
               WHERE l.id = $1 AND l.list_type = 'CUSTOM' AND l.is_public = TRUE AND owner.is_active = TRUE`,
        args: [listId],
      });
      if (!visible.rows.length) { await connection.queryObject("COMMIT"); return false; }
      await connection.queryObject({ text: "DELETE FROM rewind.list_likes WHERE list_id = $1 AND user_id = $2", args: [listId, userId] });
      await connection.queryObject("COMMIT");
      return true;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getMyListReport(authUser, listId) {
    return await getMyContentReport(authUser, "list", listId);
  },

  async reportList(authUser, listId, reason) {
    return await submitContentReport(authUser, "list", listId, reason);
  },
};
