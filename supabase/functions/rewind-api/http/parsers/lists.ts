import type { CreateMyListRequest, UpdateMyListRequest } from "../../contracts/lists.ts";
import { parsePositiveId } from "./query.ts";

export function parseCreateMyList(value: unknown): CreateMyListRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (typeof body.name !== "string" || body.name.trim().length === 0 || body.name.length > 120) return null;
  if (body.description !== undefined && body.description !== null
    && (typeof body.description !== "string" || body.description.length > 5000)) return null;
  if (body.isPublic !== undefined && body.isPublic !== null && typeof body.isPublic !== "boolean") return null;
  if (body.isRanked !== undefined && body.isRanked !== null && typeof body.isRanked !== "boolean") return null;
  const tags = parseListTags(body.tags);
  if (tags === null) return null;
  if (!Array.isArray(body.movieIds) || body.movieIds.length < 1 || body.movieIds.length > 100) return null;
  const movieIds = body.movieIds.map(parsePositiveId);
  if (movieIds.some((id) => id === null)) return null;
  return {
    name: body.name,
    description: typeof body.description === "string" ? body.description : null,
    isPublic: body.isPublic === true,
    isRanked: body.isRanked !== false,
    tags,
    movieIds: movieIds as number[],
  };
}

export function parseUpdateMyList(value: unknown): UpdateMyListRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const update: UpdateMyListRequest = {};
  if (body.name !== undefined && body.name !== null) {
    if (typeof body.name !== "string" || body.name.trim().length === 0 || body.name.length > 120) return null;
    update.name = body.name;
  }
  if (body.description !== undefined) {
    if (body.description !== null && (typeof body.description !== "string" || body.description.length > 5000)) return null;
    update.description = body.description as string | null;
  }
  if (body.isPublic !== undefined && body.isPublic !== null) {
    if (typeof body.isPublic !== "boolean") return null;
    update.isPublic = body.isPublic;
  }
  if (body.isRanked !== undefined && body.isRanked !== null) {
    if (typeof body.isRanked !== "boolean") return null;
    update.isRanked = body.isRanked;
  }
  if (body.tags !== undefined && body.tags !== null) {
    const tags = parseListTags(body.tags);
    if (tags === null) return null;
    update.tags = tags;
  }
  return update;
}

export function parseListTags(value: unknown): string[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 10) return null;
  const tags = value as unknown[];
  if (tags.some((tag) => typeof tag !== "string" || tag.length < 1 || tag.length > 50)) return null;
  return tags as string[];
}

export function parseAddListMovie(value: unknown): { movieId: number; position: number | null } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const movieId = parsePositiveId(body.movieId);
  if (movieId === null) return null;
  let position: number | null = null;
  if (body.position !== undefined && body.position !== null) {
    if (typeof body.position !== "number" || !Number.isSafeInteger(body.position)
      || body.position < 0 || body.position > 2147483647) return null;
    position = body.position;
  }
  return { movieId, position };
}

export function parseOrderedItemIds(value: unknown): number[] | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = (value as Record<string, unknown>).orderedItemIds;
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 10000) return null;
  const ids = raw.map(parsePositiveId);
  if (ids.some((id) => id === null)) return null;
  return ids as number[];
}
