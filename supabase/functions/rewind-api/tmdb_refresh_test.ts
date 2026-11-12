import { matchesWorkerSecret, runTmdbRefreshBatch } from "./tmdb_refresh.ts";

Deno.test("TMDB refresh continues after a failed item and records sanitized outcomes", async () => {
  const candidates = [1, 2, 3].map((id) => ({ movieId: id, tmdbId: id * 10 }));
  const recorded: unknown[] = [];
  const result = await runTmdbRefreshBatch(candidates, async ({ movieId }) => {
    if (movieId === 2) {
      throw Object.assign(new Error("provider detail must not escape"), {
        status: 404,
      });
    }
  }, async (candidate, succeeded, errorCode) => {
    recorded.push({ candidate, succeeded, errorCode });
  });
  if (
    JSON.stringify(result) !==
      JSON.stringify({ attempted: 3, succeeded: 2, failed: 1 })
  ) throw new Error("Unexpected batch result");
  if (
    JSON.stringify(recorded[1]) !==
      JSON.stringify({
        candidate: candidates[1],
        succeeded: false,
        errorCode: "TMDB_NOT_FOUND",
      })
  ) throw new Error("Failure was not sanitized or recorded");
});

Deno.test("TMDB refresh caps work at the requested batch limit", async () => {
  let attempted = 0;
  const result = await runTmdbRefreshBatch(
    Array.from(
      { length: 12 },
      (_, id) => ({ movieId: id + 1, tmdbId: id + 1 }),
    ),
    async () => {
      attempted++;
    },
    async () => {},
    5,
  );
  if (attempted !== 5 || result.attempted !== 5 || result.succeeded !== 5) {
    throw new Error("Batch limit was not enforced");
  }
});

Deno.test("worker secret comparison rejects missing and different values", () => {
  if (!matchesWorkerSecret("0123456789abcdef", "0123456789abcdef")) {
    throw new Error("Matching secret rejected");
  }
  if (
    matchesWorkerSecret(null, "0123456789abcdef") ||
    matchesWorkerSecret("0123456789abcdeg", "0123456789abcdef")
  ) throw new Error("Invalid secret accepted");
});
