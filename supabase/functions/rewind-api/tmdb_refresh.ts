export interface TmdbRefreshCandidate {
  movieId: number;
  tmdbId: number;
}

export interface TmdbRefreshBatchResult {
  attempted: number;
  succeeded: number;
  failed: number;
}

export type TmdbRefreshErrorCode =
  | "TMDB_NOT_FOUND"
  | "TMDB_UNAVAILABLE"
  | "SYNC_FAILED";

export async function runTmdbRefreshBatch(
  candidates: readonly TmdbRefreshCandidate[],
  sync: (candidate: TmdbRefreshCandidate) => Promise<unknown>,
  record: (
    candidate: TmdbRefreshCandidate,
    succeeded: boolean,
    errorCode: TmdbRefreshErrorCode | null,
  ) => Promise<void>,
  limit = 10,
): Promise<TmdbRefreshBatchResult> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new RangeError("Invalid TMDB refresh batch size");
  }
  const result: TmdbRefreshBatchResult = {
    attempted: 0,
    succeeded: 0,
    failed: 0,
  };
  for (const candidate of candidates.slice(0, limit)) {
    result.attempted++;
    let succeeded = false;
    let errorCode: TmdbRefreshErrorCode | null = null;
    try {
      await sync(candidate);
      succeeded = true;
      result.succeeded++;
    } catch (error) {
      errorCode =
        error instanceof Error && "status" in error && error.status === 404
          ? "TMDB_NOT_FOUND"
          : error instanceof Error && "status" in error &&
              typeof error.status === "number" && error.status >= 500
          ? "TMDB_UNAVAILABLE"
          : "SYNC_FAILED";
      result.failed++;
    }
    await record(candidate, succeeded, errorCode);
  }
  return result;
}

export function matchesWorkerSecret(
  provided: string | null,
  expected: string | null,
): boolean {
  if (!provided || !expected) return false;
  const left = new TextEncoder().encode(provided);
  const right = new TextEncoder().encode(expected);
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index++) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}
