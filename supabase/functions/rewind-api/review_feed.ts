export interface ReviewFeedItem {
  id: number;
  movieId: number;
  movieTitle: string;
  userId: number;
  username: string;
  content: string;
  rating: number | null;
  createdAt: string;
  moviePhotoUrl: string | null;
  userAvatarUrl: string | null;
}

export interface ReviewFeedPage {
  content: ReviewFeedItem[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface ReviewFeedRepository {
  recent(page: number, size: number): Promise<ReviewFeedPage>;
  popular(page: number, size: number): Promise<ReviewFeedPage>;
}

export function createReviewFeedHandler(repository: Partial<ReviewFeedRepository>) {
  return async (request: Request): Promise<Response | null> => {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/api/reviews/recent") {
      if (request.method !== "GET") {
        return json({ message: "Method not allowed" }, 405, { Allow: "GET, OPTIONS" });
      }
      const params = parsePageParams(url.searchParams, { defaultPage: 0, defaultSize: 6, maxSize: 20 });
      const result = await repository.recent?.(params.page, params.size);
      if (!result) return json({ message: "Not found" }, 404);
      return json({
        content: result.content,
        totalPages: result.totalPages,
        totalElements: result.totalElements,
        number: result.number,
      }, 200, { "Cache-Control": "no-store" });
    }

    if (path === "/api/reviews/popular") {
      if (request.method !== "GET") {
        return json({ message: "Method not allowed" }, 405, { Allow: "GET, OPTIONS" });
      }
      const params = parsePageParams(url.searchParams, { defaultPage: 0, defaultSize: 6, maxSize: 20 });
      const result = await repository.popular?.(params.page, params.size);
      if (!result) return json({ message: "Not found" }, 404);
      return json({
        content: result.content,
        totalPages: result.totalPages,
        totalElements: result.totalElements,
        number: result.number,
      }, 200, { "Cache-Control": "no-store" });
    }

    return null;
  };
}

function parsePageParams(searchParams: URLSearchParams, opts: { defaultPage: number; defaultSize: number; maxSize: number }) {
  const page = parseInteger(searchParams.get("page"), opts.defaultPage, 0, Number.MAX_SAFE_INTEGER, true);
  const size = parseInteger(searchParams.get("size"), opts.defaultSize, 1, opts.maxSize, false);
  return { page, size };
}

function parseInteger(value: string | null, fallback: number, min: number, max: number, floorToZero: boolean): number {
  if (value === null || value.trim() === "") return fallback;
  if (!/^\d+$/.test(value.trim())) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) return fallback;
  if (floorToZero && parsed < 0) return 0;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

function json(body: unknown, status: number, headers: HeadersInit = {}): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");
  if (!responseHeaders.has("Cache-Control")) responseHeaders.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}
