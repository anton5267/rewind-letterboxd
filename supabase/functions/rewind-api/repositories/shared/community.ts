import type { PgConnection } from "../../runtime/database.ts";
import type { CommunityDetails } from "../../contracts/community.ts";
import type { PublicSocialUser } from "../../contracts/social.ts";
import type { MovieCardResponse } from "../../contracts/catalog.ts";
import { safeId } from "./results.ts";

interface CommunityDetailsRow {
  id: string;
  watched_count: string;
  review_count: string;
  list_count: string;
  likes: string;
  follower_count: string;
  following_count: string;
  favorite_movies: MovieCardResponse[] | string;
}

/** Enrich one bounded page in a single query, using only publicly visible records. */
export async function enrichCommunityUsers<T extends PublicSocialUser>(
  connection: PgConnection,
  users: T[],
): Promise<Array<T & Required<CommunityDetails>>> {
  if (!users.length) return [];
  const result = await connection.queryObject<CommunityDetailsRow>({
    text: `SELECT u.id::text AS id,
      (SELECT COUNT(*) FROM rewind.list_items i
        JOIN rewind.lists l ON l.id=i.list_id AND l.is_public AND l.list_type='WATCHED'
        JOIN rewind.movies m ON m.id=i.movie_id AND m.is_published
        WHERE l.user_id=u.id)::text AS watched_count,
      (SELECT COUNT(*) FROM rewind.reviews r
        JOIN rewind.movies m ON m.id=r.movie_id AND m.is_published
        WHERE r.user_id=u.id AND NOT r.is_hidden)::text AS review_count,
      (SELECT COUNT(*) FROM rewind.lists l
        WHERE l.user_id=u.id AND l.is_public AND l.list_type='CUSTOM')::text AS list_count,
      (SELECT COUNT(*) FROM rewind.review_likes rl
        JOIN rewind.reviews r ON r.id=rl.review_id AND NOT r.is_hidden
        JOIN rewind.movies m ON m.id=r.movie_id AND m.is_published
        JOIN rewind.users liker ON liker.id=rl.user_id AND liker.is_active
        WHERE r.user_id=u.id)::text AS likes,
      (SELECT COUNT(*) FROM rewind.follows f
        JOIN rewind.users follower ON follower.id=f.follower_id AND follower.is_active
        WHERE f.following_id=u.id)::text AS follower_count,
      (SELECT COUNT(*) FROM rewind.follows f
        JOIN rewind.users followed ON followed.id=f.following_id AND followed.is_active
        WHERE f.follower_id=u.id)::text AS following_count,
      COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', favorites.id::text, 'title', favorites.title, 'photoUrl', favorites.photo_url,
        'releaseDate', favorites.release_date::text, 'rating', favorites.rating)
        ORDER BY favorites.position NULLS LAST, favorites.item_id)
        FROM (SELECT m.id,m.title,m.photo_url,m.release_date,m.rating,i.position,i.id AS item_id
          FROM rewind.list_items i
          JOIN rewind.lists l ON l.id=i.list_id AND l.is_public AND l.list_type='FAVORITES'
          JOIN rewind.movies m ON m.id=i.movie_id AND m.is_published
          WHERE l.user_id=u.id ORDER BY i.position NULLS LAST,i.id LIMIT 4
        ) favorites), '[]'::jsonb) AS favorite_movies
      FROM rewind.users u WHERE u.is_active AND u.id=ANY($1::bigint[])`,
    args: [users.map((user) => user.id)],
  });
  const details = new Map(result.rows.map((row) => {
    const movies: MovieCardResponse[] = typeof row.favorite_movies === "string"
      ? JSON.parse(row.favorite_movies)
      : row.favorite_movies;
    return [safeId(row.id, "User ID"), {
      watchedCount: Number(row.watched_count),
      reviewCount: Number(row.review_count),
      listCount: Number(row.list_count),
      likes: Number(row.likes),
      followerCount: Number(row.follower_count),
      followingCount: Number(row.following_count),
      favoriteMovies: movies.map((movie) => ({
        ...movie,
        id: safeId(String(movie.id), "Movie ID"),
      })),
    }];
  }));
  return users.flatMap((user) => {
    const detail = details.get(user.id);
    return detail ? [{ ...user, ...detail }] : [];
  });
}
