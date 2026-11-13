export const INVALID_QUERY = Symbol("invalid query parameter");

export function optionalInteger(value: string | null, fallback: number): number {
  if (value === null || !/^-?\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : fallback;
}

export function parseSocialPage(query: URLSearchParams): { page: number; size: number } {
  const requestedPage = optionalInteger(query.get("page"), 0);
  const requestedSize = optionalInteger(query.get("size"), 20);
  return { page: Math.max(0, Math.min(requestedPage, 1000)), size: Math.max(1, Math.min(requestedSize, 50)) };
}

export function parseOptionalBoolean(value: string | null): boolean | null | typeof INVALID_QUERY {
  if (value === null || value === "") return null;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return INVALID_QUERY;
}

export function parseOptionalLong(value: string | null): number | null | typeof INVALID_QUERY {
  if (value === null || value === "") return null;
  if (!/^-?\d+$/.test(value)) return INVALID_QUERY;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : INVALID_QUERY;
}

export function parseAdminPage(query: URLSearchParams, maximumSize = 50, defaultSize = 20): { page: number; size: number } | null {
  const parse = (key: string, fallback: number): number | null => {
    const value = query.get(key);
    if (value === null) return fallback;
    if (!/^-?\d+$/.test(value)) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && Math.abs(parsed) <= 2_147_483_647 ? parsed : null;
  };
  const requestedPage = parse("page", 0);
  const requestedSize = parse("size", defaultSize);
  if (requestedPage === null || requestedSize === null) return null;
  return { page: Math.max(0, requestedPage), size: Math.max(1, Math.min(requestedSize, maximumSize)) };
}

export function optionalPositiveInteger(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function optionalFiniteNumber(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseRouteId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parsePositiveId(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function parseSafeCount(value: string): number {
  if (!/^\d+$/.test(value)) throw new Error("Count must be a non-negative integer.");
  const count = Number(value);
  if (!Number.isSafeInteger(count)) throw new Error("Count is outside the safe JSON integer range.");
  return count;
}
