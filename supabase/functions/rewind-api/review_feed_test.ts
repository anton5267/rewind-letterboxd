import { createReviewFeedHandler } from "./review_feed.ts";

const sampleReview = {
  id: 99,
  movieId: 42,
  movieTitle: "Arrival",
  userId: 7,
  username: "cinephile",
  content: "Beautiful and thoughtful sci-fi movie.",
  rating: 5,
  createdAt: "2024-11-15T10:00:00Z",
  moviePhotoUrl: "https://example.com/movie.jpg",
  userAvatarUrl: "https://example.com/user.jpg",
};

Deno.test("GET /api/reviews/recent returns Spring page shape and public contract", async () => {
  const handler = createReviewFeedHandler({
    async recent(page, size) {
      if (page !== 0 || size !== 6) throw new Error(`Unexpected recent params: ${page}/${size}`);
      return {
        content: [sampleReview],
        totalPages: 2,
        totalElements: 12,
        number: 0,
      };
    },
    async popular() { return { content: [], totalPages: 0, totalElements: 0, number: 0 }; },
  });

  const response = await handler(new Request("https://project.supabase.co/api/reviews/recent?page=0&size=6"));
  if (response === null) throw new Error("Expected response for recent route");
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (response.headers.get("Cache-Control") !== "no-store") throw new Error("Recent reviews must not be cached");

  const body = await response.json();
  if (JSON.stringify(body) !== JSON.stringify({
    content: [sampleReview],
    totalPages: 2,
    totalElements: 12,
    number: 0,
  })) {
    throw new Error(`Unexpected recent review payload: ${JSON.stringify(body)}`);
  }
});

Deno.test("GET /api/reviews/popular returns Spring page shape and uses like-based ordering", async () => {
  const handler = createReviewFeedHandler({
    async recent() { return { content: [], totalPages: 0, totalElements: 0, number: 0 }; },
    async popular(page, size) {
      if (page !== 1 || size !== 20) throw new Error(`Unexpected popular params: ${page}/${size}`);
      return {
        content: [sampleReview],
        totalPages: 3,
        totalElements: 55,
        number: 1,
      };
    },
  });

  const response = await handler(new Request("https://project.supabase.co/api/reviews/popular?page=1&size=40"));
  if (response === null) throw new Error("Expected response for popular route");
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  const body = await response.json();
  if (body.number !== 1 || body.totalElements !== 55 || body.content[0].id !== sampleReview.id) {
    throw new Error(`Unexpected popular review payload: ${JSON.stringify(body)}`);
  }
});

Deno.test("review feed clamps pagination to Spring defaults and limits", async () => {
  let seenRecent: [number, number] | null = null;
  let seenPopular: [number, number] | null = null;
  const handler = createReviewFeedHandler({
    async recent(page, size) { seenRecent = [page, size]; return { content: [], totalPages: 0, totalElements: 0, number: page }; },
    async popular(page, size) { seenPopular = [page, size]; return { content: [], totalPages: 0, totalElements: 0, number: page }; },
  });

  await handler(new Request("https://project.supabase.co/api/reviews/recent?page=-4&size=99"));
  await handler(new Request("https://project.supabase.co/api/reviews/popular?page=2&size=0"));

  if (JSON.stringify(seenRecent) !== JSON.stringify([0, 20])) throw new Error(`Recent page normalization mismatch: ${JSON.stringify(seenRecent)}`);
  if (JSON.stringify(seenPopular) !== JSON.stringify([2, 1])) throw new Error(`Popular page normalization mismatch: ${JSON.stringify(seenPopular)}`);
});

Deno.test("unknown review routes return null", async () => {
  const handler = createReviewFeedHandler({
    async recent() { return { content: [], totalPages: 0, totalElements: 0, number: 0 }; },
    async popular() { return { content: [], totalPages: 0, totalElements: 0, number: 0 }; },
  });

  const response = await handler(new Request("https://project.supabase.co/api/reviews/999"));
  if (response !== null) throw new Error("Unknown review route should return null");
});

Deno.test("non-GET review feed routes are rejected with 405", async () => {
  const handler = createReviewFeedHandler({
    async recent() { return { content: [], totalPages: 0, totalElements: 0, number: 0 }; },
    async popular() { return { content: [], totalPages: 0, totalElements: 0, number: 0 }; },
  });

  const response = await handler(new Request("https://project.supabase.co/api/reviews/recent", { method: "POST" }));
  if (response === null || response.status !== 405) throw new Error(`Expected 405, got ${response?.status ?? "null"}`);
});
