import { enrichCommunityUsers } from "./repositories/shared/community.ts";

function same(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}
const users = [
  { id: 7, username: "reader", displayName: "Reader", avatarUrl: null },
  { id: 8, username: "another", displayName: "Another", avatarUrl: null },
];

Deno.test("community enrichment skips empty pages and batches all IDs in one bound query", async () => {
  const calls: unknown[] = [];
  const connection = {
    async queryObject(query: unknown) {
      calls.push(query);
      return {
        rows: users.map((user) => ({
          id: String(user.id),
          watched_count: "1",
          review_count: "2",
          list_count: "3",
          likes: "4",
          follower_count: "5",
          following_count: "6",
          favorite_movies: [],
        })),
      };
    },
  } as unknown as Parameters<typeof enrichCommunityUsers>[0];
  same(await enrichCommunityUsers(connection, []), []);
  same(calls.length, 0);
  const enriched = await enrichCommunityUsers(connection, users);
  same(calls.length, 1);
  same((calls[0] as { args: unknown[] }).args, [[7, 8]]);
  same(enriched[0], {
    ...users[0],
    watchedCount: 1,
    reviewCount: 2,
    listCount: 3,
    likes: 4,
    followerCount: 5,
    followingCount: 6,
    favoriteMovies: [],
  });
  same(users[0], {
    id: 7,
    username: "reader",
    displayName: "Reader",
    avatarUrl: null,
  });
});

Deno.test("community enrichment decodes driver JSON and preserves page order while dropping vanished users", async () => {
  const movie = {
    id: "21",
    title: "A film",
    photoUrl: null,
    releaseDate: null,
    rating: null,
  };
  const connection = {
    async queryObject() {
      return {
        rows: [{
          id: "8",
          watched_count: "0",
          review_count: "0",
          list_count: "0",
          likes: "0",
          follower_count: "0",
          following_count: "0",
          favorite_movies: JSON.stringify([movie]),
        }],
      };
    },
  } as unknown as Parameters<typeof enrichCommunityUsers>[0];
  const result = await enrichCommunityUsers(connection, users);
  same(result.length, 1);
  same(result[0].id, 8);
  same(result[0].favoriteMovies, [{ ...movie, id: 21 }]);
  same(result[0].watchedCount, 0);
});
